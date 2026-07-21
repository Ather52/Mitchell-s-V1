import asyncio
import hashlib
import logging
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=ROOT_DIR / ".env.local")
load_dotenv(dotenv_path=ROOT_DIR / ".env")

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    RoomInputOptions,
    get_job_context,
)

try:
    from livekit.plugins import noise_cancellation
except ImportError:
    noise_cancellation = None

try:
    from livekit.plugins import soniox
except ImportError:
    soniox = None

from livekit.agents.utils.participant import wait_for_participant_attribute
from livekit.agents.utils.codecs import AudioStreamDecoder

from qwen_omni_realtime import QwenOmniRealtimeModel

SONIOX_HTTP_URL = "https://tts-rt.soniox.com/tts"
SIP_CALL_STATUS_ATTR = "sip.callStatus"
SIP_CALL_STATUS_ACTIVE = "active"
GREETING_DISK_DIR = Path(__file__).resolve().parent / ".greeting_cache"
_GREETING_FRAME_CACHE: dict[str, list[rtc.AudioFrame]] = {}

logger = logging.getLogger("mitchells-agent")


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if value is None:
        return None
    return value.strip().strip('"').strip("'")


DASHSCOPE_API_KEY = _env("DASHSCOPE_API_KEY")
DASHSCOPE_WS_BASE_URL = _env(
    "DASHSCOPE_BASE_URL",
    "wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime",
)
QWEN_OMNI_MODEL = _env("QWEN_OMNI_MODEL", "qwen3.5-omni-flash-realtime")
QWEN_TTS_VOICE = _env("QWEN_TTS_VOICE", "Evan")
QWEN_VAD_SILENCE_MS = int(_env("QWEN_VAD_SILENCE_MS", "600"))
QWEN_VAD_PREFIX_PADDING_MS = int(_env("QWEN_VAD_PREFIX_PADDING_MS", "400"))
QWEN_VAD_THRESHOLD = float(_env("QWEN_VAD_THRESHOLD", "0.6"))
QWEN_TURN_DETECTION_TYPE = _env("QWEN_TURN_DETECTION_TYPE", "server_vad")

SONIOX_API_KEY = _env("SONIOX_API_KEY")
SONIOX_TTS_MODEL = _env("SONIOX_TTS_MODEL", "tts-rt-v1")
SONIOX_TTS_LANGUAGE = _env("SONIOX_TTS_LANGUAGE", "ur")
SONIOX_TTS_VOICE = _env("MITCHELLS_SONIOX_TTS_VOICE", "Maya")

GREETING_DELAY_S = float(_env("GREETING_DELAY_S", "0"))
SIP_ANSWER_TIMEOUT_S = float(_env("SIP_ANSWER_TIMEOUT_S", "45"))
CALLER_READY_TIMEOUT_S = float(_env("CALLER_READY_TIMEOUT_S", "12"))
INBOUND_GREETING_DELAY_S = float(_env("INBOUND_GREETING_DELAY_S", "0"))


def build_tts():
    if not SONIOX_API_KEY:
        return None
    if soniox is None:
        raise RuntimeError(
            "SONIOX_API_KEY is set but livekit-plugins-soniox is not installed"
        )
    return soniox.TTS(
        api_key=SONIOX_API_KEY,
        model=SONIOX_TTS_MODEL,
        language=SONIOX_TTS_LANGUAGE,
        voice=SONIOX_TTS_VOICE,
    )


USE_SONIOX_STT = _env("MITCHELLS_USE_SONIOX_STT", "0") == "1"
QWEN_TEXT_MODEL = _env("QWEN_TEXT_MODEL", "qwen-plus")
DASHSCOPE_HTTP_BASE_URL = _env(
    "DASHSCOPE_HTTP_BASE_URL",
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)

# LLM provider for the cascaded text pipeline. "openai" uses OpenAI (set
# OPENAI_API_KEY + LLM_MODEL); anything else falls back to DashScope/Qwen.
LLM_PROVIDER = _env("LLM_PROVIDER", "dashscope").strip().lower()
OPENAI_API_KEY = _env("OPENAI_API_KEY", "")
OPENAI_LLM_MODEL = _env("LLM_MODEL", "gpt-4.1")
OPENAI_BASE_URL = _env("OPENAI_BASE_URL", "https://api.openai.com/v1")


def build_stt():
    if not (USE_SONIOX_STT and SONIOX_API_KEY and soniox is not None):
        return None
    from prompts import STT_CONTEXT_TERMS

    hints = [
        h.strip()
        for h in _env("SONIOX_STT_LANGUAGE_HINTS", "ur,en").split(",")
        if h.strip()
    ]
    return soniox.STT(
        api_key=SONIOX_API_KEY,
        params=soniox.STTOptions(
            language_hints=hints,
            language_hints_strict=(
                _env("SONIOX_STT_HINTS_STRICT", "0") == "1"
            ),
            max_endpoint_delay_ms=int(
                _env("SONIOX_STT_ENDPOINT_DELAY_MS", "1500")
            ),
            endpoint_sensitivity=float(
                _env("SONIOX_STT_ENDPOINT_SENSITIVITY", "0.3")
            ),
            context=soniox.ContextObject(
                general=[
                    soniox.ContextGeneralItem(
                        key="domain",
                        value="FMCG food product sales call in Pakistan",
                    ),
                    soniox.ContextGeneralItem(
                        key="setting",
                        value=(
                            "Ayesha, a sales agent for Mitchell's Fruit "
                            "Farms, talks to a Pakistani shopkeeper in "
                            "Urdu mixed with English commerce terms"
                        ),
                    ),
                ],
                terms=STT_CONTEXT_TERMS,
            ),
        ),
    )


def build_text_llm():
    from livekit.plugins import openai as openai_plugin

    if LLM_PROVIDER == "openai" and OPENAI_API_KEY:
        logger.info(
            "cascaded pipeline: Soniox STT -> OpenAI %s -> Soniox TTS",
            OPENAI_LLM_MODEL,
        )
        kwargs = {
            "model": OPENAI_LLM_MODEL,
            "api_key": OPENAI_API_KEY,
            "base_url": OPENAI_BASE_URL,
        }
        # GPT-5 reasoning models "think" before answering; on a live call
        # that adds seconds per turn. Keep effort low unless overridden.
        effort = _env("LLM_REASONING_EFFORT", "").strip()
        if effort:
            kwargs["reasoning_effort"] = effort
        return openai_plugin.LLM(**kwargs)
    logger.info(
        "cascaded pipeline: Soniox STT -> %s -> Soniox TTS", QWEN_TEXT_MODEL
    )
    return openai_plugin.LLM(
        model=QWEN_TEXT_MODEL,
        api_key=DASHSCOPE_API_KEY,
        base_url=DASHSCOPE_HTTP_BASE_URL,
    )


def build_llm(instructions: str, *, use_soniox: bool) -> QwenOmniRealtimeModel:
    if use_soniox:
        logger.info(
            "using Soniox TTS (%s, voice=%s)", SONIOX_TTS_LANGUAGE, SONIOX_TTS_VOICE
        )
    else:
        logger.info("using Qwen built-in voice (%s)", QWEN_TTS_VOICE)
    return QwenOmniRealtimeModel(
        model=QWEN_OMNI_MODEL,
        voice=QWEN_TTS_VOICE,
        api_key=DASHSCOPE_API_KEY,
        base_url=DASHSCOPE_WS_BASE_URL,
        instructions=instructions,
        audio_output=not use_soniox,
        vad_silence_duration_ms=QWEN_VAD_SILENCE_MS,
        vad_prefix_padding_ms=QWEN_VAD_PREFIX_PADDING_MS,
        vad_threshold=QWEN_VAD_THRESHOLD,
        turn_detection_type=QWEN_TURN_DETECTION_TYPE,
    )


class MitchellsAssistant(Agent):
    def __init__(
        self,
        *,
        instructions: str,
        tools: list,
        greeting_text: str,
        greeting_frames: list[rtc.AudioFrame] | None = None,
        inbound: bool = True,
        tts=None,
        stt=None,
    ) -> None:
        self._greeting_text = greeting_text
        self._greeting_frames = greeting_frames or []
        self._inbound = inbound
        # tts is the caller's decision: None means Qwen speaks natively,
        # either because no Soniox key is set or because the Soniox probe
        # failed and this call is running on the fallback voice.
        self._has_tts = tts is not None
        if stt is not None:
            super().__init__(
                instructions=instructions,
                stt=stt,
                tts=tts,
                llm=build_text_llm(),
                tools=tools,
            )
        else:
            super().__init__(
                instructions=instructions,
                tts=tts,
                llm=build_llm(instructions, use_soniox=tts is not None),
                tools=tools,
            )

    def tts_node(self, text, model_settings):
        # The LLM tends to echo the STT's Urdu transliterations of product
        # names ("مینگو جیم") no matter what the prompt says; the ur voice
        # then mispronounces them. Rewrite known names to English right
        # before synthesis. A 60-char tail is held back so a multi-word
        # name never straddles an emit boundary.
        from prompts import PRODUCT_NAME_FIXES

        def _fix(chunk: str) -> str:
            for ur, en in PRODUCT_NAME_FIXES:
                if ur in chunk:
                    chunk = chunk.replace(ur, en)
            return chunk

        async def _fixed():
            buf = ""
            async for chunk in text:
                buf += chunk
                if len(buf) > 60:
                    cut = buf.rfind(" ", 0, len(buf) - 60)
                    if cut > 0:
                        out, buf = buf[:cut], buf[cut:]
                        yield _fix(out)
            if buf:
                yield _fix(buf)

        return Agent.default.tts_node(self, _fixed(), model_settings)

    def _sip_participant(self, room: rtc.Room) -> rtc.RemoteParticipant | None:
        return next(
            (
                p
                for p in room.remote_participants.values()
                if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
            ),
            None,
        )

    def _caller_still_connected(self, room: rtc.Room) -> bool:
        sip = self._sip_participant(room)
        return sip is not None and sip.identity in room.remote_participants

    async def _log_when_subscribed(
        self, subscribed: asyncio.Future, call_status: str | None
    ) -> None:
        try:
            await asyncio.wait_for(subscribed, timeout=CALLER_READY_TIMEOUT_S)
            logger.info(
                "inbound audio subscribed, call_status=%s", call_status
            )
        except asyncio.TimeoutError:
            logger.warning(
                "inbound audio not subscribed within %.0fs, "
                "call_status=%s",
                CALLER_READY_TIMEOUT_S,
                call_status,
            )
        except Exception as exc:
            logger.debug("subscribed wait ended: %s", exc)

    async def _wait_caller_ready(self) -> bool:
        room = get_job_context().room
        sip = self._sip_participant(room)

        # Console / WebRTC mode
        if sip is None:
            logger.info(
                "No SIP participant detected. Running in WebRTC/Console mode."
            )
            return True

        subscribed = self.session.room_io.subscribed_fut

        # ----- Existing SIP logic below -----
        if self._inbound:
            if not self._caller_still_connected(room):
                logger.warning("caller disconnected before greeting")
                return False

            status = sip.attributes.get(SIP_CALL_STATUS_ATTR)

            if INBOUND_GREETING_DELAY_S > 0:
                await asyncio.sleep(INBOUND_GREETING_DELAY_S)

                if not self._caller_still_connected(room):
                    logger.warning("caller disconnected during greeting delay")
                    return False

            if subscribed is not None and not subscribed.done():
                asyncio.create_task(
                    self._log_when_subscribed(subscribed, status),
                    name="log_audio_subscribed",
                )
            else:
                logger.info(
                    "inbound immediate greeting, call_status=%s",
                    status,
                )

            return True

        async def _wait_subscribed() -> None:
            if subscribed is not None and not subscribed.done():
                await subscribed
            logger.info("agent audio track subscribed by caller")

        async def _wait_sip_active() -> None:
            if sip.attributes.get(SIP_CALL_STATUS_ATTR) == SIP_CALL_STATUS_ACTIVE:
                return
            await wait_for_participant_attribute(
                room,
                identity=sip.identity,
                attribute=SIP_CALL_STATUS_ATTR,
                value=SIP_CALL_STATUS_ACTIVE,
            )
            logger.info("sip call active")

        try:
            await asyncio.wait_for(
                asyncio.gather(_wait_subscribed(), _wait_sip_active()),
                timeout=CALLER_READY_TIMEOUT_S,
            )
            return True
        except asyncio.TimeoutError:
            logger.warning(
                "timed out waiting for caller ready after %.0fs, "
                "greeting anyway",
                CALLER_READY_TIMEOUT_S,
            )
            return self._caller_still_connected(room)
        except RuntimeError as exc:
            logger.warning("caller disconnected before ready: %s", exc)
            return False

    async def on_enter(self) -> None:
        if not await self._wait_caller_ready():
            return
        if GREETING_DELAY_S > 0:
            await asyncio.sleep(GREETING_DELAY_S)
        self.session.clear_user_turn()
        if not self._has_tts:
            # Native mode cannot session.say (supports_say=False): ask the
            # model to speak the greeting itself.
            logger.warning("no TTS, greeting via Qwen native voice")
            self.session.generate_reply(
                instructions=(
                    "Say exactly this greeting, nothing else: "
                    f"{self._greeting_text}"
                )
            )
            return
        if self._greeting_frames:

            async def _cached_audio():
                for frame in self._greeting_frames:
                    yield frame

            self.session.say(
                self._greeting_text,
                audio=_cached_audio(),
                allow_interruptions=True,
            )
            logger.info(
                "playing cached greeting (%d frames)", len(self._greeting_frames)
            )
        else:
            logger.warning("no cached greeting, using live TTS")
            self.session.say(self._greeting_text, allow_interruptions=True)


def _greeting_cache_key(greeting_text: str) -> str:
    return f"greeting:{greeting_text}"


def _greeting_disk_path(greeting_text: str) -> Path:
    digest = hashlib.sha256(greeting_text.encode("utf-8")).hexdigest()[:16]
    return GREETING_DISK_DIR / f"{digest}.mp3"


async def _decode_mp3_frames(mp3_data: bytes) -> list[rtc.AudioFrame]:
    decoder = AudioStreamDecoder(
        sample_rate=24000, num_channels=1, format="mp3"
    )
    decoder.push(mp3_data)
    decoder.end_input()
    frames: list[rtc.AudioFrame] = []
    try:
        async for frame in decoder:
            frames.append(frame)
    finally:
        await decoder.aclose()
    return frames


def _store_greeting_frames(
    proc: JobProcess, greeting_text: str, frames: list[rtc.AudioFrame]
) -> None:
    cache_key = _greeting_cache_key(greeting_text)
    _GREETING_FRAME_CACHE[cache_key] = frames
    proc.userdata[cache_key] = frames
    proc.userdata["soniox_ready"] = True


def load_greeting_frames_sync(
    proc: JobProcess, greeting_text: str
) -> list[rtc.AudioFrame]:
    cache_key = _greeting_cache_key(greeting_text)
    cached = (
        proc.userdata.get(cache_key)
        or _GREETING_FRAME_CACHE.get(cache_key)
    )
    if cached:
        return cached

    disk_path = _greeting_disk_path(greeting_text)
    if not disk_path.exists():
        return []

    try:
        frames = asyncio.run(_decode_mp3_frames(disk_path.read_bytes()))
        _store_greeting_frames(proc, greeting_text, frames)
        logger.info("loaded greeting from disk (%d frames)", len(frames))
        return frames
    except Exception as exc:
        logger.warning("disk greeting load failed: %s", exc)
        return []


def cache_greeting_sync(proc: JobProcess, greeting_text: str) -> None:
    if load_greeting_frames_sync(proc, greeting_text):
        return
    if not SONIOX_API_KEY:
        return

    try:
        resp = requests.post(
            SONIOX_HTTP_URL,
            headers={"Authorization": f"Bearer {SONIOX_API_KEY}"},
            json={
                "model": SONIOX_TTS_MODEL,
                "language": SONIOX_TTS_LANGUAGE,
                "voice": SONIOX_TTS_VOICE,
                "audio_format": "mp3",
                "text": greeting_text,
            },
            timeout=60,
        )
        if resp.status_code != 200:
            logger.warning(
                "greeting HTTP cache failed: %s",
                resp.status_code,
            )
            return
        GREETING_DISK_DIR.mkdir(parents=True, exist_ok=True)
        _greeting_disk_path(greeting_text).write_bytes(resp.content)
        frames = asyncio.run(_decode_mp3_frames(resp.content))
        _store_greeting_frames(proc, greeting_text, frames)
        logger.info(
            "cached greeting audio via HTTP (%d frames)", len(frames)
        )
    except Exception as exc:
        logger.warning("greeting cache failed: %s", exc)


def prewarm_soniox(proc: JobProcess) -> None:
    return


async def ensure_soniox_ready(proc: JobProcess, greeting_text: str):
    """Prewarm Soniox and verify it can actually synthesize.

    Returns (tts, greeting_frames). tts is None when Soniox is unavailable
    (no key, or the probe failed) — the caller then runs the call on Qwen's
    native voice instead of dying silent mid-call.
    """
    tts = proc.userdata.get("tts") or build_tts()
    if tts is None:
        return None, []

    cache_key = _greeting_cache_key(greeting_text)
    cached = proc.userdata.get(cache_key) or _GREETING_FRAME_CACHE.get(
        cache_key
    )
    # Even with a cached greeting, synthesize a short probe: a dead Soniox
    # account otherwise only surfaces after the greeting, killing the call.
    text = "سلام" if cached else greeting_text
    stream = tts.synthesize(text)
    frames: list[rtc.AudioFrame] = []
    try:
        async for chunk in stream:
            frames.append(chunk.frame)
        proc.userdata["tts"] = tts
        if cached:
            return tts, cached
        _store_greeting_frames(proc, greeting_text, frames)
        logger.info(
            "prewarmed Soniox TTS (%d greeting frames)", len(frames)
        )
        return tts, frames
    except Exception as exc:
        logger.warning(
            "Soniox probe failed, falling back to Qwen native voice: %s",
            exc,
        )
        return None, []
    finally:
        await stream.aclose()


def build_session(*, cascaded: bool = False) -> AgentSession:
    if cascaded:
        # Soniox's own endpoint detection drives the turns; no local VAD.
        # Preemptive generation drafts the reply from interim transcripts
        # while the caller is still finishing, cutting turn latency.
        return AgentSession(
            vad=None,
            aec_warmup_duration=0.0,
            turn_handling={
                "turn_detection": "stt",
                "endpointing": {"min_delay": 0.4, "max_delay": 3.0},
                "preemptive_generation": {"enabled": True},
                # Backchannels ("جی", "ہمم") must not kill the agent's
                # sentence: require real speech to interrupt, and resume
                # quickly when the interruption turns out to be noise.
                "interruption": {
                    "min_duration": 0.8,
                    "min_words": 2,
                    "resume_false_interruption": True,
                    "false_interruption_timeout": 1.0,
                },
            },
        )
    return AgentSession(
        vad=None,
        aec_warmup_duration=0.0,
        turn_handling={
            "turn_detection": None,
            "endpointing": {"min_delay": 0.4, "max_delay": 4.0},
            "preemptive_generation": {"enabled": False},
        },
    )


def build_room_input_options():
    kwargs = {"close_on_disconnect": False}
    if noise_cancellation is not None:
        kwargs["noise_cancellation"] = noise_cancellation.BVCTelephony()
    return RoomInputOptions(**kwargs)


async def _wait_for_sip_answer(
    ctx: JobContext,
    participant: rtc.RemoteParticipant,
    log_label: str,
    *,
    inbound: bool,
) -> bool:
    if participant.kind != rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
        logger.info(
            "[%s] non-SIP participant (%s), skipping SIP answer wait "
            "(console/WebRTC mode)",
            log_label,
            participant.identity,
        )
        return True

    status = participant.attributes.get(SIP_CALL_STATUS_ATTR)
    if status == SIP_CALL_STATUS_ACTIVE:
        logger.info("[%s] SIP call active", log_label)
        return True

    if inbound and status == "ringing":
        logger.info(
            "[%s] inbound call ringing, starting agent immediately",
            log_label,
        )
        return True

    if participant.identity not in ctx.room.remote_participants:
        return False

    logger.info(
        "[%s] waiting for SIP answer (status=%s)",
        log_label,
        status,
    )
    try:
        await asyncio.wait_for(
            wait_for_participant_attribute(
                ctx.room,
                identity=participant.identity,
                attribute=SIP_CALL_STATUS_ATTR,
                value=SIP_CALL_STATUS_ACTIVE,
            ),
            timeout=SIP_ANSWER_TIMEOUT_S,
        )
        logger.info("[%s] SIP call active", log_label)
        return True
    except asyncio.TimeoutError:
        logger.warning(
            "[%s] timed out waiting for SIP answer after %.0fs",
            log_label,
            SIP_ANSWER_TIMEOUT_S,
        )
        return participant.identity in ctx.room.remote_participants
    except RuntimeError as exc:
        logger.warning("[%s] SIP answer wait ended: %s", log_label, exc)
        return False


async def run_agent(
    ctx: JobContext,
    *,
    instructions: str,
    tools: list,
    greeting_text: str,
    log_label: str,
) -> None:
    greeting_frames = await asyncio.to_thread(
        load_greeting_frames_sync, ctx.proc, greeting_text
    )

    logger.info("[%s] connecting to room %s", log_label, ctx.room.name)
    connect_task = asyncio.create_task(
        ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY),
        name="room_connect",
    )
    if not greeting_frames:
        greeting_frames = await asyncio.to_thread(
            load_greeting_frames_sync, ctx.proc, greeting_text
        )
    await connect_task

    participant = await ctx.wait_for_participant()
    logger.info(
        "[%s] caller joined: %s call_status=%s",
        log_label,
        participant.identity,
        participant.attributes.get(SIP_CALL_STATUS_ATTR),
    )

    # Probe Soniox while the phone is still ringing so the result is ready
    # by the time the callee answers.
    soniox_task = asyncio.create_task(
        ensure_soniox_ready(ctx.proc, greeting_text),
        name="soniox_cache",
    )

    if not await _wait_for_sip_answer(
        ctx, participant, log_label, inbound=(log_label == "inbound")
    ):
        logger.info("[%s] caller gone before answer, exiting", log_label)
        soniox_task.cancel()
        return

    try:
        prewarmed_tts, warm_frames = await asyncio.wait_for(
            asyncio.shield(soniox_task), timeout=10
        )
    except Exception:
        # Probe inconclusive: keep the old behavior and assume Soniox works.
        prewarmed_tts, warm_frames = build_tts(), []
    if not greeting_frames:
        greeting_frames = warm_frames

    logger.info(
        "[%s] greeting ready: %d frames", log_label, len(greeting_frames)
    )

    stt = build_stt() if prewarmed_tts is not None else None
    session = build_session(cascaded=stt is not None)
    is_inbound = log_label == "inbound"

    @session.on("conversation_item_added")
    def _log_item(ev):
        logger.info(
            "%s: %r",
            getattr(ev.item, "role", "?"),
            getattr(ev.item, "text_content", ""),
        )

    logger.info("[%s] starting voice assistant", log_label)
    await session.start(
        room=ctx.room,
        agent=MitchellsAssistant(
            instructions=instructions,
            tools=tools,
            greeting_text=greeting_text,
            greeting_frames=greeting_frames,
            inbound=is_inbound,
            tts=prewarmed_tts,
            stt=stt,
        ),
        room_input_options=build_room_input_options(),
    )