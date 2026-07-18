from operator import call
import asyncio
import logging
import re
import os
import httpx
from datetime import datetime, timezone, timedelta
from sqlalchemy import select,Subquery
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.services import retell_service
from src.services import livekit_service
from src.utils.db import AsyncSessionLocal
from src.api.outbound import repository as repo
from src.api.outbound.utils import (
    validate_phone_number,
    normalize_phone_number,
    CAMPAIGN_STATUSES,
    merge_contact_payload,
    format_last_order,
    clean_customer_value,
    map_retell_call_status,
    contact_status_for_call_status,
)
from src.utils.db_functions import (
    get_caller_by_phone,
    get_agent_settings,
    build_menu_text,
)

_logger = logging.getLogger("outbound_calling")

COMPANY_FIELD_KEYS = (
    "company_name",
    "company",
    "customer_company",
    "business_name",
    "shop_name",
    "store_name",
    "organization",
)


# ---------------------------------------------------------------------------
# Recall-time parser
# ---------------------------------------------------------------------------

_WEEKDAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}

def parse_recall_time(text: str) -> datetime | None:
    """
    Parse a natural-language recall request from a call summary and return
    an absolute UTC datetime.

    Handles patterns like:
      - "call after 30 minutes"
      - "call back in 2 hours"
      - "call me tomorrow"
      - "call next Monday"
      - "call on Friday"
      - "call later" / "callback" (defaults to +2 h)
    Returns None if no recall intent is detected.
    """
    if not text:
        return None

    low = text.lower()

    # Must contain a callback / call-later keyword
    TRIGGER_KEYWORDS = [
        "call later", "call back", "callback", "call again",
        "call after", "call me", "ring me", "call in", "call next", "call on",
    ]
    if not any(kw in low for kw in TRIGGER_KEYWORDS):
        return None

    now = datetime.now(timezone.utc)

    # ── minutes ──────────────────────────────────────────────────────────────
    m = re.search(r"(\d+)\s*(?:minute|min)", low)
    if m:
        return now + timedelta(minutes=int(m.group(1)))

    # ── hours ─────────────────────────────────────────────────────────────────
    m = re.search(r"(\d+)\s*(?:hour|hr)", low)
    if m:
        return now + timedelta(hours=int(m.group(1)))

    # ── "tomorrow" ────────────────────────────────────────────────────────────
    if "tomorrow" in low:
        return now + timedelta(days=1)

    # ── specific weekday ──────────────────────────────────────────────────────
    for day_name, day_idx in _WEEKDAY_MAP.items():
        if day_name in low:
            days_ahead = (day_idx - now.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7  # same weekday → next week
            return now + timedelta(days=days_ahead)

    # ── "call later" / generic callback → default +2 hours ───────────────────
    if any(kw in low for kw in ["call later", "call back", "callback", "call again", "try again"]):
        return now + timedelta(hours=2)

    return None


def _extract_company_from_data(*sources: dict | None) -> str | None:
    for data in sources:
        if not data:
            continue
        for key in COMPANY_FIELD_KEYS:
            company = clean_customer_value(data.get(key))
            if company:
                return company
    return None


def _extract_company_from_summary(summary: str | None) -> str | None:
    if not summary:
        return None
    patterns = (
        r"\b(?:customer company is|company is|business is|shop is|store is)\s+([A-Z][a-zA-Z0-9'&.-]*(?:\s+[A-Z][a-zA-Z0-9'&.-]*){0,4})\b",
        r"\b(?:from|at|of)\s+([A-Z][a-zA-Z0-9']+(?:\s+[A-Z][a-zA-Z0-9']+){0,3}\s+(?:Store|Shop|Mart|Distributor|Ltd|Co|Incorporated|Inc|Enterprises|Traders|Supermarket))\b",
        r"(?:contacted|spoke with|spoke to|called|talked to)\s+(?:.*?)\s+(?:from|at|in|to)\s+([A-Z][a-zA-Z0-9'&.-]*(?:\s+[A-Z][a-zA-Z0-9'&.-]*){0,4})",
    )
    for pattern in patterns:
        m = re.search(pattern, summary, re.IGNORECASE)
        if m:
            val = clean_customer_value(m.group(1))
            if val:
                return val
    return None


class OutboundCallingService:

    async def create_campaign(
        self,
        db: AsyncSession,
        name: str,
        created_by: str,
        description: str | None = None,
        agent_id: str | None = None,
    ):
        return await repo.create_campaign(
            db, name, created_by, description, agent_id
        )

    async def update_campaign(
        self,
        db: AsyncSession,
        campaign_id: str,
        **kwargs,
    ):
        campaign = await repo.get_campaign(db, campaign_id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        if kwargs.get("status") and kwargs["status"] not in CAMPAIGN_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid campaign status",
            )
        return await repo.update_campaign(db, campaign, **kwargs)

    async def add_contact(
        self,
        db: AsyncSession,
        campaign_id: str,
        phone_number: str,
        name: str | None = None,
        language_preference: str = "Urdu",
        company: str | None = None,
        metadata: dict | None = None,
        shop_name: str | None = None,
        owner_name: str | None = None,
        customer_city: str | None = None,
        last_order: str | None = None,
        customer_type: str | None = None,
    ):
        campaign = await repo.get_campaign(db, campaign_id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        try:
            normalized = validate_phone_number(phone_number)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )
        resolved_name, resolved_company, resolved_meta = merge_contact_payload(
            name=name,
            company=company,
            metadata=metadata,
            shop_name=shop_name,
            owner_name=owner_name,
            customer_city=customer_city,
            last_order=last_order,
            customer_type=customer_type,
        )
        existing = await repo.get_contact_by_phone_in_campaign(
            db, campaign_id, normalized
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This phone number is already in the campaign",
            )
        return await repo.create_contact(
            db,
            campaign_id,
            normalized,
            resolved_name,
            language_preference,
            resolved_company,
            resolved_meta,
        )

    async def bulk_import_contacts(
        self,
        db: AsyncSession,
        campaign_id: str,
        contacts: list[dict],
    ) -> list:
        campaign = await repo.get_campaign(db, campaign_id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        created = []
        errors = []
        for idx, item in enumerate(contacts):
            try:
                normalized = validate_phone_number(item["phone_number"])
                resolved_name, resolved_company, resolved_meta = (
                    merge_contact_payload(
                        name=item.get("name"),
                        company=item.get("company"),
                        metadata=item.get("metadata"),
                        shop_name=item.get("shop_name"),
                        owner_name=item.get("owner_name"),
                        customer_city=item.get("customer_city"),
                        last_order=item.get("last_order"),
                        customer_type=item.get("customer_type"),
                    )
                )
                dup = await repo.get_contact_by_phone_in_campaign(
                    db, campaign_id, normalized
                )
                if dup:
                    continue
                contact = await repo.create_contact(
                    db,
                    campaign_id,
                    normalized,
                    resolved_name,
                    item.get("language_preference") or "Urdu",
                    resolved_company,
                    resolved_meta,
                )
                created.append(contact)
            except (ValueError, KeyError) as exc:
                errors.append({"index": idx, "error": str(exc)})
        if errors and not created:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Import failed", "errors": errors},
            )
        return created

    async def start_call(
        self,
        db: AsyncSession,
        contact_id: str,
    ):
        contact = await repo.get_contact(db, contact_id)
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found",
            )
        if contact.status == "calling":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact is already being called",
            )
        campaign = await repo.get_campaign(db, contact.campaign_id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        return await self._dial_contact(db, campaign, contact)

    async def start_call_by_phone(
        self,
        db: AsyncSession,
        campaign_id: str,
        phone_number: str,
        name: str | None = None,
    ):
        campaign = await repo.get_campaign(db, campaign_id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        try:
            normalized = validate_phone_number(phone_number)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )
        contact = await repo.get_contact_by_phone_in_campaign(
            db, campaign_id, normalized
        )
        if contact:
            if contact.status == "calling":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already calling this number",
                )
        else:
            resolved_name, _, _ = merge_contact_payload(name=name)
            contact = await repo.create_contact(
                db,
                campaign_id,
                normalized,
                resolved_name,
            )
        return await self._dial_contact(db, campaign, contact)

    async def start_campaign(
        self,
        db: AsyncSession,
        campaign_id: str,
    ):
        campaign = await repo.get_campaign(db, campaign_id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        if campaign.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campaign is already completed",
            )
        await repo.update_campaign(db, campaign, status="active")
        contacts = await repo.get_pending_contacts(db, campaign_id)
        if not contacts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending contacts to call",
            )
        asyncio.create_task(self._run_campaign_calls(campaign_id))
        return {
            "campaign_id": campaign_id,
            "queued_contacts": len(contacts),
            "status": "active",
        }

    async def _run_campaign_calls(self, campaign_id: str):
        async with AsyncSessionLocal() as db:
            campaign = await repo.get_campaign(db, campaign_id)
            if not campaign:
                return
            contacts = await repo.get_pending_contacts(db, campaign_id)
            for contact in contacts:
                campaign = await repo.get_campaign(db, campaign_id)
                if not campaign or campaign.status != "active":
                    break
                try:
                    await self._dial_contact(db, campaign, contact)
                except Exception as exc:
                    _logger.error(
                        "Campaign %s call to %s failed: %s",
                        campaign_id,
                        contact.phone_number,
                        exc,
                    )
                    await repo.update_contact_status(
                        db, contact.id, "failed"
                    )
                await asyncio.sleep(2)
            campaign = await repo.get_campaign(db, campaign_id)
            if campaign and campaign.status == "active":
                stats = await repo.get_campaign_contact_stats(db, campaign_id)
                if stats["pending"] == 0 and stats["calling"] == 0:
                    await repo.update_campaign(
                        db, campaign, status="completed"
                    )

    async def _build_dynamic_variables(self, db, contact) -> dict[str, str]:
        meta = contact.contact_metadata or {}
        caller = await get_caller_by_phone(db, contact.phone_number)
        settings = await get_agent_settings(db)
        catalogue = await build_menu_text(db)

        last_order = (meta.get("last_order") or "").strip()
        if not last_order:
            order = await repo.get_last_order_by_phone(
                db, contact.phone_number
            )
            last_order = format_last_order(order)

        customer_type = (meta.get("customer_type") or "").strip().lower()
        if customer_type not in ("new", "existing"):
            order = await repo.get_last_order_by_phone(
                db, contact.phone_number
            )
            if caller and caller.last_called_at:
                customer_type = "existing"
            elif order:
                customer_type = "existing"
            else:
                customer_type = "new"

        lang = (contact.language_preference or "Urdu").strip().lower()
        if lang == "urdu":
            # Dynamic Urdu greeting in Roman script for LLM compatibility
            greeting = "Assalam-o-Alaikum! Main Mitchell's Fruit Farms se baat kar raha hoon. Kya main aapka thoda waqt le sakta hoon?"
        else:
            greeting = "Hello! I am calling from Mitchell's Fruit Farms. May I have a moment of your time?"

        return {
            "customer_type": customer_type,
            "shop_name": (
                meta.get("shop_name") or contact.company or ""
            ),
            "owner_name": (
                meta.get("owner_name") or contact.name or ""
            ),
            "customer_city": meta.get("customer_city") or "",
            "customer_phone": contact.phone_number,
            "last_order": last_order,
            "product_catalogue": catalogue,
            "company_info": settings.restaurant_info or "",
            "language_preference": contact.language_preference,
            "greeting": greeting,
            "begin_message": greeting,
        }

    async def _dial_contact(self, db, campaign, contact):
        await repo.update_contact_status(db, contact.id, "calling")
        dynamic_vars = await self._build_dynamic_variables(db, contact)
        metadata = {
            key: dynamic_vars.get(key, "")
            for key in livekit_service.AGENT_METADATA_KEYS
        }
        metadata["campaign_id"] = campaign.id
        metadata["contact_id"] = contact.id
        try:
            result = await livekit_service.place_outbound_call(
                phone_number=contact.phone_number,
                metadata=metadata,
            )
        except Exception as exc:
            await repo.update_contact_status(db, contact.id, "failed")
            _logger.error("LiveKit dial failed for %s: %s", contact.id, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to initiate call: {exc}",
            )
        # The LiveKit room name is reused as the call id: it is what the agent
        # posts as `call_id` on every tool webhook, and what the LiveKit
        # webhook keys call_logs on. Stored in the existing retell_call_id
        # column so the frontend contract and lookups stay unchanged.
        room_name = result["room_name"]
        call = await repo.create_outbound_call(
            db,
            campaign.id,
            contact.id,
            contact.phone_number,
            retell_call_id=room_name,
            call_status="dialing",
        )
        _logger.info(
            "Outbound call started campaign=%s contact=%s room=%s",
            campaign.id,
            contact.id,
            room_name,
        )
        return call

    async def sync_call_status(self, db: AsyncSession, call_id: str):
        call = await repo.get_outbound_call(db, call_id)
        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found",
            )
        if not call.retell_call_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Retell call ID",
            )
        if livekit_service.is_livekit_call_id(call.retell_call_id):
            # LiveKit calls are updated by the LiveKit webhook, not polled.
            # Without this guard the id would be sent to Retell, 404, and a
            # perfectly healthy call would be marked failed.
            return call
        try:
            retell_data = await retell_service.get_call(call.retell_call_id)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                # Call does not exist on Retell (e.g. invalid test data, deleted)
                await repo.update_contact_status(db, call.contact_id, "failed")
                return await repo.update_outbound_call(db, call, call_status="failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to sync: {exc}",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to sync: {exc}",
            )
        sync_event = (
            "call_analyzed"
            if retell_data.get("call_analysis")
            else "call_ended"
            if retell_data.get("end_timestamp")
            else ""
        )
        mapped_status = (
            map_retell_call_status(retell_data, sync_event)
            or retell_data.get("call_status", call.call_status)
        )
        updates = {
            "call_status": mapped_status,
            "duration": retell_data.get("duration_ms"),
            "recording_url": retell_data.get("recording_url"),
            "start_timestamp": retell_data.get("start_timestamp"),
        }
        transcript = await retell_service.resolve_call_transcript(
            retell_data,
            call.retell_call_id,
            fetch_if_missing=True,
        )
        if transcript:
            updates["transcript"] = transcript
        analysis = retell_data.get("call_analysis") or {}
        if analysis.get("call_summary"):
            updates["summary"] = analysis["call_summary"]
        if retell_data.get("end_timestamp"):
            updates["ended_at"] = datetime.fromtimestamp(
                retell_data["end_timestamp"] / 1000, tz=timezone.utc
            )

        call_status = updates["call_status"]
        if call_status == "registered":   
            created_at = call.created_at
            if created_at:
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) - created_at > timedelta(minutes=2):
                    call_status = "failed"
                    updates["call_status"] = "failed"

        contact_status = contact_status_for_call_status(call_status)
        if contact_status:
            await repo.update_contact_status(db, call.contact_id, contact_status)

        # Extract name and company from summary if not in dynamic variables
        collected = retell_data.get("collected_dynamic_variables") or {}
        custom = retell_data.get("custom_analysis_data") or {}
        extracted_name = None
        for key in ("customer_name", "caller_name", "name", "owner_name", "user_name", "caller", "customer"):
            val = clean_customer_value(collected.get(key) or custom.get(key))
            if val:
                extracted_name = val
                break

        summary_text = analysis.get("call_summary") or ""
        extracted_company = (
            _extract_company_from_data(collected, custom)
            or _extract_company_from_summary(summary_text)
        )

        # Define extraction helpers inside method context
        def _get_name_from_sum(summary):
            if not summary: return None
            m = re.search(r"\b(?:contacted|spoke with|spoke to|called|talked to|conversing with)\s+([A-Z][a-zA-Z.]*(?:\s+[A-Z][a-zA-Z.]*){0,3})\s+(?:from|at|in|to|regarding|about|on)\b", summary)
            if m:
                name = m.group(1).strip()
                if name.lower() not in ("the user", "the customer", "the client", "the distributor", "the retailer", "the agent", "the store", "ahmad store"):
                    return clean_customer_value(name)
            m = re.search(r"\b(?:contacted|spoke with|spoke to|called|talked to)\s+([A-Z][a-zA-Z.]*(?:\s+[A-Z][a-zA-Z.]*){0,3})\b", summary)
            if m:
                name = m.group(1).strip()
                if name.lower() not in ("the user", "the customer", "the client", "the distributor", "the retailer", "the agent", "the store", "ahmad store"):
                    return clean_customer_value(name)
            return None

        if not extracted_name and summary_text:
            extracted_name = _get_name_from_sum(summary_text)

        if extracted_name or extracted_company:
            contact = await repo.get_contact(db, call.contact_id)
            if contact:
                kwargs_updates = {}
                if extracted_name:
                    kwargs_updates["name"] = extracted_name
                if extracted_company and not contact.company:
                    kwargs_updates["company"] = extracted_company
                if kwargs_updates:
                    await repo.update_contact(db, contact, **kwargs_updates)

            # Mirror name update to the CallLog record
            try:
                from src.utils.db import CallLog
                res_log = await db.execute(select(CallLog).where(CallLog.call_id == call.retell_call_id))
                log_record = res_log.scalar_one_or_none()
                if log_record:
                    log_record.customer_name = extracted_name
                    log_record.customer_name_extracted = extracted_name
                    await db.commit()
            except Exception as exc:
                _logger.warning("Failed to mirror name to CallLog for %s: %s", call.retell_call_id, exc)

        # Auto-extract order details from summary if call ended
        if call_status in ("completed", "ended") and summary_text:
            from src.utils.db_functions import get_order_by_call_id, create_order, auto_extract_order_items
            recent_order = await get_order_by_call_id(db, call.retell_call_id)
            if not recent_order:
                _SUMMARY_ORDER_KEYWORDS = [
                    "placed an order", "place a business order",
                    "logged the trade inquiry", "logged the export inquiry",
                    "trade inquiry", "export inquiry", "import inquiry",
                    "bulk order", "capturing order details", "successfully logged",
                    "order for", "reorder", "order request", "recorded the order",
                    "confirm a reorder", "confirm the order", "placed order",
                ]
                call_summary_lower = summary_text.lower()
                if any(kw in call_summary_lower for kw in _SUMMARY_ORDER_KEYWORDS):
                    structured = await auto_extract_order_items(db, "", summary_text)
                    if structured:
                        customer = extracted_name or "Guest"
                        phone = call.phone_number or ""
                        total = sum(i["price"] * i["quantity"] for i in structured)

                        auto_order = await create_order(
                            db,
                            caller_phone=phone,
                            customer_name=customer,
                            order_items=structured,
                            order_type="pickup",
                            delivery_address=None,
                            total_amount=round(total, 2),
                            special_notes=None,
                            call_id=call.retell_call_id,
                        )

                        # Push to Clover POS if configured
                        if os.getenv("CLOVER_API_TOKEN") and os.getenv("CLOVER_MERCHANT_ID"):
                            try:
                                from src.services import clover_service
                                from src.utils.db_functions import update_order_clover_status
                                clover_result = await clover_service.push_order_to_clover(
                                    order_items=structured,
                                    customer_name=customer,
                                )
                                await update_order_clover_status(
                                    db, auto_order.order_id,
                                    clover_result["clover_order_id"], True,
                                )
                            except Exception:
                                pass

                        # Set order_booked on CallLog
                        try:
                            from src.utils.db import CallLog
                            res_log = await db.execute(select(CallLog).where(CallLog.call_id == call.retell_call_id))
                            log_record = res_log.scalar_one_or_none()
                            if log_record:
                                log_record.order_booked = True
                                log_record.call_successful = True
                                log_record.order_items = summary_text
                                await db.commit()
                        except Exception as exc:
                            _logger.warning("Failed to mirror order_booked to CallLog for %s: %s", call.retell_call_id, exc)

        return await repo.update_outbound_call(db, call, **updates)

    async def process_webhook(self, db: AsyncSession, event: dict):
        event_type = event.get("event", "")
        call_data = event.get("call", {})
        retell_call_id = call_data.get("call_id", "")
        if not retell_call_id:
            return
        call = await repo.get_outbound_call_by_retell_id(db, retell_call_id)
        if not call:
            metadata = call_data.get("metadata") or {}
            contact_id = metadata.get("contact_id")
            campaign_id = metadata.get("campaign_id")
            if contact_id and campaign_id:
                call = await repo.create_outbound_call(
                    db,
                    campaign_id,
                    contact_id,
                    call_data.get("to_number", ""),
                    retell_call_id=retell_call_id,
                    call_status="registered",
                )
            else:
                return
        updates = {}
        if event_type in ("call_started",):
            updates["started_at"] = datetime.now(timezone.utc)
            if call_data.get("start_timestamp"):
                updates["start_timestamp"] = call_data.get("start_timestamp")
        elif event_type in ("call_ended",):
            if call_data.get("duration_ms") is not None:
                updates["duration"] = call_data.get("duration_ms")
            if call_data.get("recording_url"):
                updates["recording_url"] = call_data.get("recording_url")
            if call_data.get("start_timestamp"):
                updates["start_timestamp"] = call_data.get("start_timestamp")
            if call_data.get("end_timestamp"):
                updates["ended_at"] = datetime.fromtimestamp(
                    call_data["end_timestamp"] / 1000, tz=timezone.utc
                )

            collected = call_data.get("collected_dynamic_variables") or {}
            extracted_company = _extract_company_from_data(collected)
            extracted_name = None
            for key in ("customer_name", "caller_name", "name", "owner_name", "user_name", "caller", "customer"):
                val = clean_customer_value(collected.get(key))
                if val:
                    extracted_name = val
                    break
            if extracted_name or extracted_company:
                contact = await repo.get_contact(db, call.contact_id)
                if contact:
                    kwargs_updates = {}
                    if extracted_name:
                        kwargs_updates["name"] = extracted_name
                    if extracted_company and not contact.company:
                        kwargs_updates["company"] = extracted_company
                    if kwargs_updates:
                        await repo.update_contact(db, contact, **kwargs_updates)

        elif event_type in ("transcript_ready", "transcript_updated"):
            pass
        elif event_type in ("recording_ready",):
            updates["recording_url"] = call_data.get("recording_url")
        elif event_type in ("post_call_analysis", "call_analyzed"):
            analysis = call_data.get("call_analysis") or {}
            summary_text = analysis.get("call_summary", "")
            updates["summary"] = summary_text
            if call_data.get("duration_ms") is not None:
                updates["duration"] = call_data.get("duration_ms")
            if call_data.get("recording_url"):
                updates["recording_url"] = call_data.get("recording_url")
            if call_data.get("start_timestamp"):
                updates["start_timestamp"] = call_data.get("start_timestamp")
            if call_data.get("end_timestamp"):
                updates["ended_at"] = datetime.fromtimestamp(
                    call_data["end_timestamp"] / 1000, tz=timezone.utc
                )

            collected = call_data.get("collected_dynamic_variables") or {}
            custom = call_data.get("custom_analysis_data") or {}
            analysis_custom = analysis.get("custom_analysis_data") or {}
            extracted_company = (
                _extract_company_from_data(collected, custom, analysis_custom)
                or _extract_company_from_summary(summary_text)
            )
            extracted_name = None
            for key in ("customer_name", "caller_name", "name", "owner_name", "user_name", "caller", "customer"):
                val = clean_customer_value(collected.get(key))
                if val:
                    extracted_name = val
                    break
            if extracted_name or extracted_company:
                contact = await repo.get_contact(db, call.contact_id)
                if contact:
                    kwargs_updates = {}
                    if extracted_name:
                        kwargs_updates["name"] = extracted_name
                    if extracted_company and not contact.company:
                        kwargs_updates["company"] = extracted_company
                    if kwargs_updates:
                        await repo.update_contact(db, contact, **kwargs_updates)

            # ── Auto-detect recall time from call summary ──────────────────
            # Only an EXPLICIT customer request ("call me back in an hour")
            # schedules a callback. A call simply failing to connect
            # (no-answer/busy/voicemail) is NOT treated as a callback request —
            # that was causing surprise repeat calls with no user consent.
            recall_dt = None
            if summary_text:
                recall_dt = parse_recall_time(summary_text)

            if recall_dt:
                contact = await repo.get_contact(db, call.contact_id)
                if contact:
                    meta = contact.contact_metadata or {}
                    attempts = meta.get("recall_attempts", 0)
                    if attempts < 1:
                        meta["recall_attempts"] = attempts + 1
                        await repo.update_contact(db, contact, recall_at=recall_dt, contact_metadata=meta)
                        _logger.info(
                            "Auto-set recall_at=%s for contact=%s (one-time callback scheduled)",
                            recall_dt.isoformat(),
                            call.contact_id,
                        )
                    else:
                        _logger.info(
                            "Callback already used for contact=%s — not scheduling another automatic call",
                            call.contact_id,
                        )

        fetch_transcript = event_type in (
            "call_ended",
            "call_analyzed",
            "post_call_analysis",
            "transcript_ready",
            "transcript_updated",
        )
        if fetch_transcript:
            transcript = await retell_service.resolve_call_transcript(
                call_data,
                retell_call_id,
                fetch_if_missing=True,
            )
            if transcript:
                updates["transcript"] = transcript

        mapped_status = map_retell_call_status(call_data, event_type)
        if mapped_status:
            updates["call_status"] = mapped_status
            contact_status = contact_status_for_call_status(mapped_status)
            if contact_status:
                await repo.update_contact_status(
                    db, call.contact_id, contact_status
                )

        if updates:
            await repo.update_outbound_call(db, call, **updates)
            _logger.info(
                "Outbound webhook event=%s call=%s retell_status=%s "
                "mapped_status=%s",
                event_type,
                retell_call_id,
                call_data.get("call_status"),
                updates.get("call_status"),
            )

    # ── Auto-dialer scheduler ────────────────────────────────────────────────

    async def _build_call_log_recall_variables(self, db, log) -> dict[str, str]:
        settings = await get_agent_settings(db)
        catalogue = await build_menu_text(db)
        greeting = (
            "Assalam-o-Alaikum! Main Mitchell's Fruit Farms se baat kar "
            "raha hoon. Kya main aapka thoda waqt le sakta hoon?"
        )
        return {
            "customer_type": "existing" if log.order_booked else "new",
            "customer_phone": log.caller_phone,
            "customer_city": "",
            "shop_name": log.customer_name_extracted or "",
            "owner_name": log.customer_name or log.customer_name_extracted or "",
            "last_order": log.order_items if log.order_booked else "",
            "product_catalogue": catalogue,
            "company_info": settings.restaurant_info or "",
            "language_preference": "Urdu",
            "greeting": greeting,
            "begin_message": greeting,
        }

    async def _dial_call_log_recall(self, db, log) -> None:
        dynamic_vars = await self._build_call_log_recall_variables(db, log)
        agent_id = None
        if log.direction == "outbound":
            agent_id = (
                os.getenv("RETELL_OUTBOUND_AGENT_ID", "")
                or os.getenv("RETELL_AGENT_ID", "")
                or None
            )
        await retell_service.create_phone_call(
            to_number=log.caller_phone,
            override_agent_id=agent_id,
            dynamic_variables=dynamic_vars,
            metadata={
                "original_call_id": log.call_id,
                "is_callback": "true",
            },
        )

    async def _recall_scheduler_loop(self):
        """
        Background loop: check for contacts and call logs whose recall_at has
        passed and auto-dial them.
        """
        _logger.info("Recall scheduler started")
        poll_secs = 15
        while True:
            try:
                async with AsyncSessionLocal() as db:
                    due = await repo.get_contacts_due_for_recall(db)
                    dialed_phones: set[str] = set()
                    for contact in due:
                        if contact.status == "calling":
                            continue
                        # Capture plain strings before any try/rollback so that
                        # expired ORM attributes are never accessed in except blocks
                        contact_id = contact.id
                        contact_phone = contact.phone_number
                        try:
                            campaign = contact.campaign
                            if not campaign:
                                _logger.warning(
                                    "Skipping recall for contact=%s: no campaign",
                                    contact_id,
                                )
                                continue
                            _logger.info(
                                "Auto-recall dialling contact=%s phone=%s",
                                contact_id,
                                contact_phone,
                            )
                            await self._dial_contact(db, campaign, contact)
                            await repo.update_contact(
                                db, contact, recall_at=None
                            )
                            dialed_phones.add(
                                normalize_phone_number(contact_phone)
                            )
                            await repo.clear_call_log_recalls_for_phone(
                                db, contact_phone
                            )
                        except Exception as exc:
                            await db.rollback()
                            _logger.error(
                                "Auto-recall dial failed for contact=%s: %s",
                                contact_id,
                                exc,
                            )

                    from src.utils.db import CallLog

                    now_utc = datetime.now(timezone.utc)
                    log_res = await db.execute(
                        select(CallLog).where(
                            CallLog.recall_at <= now_utc,
                            CallLog.recall_at.isnot(None),
                            CallLog.call_status.notin_(
                                ["ongoing", "calling", "ringing"]
                            ),
                        )
                    )
                    due_logs = log_res.scalars().all()
                    for log in due_logs:
                        if not log.caller_phone:
                            continue
                        # Skip logs with placeholder/invalid phone numbers
                        raw_phone = (log.caller_phone or "").strip().lower()
                        if raw_phone in ("unknown", "n/a", "", "none"):
                            log.recall_at = None
                            await db.commit()
                            _logger.warning(
                                "Skipping recall for call_log=%s: invalid phone '%s'",
                                log.call_id,
                                log.caller_phone,
                            )
                            continue
                        # Capture plain strings before any try/rollback so that
                        # expired ORM attributes are never accessed in except blocks
                        log_call_id = log.call_id
                        log_caller_phone = log.caller_phone
                        log_direction = log.direction
                        phone_key = normalize_phone_number(log_caller_phone)
                        if phone_key in dialed_phones:
                            log.recall_at = None
                            await db.commit()
                            continue
                        try:
                            _logger.info(
                                "Auto-recall dialling call_log=%s phone=%s "
                                "direction=%s",
                                log_call_id,
                                log_caller_phone,
                                log_direction,
                            )
                            await self._dial_call_log_recall(db, log)
                            log.recall_at = None
                            await db.commit()
                        except Exception as exc:
                            await db.rollback()
                            _logger.error(
                                "Auto-recall dial failed for CallLog "
                                "call=%s: %s",
                                log_call_id,
                                exc,
                            )
            except asyncio.CancelledError:
                _logger.info("Recall scheduler cancelled")
                break
            except Exception as exc:
                _logger.error("Recall scheduler error: %s", exc, exc_info=True)
            await asyncio.sleep(poll_secs)


outbound_service = OutboundCallingService()


async def start_recall_scheduler():
    """Create the background recall-scheduler task. Call once on app startup."""
    asyncio.create_task(outbound_service._recall_scheduler_loop())

