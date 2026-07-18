from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.utils.db import get_db, User
from src.utils.dependencies import get_current_user
from src.api.outbound.service import outbound_service
from src.api.outbound import repository as repo
from src.api.outbound.schemas import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactImportRequest,
    StartCallRequest,
    CallResponse,
    DashboardStatsResponse,
    CampaignStatsResponse,
    WebhookResponse,
)
from src.api.outbound.utils import parse_csv_contacts, parse_json_contacts
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/outbound", tags=["outbound"])


def _contact_response(contact) -> ContactResponse:
    return ContactResponse(
        id=contact.id,
        campaign_id=contact.campaign_id,
        name=contact.name,
        phone_number=contact.phone_number,
        language_preference=contact.language_preference,
        company=contact.company,
        contact_metadata=contact.contact_metadata,
        status=contact.status,
        recall_at=contact.recall_at,
        created_at=contact.created_at,
    )


def _call_response(call) -> CallResponse:
    return CallResponse(
        id=call.id,
        campaign_id=call.campaign_id,
        contact_id=call.contact_id,
        retell_call_id=call.retell_call_id,
        phone_number=call.phone_number,
        call_status=call.call_status,
        duration=call.duration,
        recording_url=call.recording_url,
        transcript=call.transcript,
        summary=call.summary,
        started_at=call.started_at,
        ended_at=call.ended_at,
        created_at=call.created_at,
        contact_name=call.contact.name if call.contact else None,
        campaign_name=call.campaign.name if call.campaign else None,
        recall_at=getattr(call.contact, "recall_at", None) if call.contact else None,
    )


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await repo.get_dashboard_stats(db)


@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    body: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await outbound_service.create_campaign(
        db,
        body.name,
        user.id,
        body.description,
        body.agent_id,
    )


@router.get("/campaigns", response_model=list[CampaignResponse])
async def list_campaigns(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await repo.list_campaigns(db, skip, limit, search)


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    campaign = await repo.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    body: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await outbound_service.update_campaign(
        db,
        campaign_id,
        name=body.name,
        description=body.description,
        agent_id=body.agent_id,
        status=body.status,
    )


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    deleted = await repo.delete_campaign(db, campaign_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return {"deleted": True}


@router.get(
    "/campaigns/{campaign_id}/stats",
    response_model=CampaignStatsResponse,
)
async def get_campaign_stats(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    campaign = await repo.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return await repo.get_campaign_contact_stats(db, campaign_id)


@router.post(
    "/campaigns/{campaign_id}/contacts",
    response_model=ContactResponse,
)
async def add_contact(
    campaign_id: str,
    body: ContactCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    contact = await outbound_service.add_contact(
        db,
        campaign_id,
        body.phone_number,
        body.name,
        body.language_preference,
        body.company,
        body.metadata,
        body.shop_name,
        body.owner_name,
        body.customer_city,
        body.last_order,
        body.customer_type,
    )
    return _contact_response(contact)


@router.post("/campaigns/{campaign_id}/contacts/import")
async def import_contacts(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    file: UploadFile | None = File(None),
    body: ContactImportRequest | None = None,
):
    contacts_data = []
    if file:
        content = (await file.read()).decode("utf-8")
        filename = (file.filename or "").lower()
        if filename.endswith(".csv"):
            contacts_data = parse_csv_contacts(content)
        elif filename.endswith(".json"):
            contacts_data = parse_json_contacts(content)
        else:
            try:
                contacts_data = parse_json_contacts(content)
            except ValueError:
                contacts_data = parse_csv_contacts(content)
    elif body:
        contacts_data = [c.model_dump() for c in body.contacts]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a file or JSON body",
        )
    created = await outbound_service.bulk_import_contacts(
        db, campaign_id, contacts_data
    )
    return {
        "imported": len(created),
        "contacts": [_contact_response(c) for c in created],
    }


@router.get(
    "/campaigns/{campaign_id}/contacts",
    response_model=list[ContactResponse],
)
async def list_contacts(
    campaign_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    campaign = await repo.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    contacts = await repo.list_contacts(db, campaign_id, skip, limit)
    
    # Auto-sync contacts stuck in 'calling' status
    for contact in contacts:
        if contact.status == "calling":
            latest_call = await repo.get_latest_call_for_contact(db, contact.id)
            if latest_call:
                try:
                    await outbound_service.sync_call_status(db, latest_call.id)
                except Exception:
                    pass # Keep going if Retell API is temporarily down
    
    return [_contact_response(c) for c in contacts]


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    deleted = await repo.delete_contact(db, contact_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return {"deleted": True}


@router.patch("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    body: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    contact = await repo.get_contact(db, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    # Only pass fields the client actually sent — otherwise unset fields
    # (which default to None on the schema) overwrite existing values,
    # including NOT NULL columns like phone_number, causing a DB error.
    update_fields = body.model_dump(exclude_none=True, exclude_unset=True)

    updated_contact = await repo.update_contact(
        db,
        contact,
        **update_fields,
    )
    return _contact_response(updated_contact)



class RecallRequest(BaseModel):
    recall_at: datetime | None


@router.patch("/contacts/{contact_id}/recall", response_model=ContactResponse)
async def set_contact_recall(
    contact_id: str,
    body: RecallRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Manually set or clear the callback reminder time for an outbound contact."""
    contact = await repo.get_contact(db, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    updated = await repo.update_contact(db, contact, recall_at=body.recall_at)
    return _contact_response(updated)


@router.post("/calls/start", response_model=CallResponse)
async def start_call(
    body: StartCallRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if body.contact_id:
        call = await outbound_service.start_call(db, body.contact_id)
        refetched = await repo.get_outbound_call(db, call.id)
        return _call_response(refetched)
    if body.campaign_id and body.phone_number:
        call = await outbound_service.start_call_by_phone(
            db,
            body.campaign_id,
            body.phone_number,
        )
        refetched = await repo.get_outbound_call(db, call.id)
        return _call_response(refetched)
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Provide contact_id or campaign_id with phone_number",
    )


@router.post("/campaigns/{campaign_id}/start")
async def start_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await outbound_service.start_campaign(db, campaign_id)


@router.get("/calls", response_model=list[CallResponse])
async def list_calls(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    campaign_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    calls = await repo.list_outbound_calls(db, skip, limit, campaign_id)
    return [_call_response(c) for c in calls]


@router.get("/calls/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    call = await repo.get_outbound_call(db, call_id)
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    return _call_response(call)


@router.post("/calls/{call_id}/sync", response_model=CallResponse)
async def sync_call(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    call = await outbound_service.sync_call_status(db, call_id)
    refetched = await repo.get_outbound_call(db, call.id)
    return _call_response(refetched)


@router.post("/webhook/retell", response_model=WebhookResponse)
async def retell_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    from src.api.retell.router import webhook as unified_webhook
    return await unified_webhook(request, db)