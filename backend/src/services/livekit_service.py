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

POLL_INTERVAL_S = 5
POLL_MIN_AGE_S = 60
NO_MEDIA_STATUSES = ("no_answer", "declined", "trunk_failure")
INBOUND_ROOM_PREFIX = "+"

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
# Primary call-timing tracker while LiveKit webhooks are not delivered
# (observed in production: the cloud queue stopped emitting events after a
# long endpoint outage). Polls rooms and their SIP participant every few
# seconds for both directions. Timing comes from the participant, never
# the room: rooms exist before pickup and linger after hangup, so the
# hangup moment is the SIP participant vanishing from a still-live room.
# The webhook handler stays active and is more precise; both paths only
# fill fields that are still unset, so whichever runs first wins safely.

# True when the previous tick saw live call rooms; used to keep sweeping
# the DB for a few ticks after calls end without paying a Neon connection
# on every idle tick. All call state itself lives in call_logs
# (start_timestamp set = SIP participant was observed), so restarts lose
# nothing.
_recently_live = False


def _is_call_room(name: str) -> bool:
    return name.startswith((ROOM_PREFIX, INBOUND_ROOM_PREFIX))


def _sip_participant(participants):
    for p in participants:
        if (p.attributes or {}).get("sip.callID"):
            return p
        if (p.identity or "").startswith(("sip-", "sip_")):
            return p
    return None


async def _get_or_create_log(db, room_name: str):
    from sqlalchemy import select

    from src.utils.db import CallLog

    log = (
        await db.execute(select(CallLog).where(CallLog.call_id == room_name))
    ).scalar_one_or_none()
    if log is None:
        log = CallLog(
            call_id=room_name, caller_phone="", call_status="ongoing"
        )
        db.add(log)
        await db.flush()
    return log


async def _sync_outbound_row(db, log) -> None:
    from sqlalchemy import select

    from src.utils.db import OutboundCall, OutboundContact

    if not log.call_id.startswith(ROOM_PREFIX):
        return
    call = (
        await db.execute(
            select(OutboundCall).where(
                OutboundCall.retell_call_id == log.call_id
            )
        )
    ).scalar_one_or_none()
    if call is None:
        return
    if log.call_status == "ongoing":
        call.call_status = "ongoing"
        contact_status = "calling"
    elif log.call_status in NO_MEDIA_STATUSES:
        call.call_status = "failed"
        contact_status = "failed"
    elif log.end_timestamp:
        call.call_status = "ended"
        contact_status = "completed"
    else:
        return
    if log.duration_ms is not None:
        call.duration = log.duration_ms
    if log.start_timestamp:
        call.started_at = datetime.fromtimestamp(
            log.start_timestamp / 1000, tz=timezone.utc
        )
    if log.end_timestamp:
        call.ended_at = datetime.fromtimestamp(
            log.end_timestamp / 1000, tz=timezone.utc
        )
    contact = await db.get(OutboundContact, call.contact_id)
    if contact:
        contact.status = contact_status


def _finalize_log(log, now_ms: int) -> None:
    log.end_timestamp = now_ms
    if log.answered_timestamp:
        log.duration_ms = max(0, now_ms - log.answered_timestamp)
        log.call_status = "ended"
    else:
        log.duration_ms = 0
        log.call_status = "no_answer"


async def _observe_live_room(db, lk, room_name: str, now_ms: int) -> None:
    from livekit.api import ListParticipantsRequest

    parts = await lk.room.list_participants(
        ListParticipantsRequest(room=room_name)
    )
    sip = _sip_participant(parts.participants)
    log = await _get_or_create_log(db, room_name)
    if sip is not None:
        attrs = sip.attributes or {}
        if not log.start_timestamp and sip.joined_at:
            log.start_timestamp = sip.joined_at * 1000
        if not log.caller_phone:
            log.caller_phone = (
                attrs.get("sip.phoneNumber")
                or (sip.identity or "").removeprefix("sip-").removeprefix(
                    "sip_"
                )
            )
        if not log.direction:
            log.direction = (
                "inbound"
                if room_name.startswith(INBOUND_ROOM_PREFIX)
                else "outbound"
            )
        if not log.sip_call_id:
            log.sip_call_id = attrs.get("sip.callID") or None
        if (
            attrs.get("sip.callStatus") == "active"
            and not log.answered_timestamp
        ):
            log.answered_timestamp = now_ms
            if log.start_timestamp:
                log.ring_ms = max(0, now_ms - log.start_timestamp)
            log.call_status = "ongoing"
            await _sync_outbound_row(db, log)
            _logger.info("poller: %s answered", room_name)
    elif log.start_timestamp and not log.end_timestamp:
        # start_timestamp set means the SIP participant was observed at
        # some point; it being gone from a still-live room is the accurate
        # hangup signal (the room lingers for departure_timeout).
        _finalize_log(log, now_ms)
        await _sync_outbound_row(db, log)
        _logger.info(
            "poller: %s ended (%sms)", room_name, log.duration_ms
        )


def _age_seconds(created_at) -> float:
    if created_at is None:
        return float("inf")
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - created_at).total_seconds()


async def _resolve_stale_outbound(db, live: set, now_ms: int) -> None:
    """Safety net for rows whose room vanished before the poller ever saw
    it (backend downtime, restarts)."""
    from sqlalchemy import select

    from src.utils.db import OutboundCall

    result = await db.execute(
        select(OutboundCall).where(
            OutboundCall.call_status.in_(("dialing", "ongoing")),
            OutboundCall.retell_call_id.like(f"{ROOM_PREFIX}%"),
        )
    )
    for call in result.scalars().all():
        room_name = call.retell_call_id
        if room_name in live:
            continue
        if _age_seconds(call.created_at) < POLL_MIN_AGE_S:
            continue
        log = await _get_or_create_log(db, room_name)
        if not log.end_timestamp:
            _finalize_log(log, now_ms)
        await _sync_outbound_row(db, log)
        _logger.info(
            "poller resolved stale %s -> %s", room_name, call.call_status
        )


async def _sweep_vanished_rooms(db, live: set, now_ms: int) -> None:
    """Finalize call_logs rows that still look live but whose room no
    longer exists. DB-driven, so calls that ended while the backend was
    down or restarting still get their end time and duration."""
    from sqlalchemy import select

    from src.utils.db import CallLog

    result = await db.execute(
        select(CallLog).where(
            CallLog.end_timestamp.is_(None),
            CallLog.call_status.in_(("ongoing", "dialing", "registered")),
        )
    )
    for log in result.scalars().all():
        room_name = log.call_id or ""
        if not _is_call_room(room_name) or room_name in live:
            continue
        if _age_seconds(log.created_at) < 45:
            continue
        _finalize_log(log, now_ms)
        await _sync_outbound_row(db, log)
        _logger.info(
            "poller: %s room gone, resolved -> %s (%sms)",
            room_name,
            log.call_status,
            log.duration_ms,
        )


_tick = 0
STALE_CHECK_EVERY_TICKS = 12


async def _poll_call_statuses() -> None:
    from livekit.api import ListRoomsRequest, LiveKitAPI

    from src.utils.db import AsyncSessionLocal

    global _tick, _recently_live
    _tick += 1
    stale_check = _tick % STALE_CHECK_EVERY_TICKS == 0
    lk = LiveKitAPI()
    try:
        rooms = await lk.room.list_rooms(ListRoomsRequest())
        live = {r.name for r in rooms.rooms if _is_call_room(r.name)}
        now_ms = int(time.time() * 1000)
        # NullPool means every session is a fresh Neon TLS connection;
        # skip the DB entirely on idle ticks. _recently_live keeps the
        # sweep running for the tick right after the last room vanished.
        if not live and not _recently_live and not stale_check:
            return
        async with AsyncSessionLocal() as db:
            for room_name in live:
                try:
                    await _observe_live_room(db, lk, room_name, now_ms)
                except Exception:
                    _logger.exception("poller: observe failed %s", room_name)
            await _sweep_vanished_rooms(db, live, now_ms)
            if stale_check:
                await _resolve_stale_outbound(db, live, now_ms)
            await db.commit()
        _recently_live = bool(live)
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
