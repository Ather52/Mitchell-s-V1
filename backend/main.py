# MITCHELL'S SALES AGENT API - MAIN ENTRY POINT
# This file initializes the FastAPI application, sets up Cross-Origin Resource
# Sharing (CORS) rules, mounts various API routers, and manages the application
# lifecycle (startup/shutdown tasks) including the Clover database sync loop.

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# 1. ENVIRONMENT VARIABLES SETUP
# Load variables defined in the '.env' file into os.environ.
# This must happen before importing modules that rely on os.getenv().
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    force=True,
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Internal imports for database connection and API route handling
from src.utils.db import init_db, AsyncSessionLocal
from src.api.auth.router import router as auth_router
from src.api.retell.router import router as retell_router
from src.api.settings.router import router as settings_router
from src.api.menu.router import router as menu_router
from src.api.prompts.router import router as prompts_router
from src.api.outbound.router import router as outbound_router
from src.api.livekit.router import router as livekit_router
from src.api.outbound.service import start_recall_scheduler
from src.services.livekit_service import start_call_status_poller

# 2. CORS (Cross-Origin Resource Sharing) CONFIGURATION
# Allowed origins represents which frontends/websites are allowed to make requests
# to this backend. If set to "*", any website can communicate with this API.
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in CORS_ORIGINS.split(",")] if CORS_ORIGINS != "*" else ["*"]

# Logger instance to output sync details to the console/log-files
_sched_logger = logging.getLogger("clover_menu_sync")
SYNC_INTERVAL_SECONDS = 300  # 5 minutes in seconds


async def _clover_menu_sync_loop():
    """
    Background Task Loop: Synchronizes Clover POS inventory to our local SQL database.
    
    Why this runs in a while True loop:
    This is an infinite loop that keeps running as long as the server is alive.
    It periodically queries the Clover API, updates our database, and then goes
    to sleep for 5 minutes (300 seconds) before repeating.
    """
    # Inline imports to prevent circular import issues on application start
    from src.services.clover_service import fetch_all_clover_items
    from src.utils.db_functions import full_sync_menu_from_clover

    # Initial delay to give the server a moment to start up before running the first sync
    await asyncio.sleep(10)

    while True:
        try:
            token = os.getenv("CLOVER_API_TOKEN", "").strip()
            merchant_id = os.getenv("CLOVER_MERCHANT_ID", "").strip()
            if not token or not merchant_id:
                _sched_logger.info("Clover integration is not configured (missing CLOVER_API_TOKEN or CLOVER_MERCHANT_ID). Skipping menu sync.")
            else:
                items = await fetch_all_clover_items()
                async with AsyncSessionLocal() as db:
                    result = await full_sync_menu_from_clover(db, items)
                _sched_logger.info(
                    "Clover menu sync complete: %d synced, %d skipped.",
                    result["synced"], result["skipped"],
                )
        except Exception as exc:
            _sched_logger.error("Clover menu sync failed: %s", exc)
        await asyncio.sleep(SYNC_INTERVAL_SECONDS)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan Context Manager: Controls server startup and shutdown operations.
    
    FastAPI calls this context manager on app initialization (before accepting traffic)
    and on app termination (when stopping the server process).
    """
    # 1. Ensure the PostgreSQL tables exist and run migrations
    await init_db()
    
    # 2. Launch the Clover sync loop as a non-blocking background task in asyncio
    sync_task = asyncio.create_task(_clover_menu_sync_loop())

    # 3. Launch the recall/callback auto-dialer scheduler
    await start_recall_scheduler()

    # 4. Launch the LiveKit call status poller (webhook fallback)
    await start_call_status_poller()

    yield  # Server runs and handles requests here...
    
    # Cancel the background task when the server shuts down to prevent memory leaks
    sync_task.cancel()
    try:
        await sync_task
    except asyncio.CancelledError:
        # Ignore standard cancellation exceptions from cancelling the task
        pass


# 3. FASTAPI CORE INITIALIZATION
# Initialize FastAPI with metadata and our custom lifespan function.
# ROOT_PATH makes FastAPI aware it is served under a reverse-proxy prefix
# (e.g. /v1-new on the server). Without it, the Swagger page fetches
# /openapi.json instead of <prefix>/openapi.json and gets HTML back, which
# fails to render. Empty locally, set to "/v1-new" in the server env.
app = FastAPI(
    title="Mitchell's Sales Agent API",
    version="1.0.0",
    lifespan=lifespan,
    root_path=os.getenv("ROOT_PATH", ""),
)

# Apply CORS rules middleware to allow the React dashboard frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules under the app instance
app.include_router(auth_router)
app.include_router(retell_router)
app.include_router(settings_router)
app.include_router(menu_router)
app.include_router(prompts_router)
app.include_router(outbound_router)
app.include_router(livekit_router)


# 4. HEALTH CHECK ENDPOINT
# A simple endpoint to quickly check if the server is running and responsive.
class HealthResponse(BaseModel):
    status: str
    service: str


@app.get("/", response_model=HealthResponse)
async def health():
    """Endpoint to check the API health status."""
    return HealthResponse(status="ok", service="mitchells-sales-agent")
