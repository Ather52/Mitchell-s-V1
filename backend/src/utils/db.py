# DATABASE CONFIGURATION & SCHEMAS (SQLAlchemy ORM Models)

import os
import uuid
from datetime import datetime, timezone, date

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped, relationship
from sqlalchemy import String, Boolean, DateTime, Text, Integer, BigInteger, JSON, Date, Float, ForeignKey

from dotenv import load_dotenv

load_dotenv()

# 1. DATABASE CONNECTION SETUP
DATABASE_URL = os.getenv("DATABASE_URL")

# Create the Asynchronous Engine:
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool)

# Create the Session Maker:
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


# 2. BASE DECLARATIVE CLASS

class Base(DeclarativeBase):
    pass


# 3. DATABASE MODELS (TABLES)

class User(Base):
    """
    User Table: Stores administrator credentials for the management dashboard portal.
    """
    __tablename__ = "users"

    # Mapped[str] defines the Python type. mapped_column defines database column settings.
    # We use a lambda for default to generate a new UUID string on every insertion.
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reset_token: Mapped[str | None] = mapped_column(String, nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Caller(Base):
    """
    Caller Table: Keeps track of callers by phone number to recognize returning clients.
    """
    __tablename__ = "callers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_called_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CallLog(Base):
    """
    CallLog Table: Logs the full details of every voice call handled by the Retell AI agent.
    """
    __tablename__ = "call_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    call_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    caller_phone: Mapped[str] = mapped_column(String, nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    call_status: Mapped[str] = mapped_column(String, default="registered")
    direction: Mapped[str] = mapped_column(String, default="inbound")
    recording_url: Mapped[str | None] = mapped_column(String, nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    call_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_booked: Mapped[bool] = mapped_column(Boolean, default=False)
    call_successful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    user_sentiment: Mapped[str | None] = mapped_column(String, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_timestamp: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    end_timestamp: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    order_items: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_type: Mapped[str | None] = mapped_column(String, nullable=True)
    special_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    call_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_name_extracted: Mapped[str | None] = mapped_column(String, nullable=True)
    reservation_date: Mapped[str | None] = mapped_column(String, nullable=True)
    party_size: Mapped[str | None] = mapped_column(String, nullable=True)
    recall_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    customer_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # --- LiveKit telephony fields (populated by the LiveKit webhook) ---
    room_sid: Mapped[str | None] = mapped_column(String, nullable=True)
    sip_call_id: Mapped[str | None] = mapped_column(String, nullable=True)
    trunk_phone_number: Mapped[str | None] = mapped_column(String, nullable=True)
    disconnect_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    answered_timestamp: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    ring_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    room_started_timestamp: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    room_finished_timestamp: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # ORM Relationship: Allows us to access the associated order directly (e.g. call_log.order_details)
    # - 'selectin' loads this relationship proactively in a secondary query to prevent lazy-loading crashes.
    order_details: Mapped["Order"] = relationship(
        "Order",
        primaryjoin="Order.call_id == CallLog.call_id",
        foreign_keys="[Order.call_id]",
        uselist=False,
        lazy="selectin"
    )


class AgentSettings(Base):
    """
    AgentSettings Table: Stores parameters that adjust the Retell AI Voice agent's behavior
    and the company's operating attributes (business hours, timezone, greetings).
    """
    __tablename__ = "agent_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    voice_id: Mapped[str] = mapped_column(String, default="11labs-Valentina")
    voice_speed: Mapped[float] = mapped_column(Float, default=1.0)
    voice_temperature: Mapped[float] = mapped_column(Float, default=0.7)
    interruption_sensitivity: Mapped[float] = mapped_column(Float, default=0.8)
    responsiveness: Mapped[float] = mapped_column(Float, default=1.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    kitchen_open_time: Mapped[str] = mapped_column(String, default="11:00")
    kitchen_close_time: Mapped[str] = mapped_column(String, default="21:40")
    store_open_time: Mapped[str] = mapped_column(String, default="11:00")
    store_close_time: Mapped[str] = mapped_column(String, default="22:00")
    closed_greeting: Mapped[str] = mapped_column(String, default="We are currently closed. Please call back during business hours.")
    open_greeting: Mapped[str | None] = mapped_column(String, nullable=True)
    restaurant_timezone: Mapped[str] = mapped_column(String, default="Asia/Karachi")
    prompt_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(String, nullable=True)
    pickup_address: Mapped[str | None] = mapped_column(String, nullable=True)
    restaurant_name: Mapped[str] = mapped_column(String, default="Mitchell's Fruit Farms")
    restaurant_info: Mapped[str] = mapped_column(Text, default="Mitchell's is a historic food manufacturer in Pakistan, producing high-quality jams, squashes, ketchups, sauces, and confectionery since 1933.")
    wait_time_pickup: Mapped[str] = mapped_column(String, default="15")
    wait_time_delivery: Mapped[str] = mapped_column(String, default="30")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Order(Base):
    """
    Order Table: Tracks customer orders placed during calls or manual submissions.
    """
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    call_id: Mapped[str | None] = mapped_column(String, nullable=True)
    caller_phone: Mapped[str] = mapped_column(String, nullable=False)
    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    order_items: Mapped[list] = mapped_column(JSON, nullable=False)
    order_type: Mapped[str] = mapped_column(String, nullable=False)
    delivery_address: Mapped[str | None] = mapped_column(String, nullable=True)
    total_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="received")
    special_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    clover_order_id: Mapped[str | None] = mapped_column(String, nullable=True)
    clover_synced: Mapped[bool] = mapped_column(Boolean, default=False)
    clover_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class MenuCategory(Base):
    """
    MenuCategory Table: Product categories (e.g., 'Jams & Marmalades', 'Squashes').
    """
    __tablename__ = "menu_categories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class MenuItem(Base):
    """
    MenuItem Table: Individual items available in the catalog, linked to Clover IDs.
    """
    __tablename__ = "menu_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id: Mapped[str] = mapped_column(String, ForeignKey("menu_categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    allergens: Mapped[str | None] = mapped_column(String, nullable=True)
    prep_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    clover_item_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class MenuSpecial(Base):
    """
    MenuSpecial Table: Defines active promotional deals.
    """
    __tablename__ = "menu_specials"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    discount_type: Mapped[str] = mapped_column(String, nullable=False)
    discount_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    applicable_items: Mapped[str | None] = mapped_column(String, nullable=True)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Prompt(Base):
    """
    Prompt Table: Holds conversation instruction versions for the Voice agent.
    """
    __tablename__ = "prompts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CloverItemMap(Base):
    """
    CloverItemMap Table: Explicit map matching local product names to Clover POS items.
    """
    __tablename__ = "clover_item_map"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    clover_item_id: Mapped[str] = mapped_column(String, nullable=False)
    clover_item_name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class TradeInquiry(Base):
    """
    TradeInquiry Table: Records B2B Trade & wholesale query registrations.
    """
    __tablename__ = "trade_inquiries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    caller_name: Mapped[str] = mapped_column(String, nullable=False)
    caller_phone: Mapped[str] = mapped_column(String, nullable=False)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    product_interest: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    caller_type: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ExportInquiry(Base):
    """
    ExportInquiry Table: Records international export registrations.
    """
    __tablename__ = "export_inquiries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    caller_name: Mapped[str] = mapped_column(String, nullable=False)
    caller_phone: Mapped[str] = mapped_column(String, nullable=False)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False)
    product_interest: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Complaint(Base):
    """
    Complaint Table: Logs customer service and quality complaints.
    """
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    caller_name: Mapped[str] = mapped_column(String, nullable=False)
    caller_phone: Mapped[str] = mapped_column(String, nullable=False)
    product_name: Mapped[str] = mapped_column(String, nullable=False)
    complaint_description: Mapped[str] = mapped_column(Text, nullable=False)
    purchase_location: Mapped[str | None] = mapped_column(String, nullable=True)
    batch_lot_number: Mapped[str | None] = mapped_column(String, nullable=True)
    purchase_date: Mapped[str | None] = mapped_column(String, nullable=True)
    severity: Mapped[str | None] = mapped_column(String, nullable=True)
    po_number: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CallbackRequest(Base):
    """
    CallbackRequest Table: Records telephone callback requests.
    """
    __tablename__ = "callback_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    caller_name: Mapped[str] = mapped_column(String, nullable=False)
    caller_phone: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_callback_time: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class OutboundCampaign(Base):
    __tablename__ = "outbound_campaigns"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="draft")
    created_by: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    contacts: Mapped[list["OutboundContact"]] = relationship(
        "OutboundContact",
        back_populates="campaign",
        lazy="raise",
    )
    calls: Mapped[list["OutboundCall"]] = relationship(
        "OutboundCall",
        back_populates="campaign",
        lazy="raise",
    )


class OutboundContact(Base):
    __tablename__ = "outbound_contacts"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    campaign_id: Mapped[str] = mapped_column(
        String, ForeignKey("outbound_campaigns.id"), nullable=False
    )
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone_number: Mapped[str] = mapped_column(String, nullable=False)
    language_preference: Mapped[str] = mapped_column(String, default="Urdu", nullable=False)
    company: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_metadata: Mapped[dict | None] = mapped_column(
        "metadata", JSON, nullable=True
    )
    status: Mapped[str] = mapped_column(String, default="pending")
    recall_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    campaign: Mapped["OutboundCampaign"] = relationship(
        "OutboundCampaign",
        back_populates="contacts",
        lazy="raise",
    )


class OutboundCall(Base):
    __tablename__ = "outbound_calls"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    campaign_id: Mapped[str] = mapped_column(
        String, ForeignKey("outbound_campaigns.id"), nullable=False
    )
    contact_id: Mapped[str] = mapped_column(
        String, ForeignKey("outbound_contacts.id"), nullable=False
    )
    retell_call_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    phone_number: Mapped[str] = mapped_column(String, nullable=False)
    call_status: Mapped[str] = mapped_column(String, default="registered")
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(String, nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    campaign: Mapped["OutboundCampaign"] = relationship(
        "OutboundCampaign",
        back_populates="calls",
        lazy="raise",
    )
    contact: Mapped["OutboundContact"] = relationship(
        "OutboundContact",
        lazy="raise",
    )


class LiveKitCallEvent(Base):
    """
    Raw LiveKit webhook events, stored verbatim for audit and replay.

    event_id is LiveKit's own event UUID and is UNIQUE: LiveKit does not
    guarantee delivery, so it retries, and the same event can arrive more
    than once. The unique constraint is what makes ingestion idempotent.
    """
    __tablename__ = "livekit_call_events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    room_name: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    room_sid: Mapped[str | None] = mapped_column(String, nullable=True)
    participant_identity: Mapped[str | None] = mapped_column(String, nullable=True)
    participant_kind: Mapped[str | None] = mapped_column(String, nullable=True)
    # LiveKit's event timestamp (UNIX seconds), NOT our receive time. Events
    # can arrive late or out of order, so ordering must use this.
    event_time: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    # Count of events LiveKit dropped before this one — non-zero means we
    # have a gap and any derived state may be incomplete.
    num_dropped: Mapped[int] = mapped_column(Integer, default=0)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


# 4. FASTAPI DEPENDENCY YIELDER
async def get_db():
    """
    FastAPI dependency that opens a new async database session,
    yields it to the request handler, and guarantees closure
    when the HTTP request completes.
    """
    async with AsyncSessionLocal() as session:
        yield session

from sqlalchemy import text


# 5. DDL MIGRATION UTILITIES
async def init_db():
    """
    Creates all physical tables in PostgreSQL if they do not exist,
    and runs specific manual schema migration steps.
    """
    # 1. Create tables and run migrations in a single connection transaction block
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # 2. Sequential migrations list to adapt production DB without complex migration scripts (like Alembic)
        migrations = [
            "ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS restaurant_info VARCHAR DEFAULT 'We are open daily from 11am to 10pm.'",
            "ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS wait_time_pickup VARCHAR DEFAULT '15'",
            "ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS wait_time_delivery VARCHAR DEFAULT '30'",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS clover_order_id VARCHAR",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS clover_synced BOOLEAN DEFAULT FALSE",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS clover_error TEXT",
            "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS clover_item_id VARCHAR",
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS po_number VARCHAR",
            "UPDATE agent_settings SET restaurant_name = 'Mitchell''s Fruit Farms' WHERE restaurant_name = 'our restaurant' OR restaurant_name = 'Your Restaurant' OR restaurant_name IS NULL",
            "UPDATE agent_settings SET restaurant_info = 'Mitchell''s is a historic food manufacturer in Pakistan, producing high-quality jams, squashes, ketchups, sauces, and confectionery since 1933.' WHERE restaurant_info = 'We are open daily from 11am to 10pm.' OR restaurant_info IS NULL",
            "ALTER TABLE outbound_contacts ADD COLUMN IF NOT EXISTS language_preference VARCHAR DEFAULT 'Urdu'",
            "ALTER TABLE outbound_contacts DROP COLUMN IF EXISTS email",
            "ALTER TABLE outbound_contacts ADD COLUMN IF NOT EXISTS recall_at TIMESTAMPTZ",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS recall_at TIMESTAMPTZ",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS customer_feedback TEXT",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS feedback_rating INTEGER",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS room_sid VARCHAR",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS sip_call_id VARCHAR",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS trunk_phone_number VARCHAR",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS disconnect_reason VARCHAR",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS answered_timestamp BIGINT",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS ring_ms INTEGER",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS room_started_timestamp BIGINT",
            "ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS room_finished_timestamp BIGINT",
        ]
        
        # Use nested transactions (savepoints) so if one migration fails, we can continue the rest
        for sql in migrations:
            try:
                async with conn.begin_nested():
                    await conn.execute(text(sql))
            except Exception:
                # Ignore issues (e.g. if column already exists)
                pass


