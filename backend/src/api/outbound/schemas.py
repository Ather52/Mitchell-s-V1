from datetime import datetime

from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    name: str
    description: str | None = None
    agent_id: str | None = None


class CampaignUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    agent_id: str | None = None
    status: str | None = None


class CampaignResponse(BaseModel):
    id: str
    name: str
    description: str | None
    agent_id: str | None
    status: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContactCreate(BaseModel):
    name: str | None = None
    phone_number: str
    language_preference: str = "Urdu"
    company: str | None = None
    metadata: dict | None = None
    shop_name: str | None = None
    owner_name: str | None = None
    customer_city: str | None = None
    last_order: str | None = None
    customer_type: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    phone_number: str | None = None
    language_preference: str | None = None
    company: str | None = None
    recall_at: datetime | None = None


class ContactResponse(BaseModel):
    id: str
    campaign_id: str
    name: str | None
    phone_number: str
    language_preference: str
    company: str | None
    metadata: dict | None = Field(None, validation_alias="contact_metadata")
    status: str
    recall_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class ContactImportItem(BaseModel):
    name: str | None = None
    phone_number: str
    language_preference: str = "Urdu"
    company: str | None = None
    metadata: dict | None = None
    shop_name: str | None = None
    owner_name: str | None = None
    customer_city: str | None = None
    last_order: str | None = None
    customer_type: str | None = None


class ContactImportRequest(BaseModel):
    contacts: list[ContactImportItem]


class StartCallRequest(BaseModel):
    contact_id: str | None = None
    campaign_id: str | None = None
    phone_number: str | None = None


class CallResponse(BaseModel):
    id: str
    campaign_id: str
    contact_id: str
    retell_call_id: str | None
    phone_number: str
    call_status: str
    duration: int | None
    recording_url: str | None
    transcript: str | None
    summary: str | None
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime
    contact_name: str | None = None
    campaign_name: str | None = None
    recall_at: datetime | None = None

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    campaigns: int
    contacts: int
    calls_today: int
    active_calls: int
    completed_calls: int


class CampaignStatsResponse(BaseModel):
    total: int
    pending: int
    calling: int
    completed: int
    failed: int


class WebhookResponse(BaseModel):
    received: bool
