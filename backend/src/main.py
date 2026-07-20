import os
from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from src.utils.db import engine, Base
from src.utils.db import init_db
from src.api.auth.router import router as auth_router
from src.api.retell.router import router as retell_router
from src.api.settings.router import router as settings_router
from src.api.menu.router import router as menu_router
from src.api.outbound.router import router as outbound_router
from src.api.outbound.service import start_recall_scheduler


CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in CORS_ORIGINS.split(",")] if CORS_ORIGINS != "*" else ["*"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Run DDL migrations (create tables + alter columns)
    await init_db()
    # 2. Start the background recall/auto-dial scheduler
    await start_recall_scheduler()
    yield


app = FastAPI(title="Mitchell's Sales Agent API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(retell_router)
app.include_router(settings_router)
app.include_router(menu_router)
app.include_router(outbound_router)


class HealthResponse(BaseModel):
    status: str
    service: str


@app.get("/", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", service="mitchells-sales-agent")
