# RETELL AI VOICE AGENT INTEGRATION SERVICE
# This module implements the integration client with the Retell AI REST API.
# It manages agent configurations, conversational flow charts, prompt injections,
# and verifies HMAC call log webhooks signatures.

import os
import hashlib
import hmac

# pyrefly: ignore [missing-import]
import httpx
from src.utils.db import Caller

# Webhook secret to verify incoming event payloads from Retell AI
RETELL_WEBHOOK_SECRET = os.getenv("RETELL_WEBHOOK_SECRET", "")
BASE_URL = "https://api.retellai.com"

# The LOCKED_PROMPT_TAIL is appended to every prompt configuration update.
# It acts as a system definition injection that instructs the Retell LLM agent
# on what variables it can reference (e.g. caller name, menus, open settings).
LOCKED_PROMPT_TAIL = (
    "\n\nDYNAMIC VARIABLES AVAILABLE (do not edit this section):\n"
    "- {{customer_name}} — caller's (distributor or buyer) saved name, or empty string if new\n"
    "- {{is_returning_customer}} — 'true' if caller (distributor or buyer) has called before, 'false' if new\n"
    "- {{customer_phone}} — caller's (distributor or buyer) phone number in E.164 format\n"
    "- {{kitchen_is_open}} — 'true' if the Mitchell's warehouse/fulfillment center is currently open and accepting orders, 'false' if not\n"
    "- {{store_is_open}} — 'true' if the Mitchell's corporate/sales offices are currently open, 'false' if closed\n"
    "- {{menu}} — the complete catalog of Mitchell's products (jams, squashes, ketchups, confectionery, etc.) with available stock, pricing, and active deals. This is your ONLY source of truth for product availability and pricing. Never reference products not listed in {{menu}}.\n"
    "- {{restaurant_info}} — general information about Mitchell's Fruit Farms, its history, specialties, and policies.\n"
    "- {{language_preference}} — the customer's preferred language ('Urdu' or 'English'). If 'Urdu', you must greet, speak, and respond entirely in Urdu (using Roman Urdu script / text representation if required by the voice model). If 'English', speak entirely in English."
)


def assemble_global_prompt(instructions: str) -> str:
    """
    Appends the locked system definition properties to the user's custom instructions text.
    """
    return instructions.rstrip() + LOCKED_PROMPT_TAIL


def _headers() -> dict:
    """Helper: Returns authentication header credentials for Retell API queries."""
    api_key = os.getenv("RETELL_API_KEY", "")
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


async def get_call(call_id: str) -> dict:
    """
    Queries Retell for call metadata (recordings, duration, status).
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/v2/get-call/{call_id}", headers=_headers())
        response.raise_for_status()
        return response.json()


async def create_phone_call(
    to_number: str,
    from_number: str | None = None,
    override_agent_id: str | None = None,
    metadata: dict | None = None,
    dynamic_variables: dict | None = None,
) -> dict:
    api_key = os.getenv("RETELL_API_KEY", "")
    if not api_key:
        raise ValueError("RETELL_API_KEY is not configured in backend/.env")

    from_number = from_number or os.getenv("RETELL_PHONE_NUMBER", "")
    if not from_number:
        raise ValueError(
            "RETELL_PHONE_NUMBER is not configured. Add your Retell "
            "outbound number in E.164 format (e.g. +14155551234)."
        )

    agent_id = (
        override_agent_id
        or os.getenv("RETELL_OUTBOUND_AGENT_ID", "")
        or os.getenv("RETELL_AGENT_ID", "")
    )
    payload: dict = {
        "from_number": from_number,
        "to_number": to_number,
    }
    if agent_id:
        payload["override_agent_id"] = agent_id
        #payload["override_agent_version"] = 0
    if metadata:
        payload["metadata"] = metadata
    if dynamic_variables:
        payload["retell_llm_dynamic_variables"] = {
            k: str(v) for k, v in dynamic_variables.items()
        }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/v2/create-phone-call",
            headers=_headers(),
            json=payload,
        )
        if response.status_code >= 400:
            body = response.text.strip()
            if response.status_code == 404:
                raise ValueError(
                    "Retell outbound calling is not available (404). "
                    "Check: (1) Phone Numbers tab exists in Retell dashboard, "
                    "(2) RETELL_PHONE_NUMBER is purchased/imported in Retell, "
                    "(3) RETELL_API_KEY belongs to the same workspace, "
                    "(4) contact Retell support to enable PSTN/outbound if needed. "
                    f"Details: {body or 'empty response'}"
                )
            raise ValueError(
                f"Retell API error {response.status_code}: "
                f"{body or 'empty response'}"
            )
        return response.json()


async def get_agent() -> dict:
    """
    Queries Retell details for our configured Voice Agent ID.
    """
    agent_id = os.getenv("RETELL_AGENT_ID", "")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/get-agent/{agent_id}",
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()


async def get_conversation_flow(override_flow_id: str = None) -> dict:
    """
    Queries Retell details for our configured conversation flow chart graphs.
    """
    flow_id = override_flow_id or os.getenv("RETELL_CONVERSATION_FLOW_ID", "")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/get-conversation-flow/{flow_id}",
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()


async def update_conversation_flow(payload: dict, override_flow_id: str = None) -> dict:
    """
    Updates the agent's prompts and conversation graph configuration on Retell.
    
    Why this is complex:
    When updating prompt nodes in a conversation flow graph, we retrieve the current
    graph list, locate the specific nodes by ID, and update their individual prompt
    instructions, while preserving all other node attributes.
    """
    flow_id = override_flow_id or os.getenv("RETELL_CONVERSATION_FLOW_ID", "")
    patch_body: dict = {}
    
    # 1. Mount standard configurations
    if "global_prompt" in payload:
        patch_body["global_prompt"] = payload["global_prompt"]
    if "default_dynamic_variables" in payload:
        patch_body["default_dynamic_variables"] = payload["default_dynamic_variables"]
    if "model_choice" in payload:
        patch_body["model_choice"] = payload["model_choice"]
    if "model_temperature" in payload:
        patch_body["model_temperature"] = payload["model_temperature"]
    if "knowledge_base_ids" in payload:
        patch_body["knowledge_base_ids"] = payload["knowledge_base_ids"]
    if payload.get("begin_message") is not None:
        patch_body["begin_message"] = payload["begin_message"]
        
    # 2. Handle sub-node diagram updates if present
    if "nodes" in payload and payload["nodes"]:
        current = await get_conversation_flow(override_flow_id=override_flow_id)
        existing_nodes = {n["id"]: n for n in current.get("nodes", [])}
        
        for updated_node in payload["nodes"]:
            node_id = updated_node["id"]
            if node_id in existing_nodes and "instruction" in updated_node:
                # Merge custom node prompt texts
                existing_nodes[node_id]["instruction"] = updated_node["instruction"]
            elif node_id not in existing_nodes:
                # Add node if it's completely new
                existing_nodes[node_id] = updated_node
        patch_body["nodes"] = list(existing_nodes.values())
        
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{BASE_URL}/update-conversation-flow/{flow_id}",
            headers=_headers(),
            json=patch_body,
        )
        response.raise_for_status()
        return response.json()


async def update_agent_voice_settings(override_agent_id: str = None, **kwargs) -> dict:
    """
    Updates the physical voice parameters of the agent (e.g. speed, responsiveness).
    """
    agent_id = override_agent_id or os.getenv("RETELL_AGENT_ID", "")
    payload = {k: v for k, v in kwargs.items() if v is not None}
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{BASE_URL}/update-agent/{agent_id}",
            headers=_headers(),
            json=payload,
        )
        response.raise_for_status()
        return response.json()


async def list_voices() -> list[dict]:
    """
    Retrieves available voices (from ElevenLabs, PlayHT, etc.) supported by Retell AI.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/list-voices",
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()


async def list_knowledge_bases() -> dict:
    """
    Lists uploaded PDF/text vector stores from Retell.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/list-knowledge-bases", headers=_headers())
        response.raise_for_status()
        return response.json()


async def add_knowledge_base_to_flow(kb_id: str) -> dict:
    """
    Attaches a vector knowledge base store to the agent's conversation flow engine.
    """
    current = await get_conversation_flow()
    kb_ids = current.get("knowledge_base_ids", [])
    if kb_id not in kb_ids:
        kb_ids = kb_ids + [kb_id]
    return await update_conversation_flow({"knowledge_base_ids": kb_ids})


async def remove_knowledge_base_from_flow(kb_id: str) -> dict:
    """
    Detaches a vector knowledge base store from the agent's conversation flow engine.
    """
    current = await get_conversation_flow()
    kb_ids = [k for k in current.get("knowledge_base_ids", []) if k != kb_id]
    return await update_conversation_flow({"knowledge_base_ids": kb_ids})


async def list_agents() -> list[dict]:
    """
    Retrieves all Voice Agents registered under this developer account.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/list-agents",
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json()


async def create_agent(agent_name: str, voice_id: str) -> dict:
    """
    Creates a new voice agent profile.
    Automatically binds the conversation flow diagram if defined in the env variables.
    """
    flow_id = os.getenv("RETELL_CONVERSATION_FLOW_ID", "")
    payload = {
        "agent_name": agent_name,
        "voice_id": voice_id,
    }
    if flow_id:
        payload["response_engine"] = {
            "type": "conversation-flow",
            "conversation_flow_id": flow_id
        }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/create-agent",
            headers=_headers(),
            json=payload,
        )
        response.raise_for_status()
        return response.json()


def verify_webhook_signature(payload_bytes: bytes, signature_header: str, secret: str | None = None) -> bool:
    """
    Validates webhook calls to ensure they originated from Retell, not an attacker.
    
    Why hmac.compare_digest:
    Standard '==' string comparisons are vulnerable to Timing Attacks because they fail
    earlier or later depending on character match. 'hmac.compare_digest' runs in constant
    time, securing signature verification against hackers.
    """
    key = secret if secret is not None else RETELL_WEBHOOK_SECRET
    expected = hmac.new(
        key.encode(),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def _utterance_content(entry: dict) -> str:
    content = entry.get("content") or entry.get("text") or ""
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict):
                parts.append(str(part.get("word") or part.get("text") or ""))
            else:
                parts.append(str(part))
        content = " ".join(p for p in parts if p)
    content = str(content).strip()
    if content:
        return content
    words = entry.get("words")
    if isinstance(words, list):
        tokens = []
        for word in words:
            if isinstance(word, dict):
                token = str(word.get("word") or "").strip()
                if token:
                    tokens.append(token)
        if tokens:
            return " ".join(tokens)
    return ""


def extract_transcript_from_call(call_data: dict) -> str | None:
    if not call_data:
        return None
    text = call_data.get("transcript")
    if isinstance(text, str) and text.strip():
        return text.strip()

    for key in (
        "transcript_with_tool_calls",
        "scrubbed_transcript_with_tool_calls",
        "transcript_object",
    ):
        obj = call_data.get(key)
        if not obj:
            continue
        if isinstance(obj, str) and obj.strip():
            return obj.strip()
        if not isinstance(obj, list):
            continue
        lines: list[str] = []
        for entry in obj:
            if not isinstance(entry, dict):
                continue
            role = entry.get("role") or entry.get("speaker") or ""
            content = _utterance_content(entry)
            if not content:
                continue
            if role in ("agent", "user", "transfer_target"):
                label = "Agent" if role == "agent" else (
                    "User" if role == "user" else role
                )
                lines.append(f"{label}: {content}")
            else:
                lines.append(content)
        if lines:
            return "\n".join(lines)
    return None


async def resolve_call_transcript(
    call_data: dict | None,
    retell_call_id: str | None,
    *,
    fetch_if_missing: bool = False,
) -> str | None:
    text = extract_transcript_from_call(call_data or {})
    if text:
        return text
    if not fetch_if_missing or not retell_call_id:
        return None
    try:
        full = await get_call(retell_call_id)
        return extract_transcript_from_call(full)
    except Exception:
        return None


def build_caller_dynamic_variables(caller: Caller | None, from_number: str) -> dict:
    """
    Helper: Prepares the dynamic parameters dictionary about a caller
    to feed into Retell at the beginning of an inbound call.
    """
    return {
        "customer_name": caller.customer_name if caller and caller.customer_name else "",
        "customer_phone": from_number,
        "is_returning_customer": "true" if caller else "false",
    }
