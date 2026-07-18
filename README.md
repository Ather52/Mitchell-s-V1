# Mitchell's Fruit Farms Voice Agents

Two LiveKit agents for Mitchell's Fruit Farms, sharing one core (Qwen Omni
Realtime for STT+LLM, optional Soniox TTS for Urdu), ported from the
reference Retell AI flow configs:

- `agent_inbound.py` — "Ayesha" receptionist: greets callers, answers
  product questions, takes orders/trade inquiries, logs complaints and
  callback requests.
- `agent_outbound.py` — "Ayesha" sales caller: validates the owner,
  explains payment/discount policy, collects an order, handles objections,
  asks for feedback.

Both call real function-tools (`mitchells/tools.py`) that POST to
configurable webhook URLs instead of Retell's built-in HTTP tool nodes.

## Setup

Uses the same virtualenv and the same root `.env`/`.env.local` as the
existing `agent.py` (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`,
`DASHSCOPE_API_KEY`, `SONIOX_API_KEY`, etc. — see `mitchells/agent_core.py`).
Add the extra variables documented in `mitchells/.env.example` to that same
root `.env` file (webhook URLs + latency tuning knobs).

Install/upgrade dependencies from the repo root as usual:

```bash
pip install -r requirements.txt
```

## Running locally

Run each agent directly from inside this directory (same convention as the
root `agent.py`):

```bash
cd mitchells
python agent_inbound.py dev
python agent_outbound.py dev
```

## Telephony wiring (not automated by this repo)

This repo has no Twilio/SIP provisioning script. Telephony must be set up
manually in the LiveKit Cloud console (Telephony > Configuration) and/or
your SIP trunk provider, per LiveKit's SIP docs:

- **Inbound**: point your inbound SIP trunk's dispatch rule at
  `agent_name=mitchells-inbound`. Optionally pass `{"caller_phone": "..."}`
  as job metadata if your dispatch rule can set it; otherwise the agent
  falls back to the SIP participant's `sip.phoneNumber` attribute.
- **Outbound**: create an explicit dispatch with `agent_name=mitchells-outbound`
  and JSON metadata carrying the per-call dynamic variables, e.g.:

  ```bash
  lk dispatch create \
    --agent-name mitchells-outbound \
    --metadata '{"owner_name": "Ali", "shop_name": "Ali General Store", "customer_phone": "03001234567", "customer_city": "Lahore", "customer_type": "existing", "last_order": "Mango Jam 450g x24", "language_preference": "Urdu"}'
  ```

  Then dial out to the callee and add them as a SIP participant to the same
  room (via `create_sip_participant`), so the agent and the callee land in
  the same room.

## Latency notes

- `turn_detection=None` is set explicitly on the `AgentSession` since Qwen's
  realtime model already does server-side turn detection — this avoids
  loading an unused local turn-detector model at startup.
- The greeting nudge (`generate_reply(instructions=...)` in `on_enter`) no
  longer re-sends the full system prompt on top of itself. It used to
  concatenate the entire base instructions into every
  `generate_reply(instructions=...)` call, doubling the payload sent for the
  very first turn. The base instructions are already persisted once via
  `session.update` at connect time, so per-turn overrides now only send the
  short override text.
- The full product catalogue (~3.9k characters) is no longer inlined in the
  base instructions. It's now served on demand via the `get_product_catalogue`
  tool (`mitchells/tools.py`); the base prompt only carries a short category
  list (`PRODUCT_CATEGORIES_SUMMARY` in `prompts.py`). This cut the resident
  session instructions from ~14.6k to ~11k characters (inbound).
- `mitchells/qwen_omni_realtime.py` now logs timing at each step of the Qwen
  WS handshake (`Qwen WS connected in Xs`, `sending Qwen session.update (N
  chars)`, `Qwen session.updated received Xs after session.update sent`).
  If the agent still starts slowly, check these log lines first — they tell
  you whether the delay is in the WS connect, or in Qwen processing the
  session update, which points to either a network/region issue (try a
  different `DASHSCOPE_BASE_URL` region) or a still-too-large prompt.
- The internal "session not ready" timeout for the first reply was bumped
  from a hard 20s cutoff (which was silently failing and leaving the caller
  in dead air) to 45s, with a matching 60s overall response timeout. This
  doesn't reduce actual latency, but it means a slow-but-working session
  negotiation no longer aborts the greeting outright.
- If it's still slow after this, the next lever is trimming `GLOBAL_RULES`
  in `prompts.py` further, since it's still the largest remaining chunk
  (~5.5k characters) of the base instructions.

## Voice / accent notes

- The old default Soniox voice for Urdu (`Priya`, inherited from the shared
  root `.env`) is documented by Soniox itself as having a "natural Indian
  accent" — that's the "Hindi accent" you were hearing, not a bug in how
  Urdu text was generated. Mitchell's agents now read their own
  `MITCHELLS_SONIOX_TTS_VOICE` env var (default `Maya`, a voice with no
  stated regional accent) instead of falling back to the shared
  `SONIOX_TTS_VOICE`, so this doesn't affect the root `agent.py`/Marcus.
- Soniox has no voice explicitly labeled "Urdu"/"Pakistani". Picking a voice
  with no documented accent (Maya, Nina, Emma, Claire, Grace, Mina for
  female; Daniel, Noah, Jack, Adrian, Owen, Kenji for male) lets Soniox's
  Urdu language model drive pronunciation instead of a voice's baked-in
  accent identity. Try a couple of these and pick whichever sounds most
  natural for Urdu in your testing — see
  https://soniox.com/docs/tts/concepts/voices for the full list/descriptions.
- Truncated/garbled mid-sentence audio in testing (e.g. a greeting cut off
  after "Would you like") lines up with spurious VAD-triggered "user turns"
  in the console logs (e.g. transcripts like "嗯。" or "那不。" appearing from
  silence/background noise) that interrupt the agent mid-reply. This is a
  `console` mode + local mic/background-noise artifact — the VAD/ASR is
  picking up ambient sound and treating it as the user speaking, which
  cancels the in-progress TTS stream. A new `QWEN_VAD_THRESHOLD` env var
  (default `0.6`) is now exposed if you need to raise it for a noisy test
  environment; a real SIP/phone line is much less prone to this than a
  laptop mic in a room with background audio.

## Known simplifications vs. the reference Retell configs

- No DTMF "press 1 for English / 2 for Urdu" menu — language is asked for
  (inbound) or pre-set via `language_preference` metadata (outbound)
  instead, since this stack has no DTMF handling.
- No live SIP call transfer to a human — `Transfer_Call`-equivalent
  situations route to `log_callback_request` instead, since no SIP
  transfer code exists in this repo.
