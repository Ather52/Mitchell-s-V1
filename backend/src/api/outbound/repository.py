from datetime import datetime, timezone, date

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.utils.db import OutboundCampaign, OutboundContact, OutboundCall, Order
from src.api.outbound.utils import normalize_phone_number
from src.utils.db_functions import LIVE_CALL_STATUSES


async def get_last_order_by_phone(
    db: AsyncSession,
    phone_number: str,
) -> Order | None:
    result = await db.execute(
        select(Order)
        .where(Order.caller_phone == phone_number)
        .order_by(Order.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def create_campaign(
    db: AsyncSession,
    name: str,
    created_by: str,
    description: str | None = None,
    agent_id: str | None = None,
) -> OutboundCampaign:
    campaign = OutboundCampaign(
        name=name,
        description=description,
        agent_id=agent_id,
        created_by=created_by,
        status="draft",
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def get_campaign(db: AsyncSession, campaign_id: str) -> OutboundCampaign | None:
    result = await db.execute(
        select(OutboundCampaign)
        .options(selectinload(OutboundCampaign.contacts))
        .where(OutboundCampaign.id == campaign_id)
    )
    return result.scalar_one_or_none()


async def list_campaigns(
    db: AsyncSession,
    skip: int,
    limit: int,
    search: str | None = None,
) -> list[OutboundCampaign]:
    query = select(OutboundCampaign).order_by(OutboundCampaign.created_at.desc())
    if search:
        query = query.where(OutboundCampaign.name.ilike(f"%{search}%"))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_campaign(
    db: AsyncSession,
    campaign: OutboundCampaign,
    **kwargs,
) -> OutboundCampaign:
    for key, value in kwargs.items():
        if value is not None and hasattr(campaign, key):
            setattr(campaign, key, value)
    campaign.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def delete_campaign(db: AsyncSession, campaign_id: str) -> bool:
    campaign = await get_campaign(db, campaign_id)
    if not campaign:
        return False
    await db.execute(
        delete(OutboundCall).where(OutboundCall.campaign_id == campaign_id)
    )
    await db.execute(
        delete(OutboundContact).where(OutboundContact.campaign_id == campaign_id)
    )
    await db.delete(campaign)
    await db.commit()
    return True


async def get_contact_by_phone_in_campaign(
    db: AsyncSession,
    campaign_id: str,
    phone_number: str,
) -> OutboundContact | None:
    result = await db.execute(
        select(OutboundContact)
        .where(
            OutboundContact.campaign_id == campaign_id,
            OutboundContact.phone_number == phone_number,
        )
        .order_by(OutboundContact.created_at.desc())
        .limit(1)
    )
    return result.scalars().first()


async def create_contact(
    db: AsyncSession,
    campaign_id: str,
    phone_number: str,
    name: str | None = None,
    language_preference: str = "Urdu",
    company: str | None = None,
    metadata: dict | None = None,
) -> OutboundContact:
    contact = OutboundContact(
        campaign_id=campaign_id,
        name=name,
        phone_number=phone_number,
        language_preference=language_preference,
        company=company,
        contact_metadata=metadata,
        status="pending",
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


async def list_contacts(
    db: AsyncSession,
    campaign_id: str,
    skip: int = 0,
    limit: int = 1000,
) -> list[OutboundContact]:
    result = await db.execute(
        select(OutboundContact)
        .where(OutboundContact.campaign_id == campaign_id)
        .order_by(OutboundContact.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_contact(db: AsyncSession, contact_id: str) -> OutboundContact | None:
    result = await db.execute(
        select(OutboundContact).where(OutboundContact.id == contact_id)
    )
    return result.scalar_one_or_none()


async def delete_contact(db: AsyncSession, contact_id: str) -> bool:
    contact = await get_contact(db, contact_id)
    if not contact:
        return False
    await db.execute(
        delete(OutboundCall).where(OutboundCall.contact_id == contact_id)
    )
    await db.delete(contact)
    await db.commit()
    return True


async def update_contact(
    db: AsyncSession,
    contact: OutboundContact,
    **kwargs,
) -> OutboundContact:
    for key, value in kwargs.items():
        if hasattr(contact, key):
            setattr(contact, key, value)
    await db.commit()
    await db.refresh(contact)
    return contact


async def update_contact_status(
    db: AsyncSession,
    contact_id: str,
    status: str,
) -> None:
    contact = await get_contact(db, contact_id)
    if contact:
        contact.status = status
        await db.commit()


async def get_pending_contacts(
    db: AsyncSession,
    campaign_id: str,
) -> list[OutboundContact]:
    result = await db.execute(
        select(OutboundContact)
        .where(
            OutboundContact.campaign_id == campaign_id,
            OutboundContact.status == "pending",
        )
        .order_by(OutboundContact.created_at.asc())
    )
    return list(result.scalars().all())


async def create_outbound_call(
    db: AsyncSession,
    campaign_id: str,
    contact_id: str,
    phone_number: str,
    retell_call_id: str | None = None,
    call_status: str = "registered",
) -> OutboundCall:
    call = OutboundCall(
        campaign_id=campaign_id,
        contact_id=contact_id,
        phone_number=phone_number,
        retell_call_id=retell_call_id,
        call_status=call_status,
        started_at=datetime.now(timezone.utc),
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    # Mirror outbound call to CallLog table so it shows up in Calls & Orders (CallOrder.jsx)
    if retell_call_id:
        try:
            from src.utils.db import CallLog
            res = await db.execute(select(CallLog).where(CallLog.call_id == retell_call_id))
            existing_log = res.scalar_one_or_none()
            if not existing_log:
                contact = await get_contact(db, contact_id)
                customer_name = contact.name if contact else None
                log = CallLog(
                    call_id=retell_call_id,
                    caller_phone=phone_number,
                    customer_name=customer_name,
                    direction="outbound",
                    call_status=call_status,
                    start_timestamp=int(datetime.now(timezone.utc).timestamp() * 1000),
                )
                db.add(log)
                await db.commit()
        except Exception:
            pass # Suppress failures to avoid interrupting main dial flow

    return call


async def get_outbound_call(db: AsyncSession, call_id: str) -> OutboundCall | None:
    result = await db.execute(
        select(OutboundCall)
        .options(
            selectinload(OutboundCall.contact),
            selectinload(OutboundCall.campaign),
        )
        .where(OutboundCall.id == call_id)
    )
    return result.scalar_one_or_none()


async def get_outbound_call_by_retell_id(
    db: AsyncSession,
    retell_call_id: str,
) -> OutboundCall | None:
    result = await db.execute(
        select(OutboundCall)
        .options(
            selectinload(OutboundCall.contact),
            selectinload(OutboundCall.campaign),
        )
        .where(OutboundCall.retell_call_id == retell_call_id)
    )
    return result.scalar_one_or_none()


async def list_outbound_calls(
    db: AsyncSession,
    skip: int,
    limit: int,
    campaign_id: str | None = None,
) -> list[OutboundCall]:
    query = (
        select(OutboundCall)
        .options(
            selectinload(OutboundCall.contact),
            selectinload(OutboundCall.campaign),
        )
        .order_by(OutboundCall.created_at.desc())
    )
    if campaign_id:
        query = query.where(OutboundCall.campaign_id == campaign_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_outbound_call(
    db: AsyncSession,
    call: OutboundCall,
    **kwargs,
) -> OutboundCall:
    for key, value in kwargs.items():
        if value is not None and hasattr(call, key):
            setattr(call, key, value)
    await db.commit()
    await db.refresh(call)

    # Mirror updates to CallLog table
    if call.retell_call_id:
        try:
            from src.utils.db import CallLog
            from src.utils.db_functions import create_call_log

            res = await db.execute(
                select(CallLog).where(CallLog.call_id == call.retell_call_id)
            )
            log = res.scalar_one_or_none()
            if not log:
                contact_name = None
                if call.contact:
                    contact_name = call.contact.name
                await create_call_log(
                    db,
                    call_id=call.retell_call_id,
                    caller_phone=call.phone_number,
                    customer_name=contact_name,
                    direction="outbound",
                    call_status="ended",
                )
                res = await db.execute(
                    select(CallLog).where(
                        CallLog.call_id == call.retell_call_id
                    )
                )
                log = res.scalar_one_or_none()
            if log:
                if "call_status" in kwargs and kwargs["call_status"]:
                    status = str(kwargs["call_status"]).lower()
                    if status in ("error", "failed", "dial_failed"):
                        log.call_status = "failed"
                    elif status in LIVE_CALL_STATUSES:
                        log.call_status = "ongoing"
                    else:
                        log.call_status = "ended"
                if "duration" in kwargs:
                    log.duration_ms = kwargs["duration"]
                if "recording_url" in kwargs and kwargs["recording_url"]:
                    log.recording_url = kwargs["recording_url"]
                if "transcript" in kwargs and kwargs["transcript"]:
                    log.transcript = kwargs["transcript"]
                if "summary" in kwargs:
                    log.call_summary = kwargs["summary"]
                if "start_timestamp" in kwargs:
                    log.start_timestamp = kwargs["start_timestamp"]
                if kwargs.get("ended_at") is not None:
                    ended = kwargs["ended_at"]
                    if hasattr(ended, "timestamp"):
                        log.end_timestamp = int(ended.timestamp() * 1000)
                await db.commit()
        except Exception as exc:
            import logging
            logging.getLogger("outbound_calling").warning(
                "Failed to mirror outbound call %s to call_logs: %s",
                call.retell_call_id,
                exc,
            )

    return call


async def get_campaign_contact_stats(
    db: AsyncSession,
    campaign_id: str,
) -> dict:
    result = await db.execute(
        select(OutboundContact.status, func.count())
        .where(OutboundContact.campaign_id == campaign_id)
        .group_by(OutboundContact.status)
    )
    counts = {row[0]: row[1] for row in result.all()}
    total = sum(counts.values())
    return {
        "total": total,
        "pending": counts.get("pending", 0),
        "calling": counts.get("calling", 0),
        "completed": counts.get("completed", 0),
        "failed": counts.get("failed", 0),
    }


async def get_dashboard_stats(db: AsyncSession) -> dict:
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(
        tzinfo=timezone.utc
    )
    campaigns = await db.execute(select(func.count()).select_from(OutboundCampaign))
    contacts = await db.execute(select(func.count()).select_from(OutboundContact))
    calls_today = await db.execute(
        select(func.count())
        .select_from(OutboundCall)
        .where(OutboundCall.created_at >= today_start)
    )
    active_calls = await db.execute(
        select(func.count())
        .select_from(OutboundCall)
        .where(OutboundCall.call_status.in_(["registered", "ongoing", "started"]))
    )
    completed_calls = await db.execute(
        select(func.count())
        .select_from(OutboundCall)
        .where(OutboundCall.call_status.in_(["ended", "completed"]))
    )
    return {
        "campaigns": campaigns.scalar() or 0,
        "contacts": contacts.scalar() or 0,
        "calls_today": calls_today.scalar() or 0,
        "active_calls": active_calls.scalar() or 0,
        "completed_calls": completed_calls.scalar() or 0,
    }


async def get_contacts_due_for_recall(
    db: AsyncSession,
) -> list[OutboundContact]:
    """Return outbound contacts whose recall_at has passed and are ready to call again."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(OutboundContact)
        .where(
            OutboundContact.recall_at <= now,
            OutboundContact.status != "calling",
        )
        .options(selectinload(OutboundContact.campaign))
        .order_by(OutboundContact.recall_at.asc())
    )
    return list(result.scalars().all())


async def clear_call_log_recalls_for_phone(
    db: AsyncSession,
    phone_number: str,
) -> None:
    from src.utils.db import CallLog

    normalized = normalize_phone_number(phone_number)
    result = await db.execute(
        select(CallLog).where(
            CallLog.caller_phone == normalized,
            CallLog.recall_at.isnot(None),
        )
    )
    for log in result.scalars().all():
        log.recall_at = None
    await db.commit()


async def get_latest_call_for_contact(
    db: AsyncSession,
    contact_id: str,
) -> OutboundCall | None:
    """Get the most recent outbound call log for a specific contact."""
    result = await db.execute(
        select(OutboundCall)
        .where(OutboundCall.contact_id == contact_id)
        .order_by(OutboundCall.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
