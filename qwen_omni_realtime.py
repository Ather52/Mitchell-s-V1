from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import time
import weakref
from dataclasses import dataclass
from typing import Any, Literal

import aiohttp

from livekit import rtc
from livekit.agents import (
    APIConnectionError,
    APIError,
    llm,
    utils,
)
from livekit.agents.llm.utils import build_legacy_openai_schema
from livekit.agents.types import NOT_GIVEN, NotGivenOr
from livekit.agents.utils import is_given

INPUT_SAMPLE_RATE = 16000
OUTPUT_SAMPLE_RATE = 24000
NUM_CHANNELS = 1
DEFAULT_MODEL = "qwen3.5-omni-flash-realtime"
DEFAULT_VOICE = "Evan"
DEFAULT_BASE_URL = "wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime"
DEFAULT_VAD_SILENCE_MS = 1500
DEFAULT_VAD_PREFIX_PADDING_MS = 400
DEFAULT_VAD_THRESHOLD = 0.6
DEFAULT_TURN_DETECTION_TYPE = "server_vad"
SESSION_READY_TIMEOUT_S = 45.0
RESPONSE_TIMEOUT_S = 60.0

logger = logging.getLogger("mitchells-qwen")


@dataclass
class _ModelOptions:
    api_key: str
    base_url: str
    model: str
    voice: str
    language_type: str
    instructions: str | None
    audio_output: bool
    vad_threshold: float
    vad_prefix_padding_ms: int
    vad_silence_duration_ms: int
    turn_detection_type: str


@dataclass
class _MessageGeneration:
    message_id: str
    text_ch: utils.aio.Chan[str]
    audio_ch: utils.aio.Chan[rtc.AudioFrame]
    modalities: asyncio.Future[list[Literal["text", "audio"]]]


@dataclass
class _ResponseGeneration:
    message_ch: utils.aio.Chan[llm.MessageGeneration]
    function_ch: utils.aio.Chan[llm.FunctionCall]
    messages: dict[str, _MessageGeneration]
    fnc_items: dict[str, dict[str, str]]
    dispatched: set[str]


class QwenOmniRealtimeModel(llm.RealtimeModel):
    def __init__(
        self,
        *,
        model: str = DEFAULT_MODEL,
        voice: str = DEFAULT_VOICE,
        language_type: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
        instructions: str | None = None,
        audio_output: bool = True,
        vad_threshold: float = DEFAULT_VAD_THRESHOLD,
        vad_prefix_padding_ms: int = DEFAULT_VAD_PREFIX_PADDING_MS,
        vad_silence_duration_ms: int = DEFAULT_VAD_SILENCE_MS,
        turn_detection_type: str = DEFAULT_TURN_DETECTION_TYPE,
        http_session: aiohttp.ClientSession | None = None,
    ) -> None:
        super().__init__(
            capabilities=llm.RealtimeCapabilities(
                message_truncation=False,
                turn_detection=True,
                user_transcription=True,
                auto_tool_reply_generation=True,
                audio_output=audio_output,
                manual_function_calls=True,
                mutable_chat_context=False,
                mutable_instructions=True,
                mutable_tools=True,
                per_response_tool_choice=False,
                supports_say=False,
            )
        )
        api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        if not api_key:
            raise ValueError("DASHSCOPE_API_KEY must be set")
        self._opts = _ModelOptions(
            api_key=api_key,
            base_url=base_url or os.getenv("DASHSCOPE_BASE_URL", DEFAULT_BASE_URL),
            model=model,
            voice=voice,
            language_type=language_type or os.getenv("QWEN_LANGUAGE_TYPE", "Auto"),
            instructions=instructions,
            audio_output=audio_output,
            vad_threshold=vad_threshold,
            vad_prefix_padding_ms=vad_prefix_padding_ms,
            vad_silence_duration_ms=vad_silence_duration_ms,
            turn_detection_type=turn_detection_type,
        )
        self._session = http_session
        self._sessions = weakref.WeakSet["QwenOmniRealtimeSession"]()

    @property
    def model(self) -> str:
        return self._opts.model

    @property
    def provider(self) -> str:
        return "Qwen"

    def _ensure_session(self) -> aiohttp.ClientSession:
        if not self._session:
            self._session = utils.http_context.http_session()
        return self._session

    def session(self) -> QwenOmniRealtimeSession:
        sess = QwenOmniRealtimeSession(self)
        self._sessions.add(sess)
        return sess

    async def aclose(self) -> None:
        for sess in list(self._sessions):
            await sess.aclose()


class QwenOmniRealtimeSession(llm.RealtimeSession):
    def __init__(self, realtime_model: QwenOmniRealtimeModel) -> None:
        super().__init__(realtime_model)
        self._realtime_model = realtime_model
        self._opts = realtime_model._opts
        self._chat_ctx = llm.ChatContext.empty()
        self._tools = llm.ToolContext.empty()
        self._instructions = self._opts.instructions
        self._msg_ch = utils.aio.Chan[dict[str, Any]]()
        self._input_resampler: rtc.AudioResampler | None = None
        self._current_generation: _ResponseGeneration | None = None
        self._response_created_futures: dict[str, asyncio.Future[llm.GenerationCreatedEvent]] = {}
        self._sent_function_call_output_ids: set[str] = set()
        self._session_ready = asyncio.Event()
        self._session_update_sent_at: float | None = None
        self._main_task = asyncio.create_task(
            self._main_task(),
            name="QwenOmniRealtimeSession._main_task",
        )
        # Nothing awaits _main_task, so without this callback any failure in
        # it (e.g. the DashScope WS refusing to connect) is swallowed by the
        # task object: the session silently never becomes ready and the agent
        # greets the caller and then goes deaf for the rest of the call, with
        # nothing in the logs to explain it.
        self._main_task.add_done_callback(self._on_main_task_done)

    def _on_main_task_done(self, task: asyncio.Task) -> None:
        if task.cancelled():
            return
        exc = task.exception()
        if exc is None:
            return
        logger.error(
            "Qwen realtime session died, agent can no longer hear or reply: %s",
            exc,
            exc_info=exc,
        )
        err = exc if isinstance(exc, APIError) else APIConnectionError(str(exc))
        self.emit(
            "error",
            llm.RealtimeModelError(
                timestamp=time.time(),
                label=self._realtime_model.label,
                error=err,
                recoverable=False,
            ),
        )

    @property
    def chat_ctx(self) -> llm.ChatContext:
        return self._chat_ctx

    @property
    def tools(self) -> llm.ToolContext:
        return self._tools

    def _send(self, event: dict[str, Any]) -> None:
        try:
            self._msg_ch.send_nowait(event)
        except utils.aio.channel.ChanClosed:
            pass

    async def update_instructions(self, instructions: str) -> None:
        self._instructions = instructions
        self._send(self._session_update_event())

    async def update_chat_ctx(self, chat_ctx: llm.ChatContext) -> None:
        new_ctx = chat_ctx.copy()
        sent_any_output = False
        for item in new_ctx.items:
            if item.type != "function_call_output":
                continue
            if item.call_id in self._sent_function_call_output_ids:
                continue
            self._sent_function_call_output_ids.add(item.call_id)
            output = item.output if isinstance(item.output, str) else json.dumps(item.output)
            self._send(
                {
                    "type": "conversation.item.create",
                    "event_id": f"event_{utils.shortuuid()}",
                    "item": {
                        "type": "function_call_output",
                        "call_id": item.call_id,
                        "output": output,
                    },
                }
            )
            sent_any_output = True
        if sent_any_output:
            # Qwen keeps the response active across the tool call and resumes
            # it itself once function_call_output arrives. Sending an explicit
            # response.create here is rejected with "Conversation already has
            # an active response", which is a fatal error for the session.
            logger.info(
                "function_call_output sent, letting Qwen resume the response"
            )
        self._chat_ctx = new_ctx

    async def update_tools(self, tools: list[llm.Tool]) -> None:
        self._tools = llm.ToolContext(tools)
        self._send(self._session_update_event())

    def update_options(self, *, tool_choice: NotGivenOr[llm.ToolChoice | None] = NOT_GIVEN) -> None:
        pass

    def push_audio(self, frame: rtc.AudioFrame) -> None:
        if frame.sample_rate != INPUT_SAMPLE_RATE:
            if self._input_resampler is None:
                self._input_resampler = rtc.AudioResampler(
                    frame.sample_rate,
                    INPUT_SAMPLE_RATE,
                    quality=rtc.AudioResamplerQuality.HIGH,
                )
            frames = self._input_resampler.push(frame)
        else:
            frames = [frame]
        for f in frames:
            pcm = f.data.tobytes()
            self._send(
                {
                    "type": "input_audio_buffer.append",
                    "event_id": f"event_{utils.shortuuid()}",
                    "audio": base64.b64encode(pcm).decode("ascii"),
                }
            )

    def push_video(self, frame: rtc.VideoFrame) -> None:
        pass

    def commit_audio(self) -> None:
        pass

    def clear_audio(self) -> None:
        self._send({"type": "input_audio_buffer.clear", "event_id": f"event_{utils.shortuuid()}"})

    def generate_reply(
        self,
        *,
        instructions: NotGivenOr[str] = NOT_GIVEN,
        tool_choice: NotGivenOr[llm.ToolChoice] = NOT_GIVEN,
        tools: NotGivenOr[list[llm.Tool]] = NOT_GIVEN,
    ) -> asyncio.Future[llm.GenerationCreatedEvent]:
        event_id = utils.shortuuid("response_create_")
        fut: asyncio.Future[llm.GenerationCreatedEvent] = asyncio.Future()
        self._response_created_futures[event_id] = fut
        response: dict[str, Any] = {}
        if is_given(instructions):
            response["instructions"] = instructions
        if not self._opts.audio_output:
            response["modalities"] = ["text"]
        payload: dict[str, Any] = {
            "type": "response.create",
            "event_id": event_id,
        }
        if response:
            payload["response"] = response

        async def _send_when_ready() -> None:
            wait_start = time.monotonic()
            try:
                await asyncio.wait_for(
                    self._session_ready.wait(), timeout=SESSION_READY_TIMEOUT_S
                )
            except asyncio.TimeoutError:
                logger.error(
                    "Qwen session still not ready after %.1fs, giving up on this reply",
                    time.monotonic() - wait_start,
                )
                pending = self._response_created_futures.pop(event_id, None)
                if pending and not pending.done():
                    pending.set_exception(
                        llm.RealtimeError("Qwen session not ready")
                    )
                return
            elapsed = time.monotonic() - wait_start
            if elapsed > 1.0:
                logger.info("Qwen session became ready after %.1fs wait", elapsed)
            self._send(payload)

        asyncio.create_task(_send_when_ready())

        def _on_timeout() -> None:
            pending = self._response_created_futures.pop(event_id, None)
            if pending and not pending.done():
                pending.set_exception(
                    llm.RealtimeError("generate_reply timed out")
                )

        handle = asyncio.get_event_loop().call_later(RESPONSE_TIMEOUT_S, _on_timeout)

        def _on_done(f: asyncio.Future[llm.GenerationCreatedEvent]) -> None:
            handle.cancel()
            self._response_created_futures.pop(event_id, None)
            if f.cancelled():
                self._send(
                    {
                        "type": "response.cancel",
                        "event_id": f"event_{utils.shortuuid()}",
                    }
                )

        fut.add_done_callback(_on_done)
        return fut

    def interrupt(self) -> None:
        if self._current_generation is None and not self._response_created_futures:
            return
        self._send({"type": "response.cancel", "event_id": f"event_{utils.shortuuid()}"})

    def truncate(
        self,
        *,
        message_id: str,
        modalities: list[Literal["text", "audio"]],
        audio_end_ms: int,
        audio_transcript: NotGivenOr[str] = NOT_GIVEN,
    ) -> None:
        pass

    async def aclose(self) -> None:
        self._msg_ch.close()
        await utils.aio.cancel_and_wait(self._main_task)

    def _session_tools(self) -> list[dict[str, Any]]:
        tools = []
        for tool in self._tools.function_tools.values():
            if not llm.is_function_tool(tool):
                continue
            nested = build_legacy_openai_schema(tool, internally_tagged=False)
            # build_legacy_openai_schema returns the Chat Completions shape:
            # {"type": "function", "function": {"name": ..., "description": ...,
            # "parameters": ...}}. The Realtime API's session.update instead
            # needs a FLAT shape with name/description/parameters at the top
            # level, or DashScope silently fails to register the tool.
            fn = nested.get("function", nested)
            tools.append({
                "type": "function",
                "name": fn.get("name"),
                "description": fn.get("description", ""),
                "parameters": fn.get("parameters", {"type": "object", "properties": {}}),
            })
        tool_names = [t.get("name") for t in tools]
        logger.info("Qwen session tools being sent (flat schema): %s", tool_names)
        return tools

    def _session_update_event(self) -> dict[str, Any]:
        modalities = (
            ["text", "audio"] if self._opts.audio_output else ["text"]
        )
        session: dict[str, Any] = {
            "modalities": modalities,
            "input_audio_format": "pcm",
            "output_audio_format": "pcm",
            "input_audio_transcription": {
                "model": "qwen3-asr-flash-realtime",
            },
            "turn_detection": {
                "type": self._opts.turn_detection_type,
                "threshold": self._opts.vad_threshold,
                "prefix_padding_ms": self._opts.vad_prefix_padding_ms,
                "silence_duration_ms": self._opts.vad_silence_duration_ms,
                "create_response": True,
                "interrupt_response": self._opts.audio_output,
            },
        }
        if self._opts.audio_output:
            session["voice"] = self._opts.voice
            session["language_type"] = self._opts.language_type
            session["smooth_output"] = True
            session["temperature"] = 0.7
        if self._instructions:
            session["instructions"] = self._instructions
        tools = self._session_tools()
        if tools:
            session["tools"] = tools
        return {
            "type": "session.update",
            "event_id": f"event_{utils.shortuuid()}",
            "session": session,
        }

    async def _connect_ws(self) -> aiohttp.ClientWebSocketResponse:
        url = f"{self._opts.base_url}?model={self._opts.model}"
        headers = {"Authorization": f"Bearer {self._opts.api_key}"}
        session = self._realtime_model._ensure_session()
        connect_start = time.monotonic()
        ws = await asyncio.wait_for(
            session.ws_connect(url, headers=headers, heartbeat=30),
            timeout=30,
        )
        logger.info("Qwen WS connected in %.2fs", time.monotonic() - connect_start)
        return ws

    async def _main_task(self) -> None:
        while not self._msg_ch.closed:
            self._session_ready.clear()
            ws = await self._connect_ws()
            update_event = self._session_update_event()
            payload_str = json.dumps(update_event)
            self._session_update_sent_at = time.monotonic()
            logger.info(
                "sending Qwen session.update (%d chars)", len(payload_str)
            )
            logger.info(
                "Qwen session.update tools payload: %s",
                json.dumps(update_event.get("session", {}).get("tools", [])),
            )
            await ws.send_str(payload_str)
            send_task = asyncio.create_task(self._send_task(ws))
            recv_task = asyncio.create_task(self._recv_task(ws))
            done, pending = await asyncio.wait(
                [send_task, recv_task],
                return_when=asyncio.FIRST_COMPLETED,
            )
            self._session_ready.clear()
            for task in pending:
                task.cancel()
            await utils.aio.cancel_and_wait(*pending)
            for task in done:
                if task.exception():
                    raise task.exception()
            await ws.close()

    async def _send_task(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        async for event in self._msg_ch:
            await ws.send_str(json.dumps(event))

    async def _recv_task(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        while True:
            msg = await ws.receive()
            if msg.type in (
                aiohttp.WSMsgType.CLOSED,
                aiohttp.WSMsgType.CLOSE,
                aiohttp.WSMsgType.CLOSING,
            ):
                break
            if msg.type != aiohttp.WSMsgType.TEXT:
                continue
            data = json.loads(msg.data)
            await self._handle_event(data)

    async def _handle_event(self, data: dict[str, Any]) -> None:
        event_type = data.get("type")
        if event_type == "session.updated":
            if self._session_update_sent_at is not None:
                logger.info(
                    "Qwen session.updated received %.2fs after session.update sent",
                    time.monotonic() - self._session_update_sent_at,
                )
            self._session_ready.set()
            return
        if event_type == "session.created":
            return
        if event_type == "error":
            error = data.get("error", data)
            err = APIError(f"Qwen Omni error: {error}")
            self.emit("error", llm.RealtimeModelError(
                timestamp=time.time(),
                label=self._realtime_model.label,
                error=err,
                recoverable=False,
            ))
            raise err
        if event_type == "input_audio_buffer.speech_started":
            self.emit("input_speech_started", llm.InputSpeechStartedEvent())
        elif event_type == "input_audio_buffer.speech_stopped":
            self.emit(
                "input_speech_stopped",
                llm.InputSpeechStoppedEvent(user_transcription_enabled=True),
            )
        elif event_type == "conversation.item.input_audio_transcription.completed":
            transcript = data.get("transcript", "")
            item_id = data.get("item_id", utils.shortuuid())
            if transcript:
                self.emit(
                    "input_audio_transcription_completed",
                    llm.InputTranscriptionCompleted(
                        item_id=item_id,
                        transcript=transcript,
                        is_final=True,
                    ),
                )
        elif event_type == "response.created":
            self._start_generation(data)
        elif event_type == "response.output_item.added":
            self._add_output_item(data)
        elif event_type in (
            "response.audio_transcript.delta",
            "response.text.delta",
        ):
            self._push_text_delta(data)
        elif event_type == "response.audio.delta":
            self._push_audio_delta(data)
        elif event_type in (
            "response.audio_transcript.done",
            "response.text.done",
        ):
            self._close_text(data)
        elif event_type == "response.audio.done":
            self._close_audio(data)
        elif event_type == "response.function_call_arguments.done":
            logger.info(
                "Qwen function call received: name=%s call_id=%s arguments=%s",
                data.get("name"),
                data.get("call_id"),
                data.get("arguments"),
            )
            self._handle_function_call_done(data)
        elif event_type == "response.output_item.done":
            self._handle_output_item_done(data)
        elif event_type == "response.done":
            self._finish_generation()
        elif event_type not in (
            "conversation.item.created",
            "response.content_part.added",
            "response.content_part.done",
        ):
            logger.debug("Qwen unhandled event type: %s", event_type)

    def _start_generation(self, data: dict[str, Any]) -> None:
        response_id = data.get("response", {}).get("id", utils.shortuuid())
        if self._current_generation is not None:
            logger.warning(
                "Qwen response.created while a generation was still open, "
                "closing the previous one"
            )
            self._finish_generation()
        self._current_generation = _ResponseGeneration(
            message_ch=utils.aio.Chan(),
            function_ch=utils.aio.Chan(),
            messages={},
            fnc_items={},
            dispatched=set(),
        )
        generation_ev = llm.GenerationCreatedEvent(
            message_stream=self._current_generation.message_ch,
            function_stream=self._current_generation.function_ch,
            user_initiated=False,
            response_id=response_id,
        )
        user_initiated = False
        for event_id, fut in list(self._response_created_futures.items()):
            if not fut.done():
                generation_ev.user_initiated = True
                user_initiated = True
                fut.set_result(generation_ev)
                self._response_created_futures.pop(event_id, None)
                break
        if not user_initiated:
            self.emit("generation_created", generation_ev)

    def _add_output_item(self, data: dict[str, Any]) -> None:
        if self._current_generation is None:
            return
        item = data.get("item", {})
        item_id = item.get("id", utils.shortuuid())
        if item.get("type") == "function_call":
            self._current_generation.fnc_items[item_id] = {
                "call_id": item.get("call_id") or "",
                "name": item.get("name") or "",
            }
            return
        if item.get("type") != "message":
            return
        item_generation = _MessageGeneration(
            message_id=item_id,
            text_ch=utils.aio.Chan(),
            audio_ch=utils.aio.Chan(),
            modalities=asyncio.get_event_loop().create_future(),
        )
        item_generation.modalities.set_result(
            ["audio", "text"] if self._opts.audio_output else ["text"]
        )
        self._current_generation.messages[item_id] = item_generation
        self._current_generation.message_ch.send_nowait(
            llm.MessageGeneration(
                message_id=item_id,
                text_stream=item_generation.text_ch,
                audio_stream=item_generation.audio_ch,
                modalities=item_generation.modalities,
            )
        )

    def _push_text_delta(self, data: dict[str, Any]) -> None:
        if self._current_generation is None:
            return
        delta = data.get("delta", "")
        item_id = data.get("item_id")
        if not delta or not item_id:
            return
        item = self._current_generation.messages.get(item_id)
        if item:
            item.text_ch.send_nowait(delta)

    def _push_audio_delta(self, data: dict[str, Any]) -> None:
        if self._current_generation is None:
            return
        delta = data.get("delta", "")
        item_id = data.get("item_id")
        if not delta or not item_id:
            return
        item = self._current_generation.messages.get(item_id)
        if not item:
            return
        pcm = base64.b64decode(delta)
        samples = len(pcm) // 2
        frame = rtc.AudioFrame(
            data=pcm,
            sample_rate=OUTPUT_SAMPLE_RATE,
            num_channels=NUM_CHANNELS,
            samples_per_channel=samples,
        )
        item.audio_ch.send_nowait(frame)

    def _close_text(self, data: dict[str, Any]) -> None:
        item_id = data.get("item_id")
        if self._current_generation and item_id:
            item = self._current_generation.messages.get(item_id)
            if item:
                item.text_ch.close()

    def _close_audio(self, data: dict[str, Any]) -> None:
        item_id = data.get("item_id")
        if self._current_generation and item_id:
            item = self._current_generation.messages.get(item_id)
            if item:
                item.audio_ch.close()

    def _handle_function_call_done(self, data: dict[str, Any]) -> None:
        if self._current_generation is None:
            logger.warning(
                "Qwen function call arrived but no active generation to attach it to: %s",
                data,
            )
            return
        item_id = data.get("item_id") or utils.shortuuid()
        tracked = self._current_generation.fnc_items.get(item_id, {})
        self._dispatch_function_call(
            item_id,
            data.get("call_id") or tracked.get("call_id"),
            data.get("name") or tracked.get("name"),
            data.get("arguments", ""),
            warn=False,
        )

    def _handle_output_item_done(self, data: dict[str, Any]) -> None:
        if self._current_generation is None:
            return
        item = data.get("item", {})
        item_type = item.get("type")
        if item_type == "message":
            # Close the message streams as soon as the message item is done.
            # Qwen holds the response open across a tool call, so waiting for
            # response.done would keep the TTS text stream open and Soniox
            # times out (408) waiting for text_end that never arrives.
            message = self._current_generation.messages.get(item.get("id"))
            if message:
                message.text_ch.close()
                message.audio_ch.close()
            return
        if item_type != "function_call":
            return
        self._dispatch_function_call(
            item.get("id") or utils.shortuuid(),
            item.get("call_id"),
            item.get("name"),
            item.get("arguments", ""),
        )

    def _dispatch_function_call(
        self,
        item_id: str,
        call_id: str | None,
        name: str | None,
        arguments: str,
        *,
        warn: bool = True,
    ) -> None:
        if self._current_generation is None:
            return
        if not call_id or not name:
            if warn:
                logger.warning(
                    "Qwen function call missing call_id/name: "
                    "item_id=%s call_id=%s name=%s",
                    item_id,
                    call_id,
                    name,
                )
            return
        if call_id in self._current_generation.dispatched:
            return
        self._current_generation.dispatched.add(call_id)
        logger.info(
            "Dispatching function call to executor: name=%s call_id=%s",
            name,
            call_id,
        )
        # Persist to the backend right now, before handing off to LiveKit's
        # tool executor: that executor task gets cancelled outright if the
        # speech turn is interrupted (TTS failure, spurious VAD), which would
        # otherwise silently drop the write.
        try:
            from tools import schedule_durable_tool

            schedule_durable_tool(name, arguments, call_id=str(call_id))
        except Exception:
            logger.exception(
                "failed to schedule durable webhook for %s call_id=%s",
                name,
                call_id,
            )
        # Don't force id=item_id: Qwen reuses item ids across message and
        # function_call items, which collides with an existing message in
        # LiveKit's chat context and raises "Item type mismatch". The id is
        # only LiveKit's internal key; call_id is what the protocol uses.
        self._current_generation.function_ch.send_nowait(
            llm.FunctionCall(
                call_id=call_id,
                name=name,
                arguments=arguments,
            )
        )

    def _finish_generation(self) -> None:
        if self._current_generation is None:
            return
        self._current_generation.message_ch.close()
        self._current_generation.function_ch.close()
        for item in self._current_generation.messages.values():
            item.text_ch.close()
            item.audio_ch.close()
        self._current_generation = None