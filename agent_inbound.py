import multiprocessing
import sys

if sys.platform != "win32":
    multiprocessing.set_start_method("fork", force=True)

import json
import logging
import os

from dotenv import load_dotenv
from livekit.agents import JobContext, JobProcess, WorkerOptions, cli

from agent_core import cache_greeting_sync, run_agent
from prompts import build_inbound_instructions
from tools import INBOUND_TOOLS

load_dotenv()
logger = logging.getLogger("mitchells-inbound")

GREETING_TEXT = (
    "Mitchell's Fruit Farms میں خوش آمدید! 1933 سے پاکستان کا trusted food "
    "brand۔ میں عائشہ ہوں، کیا آپ English میں بات کریں گے یا Urdu میں؟"
)


def _caller_phone_from_room(room_name: str) -> str:
    if room_name.startswith("+") and "_" in room_name:
        return room_name.split("_", 1)[0]
    return ""


def _caller_phone_from_job(ctx: JobContext) -> str:
    metadata = ctx.job.metadata or ""
    try:
        data = json.loads(metadata) if metadata else {}
    except json.JSONDecodeError:
        data = {}
    if isinstance(data, dict) and data.get("caller_phone"):
        return str(data["caller_phone"])
    for participant in ctx.room.remote_participants.values():
        phone = participant.attributes.get("sip.phoneNumber") if participant.attributes else None
        if phone:
            return phone
    return ""


def prewarm(proc: JobProcess) -> None:
    cache_greeting_sync(proc, GREETING_TEXT)


async def entrypoint(ctx: JobContext) -> None:
    caller_phone = _caller_phone_from_job(ctx) or _caller_phone_from_room(
        ctx.room.name
    )
    instructions = build_inbound_instructions(caller_phone=caller_phone)
    await run_agent(
        ctx,
        instructions=instructions,
        tools=INBOUND_TOOLS,
        greeting_text=GREETING_TEXT,
        log_label="inbound",
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            num_idle_processes=int(
                os.getenv("MITCHELLS_IDLE_PROCESSES", "0")
            ),
            agent_name=os.getenv("MITCHELLS_INBOUND_AGENT_NAME", "mitchells-inbound"),
            port=int(os.getenv("MITCHELLS_INBOUND_HTTP_PORT", "8081")),
        ),
    )
