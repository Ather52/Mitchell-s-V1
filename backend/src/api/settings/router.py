import logging
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.utils.db import get_db, User
from src.utils.dependencies import get_current_user
from src.utils.db_functions import get_agent_settings, update_agent_settings
from src.services import retell_service

router = APIRouter(prefix="/api/settings", tags=["settings"])
logger = logging.getLogger(__name__)


def _detect_provider(voice_id: str) -> str:
    prefix = voice_id.split("-")[0].lower()
    mapping = {
        "11labs": "elevenlabs",
        "cartesia": "cartesia",
        "openai": "openai",
        "deepgram": "deepgram",
        "minimax": "minimax",
        "retell": "retell",
    }
    return mapping.get(prefix, prefix)


class AgentSettingsResponse(BaseModel):
    id: str
    voice_id: str
    voice_speed: float
    voice_temperature: float
    interruption_sensitivity: float
    responsiveness: float
    is_active: bool
    kitchen_open_time: str
    kitchen_close_time: str
    store_open_time: str
    store_close_time: str
    closed_greeting: str
    open_greeting: str | None
    restaurant_timezone: str
    prompt_instructions: str | None
    delivery_address: str | None
    pickup_address: str | None
    restaurant_name: str
    restaurant_info: str = "Mitchell's is a historic food manufacturer in Pakistan, producing high-quality jams, squashes, ketchups, sauces, and confectionery since 1933."
    wait_time_pickup: str = "15"
    wait_time_delivery: str = "30"
    locked_prompt_tail: str = retell_service.LOCKED_PROMPT_TAIL
    updated_at: datetime
    retell_live: dict | None = None

    class Config:
        from_attributes = True


class UpdateAgentSettingsRequest(BaseModel):
    voice_id: str | None = None
    voice_speed: float | None = Field(default=None, ge=0.5, le=2.0)
    voice_temperature: float | None = Field(default=None, ge=0.0, le=1.0)
    interruption_sensitivity: float | None = Field(default=None, ge=0.0, le=1.0)
    responsiveness: float | None = Field(default=None, ge=0.0, le=1.0)
    is_active: bool | None = None
    kitchen_open_time: str | None = None
    kitchen_close_time: str | None = None
    store_open_time: str | None = None
    store_close_time: str | None = None
    closed_greeting: str | None = None
    open_greeting: str | None = None
    restaurant_timezone: str | None = None
    prompt_instructions: str | None = None
    delivery_address: str | None = None
    pickup_address: str | None = None
    restaurant_name: str | None = None
    restaurant_info: str | None = None
    wait_time_pickup: str | None = None
    wait_time_delivery: str | None = None


class VoiceItem(BaseModel):
    voice_id: str
    voice_name: str
    provider: str
    gender: str
    accent: str | None = None
    age: str | None = None
    preview_audio_url: str | None = None


class VoicesResponse(BaseModel):
    voices: list[VoiceItem]
    current_voice_id: str
    current_provider: str


# The 3 curated voices selectable from the dashboard — confirmed available in this Retell workspace.
DEFAULT_VOICES: list[VoiceItem] = [
    VoiceItem(voice_id="11labs-Monika", voice_name="Monika (en-IN)", provider="elevenlabs",
              gender="female", accent="indian", age="middle aged", preview_audio_url=None),
    VoiceItem(voice_id="11labs-Samad", voice_name="Samad (en-IN)", provider="elevenlabs",
              gender="male", accent="indian", age="middle aged", preview_audio_url=None),
    VoiceItem(voice_id="11labs-Hailey", voice_name="Hailey", provider="elevenlabs",
              gender="female", accent="american", age="young", preview_audio_url=None),
]

ALLOWED_VOICE_IDS: set[str] = {v.voice_id for v in DEFAULT_VOICES}


class AgentLiveResponse(BaseModel):
    voice_id: str
    voice_speed: float | None = None
    voice_temperature: float | None = None
    interruption_sensitivity: float | None = None
    responsiveness: float | None = None
    is_published: bool | None = None
    language: str | None = None
    max_call_duration_ms: int | None = None
    end_call_after_silence_ms: int | None = None


@router.get("", response_model=AgentSettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    settings = await get_agent_settings(db)
    response = AgentSettingsResponse.model_validate(settings)
    return response


@router.get("/retell")
async def get_retell_live(_: User = Depends(get_current_user)):
    return await retell_service.get_agent()


@router.get("/agent-live", response_model=AgentLiveResponse)
async def get_agent_live(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        agent = await retell_service.get_agent()
    except Exception as e:
        logger.error("Could not reach Retell API: %s", e)
        raise HTTPException(status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE, detail="Could not reach Retell API")
    try:
        await update_agent_settings(
            db,
            voice_id=agent.get("voice_id"),
            voice_speed=agent.get("voice_speed"),
            interruption_sensitivity=agent.get("interruption_sensitivity"),
            responsiveness=agent.get("responsiveness"),
        )
    except Exception as e:
        logger.error("Failed to sync agent-live settings to DB: %s", e)
    return AgentLiveResponse(
        voice_id=agent.get("voice_id", ""),
        voice_speed=agent.get("voice_speed"),
        voice_temperature=agent.get("voice_temperature"),
        interruption_sensitivity=agent.get("interruption_sensitivity"),
        responsiveness=agent.get("responsiveness"),
        is_published=agent.get("is_published"),
        language=agent.get("language"),
        max_call_duration_ms=agent.get("max_call_duration_ms"),
        end_call_after_silence_ms=agent.get("end_call_after_silence_ms"),
    )


@router.get("/voices", response_model=VoicesResponse)
async def get_voices(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        settings = await get_agent_settings(db)
        current_voice_id = settings.voice_id or DEFAULT_VOICES[0].voice_id
    except Exception:
        current_voice_id = DEFAULT_VOICES[0].voice_id

    current_provider = _detect_provider(current_voice_id)

    try:
        all_voices = await retell_service.list_voices()
        by_id = {v.get("voice_id"): v for v in all_voices}
        voices = []
        for dv in DEFAULT_VOICES:
            live = by_id.get(dv.voice_id)
            if live:
                voices.append(VoiceItem(
                    voice_id=dv.voice_id,
                    voice_name=dv.voice_name,
                    provider=dv.provider,
                    gender=dv.gender,
                    accent=dv.accent,
                    age=dv.age,
                    preview_audio_url=live.get("preview_audio_url"),
                ))
            else:
                voices.append(dv)
    except Exception as e:
        logger.error("Failed to fetch preview URLs from Retell (using curated defaults as-is): %s", e)
        voices = DEFAULT_VOICES

    return VoicesResponse(
        voices=voices,
        current_voice_id=current_voice_id,
        current_provider=current_provider,
    )


@router.patch("", response_model=AgentSettingsResponse)
async def patch_settings(
    body: UpdateAgentSettingsRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    updates = body.model_dump(exclude_none=True)
    voice_fields = {"voice_id", "voice_speed", "interruption_sensitivity", "responsiveness"}
    voice_updates = {k: v for k, v in updates.items() if k in voice_fields}

    if "voice_id" in voice_updates:
        valid_prefixes = ("11labs-", "cartesia-", "retell-", "openai-", "deepgram-", "minimax-")
        new_voice_id = voice_updates["voice_id"]
        if not new_voice_id.startswith(valid_prefixes):
            logger.error("Invalid voice_id format: %s", new_voice_id)
            voice_updates.pop("voice_id")
        else:
            try:
                all_voices = await retell_service.list_voices()
                valid_ids = {v.get("voice_id") for v in all_voices}
                if new_voice_id not in valid_ids:
                    raise HTTPException(
                        status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Voice ID not found in Retell. Use GET /api/settings/voices to see available voices.",
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.warning("Could not validate voice_id against Retell: %s", e)
            new_provider = new_voice_id.split("-")[0]
            if new_provider == "11labs":
                voice_updates["voice_model"] = "eleven_turbo_v2_5"
            else:
                voice_updates["voice_model"] = None

    prompt_instructions = updates.get("prompt_instructions")
    settings = await update_agent_settings(db, **updates)
    if voice_updates:
        for agent_id in (os.getenv("RETELL_AGENT_ID"), os.getenv("RETELL_OUTBOUND_AGENT_ID")):
            if not agent_id: continue
            try:
                logger.warning("Sending to Retell update-agent %s: %s", agent_id, voice_updates)
                result = await retell_service.update_agent_voice_settings(override_agent_id=agent_id, **voice_updates)
                logger.warning("Retell update-agent %s response: %s", agent_id, result)
            except Exception as e:
                logger.error("Failed to sync voice settings to Retell agent %s: %s", agent_id, e)
    if prompt_instructions is not None:
        full_prompt = retell_service.assemble_global_prompt(prompt_instructions)
        for flow_id in (os.getenv("RETELL_CONVERSATION_FLOW_ID"), os.getenv("RETELL_OUTBOUND_CONVERSATION_FLOW_ID")):
            if not flow_id: continue
            try:
                await retell_service.update_conversation_flow({"global_prompt": full_prompt}, override_flow_id=flow_id)
            except Exception as e:
                logger.error("Failed to sync prompt to Retell flow %s: %s", flow_id, e)
    return AgentSettingsResponse.model_validate(settings)


class CreateAgentRequest(BaseModel):
    agent_name: str
    voice_id: str


@router.get("/agents")
async def list_agents(
    _: User = Depends(get_current_user),
):
    try:
        agents = await retell_service.list_agents()
        return agents
    except Exception as e:
        logger.error("Failed to list agents from Retell: %s", e)
        # Return fallback list so settings UI always loads and functions
        active_agent_id = os.getenv("RETELL_AGENT_ID", "default_agent_id")
        return [
            {
                "agent_id": active_agent_id,
                "agent_name": "Mitchell's Sales Agent",
                "voice_id": "11labs-Valentina",
                "response_engine": {
                    "type": "conversation-flow",
                    "conversation_flow_id": os.getenv("RETELL_CONVERSATION_FLOW_ID", "")
                }
            }
        ]


@router.post("/agents")
async def create_agent(
    body: CreateAgentRequest,
    _: User = Depends(get_current_user),
):
    try:
        agent = await retell_service.create_agent(body.agent_name, body.voice_id)
        return agent
    except Exception as e:
        logger.error("Failed to create agent in Retell: %s", e)
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create agent: {str(e)}"
        )