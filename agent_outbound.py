import multiprocessing
import sys

if sys.platform != "win32":
    multiprocessing.set_start_method("fork", force=True)

import json
import logging
import os

from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli

from agent_core import run_agent
from prompts import build_outbound_instructions
from tools import OUTBOUND_TOOLS
load_dotenv()

logger = logging.getLogger("mitchells-outbound")

DYNAMIC_VAR_KEYS = (
    "owner_name",
    "shop_name",
    "customer_phone",
    "customer_city",
    "customer_type",
    "last_order",
    "language_preference",
)


def _greeting_text(dynamic_vars: dict) -> str:
    lang = (dynamic_vars.get("language_preference") or "Urdu").strip().lower()
    owner = (dynamic_vars.get("owner_name") or "").strip()
    if lang == "english":
        who = owner or "the shop owner"
        return (
            f"Assalam o Alaikum! This is Ayesha calling from Mitchell's "
            f"Fruit Farms — may I speak with {who} please?"
        )
    who = owner or "دکان کے مالک"
    return (
        f"السلام علیکم! میں عائشہ ہوں، Mitchell's Fruit Farms سے بات کر "
        f"رہی ہوں — کیا {who} سے بات ہو سکتی ہے؟"
    )


def _dynamic_vars_from_job(ctx: JobContext) -> dict:
    metadata = ctx.job.metadata or ""
    try:
        data = json.loads(metadata) if metadata else {}
    except json.JSONDecodeError:
        logger.warning("could not parse job metadata as JSON: %r", metadata)
        data = {}
    if not isinstance(data, dict):
        data = {}
    return {key: str(data[key]) for key in DYNAMIC_VAR_KEYS if data.get(key)}


async def entrypoint(ctx: JobContext) -> None:
    dynamic_vars = _dynamic_vars_from_job(ctx)
    instructions = build_outbound_instructions(**dynamic_vars)
    await run_agent(
        ctx,
        instructions=instructions,
        tools=OUTBOUND_TOOLS,
        greeting_text=_greeting_text(dynamic_vars),
        log_label="outbound",
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=os.getenv("MITCHELLS_OUTBOUND_AGENT_NAME", "mitchells-outbound"),
            port=int(os.getenv("MITCHELLS_OUTBOUND_HTTP_PORT", "8082")),
            num_idle_processes=int(
                os.getenv("MITCHELLS_IDLE_PROCESSES", "0")
            ),
        ),
    )
