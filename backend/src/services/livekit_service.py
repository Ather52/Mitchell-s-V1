# SERVICE: LIVEKIT OUTBOUND TELEPHONY
# Places outbound calls over LiveKit SIP. The LiveKit outbound trunk holds the
# Twilio credentials, so nothing Twilio-specific belongs here — we only
# reference the trunk by id.

import asyncio
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone

_logger = logging.getLogger("mitchells.livekit_service")

POLL_INTERVAL_S = 30
POLL_MIN_AGE_S = 60
NO_MEDIA_STATUSES = ("no_answer", "declined", "trunk_failure")

# Only these reach the agent as job metadata. _build_dynamic_variables also
# returns product_catalogue/company_info, which the LiveKit agent reads from
# its own prompt and tools — shipping them here would bloat every dispatch.
AGENT_METADATA_KEYS = (
    "owner_name",
    "shop_name",
    "customer_phone",
    "customer_city",
    "customer_type",
    "last_order",
    "language_preference",
)

ROOM_PREFIX = "outbound-"


def is_livekit_call_id(call_id: str | None) -> bool:
    """LiveKit calls are keyed by room name, Retell calls by a Retell id."""
    return bool(call_id) and call_id.startswith(ROOM_PREFIX)


def outbound_agent_name() -> str:
    return (
        os.getenv("MITCHELLS_OUTBOUND_AGENT_NAME") or "mitchells-outbound"
    ).strip()


def _require(name: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value:
        raise RuntimeError(f"{name} is not set")
    return value


async def place_outbound_call(
    *,
    phone_number: str,
    metadata: dict,
    agent_name: str | None = None,
) -> dict:
    """Dial `phone_number` and put the agent in the room with the callee.

    The agent dispatch is created BEFORE the SIP participant on purpose: if
    the callee answers before a worker has been assigned, they hear silence.

    Returns room_name (which doubles as the call id everywhere else in this
    codebase), sip_call_id and participant_identity.
    """
    from livekit.api import (
        CreateAgentDispatchRequest,
        CreateSIPParticipantRequest,
        LiveKitAPI,
    )

    trunk_id = _require("SIP_OUTBOUND_TRUNK_ID")
    _require("LIVEKIT_URL")
    _require("LIVEKIT_API_KEY")
    _require("LIVEKIT_API_SECRET")

    agent = agent_name or outbound_agent_name()
    phone = phone_number.strip()
    room_name = f"{ROOM_PREFIX}{uuid.uuid4().hex[:12]}"

    job_metadata = {"direction": "outbound", "customer_phone": phone}
    job_metadata.update({k: v for k, v in (metadata or {}).items() if v})

    lk = LiveKitAPI()
    try:
        await lk.agent_dispatch.create_dispatch(
            CreateAgentDispatchRequest(
                agent_name=agent,
                room=room_name,
                metadata=json.dumps(job_metadata, ensure_ascii=False),
            )
        )
        # wait_until_answered=False so the HTTP request does not block for the
        # whole ring; the LiveKit webhook reports answered/no_answer instead.
        participant = await lk.sip.create_sip_participant(
            CreateSIPParticipantRequest(
                sip_trunk_id=trunk_id,
                sip_call_to=phone,
                room_name=room_name,
                participant_identity=f"sip-{phone}",
                participant_name=job_metadata.get("owner_name") or phone,
                wait_until_answered=False,
            )
        )
    finally:
        await lk.aclose()

    _logger.info(
        "livekit outbound dial room=%s phone=%s agent=%s", room_name, phone, agent
    )
    return {
        "room_name": room_name,
        "sip_call_id": getattr(participant, "sip_call_id", "") or "",
        "participant_identity": getattr(participant, "participant_identity", "") or "",
    }


# CALL STATUS POLLER
# Fallback for when LiveKit webhooks are not delivered (observed in
# production: the cloud queue stopped emitting events after a long endpoint
# outage). Reconciles live outbound_calls rows against the rooms API. The
# webhook stays the precise source of truth; the poller only touches rows
# still in dialing/ongoing, so whichever arrives first wins.

def _age_seconds(created_at) -> float:
    if created_at is None:
        return float("inf")
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - created_at).total_seconds()


async def _poll_call_statuses() -> None:
    from livekit.api import (
        LiveKitAPI,
        ListParticipantsRequest,
        ListRoomsRequest,
    )
    from sqlalchemy import select

    from src.utils.db import (
        AsyncSessionLocal,
        CallLog,
        OutboundCall,
        OutboundContact,
    )

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(OutboundCall).where(
                OutboundCall.call_status.in_(("dialing", "ongoing")),
                OutboundCall.retell_call_id.like(f"{ROOM_PREFIX}%"),
            )
        )
        calls = result.scalars().all()
        if not calls:
            return
        lk = LiveKitAPI()
        try:
            rooms = await lk.room.list_rooms(ListRoomsRequest())
            live = {r.name for r in rooms.rooms}
            now_ms = int(time.time() * 1000)
            now_dt = datetime.now(timezone.utc)
            for call in calls:
                room_name = call.retell_call_id
                log = (
                    await db.execute(
                        select(CallLog).where(CallLog.call_id == room_name)
                    )
                ).scalar_one_or_none()
                contact = await db.get(OutboundContact, call.contact_id)
                if room_name in live:
                    parts = await lk.room.list_participants(
                        ListParticipantsRequest(room=room_name)
                    )
                    sip = next(
                        (
                            p
                            for p in parts.participants
                            if (p.identity or "").startswith(("sip-", "sip_"))
                        ),
                        None,
                    )
                    active = (
                        sip is not None
                        and (sip.attributes or {}).get("sip.callStatus")
                        == "active"
                    )
                    if active and call.call_status != "ongoing":
                        call.call_status = "ongoing"
                        if contact:
                            contact.status = "calling"
                        if log is not None and not log.answered_timestamp:
                            log.answered_timestamp = now_ms
                            log.call_status = "ongoing"
                    continue
                if _age_seconds(call.created_at) < POLL_MIN_AGE_S:
                    continue
                if log is not None and log.end_timestamp:
                    failed = log.call_status in NO_MEDIA_STATUSES
                    call.call_status = "failed" if failed else "ended"
                    call.duration = log.duration_ms
                    call.ended_at = datetime.fromtimestamp(
                        log.end_timestamp / 1000, tz=timezone.utc
                    )
                else:
                    answered = log.answered_timestamp if log else None
                    call.call_status = "ended" if answered else "failed"
                    call.ended_at = now_dt
                    call.duration = (
                        max(0, now_ms - answered) if answered else 0
                    )
                    if log is not None:
                        log.end_timestamp = now_ms
                        log.duration_ms = call.duration
                        log.call_status = (
                            "ended" if answered else "no_answer"
                        )
                if contact:
                    contact.status = (
                        "failed" if call.call_status == "failed"
                        else "completed"
                    )
                _logger.info(
                    "poller resolved %s -> %s", room_name, call.call_status
                )
            await db.commit()
        finally:
            await lk.aclose()


async def _call_status_poll_loop() -> None:
    while True:
        try:
            await _poll_call_statuses()
        except Exception:
            _logger.exception("call status poll failed")
        await asyncio.sleep(POLL_INTERVAL_S)


async def start_call_status_poller() -> None:
    asyncio.create_task(_call_status_poll_loop())
    _logger.info("LiveKit call status poller started")
