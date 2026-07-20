from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path

import aiohttp
from dotenv import load_dotenv

from livekit import api
from livekit.agents import function_tool, get_job_context

from prompts import PRODUCT_CATALOGUE

_ROOT = Path(__file__).resolve().parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

logger = logging.getLogger("mitchells-tools")

WEBHOOK_TIMEOUT_S = 15.0


def _env(name: str) -> str:
    value = os.getenv(name, "")
    return value.strip().strip('"').strip("'")


def _livekit_call_context() -> dict:
    ctx = get_job_context()
    if ctx is None or ctx.room is None or not ctx.room.name:
        return {}
    room_name = ctx.room.name
    direction = "inbound"
    try:
        meta = json.loads(ctx.job.metadata or "{}")
        if isinstance(meta, dict):
            if meta.get("direction") in ("inbound", "outbound"):
                direction = meta["direction"]
            elif meta.get("customer_phone") or meta.get("owner_name"):
                direction = "outbound"
    except (json.JSONDecodeError, TypeError, AttributeError):
        pass
    return {
        "call_id": room_name,
        "call": {
            "call_id": room_name,
            "direction": direction,
        },
    }


def _webhook_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
    }
    ctx = get_job_context()
    if ctx is not None and ctx.room is not None and ctx.room.name:
        headers["X-Call-Id"] = ctx.room.name
        headers["X-Retell-Call-Id"] = ctx.room.name
    return headers


# LiveKit cancels a tool's executor task outright once its speech turn is
# marked interrupted (e.g. a spurious VAD false-positive from background
# noise, or a TTS failure). To survive that, the actual HTTP write is
# started as a detached task the moment the model emits the function call
# (see schedule_durable_tool), keyed by its payload so the tool executor
# can later attach to the same task via asyncio.shield instead of starting
# a second, redundant request.
_pending_webhook_tasks: set[asyncio.Task] = set()
_durable_webhook_tasks: dict[str, asyncio.Task] = {}

_DURABLE_TOOL_URLS = {
    "log_trade_inquiry": "TRADE_INQUIRY_WEBHOOK_URL",
    "log_complaint": "COMPLAINT_WEBHOOK_URL",
    "log_callback_request": "CALLBACK_WEBHOOK_URL",
    "log_customer_feedback": "FEEDBACK_WEBHOOK_URL",
}


def _payload_key(tool_name: str, payload: dict) -> str:
    return f"{tool_name}:{json.dumps(payload, sort_keys=True, ensure_ascii=True, default=str)}"


def _tool_payload(name: str, args: dict) -> dict | None:
    if name == "log_trade_inquiry":
        return {
            "customer_name": args.get("customer_name", ""),
            "location": args.get("location", ""),
            "product_interest": args.get("product_interest", ""),
            "caller_phone": args.get("caller_phone", ""),
            "company_name": args.get("company_name", ""),
            "email": args.get("email", ""),
            "caller_type": args.get("caller_type", "other"),
            "notes": args.get("notes", ""),
        }
    if name == "log_complaint":
        return {
            "caller_name": args.get("caller_name", ""),
            "caller_phone": args.get("caller_phone", ""),
            "complaint_description": args.get("complaint_description", ""),
            "product_name": args.get("product_name", ""),
            "severity": args.get("severity", "medium"),
            "purchase_location": args.get("purchase_location", ""),
            "batch_lot_number": args.get("batch_lot_number", ""),
            "purchase_date": args.get("purchase_date", ""),
        }
    if name == "log_callback_request":
        return {
            "caller_name": args.get("caller_name", ""),
            "caller_phone": args.get("caller_phone", ""),
            "reason": args.get("reason", ""),
            "preferred_callback_time": args.get("preferred_callback_time", ""),
            "notes": args.get("notes", ""),
        }
    if name == "log_customer_feedback":
        rating = args.get("rating", 0)
        return {
            "caller_name": args.get("caller_name", ""),
            "caller_phone": args.get("caller_phone", ""),
            "feedback_text": args.get("feedback_text", ""),
            "rating": rating if rating else None,
            "topic": args.get("topic", ""),
            "sentiment": args.get("sentiment", "neutral"),
        }
    return None


async def _send_webhook(url: str, body: dict, headers: dict) -> dict:
    timeout = aiohttp.ClientTimeout(total=WEBHOOK_TIMEOUT_S)
    logger.info("POSTing webhook to %s payload=%s", url, body)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, json=body, headers=headers) as resp:
            text = await resp.text()
            logger.info(
                "webhook %s responded status=%s body=%s",
                url,
                resp.status,
                text[:500],
            )
            if resp.status >= 400:
                raise aiohttp.ClientResponseError(
                    resp.request_info,
                    resp.history,
                    status=resp.status,
                    message=text[:300],
                    headers=resp.headers,
                )
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type and text:
                try:
                    data = json.loads(text)
                    return data if isinstance(data, dict) else {}
                except json.JSONDecodeError:
                    logger.warning("webhook %s returned invalid JSON", url)
                    return {}
            return {}


def _start_durable_webhook(tool_name: str, url: str, payload: dict) -> asyncio.Task:
    key = _payload_key(tool_name, payload)
    existing = _durable_webhook_tasks.get(key)
    if existing is not None and not existing.done():
        return existing

    body = {**payload, **_livekit_call_context()}
    headers = _webhook_headers()
    task = asyncio.ensure_future(_send_webhook(url, body, headers))
    _pending_webhook_tasks.add(task)
    _durable_webhook_tasks[key] = task

    def _cleanup(t: asyncio.Task) -> None:
        _pending_webhook_tasks.discard(t)

    task.add_done_callback(_cleanup)
    logger.info("durable webhook scheduled tool=%s key=%s", tool_name, key[:120])
    return task


def schedule_durable_tool(name: str, arguments: str | dict, call_id: str = "") -> None:
    """Start the backend write the instant the model emits the tool call.

    Must not wait for LiveKit's tool executor to run it — that path gets
    cancelled outright when TTS fails or the speech turn is interrupted,
    which otherwise loses the write entirely.
    """
    env_name = _DURABLE_TOOL_URLS.get(name)
    if not env_name:
        return
    url = _env(env_name)
    if not url:
        logger.warning("%s not set, cannot schedule durable tool=%s", env_name, name)
        return
    try:
        args = json.loads(arguments) if isinstance(arguments, str) else dict(arguments)
    except (json.JSONDecodeError, TypeError, ValueError):
        logger.exception("durable tool args parse failed name=%s call_id=%s", name, call_id)
        return
    if not isinstance(args, dict):
        logger.warning("durable tool args not an object name=%s call_id=%s", name, call_id)
        return
    payload = _tool_payload(name, args)
    if payload is None:
        return
    _start_durable_webhook(name, url, payload)


async def _post_webhook(tool_name: str, url: str, payload: dict) -> dict:
    task = _start_durable_webhook(tool_name, url, payload)
    try:
        return await asyncio.shield(task)
    except asyncio.CancelledError:
        logger.warning(
            "tool call cancelled while POSTing to %s; write continues in background",
            url,
        )
        raise


@function_tool
async def get_product_catalogue() -> str:
    """Look up Mitchell's full product catalogue: exact product names, pack
    sizes, and PKR prices across every category, plus the bulk discount
    table. Call this whenever you need an exact price or size before quoting
    the caller — never guess or invent one.
    """
    return PRODUCT_CATALOGUE


@function_tool
async def log_trade_inquiry(
    customer_name: str,
    location: str,
    product_interest: str,
    caller_phone: str = "",
    company_name: str = "",
    email: str = "",
    caller_type: str = "other",
    notes: str = "",
) -> str:
    """REQUIRED tool to persist an order/trade inquiry to the backend.

    Call immediately after the caller confirms the order summary. Do not say
    the order was recorded until this tool returns success.

    Args:
        customer_name: Full name of the customer placing the order or making the trade inquiry.
        location: City and country of the caller's business or delivery location.
        product_interest: Full list of ordered/interested line items with quantities,
            e.g. "Happy Hearts 7.5g x20, Jubilee 36g x12". Use digits only for weight and quantity.
        caller_phone: Caller phone number as digits only. Empty string if email is used instead.
        company_name: Name of the company or business, if any. Empty string for a personal order.
        email: Caller's email address if provided, in standard lowercase format. Empty string otherwise.
        caller_type: One of distributor, retailer, supermarket, wholesaler, horeca, other.
        notes: Any additional details or specific requests. Empty string if none.
    """
    payload = {
        "customer_name": customer_name,
        "location": location,
        "product_interest": product_interest,
        "caller_phone": caller_phone,
        "company_name": company_name,
        "email": email,
        "caller_type": caller_type,
        "notes": notes,
    }
    url = _env("TRADE_INQUIRY_WEBHOOK_URL")
    if not url:
        logger.warning("TRADE_INQUIRY_WEBHOOK_URL not set, skipping webhook. payload=%s", payload)
        return "Logged locally (no webhook configured). Confirm the inquiry is recorded."
    try:
        data = await _post_webhook("log_trade_inquiry", url, payload)
    except Exception:
        logger.exception("log_trade_inquiry webhook call failed")
        return "There was a technical issue logging the inquiry. Ask the caller to let you retry."
    message = data.get("message") or "The inquiry has been recorded successfully."
    inquiry_id = data.get("inquiry_id", "")
    if inquiry_id:
        return f"{message} (inquiry_id={inquiry_id})"
    return message


@function_tool
async def log_complaint(
    caller_name: str,
    caller_phone: str,
    complaint_description: str,
    product_name: str,
    severity: str = "medium",
    purchase_location: str = "",
    batch_lot_number: str = "",
    purchase_date: str = "",
) -> str:
    """REQUIRED tool to persist a product/service complaint to the backend.

    You MUST call this as soon as the caller confirms the complaint summary
    (yes / ٹھیک ہے / correct). Do not say the complaint is recorded or with
    the quality team until this tool returns success. Empty optional fields
    are fine — still call the tool with what you have.

    Args:
        caller_name: Full name of the caller raising the complaint.
        caller_phone: Caller phone number as digits only.
        complaint_description: Full description of the complaint as described by the caller.
        product_name: Name of the Mitchell's product the complaint relates to.
        severity: One of low, medium, high, critical. Critical for injury/illness/foreign
            objects, high if very upset, medium for quality/taste issues, low for general feedback.
        purchase_location: Store name and city where purchased. Empty string if unknown.
        batch_lot_number: Batch/lot number from the packaging. Empty string if unavailable.
        purchase_date: Date of purchase in YYYY-MM-DD format. Empty string if unknown.
    """
    payload = {
        "caller_name": caller_name,
        "caller_phone": caller_phone,
        "complaint_description": complaint_description,
        "product_name": product_name,
        "severity": severity,
        "purchase_location": purchase_location,
        "batch_lot_number": batch_lot_number,
        "purchase_date": purchase_date,
    }
    url = _env("COMPLAINT_WEBHOOK_URL")
    if not url:
        logger.warning("COMPLAINT_WEBHOOK_URL not set, skipping webhook. payload=%s", payload)
        return "Logged locally (no webhook configured). Confirm the complaint is recorded."
    try:
        data = await _post_webhook("log_complaint", url, payload)
    except Exception:
        logger.exception("log_complaint webhook call failed")
        return "There was a technical issue logging the complaint. Ask the caller to let you retry."
    message = data.get("message") or "The complaint has been passed to our quality team."
    complaint_id = data.get("complaint_id", "")
    if complaint_id:
        return f"{message} (complaint_id={complaint_id})"
    return message


@function_tool
async def log_callback_request(
    caller_name: str,
    caller_phone: str,
    reason: str,
    preferred_callback_time: str = "",
    notes: str = "",
) -> str:
    """REQUIRED tool to persist a callback request to the backend.

    Call immediately after the caller confirms name/phone/reason/time. Do not
    say the callback is recorded until this tool returns success.

    Args:
        caller_name: Full name of the caller.
        caller_phone: Caller phone number as digits only.
        reason: One of product_inquiry, trade_inquiry, export_inquiry, complaint, general.
        preferred_callback_time: Preferred time or window for the callback, as the caller stated it.
        notes: Any additional context about the caller's inquiry. Empty string if none.
    """
    payload = {
        "caller_name": caller_name,
        "caller_phone": caller_phone,
        "reason": reason,
        "preferred_callback_time": preferred_callback_time,
        "notes": notes,
    }
    url = _env("CALLBACK_WEBHOOK_URL")
    if not url:
        logger.warning("CALLBACK_WEBHOOK_URL not set, skipping webhook. payload=%s", payload)
        return "Logged locally (no webhook configured). Confirm the callback is recorded."
    try:
        data = await _post_webhook("log_callback_request", url, payload)
    except Exception:
        logger.exception("log_callback_request webhook call failed")
        return "There was a technical issue logging the callback. Ask the caller to let you retry."
    message = data.get("message") or "The callback request has been recorded."
    callback_id = data.get("callback_id", "")
    if callback_id:
        return f"{message} (callback_id={callback_id})"
    return message


@function_tool
async def log_customer_feedback(
    caller_name: str,
    caller_phone: str,
    feedback_text: str,
    rating: int = 0,
    topic: str = "",
    sentiment: str = "neutral",
) -> str:
    """REQUIRED tool to persist customer feedback/rating to the backend.

    Call when the caller gives a 1-5 rating and/or feedback comment. Do not
    claim feedback was saved without calling this tool.

    Args:
        caller_name: Full name of the caller giving feedback. Empty string if not given.
        caller_phone: Caller phone number as digits only. Empty string if not given.
        feedback_text: The feedback in the caller's own words, summarized clearly.
        rating: Caller's satisfaction rating from 1 (very unhappy) to 5 (very happy).
            Use 0 if the caller did not give a rating.
        topic: Short topic label, e.g. "product quality", "delivery", "pricing",
            "customer service", "packaging". Empty string if unclear.
        sentiment: One of positive, neutral, negative — the overall tone of the feedback.
    """
    payload = {
        "caller_name": caller_name,
        "caller_phone": caller_phone,
        "feedback_text": feedback_text,
        "rating": rating if rating else None,
        "topic": topic,
        "sentiment": sentiment,
    }
    url = _env("FEEDBACK_WEBHOOK_URL")
    if not url:
        logger.warning("FEEDBACK_WEBHOOK_URL not set, skipping webhook. payload=%s", payload)
        return "Logged locally (no webhook configured). Confirm the feedback is recorded."
    try:
        data = await _post_webhook("log_customer_feedback", url, payload)
    except Exception:
        logger.exception("log_customer_feedback webhook call failed")
        return "There was a technical issue logging the feedback. Ask the caller to let you retry."
    message = data.get("message") or "The feedback has been recorded, thank you."
    feedback_id = data.get("feedback_id", "")
    if feedback_id:
        return f"{message} (feedback_id={feedback_id})"
    return message


@function_tool
async def end_call() -> str:
    """End the phone call and hang up.

    Call this IMMEDIATELY after you have spoken your final goodbye line
    (e.g. "Allah Hafiz" / "have a great day"). Do not call this before
    speaking the goodbye — the caller will not hear anything said after
    this tool runs, since it disconnects the call right away.
    """
    ctx = get_job_context()
    if ctx is None:
        logger.warning("end_call: no job context available, cannot hang up")
        return "Could not end the call (no active session)."
    try:
        await ctx.api.room.delete_room(
            api.DeleteRoomRequest(room=ctx.room.name)
        )
        logger.info("end_call: room %s deleted, call hung up", ctx.room.name)
        return "Call ended."
    except Exception:
        logger.exception("end_call: failed to delete room %s", ctx.room.name)
        return "There was a technical issue ending the call."


INBOUND_TOOLS = [get_product_catalogue, log_trade_inquiry, log_complaint, log_callback_request, log_customer_feedback, end_call]
OUTBOUND_TOOLS = [get_product_catalogue, log_trade_inquiry, log_callback_request, log_customer_feedback, end_call]
