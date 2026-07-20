# ROUTER: LIVEKIT TELEPHONY WEBHOOK
# Receives LiveKit's room/participant lifecycle events and turns them into
# call records. This is the source of truth for call timing — the agent
# process cannot report it reliably, because a crashed or killed agent never
# gets to write anything, whereas LiveKit still emits participant_left.
#
# TIMING — the important part:
#   room_started / room_finished do NOT bound the call. A room is created
#   before anyone answers, and it lingers after the last participant leaves
#   for `departure_timeout` seconds (and `empty_timeout` if nobody ever
#   joined). Using them would overstate every call by up to a minute.
#   The caller's own SIP participant is what bounds the call:
#     joined_at            -> line connected (inbound) / dial start (outbound)
#     first track_published -> media flowing == answered
#     participant_left     -> hangup
#   So billable duration is measured from `answered` when we can determine
#   it, falling back to joined_at.

import json
import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, Response
from google.protobuf.json_format import MessageToDict
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.utils.db import (
    get_db,
    CallLog,
    LiveKitCallEvent,
    OutboundCall,
    OutboundContact,
)

logger = logging.getLogger("mitchells.livekit")

router = APIRouter(prefix="/api/livekit", tags=["livekit"])

SIP_KIND = "SIP"
AGENT_KIND = "AGENT"

# sip.callStatus values, per LiveKit's SIP participant reference.
CALL_STATUS_ACTIVE = "active"

# DisconnectReason -> human outcome. This is what lets us tell a real
# conversation apart from a call that was never answered.
DISCONNECT_OUTCOMES = {
    "CLIENT_INITIATED": "caller_hung_up",
    "USER_UNAVAILABLE": "no_answer",
    "USER_REJECTED": "declined",
    "SIP_TRUNK_FAILURE": "trunk_failure",
    "ROOM_DELETED": "agent_ended",
    "SERVER_SHUTDOWN": "server_shutdown",
    "PARTICIPANT_REMOVED": "removed",
    "CONNECTION_TIMEOUT": "connection_timeout",
    "MEDIA_FAILURE": "media_failure",
    "AGENT_ERROR": "agent_error",
    "ROOM_CLOSED": "room_closed",
}

NO_MEDIA_OUTCOMES = {"no_answer", "declined", "trunk_failure"}

_receiver = None


def _get_receiver():
    """Build the verifier lazily so the app still boots without LiveKit keys."""
    global _receiver
    if _receiver is not None:
        return _receiver
    api_key = (os.getenv("LIVEKIT_API_KEY") or "").strip()
    api_secret = (os.getenv("LIVEKIT_API_SECRET") or "").strip()
    if not api_key or not api_secret:
        return None
    from livekit.api import TokenVerifier, WebhookReceiver

    _receiver = WebhookReceiver(TokenVerifier(api_key, api_secret))
    return _receiver


def _attr(participant, key: str) -> str:
    if not participant:
        return ""
    return (participant.attributes or {}).get(key, "") or ""


def _is_sip(participant) -> bool:
    # track_published events omit both `kind` and the sip.* attributes, so
    # the identity prefix (sip-<number> outbound, sip_<number> inbound) is
    # the only reliable marker there.
    if _kind_name(participant) == SIP_KIND:
        return True
    identity = getattr(participant, "identity", "") or ""
    return identity.startswith(("sip-", "sip_"))


def _kind_name(participant) -> str:
    try:
        from livekit.protocol.models import ParticipantInfo

        return ParticipantInfo.Kind.Name(participant.kind)
    except Exception:
        return str(getattr(participant, "kind", ""))


def _disconnect_name(participant) -> str:
    try:
        from livekit.protocol.models import DisconnectReason

        return DisconnectReason.Name(participant.disconnect_reason)
    except Exception:
        return ""


async def _get_or_create_call(db: AsyncSession, room_name: str) -> CallLog:
    """call_id is the LiveKit room name — the same key tools.py posts as
    `call_id`, which is what ties a logged order back to its call."""
    result = await db.execute(select(CallLog).where(CallLog.call_id == room_name))
    call = result.scalar_one_or_none()
    if call is None:
        call = CallLog(call_id=room_name, caller_phone="", call_status="ongoing")
        db.add(call)
        await db.flush()
    return call


async def _store_event(db: AsyncSession, event, raw: dict) -> bool:
    """Persist the raw event. Returns False if we've already seen it.

    LiveKit retries on any non-2xx and gives no delivery guarantee, so the
    same event id can arrive repeatedly; the unique index is what stops a
    retry from double-counting a duration.
    """
    participant = event.participant if event.HasField("participant") else None
    row = LiveKitCallEvent(
        event_id=event.id,
        event_type=event.event,
        room_name=event.room.name if event.HasField("room") else None,
        room_sid=event.room.sid if event.HasField("room") else None,
        participant_identity=participant.identity if participant else None,
        participant_kind=_kind_name(participant) if participant else None,
        event_time=event.created_at,
        num_dropped=event.num_dropped,
        payload=raw,
    )
    db.add(row)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        logger.warning("duplicate LiveKit event ignored id=%s", event.id)
        return False
    return True


async def _handle_room_started(db, event):
    call = await _get_or_create_call(db, event.room.name)
    call.room_sid = event.room.sid
    call.room_started_timestamp = event.room.creation_time * 1000
    if call.call_status in (None, "", "registered"):
        call.call_status = "ongoing"


async def _sync_outbound_call(db, call: CallLog):
    """Mirror webhook-derived state into the outbound_calls row the campaign
    UI reads. The Retell polling path is a no-op for LiveKit ids, so without
    this the UI shows every LiveKit call as `dialing` forever."""
    result = await db.execute(
        select(OutboundCall).where(OutboundCall.retell_call_id == call.call_id)
    )
    outbound = result.scalar_one_or_none()
    if outbound is None:
        return
    if call.call_status == "ongoing":
        outbound.call_status = "ongoing"
        contact_status = "calling"
    elif call.call_status in NO_MEDIA_OUTCOMES:
        outbound.call_status = "failed"
        contact_status = "failed"
    else:
        outbound.call_status = "ended"
        contact_status = "completed"
    if call.duration_ms is not None:
        outbound.duration = call.duration_ms
    if call.start_timestamp:
        outbound.started_at = datetime.fromtimestamp(
            call.start_timestamp / 1000, tz=timezone.utc
        )
    if call.end_timestamp:
        outbound.ended_at = datetime.fromtimestamp(
            call.end_timestamp / 1000, tz=timezone.utc
        )
    contact = await db.get(OutboundContact, outbound.contact_id)
    if contact:
        contact.status = contact_status


async def _handle_participant_joined(db, event):
    participant = event.participant
    if not _is_sip(participant):
        return
    call = await _get_or_create_call(db, event.room.name)
    call.room_sid = event.room.sid
    call.start_timestamp = participant.joined_at * 1000
    call.sip_call_id = _attr(participant, "sip.callID")
    call.trunk_phone_number = _attr(participant, "sip.trunkPhoneNumber")
    phone = _attr(participant, "sip.phoneNumber")
    if phone:
        call.caller_phone = phone
    # sip.ruleID is only set when an inbound dispatch rule matched.
    call.direction = "inbound" if _attr(participant, "sip.ruleID") else "outbound"
    call.call_status = "ongoing"
    # Inbound callers are already on the line when their participant is
    # created, so joined_at IS the answer time. Outbound starts at dial and
    # only becomes active once picked up — that transition has no webhook,
    # so we wait for track_published below.
    if _attr(participant, "sip.callStatus") == CALL_STATUS_ACTIVE:
        call.answered_timestamp = participant.joined_at * 1000
        call.ring_ms = 0
    await _sync_outbound_call(db, call)


async def _handle_track_published(db, event):
    """First media from the caller == the call is genuinely answered.

    This is our only webhook-visible signal for an outbound answer, since
    sip.callStatus flipping to "active" doesn't emit an event.
    """
    participant = event.participant
    if not _is_sip(participant):
        return
    call = await _get_or_create_call(db, event.room.name)
    if call.answered_timestamp:
        return
    call.answered_timestamp = event.created_at * 1000
    if call.start_timestamp:
        call.ring_ms = max(0, call.answered_timestamp - call.start_timestamp)


async def _handle_participant_left(db, event):
    participant = event.participant
    if not _is_sip(participant):
        return
    call = await _get_or_create_call(db, event.room.name)
    end_ms = event.created_at * 1000
    call.end_timestamp = end_ms
    reason = _disconnect_name(participant)
    call.disconnect_reason = reason
    outcome = DISCONNECT_OUTCOMES.get(reason, "ended")
    # Billable time runs from answer, not from dial — otherwise every
    # unanswered outbound call bills for its ring time.
    started = call.answered_timestamp or call.start_timestamp
    if outcome in NO_MEDIA_OUTCOMES and not call.answered_timestamp:
        call.duration_ms = 0
    elif started:
        call.duration_ms = max(0, end_ms - started)
    call.call_status = outcome
    await _sync_outbound_call(db, call)


async def _handle_room_finished(db, event):
    call = await _get_or_create_call(db, event.room.name)
    call.room_finished_timestamp = event.created_at * 1000
    # Deliberately NOT used for duration: this fires departure_timeout after
    # the last participant left, so it is later than the real hangup.
    if not call.end_timestamp:
        # No SIP participant ever left => none ever joined => nobody answered.
        call.call_status = "no_answer"
        call.duration_ms = 0
        await _sync_outbound_call(db, call)


HANDLERS = {
    "room_started": _handle_room_started,
    "participant_joined": _handle_participant_joined,
    "track_published": _handle_track_published,
    "participant_left": _handle_participant_left,
    "room_finished": _handle_room_finished,
}


@router.post("/webhook")
async def livekit_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    receiver = _get_receiver()
    if receiver is None:
        logger.error("LIVEKIT_API_KEY/SECRET not set, cannot verify webhook")
        return Response(status_code=200)

    # Signature verification needs the EXACT bytes LiveKit signed; a parsed
    # and re-serialized body would not match the sha256 in the token.
    body = (await request.body()).decode("utf-8")
    auth = request.headers.get("Authorization", "")
    try:
        event = receiver.receive(body, auth)
    except Exception:
        logger.exception("LiveKit webhook verification failed")
        return Response(status_code=401)

    try:
        raw = json.loads(body)
    except json.JSONDecodeError:
        raw = MessageToDict(event, preserving_proto_field_name=True)

    if event.num_dropped:
        logger.warning(
            "LiveKit dropped %d event(s) before %s (room=%s) — derived state "
            "for this call may be incomplete",
            event.num_dropped,
            event.event,
            event.room.name if event.HasField("room") else "?",
        )

    logger.warning(
        "livekit event %s id=%s room=%s created_at=%s",
        event.event,
        event.id,
        event.room.name if event.HasField("room") else "?",
        event.created_at,
    )
    try:
        fresh = await _store_event(db, event, raw)
        if not fresh:
            return {"success": True, "duplicate": True}
        handler = HANDLERS.get(event.event)
        if handler and event.HasField("room") and event.room.name:
            await handler(db, event)
        await db.commit()
    except Exception:
        await db.rollback()
        logger.exception("failed handling LiveKit event %s", event.event)
        # 500 makes LiveKit retry, which is what we want for a transient DB
        # error — the event id dedupe keeps the retry safe.
        return Response(status_code=500)

    return {"success": True}
