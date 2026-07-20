# Mitchell's Fruit Farms — Voice AI Agent — Project Handoff

> **Status at handoff:** Backend + frontend deployed and working on the server.
> **The agent worker is DOWN** (Python 3.14 crash loop) and the server venv was
> deleted mid-debug, so the backend may also be down. See §19 "Current Project
> State" and §18 TODO before doing anything else.

---

## 1. Project Overview

### What it is
A voice AI agent system for **Mitchell's Fruit Farms Ltd.**, Pakistan's heritage
food manufacturer (established 1933, Lahore). The system places and receives
real phone calls in **Urdu and English**, talks to shopkeepers/distributors,
takes product orders, logs complaints and callbacks, and writes everything into
a Postgres database that a React admin portal reads.

Products: jams, squashes, ketchups, sauces, confectionery (Jubilee Chocolates,
Mango Jam, Happy Hearts, etc.).

### Business goal
Replace/augment a human sales desk with an AI voice agent that:
- **Outbound:** calls shop owners, pitches products, captures orders, applies
  discount/payment policy (COD gets a discount), asks for feedback.
- **Inbound:** answers distributor/customer calls, quotes prices from a
  catalogue, logs trade inquiries, complaints, and callback requests.

### End users
- **Callers:** Pakistani shopkeepers, distributors, retailers, wholesalers —
  mostly Urdu speakers who code-switch heavily into English for product and
  commerce words ("order", "carton", "rate", "COD", "mango jam").
- **Staff:** Mitchell's sales/ops team using the React admin portal to manage
  campaigns, contacts, view call logs, orders, complaints.

### Current development stage
**Mid-migration, actively being debugged in production.** The system originally
ran on **Retell AI**. We are migrating outbound calling to **LiveKit + Twilio
SIP**. Backend and frontend for that migration are deployed. The voice agent
itself is blocked by an environment issue on the server.

### High-level architecture

```
┌──────────────┐     HTTPS      ┌─────────────────────────────┐
│ React admin  │───────────────▶│ nginx (13.62.66.137:80)     │
│  (Vite SPA)  │                │  /new/     → static SPA     │
└──────────────┘                │  /v1-new/  → :8001 backend  │
                                │  /v1/      → :8000 old      │
                                └──────────┬──────────────────┘
                                           │
                                  ┌────────▼────────┐
                                  │ FastAPI backend │
                                  │  (uvicorn 8001) │
                                  └───┬──────┬──────┘
                                      │      │
                    ┌─────────────────┘      └──────────────┐
                    ▼                                       ▼
          ┌──────────────────┐                    ┌──────────────────┐
          │ Neon Postgres    │                    │ LiveKit Cloud    │
          │ (serverless)     │                    │ scout-x47l9ay3   │
          └──────────────────┘                    └────┬────────┬────┘
                    ▲                                  │        │
                    │ tool webhooks              dispatch    SIP trunk
                    │ (orders/complaints)              │        │
          ┌─────────┴──────────┐              ┌────────▼──┐  ┌──▼──────┐
          │ LiveKit Agent      │◀─────────────│  agent    │  │ Twilio  │
          │ (Python worker)    │              │  worker   │  │  PSTN   │
          │  Qwen Omni + Soniox│              └───────────┘  └────┬────┘
          └────────────────────┘                                  │
                                                            real phone
```

---

## 2. Overall Strategy

### The core migration decision: Retell AI → LiveKit + Twilio

**Why.** The backend was built around Retell AI (hence table/column names like
`retell_call_id`, routes under `/api/retell/`). The team wanted control over the
voice pipeline, model choice (Qwen for Urdu), and cost — so outbound calling was
moved to **LiveKit Agents** with a **Twilio SIP trunk** owned by LiveKit.

**Key insight that made this cheap:** *no Twilio credentials are needed in our
codebase.* The LiveKit **outbound trunk** object holds the Twilio SIP
username/password. Our backend only references the trunk by ID
(`SIP_OUTBOUND_TRUNK_ID`). No Twilio SDK, no account SID in our env.

**Rejected alternative:** calling Twilio's REST API directly and bridging media
ourselves. Rejected because LiveKit already solves SIP↔WebRTC bridging, agent
dispatch, and room lifecycle.

### Strategy: edit the existing endpoint, don't add a parallel one

When adding LiveKit outbound, the first implementation added a **new** endpoint
`POST /api/livekit/calls/start`. The user explicitly rejected this: the React
frontend already calls `POST /api/outbound/calls/start`, and they did not want a
frontend change.

**Decision:** delete the new endpoint; swap the *dial mechanism* inside the
existing `_dial_contact()` service method. The endpoint, its request/response
schemas, auth, and all campaign/contact logic stayed **byte-identical**. Only
`retell_service.create_phone_call(...)` → `livekit_service.place_outbound_call(...)`
changed.

**Benefit:** zero frontend churn, all existing campaign features (contacts,
recall scheduling, dynamic variables) keep working.
**Tradeoff:** the column `retell_call_id` now stores a **LiveKit room name**.
Ugly name, deliberate choice — avoids a schema migration and a frontend change,
and it makes tool webhooks link back to the right call automatically (see §9).

### Strategy: call duration must come from SIP participant events

**Problem discovered:** a LiveKit room is created *before* anyone answers and
lingers *after* the last participant leaves (`departure_timeout`, plus
`empty_timeout` if nobody joined). Using `room_started`→`room_finished` overstates
every call by up to a minute, and bills unanswered calls for their ring time.

**Notable:** LiveKit has **no official answer** for this.
[livekit/agents#3532](https://github.com/livekit/agents/issues/3532) asks exactly
this question and was closed unresolved.

**Decision:** bound the call by the **caller's own SIP participant**:

| Signal | Meaning |
|---|---|
| `participant.joined_at` | line connected (inbound) / dial start (outbound) |
| first `track_published` from the SIP participant | **media flowing = actually answered** |
| `participant_left` event `createdAt` | hangup |

The `track_published` row is subtle and important: `sip.callStatus` flips to
`active` on answer, but **attribute changes emit no webhook**. First media is the
only webhook-visible answer signal for outbound.

### Design philosophy adopted during this work
- **Verify, don't assume.** Multiple hypotheses in this project were confidently
  wrong and only caught by testing (see §16). Always reproduce before fixing.
- **Files on disk ≠ running process.** Hours were lost to this. `git pull`
  does not reload a running Python process.
- **Prefer the official plugin.** Every bug fixed in this project lived in a
  hand-rolled adapter (`qwen_omni_realtime.py`); none were in LiveKit's
  maintained plugins.

---

## 3. Current Architecture

### Frontend
- **React + Vite SPA** (`frontend/`), React Router v6 (`createBrowserRouter`),
  axios, tailwind, react-hot-toast.
- Served as **static files by nginx** at `/new/` from `/var/www/mitchell-v1-new/`.
  There is **no Node process** — nothing to "restart"; deploying = copying files.
- Built with `--base=/new/`; router `basename` derives from `import.meta.env.BASE_URL`.
- API base from `VITE_BASE_URL`, **baked at build time** (must rebuild to change).

### Backend
- **FastAPI + uvicorn**, `backend/main.py`, port **8001** on the server.
- Routers mounted under `/api/*`: `auth`, `retell`, `settings`, `menu`,
  `prompts`, `outbound`, `livekit`.
- `root_path` from `ROOT_PATH` env so Swagger works behind the `/v1-new` prefix.
- Async SQLAlchemy 2.x, `asyncpg`, `NullPool`.

### Database
**Neon serverless Postgres** (`ep-rough-bird-at7lw5qd-pooler.c-9.us-east-1.aws.neon.tech`),
PostgreSQL **18.4**. Schema created by `Base.metadata.create_all` in `init_db()`
plus a hand-rolled sequential migration list (see §9).

### Authentication
JWT (`python-jose`), `passlib`/`bcrypt`. `get_current_user` dependency guards
outbound and admin routes. `SECRET_KEY`, `ALGORITHM`,
`ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` in backend env.

### Voice pipeline (the agent)
```
caller audio ──▶ Qwen Omni Realtime (WebSocket, DashScope)
                   ├── STT (qwen3-asr-flash-realtime)
                   ├── LLM (qwen3.5-omni-flash-realtime)
                   └── server-side VAD (turn detection)
                          │
                     text response
                          │
                          ▼
                   Soniox TTS (Urdu, voice "Maya") ──▶ caller
```
- **Cascaded mode** (Soniox): `audio_output=False` on the Qwen model; Qwen emits
  text, Soniox speaks it. Used when `SONIOX_API_KEY` is set.
- **Native mode**: if `SONIOX_API_KEY` is absent, `audio_output=True` and Qwen
  speaks directly with its own voice (`QWEN_TTS_VOICE`, default `Evan`).
  **Removing the Soniox key silently switches modes** — this confused debugging.

### LLM / model details
- Provider: **Alibaba DashScope** (`dashscope-intl.aliyuncs.com`), OpenAI-Realtime-
  compatible WebSocket API.
- Model: `qwen3.5-omni-flash-realtime`.
- Adapter: **`qwen_omni_realtime.py`** — ~750 lines of hand-written code
  implementing LiveKit's `llm.RealtimeModel` / `RealtimeSession` against
  DashScope. **This file is where every voice bug in this project lived.**

### Third-party services
| Service | Purpose | Credential |
|---|---|---|
| LiveKit Cloud | agent dispatch, SIP, rooms, webhooks | `LIVEKIT_URL/API_KEY/API_SECRET` |
| Twilio | PSTN trunk (held *inside* LiveKit trunk) | none in our code |
| DashScope (Qwen) | STT + LLM | `DASHSCOPE_API_KEY` |
| Soniox | Urdu TTS | `SONIOX_API_KEY` |
| Deepgram | evaluated, **not wired in** | `DEEPGRAM_API_KEY` |
| Neon | Postgres | `DATABASE_URL` |
| Retell AI | legacy, still referenced | `RETELL_API_KEY` |
| Clover | POS integration (legacy) | `CLOVER_*` |

### Deployment / infrastructure
- **AWS EC2**, Ubuntu (codename **"resolute"** — very new; ships **Python 3.14**
  as system python, has **no python3.12** in its repos), host `ip-172-31-19-9`,
  public IP **13.62.66.137**.
- **nginx** reverse proxy on :80 (no SSL yet).
- **systemd** services (see §14).
- **Two backends coexist:** `/v1/` → :8000 (old Retell-era), `/v1-new/` → :8001 (new).

### Environment separation
| Consumer | Env file | Loaded by |
|---|---|---|
| Backend | `backend/.env` | `load_dotenv()` with `WorkingDirectory=backend` |
| Agents | `<repo root>/.env`, `.env.local` | `agent_core.py` via `Path(__file__).parent` |
| Agents (planned) | `agents.env` | systemd `EnvironmentFile=` |
| Frontend | `frontend/.env` | Vite **at build time** |

These are already separate files — the agent never reads `backend/.env`.

---

## 4. Repository Structure

**Repo:** `https://github.com/Ather52/Mitchell-s-V1.git`
**Active branch:** `feature/webhookandoutboundcalls`
**Server checkout:** `/home/ubuntu/mitchell-v1-new`
**Local checkout:** `D:\Artificizen\Mitchell-s-V1`

```
Mitchell-s-V1/
├── agent_core.py          # shared agent: session, TTS, greeting cache, SIP wait
├── agent_inbound.py       # inbound entrypoint, agent_name=mitchells-inbound
├── agent_outbound.py      # outbound entrypoint, agent_name=mitchells-outbound
├── qwen_omni_realtime.py  # ⚠ custom Qwen Realtime adapter — all voice bugs here
├── prompts.py             # GLOBAL_RULES, INBOUND_PROMPT, OUTBOUND_PROMPT, catalogue
├── tools.py               # @function_tool defs + durable webhook POSTs
├── requirements.txt       # AGENT deps
├── backend/
│   ├── main.py            # FastAPI app, router mounts, lifespan, root_path
│   ├── requirements.txt   # BACKEND deps
│   └── src/
│       ├── api/
│       │   ├── auth/      │ login/register/refresh/me
│       │   ├── retell/    │ tool webhooks + call logs + orders + Clover
│       │   ├── outbound/  │ campaigns, contacts, calls  ← FRONTEND CALLS THIS
│       │   ├── livekit/   │ ★ NEW: LiveKit webhook receiver
│       │   ├── menu/ settings/ prompts/
│       ├── services/
│       │   ├── livekit_service.py  ★ NEW: outbound dial via LiveKit SIP
│       │   ├── retell_service.py   legacy dial
│       │   ├── clover_service.py, auth_service.py
│       └── utils/
│           ├── db.py      # ALL models + init_db() + migration list
│           ├── db_functions.py, dependencies.py, jwt_handler.py
└── frontend/
    ├── src/App.jsx        # router + basename fix
    ├── src/api/interceptor.js  # axios baseURL = VITE_BASE_URL
    ├── src/api/api.js     # "/auth/login", "/outbound/calls/start", ...
    └── vite.config.js     # port 3000, no `base` (passed via --base flag)
```

### Related but separate repo
`D:\Artificizen\Scout Project\livekit\persona_agent.py` — a **different product**
("Alex" persona agent) that shares the **same LiveKit project** and caused a
production incident (see §15, bug 5).

### Commit history (branch `feature/webhookandoutboundcalls`)
```
da72192  ruoting fix                 ← root_path + router basename
59616cc  fixes
c320750  added the webhook and outbound calling and fixed the tool calls
         and sonoix failure          ← the big one
da7ac43  backend connectivity fixed
739d553  Backend response sends
3256e50  Initial project setup
```
**Working tree is clean at `da72192`.** Everything is committed and pushed.

---

## 5. Every Feature We Built

### 5.1 Outbound calling via LiveKit + Twilio SIP
- **Purpose:** place real outbound sales calls from the admin UI.
- **Implementation:** `livekit_service.place_outbound_call()` creates the **agent
  dispatch first**, then the SIP participant. Order matters — if the callee
  answers before a worker is assigned, they hear silence.
  `wait_until_answered=False` so the HTTP request doesn't block for the ring.
- **Status:** ✅ Backend verified working end-to-end (a real call to
  +923451452451 connected and was answered). ⚠ Blocked now by the agent crash.
- **Limitations:** no retry logic; no concurrency cap; `campaign.agent_id`
  (a Retell agent id) is now unused.

### 5.2 LiveKit webhook receiver + call timing
- **Purpose:** record true call duration, outcome, ring time.
- **Implementation:** `POST /api/livekit/webhook`, JWT+SHA256 verified via
  `livekit.api.WebhookReceiver`. Raw body required for signature. Events stored
  verbatim in `livekit_call_events` with a **UNIQUE `event_id`** for idempotency
  (LiveKit retries and gives no delivery guarantee). `num_dropped` logged.
- **Status:** ✅ Deployed, returning 200 for real events. ⚠ Duration not yet
  confirmed populating (agent down, so no real calls).
- **Verified scenarios** (unit-tested against synthetic events):

  | Scenario | Result |
  |---|---|
  | Inbound answered | `caller_hung_up`, 60s (not 85s room span) |
  | Outbound answered | `caller_hung_up`, ring 8s, talk 60s |
  | Outbound no answer | `no_answer`, **0s** (not 30s of ringing) |
  | Agent `end_call` | `agent_ended`, `ROOM_DELETED` |
  | Nobody joined | `no_answer`, 0s |

### 5.3 Tool calling (order/complaint/callback/feedback logging)
- **Purpose:** the agent writes real records mid-call.
- **Tools:** `get_product_catalogue`, `log_trade_inquiry`, `log_complaint`,
  `log_callback_request`, `log_customer_feedback`, `end_call`.
- **Durable write design** (pre-existing, excellent): `schedule_durable_tool()`
  fires the webhook **at dispatch time**, before LiveKit's tool executor runs,
  because that executor is cancelled if the speech turn is interrupted.
  `_start_durable_webhook` dedupes by payload key; `_post_webhook` uses
  `asyncio.shield`. This design **saved real data** when the executor crashed.
- **Status:** ✅ Verified working — a real order produced
  `inquiry_id=3d4b9a86-4cad-4203-9ee2-92172d6a48b5` in Postgres.

### 5.4 React admin portal
Campaigns, contacts (+CSV import), call list/detail, orders, complaints, menu,
settings, agents, reports. Auth-gated. **Status:** ✅ deployed at `/new/`.

### 5.5 Agent prompts (Urdu/English bilingual)
`GLOBAL_RULES` (~8k chars) + `INBOUND_PROMPT` / `OUTBOUND_PROMPT` (~7.5k each)
+ `PRODUCT_CATALOGUE` (served on demand via tool, not inlined).
**Status:** ⚠ Working but has known defects — see §7 and §15 bug 6.

---

## 6. Everything Already Implemented (with detail)

### `qwen_omni_realtime.py` — four real bug fixes
1. **Message streams close on `response.output_item.done`** (not `response.done`).
   Qwen holds the response open across a tool call, so waiting for `response.done`
   left the TTS text channel open → Soniox never got `text_end` → **HTTP 408**.
   This matches LiveKit's official OpenAI plugin behaviour.
2. **Removed the explicit `response.create`** after `function_call_output`, and set
   `auto_tool_reply_generation=True`. Qwen resumes the response itself; sending
   `response.create` returns `"Conversation already has an active response"`,
   which is **fatal** and killed the session. Note `False` would make LiveKit fire
   its *own* `_realtime_reply_task` — a second rejected `response.create`.
3. **Don't pass `id=` to `llm.FunctionCall`.** Qwen reuses item ids across message
   and function_call items; forcing the id collided with an existing message in
   LiveKit's chat context → `ValueError: Item type mismatch: function_call != message`,
   which crashed `_execute_tools_task` so the **tool result never returned to the
   model** (the agent then *guessed* that the order was saved).
4. **`_on_main_task_done` callback.** `_main_task` was launched with no done
   callback, so a DashScope WS failure was swallowed by the task object — the
   agent greeted the caller then went **permanently deaf with zero log output**.
   Now logs `Qwen realtime session died…` and emits a non-recoverable
   `RealtimeModelError`.

Also present: `_dispatch_function_call` with `call_id` dedupe, `_handle_output_item_done`,
`fnc_items` name tracking, and the `schedule_durable_tool` graft placed **after**
the dedupe guard so it fires exactly once.

### `livekit_service.py`
`place_outbound_call()`, `AGENT_METADATA_KEYS`, `is_livekit_call_id()`
(room names start with `outbound-`), `outbound_agent_name()`.
**Verified:** `AGENT_METADATA_KEYS` exactly matches `agent_outbound.DYNAMIC_VAR_KEYS`
— no missing, no extra keys.

### `outbound/service.py`
- `_dial_contact()` now dials via LiveKit; stores room name in `retell_call_id`.
- **`sync_call_status()` guard**: returns early for LiveKit call ids. Without it,
  the frontend's sync button would send a room name to Retell, get a 404, and the
  existing 404 branch would mark a **healthy live call as `failed`**.

### `backend/main.py`
`root_path=os.getenv("ROOT_PATH", "")` so Swagger fetches
`/v1-new/openapi.json` instead of `/openapi.json` (which returned HTML → the
"not a valid version field" parser error).

### `frontend/src/App.jsx`
```js
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
createBrowserRouter([...], { basename: BASENAME });
```
Verified: `/` → `/`, `/new/` → `/new`, `/new` → `/new`.

### `Scout Project/livekit/persona_agent.py`
Added `agent_name=_env("PERSONA_AGENT_NAME", "scout-persona")`.

---

## 7. Everything Still Pending

### 🔴 HIGH
1. **Agent crash loop on Python 3.14** — *the blocker*. Nothing voice-related
   works. See §15 bug 11 and §18.
2. **Server venv was deleted** (`rm -rf venv`) and `python3.12` was not available,
   so the venv does not exist. The backend shares this venv → backend likely down.
3. **Restart discipline** — agents must be restarted after every `git pull`.
4. **Verify duration actually populates** once real calls flow.

### 🟡 MEDIUM
5. **VAD fragmentation** — the true cause of the repetition (see §21). Try
   `QWEN_VAD_THRESHOLD` 0.6 → 0.8 first (one env var), then consider a cascaded
   pipeline with silero VAD + LiveKit's turn detector.
6. **Owner-validation prompt gate** ([prompts.py:399]) has no branch for a plain
   "yes" — it re-asks forever. Needs a fallback exit.
7. **Numbers rule contradiction** in `GLOBAL_RULES` (~line 73): "never use Urdu
   number words" vs "prices → `ایک ہزار چار سو روپے`". Impossible to satisfy.
8. **Backend latency**: a trade-inquiry webhook took **10.4 s**. Suspect `NullPool`
   opening a fresh Neon connection per request + several sequential queries.
9. **`PYTHONUNBUFFERED=1`** on services so logs flush in real time.
10. **No SSL** — plain HTTP on 13.62.66.137.

### 🟢 LOW
11. Deepgram STT swap (evaluated, not justified yet — see §21).
12. Retire the old `/v1/` + :8000 backend and the old root SPA build.
13. Per-job logging context (concurrent calls interleave unreadably).
14. `feedback-log` had no route originally — now exists; keep in sync.
15. Rotate the LiveKit API secret that was pasted into chat.

---

## 8. Important Decisions Made

### D1 — Edit the existing endpoint instead of adding one
- **Problem:** new `/api/livekit/calls/start` duplicated `/api/outbound/calls/start`.
- **Decision:** delete it; swap the dial inside `_dial_contact`.
- **Benefit:** no frontend change; campaigns/contacts/recall all still work.
- **Tradeoff:** `retell_call_id` now holds a LiveKit room name.

### D2 — Room name as the universal call id
- **Problem:** tool webhooks and call records needed a shared key.
- **Decision:** `call_id = room name` (`outbound-<hex>`); `tools.py` already posts
  `call_id = room.name`.
- **Benefit:** `_resolve_retell_call_id` links a logged order to its call for free.

### D3 — Duration from SIP participant events, not room events
See §2. Benefit: unanswered calls bill 0s. Tradeoff: needs `track_published`,
which is subtler than reading room timestamps.

### D4 — Idempotency via UNIQUE `event_id`
- **Problem:** LiveKit retries webhooks; no delivery guarantee.
- **Decision:** unique index on `event_id`; duplicates are no-ops returning 200.
  Non-2xx (500) is returned on transient DB errors so LiveKit retries safely.

### D5 — Name the persona agent
- **Problem:** an unnamed worker auto-dispatches to **every room in the project**.
- **Decision:** `agent_name="scout-persona"`.
- **Tradeoff:** the Scout React demo relies on auto-dispatch and will now sit
  silent until its token route requests the agent explicitly, or Scout moves to
  its own LiveKit project (**recommended long-term**).

### D6 — Keep Soniox rather than swap to Deepgram
Soniox is the **official LiveKit plugin** and was never the bug; the 408 came from
our adapter starving it. Deepgram Nova-3 does support Urdu, but it's monolingual
(the `multi` mode excludes Urdu) and wouldn't fix the real problem (VAD
fragmentation).

### D7 — Env-driven `root_path` / `basename` rather than hardcoding
Both derive from env/build config so local (`/`) and server (`/v1-new`, `/new`)
work from one codebase.

---

## 9. Database Design

**Tables** (`backend/src/utils/db.py`):
`users`, `callers`, `call_logs`, `agent_settings`, `orders`, `menu_categories`,
`menu_items`, `menu_specials`, `prompts`, `clover_item_map`, `trade_inquiries`,
`export_inquiries`, `complaints`, `callback_requests`, `outbound_campaigns`,
`outbound_contacts`, `outbound_calls`, **`livekit_call_events`** ★new.

### `call_logs` (central record)
Existing: `call_id` (UNIQUE), `caller_phone`, `customer_name`, `call_status`,
`direction`, `recording_url`, `transcript`, `call_summary`, `order_booked`,
`duration_ms`, `start_timestamp`, `end_timestamp`, `raw_payload`,
`customer_feedback`, `feedback_rating`, `recall_at`, …

**Columns added for LiveKit telephony:**
`room_sid`, `sip_call_id`, `trunk_phone_number`, `disconnect_reason`,
`answered_timestamp`, `ring_ms`, `room_started_timestamp`, `room_finished_timestamp`.

Relationship: `order_details` → `Order` via `Order.call_id == CallLog.call_id`
(`lazy="selectin"`).

### `livekit_call_events` ★ new
| Column | Purpose |
|---|---|
| `event_id` | LiveKit's UUID, **UNIQUE** → idempotency |
| `event_type` | indexed |
| `room_name` | indexed; = `call_id` |
| `room_sid`, `participant_identity`, `participant_kind` | context |
| `event_time` | LiveKit's timestamp (**use this for ordering**, not receive time) |
| `num_dropped` | non-zero ⇒ gap, derived state may be incomplete |
| `payload` | raw JSON, verbatim |

### Migration status
**No Alembic.** `init_db()` runs `Base.metadata.create_all` then a sequential list
of raw `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements, each wrapped in a
savepoint with a bare `except: pass`. New columns were appended to that list.
These statements are **Postgres-specific** (`IF NOT EXISTS`, `TIMESTAMPTZ`) — a
SQLite fallback would silently skip them.

---

## 10. APIs

### Frontend-facing (unchanged contract)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | – | 422 on bad payload = route alive |
| POST | `/api/auth/register`, `/refresh`, `/forgot-password`, `/reset-password` | – | |
| GET | `/api/auth/me` | JWT | |
| POST | **`/api/outbound/calls/start`** | JWT | ★ now dials via LiveKit |
| GET/POST/PUT | `/api/outbound/campaigns[/{id}][/stats][/contacts][/start]` | JWT | |
| POST | `/api/outbound/campaigns/{id}/contacts/import` | JWT | CSV |
| GET/POST | `/api/outbound/calls[/{id}][/sync]` | JWT | sync no-ops for LiveKit ids |
| GET | `/api/retell/calls`, `/stats`, `/orders`, `/complaints`, `/callers` | JWT | |
| GET/POST | `/api/menu/*`, `/api/settings/*`, `/api/prompts/*` | JWT | |

### Tool webhooks (called by the **agent**)
| Path | Tool |
|---|---|
| `POST /api/retell/trade-inquiry` | `log_trade_inquiry` |
| `POST /api/retell/complaint-log` | `log_complaint` |
| `POST /api/retell/callback-request` | `log_callback_request` |
| `POST /api/retell/feedback-log` | `log_customer_feedback` |

Response shape: `{"inquiry_id": "...", "message": "..."}`. `tools.py` surfaces
the id back to the model.

### LiveKit webhook
`POST /api/livekit/webhook` — no JWT auth; **LiveKit signature** (Authorization
header JWT containing a SHA-256 of the raw body).
- `200` ok / duplicate
- `401` verification failed
- `500` transient DB error → LiveKit retries (safe via `event_id` dedupe)
- Returns `200` if keys are unset (so an unconfigured server doesn't loop retries)

Public URL: `http://13.62.66.137/v1-new/api/livekit/webhook`

---

## 11. Background Jobs
- **Recall scheduler**: `start_recall_scheduler()` launched in the FastAPI
  lifespan; logs `"Recall scheduler started"`. Uses `outbound_contacts.recall_at`
  / `call_logs.recall_at`.
- **Campaign runner**: `start_campaign` → `asyncio.create_task(self._run_campaign_calls(...))`
  — an in-process asyncio task, **not** a real queue. Dies with the process.
- **Durable webhook tasks** (agent side): `asyncio.ensure_future` + `asyncio.shield`,
  deduped by payload key, tracked in `_pending_webhook_tasks`.
- **No Celery/Redis/RQ.** No cron. No retry/backoff beyond LiveKit's own webhook retries.

---

## 12. AI Components

### Model stack
- **STT + LLM:** Qwen Omni Realtime via DashScope WebSocket.
  `qwen3.5-omni-flash-realtime`, transcription `qwen3-asr-flash-realtime`.
- **TTS:** Soniox `tts-rt-v1`, language `ur`, voice **Maya**.
  *Note:* the previous default `Priya` is documented by Soniox as having a
  "natural Indian accent" — that was the "Hindi accent" complaint, not a bug.
- **Turn detection:** Qwen **server-side VAD** (`server_vad`), threshold
  `QWEN_VAD_THRESHOLD=0.6`, silence 600 ms, prefix padding 400 ms.
  `AgentSession(turn_detection=None)` because Qwen already does it.

### Tool calling
LiveKit `@function_tool` defs in `tools.py`; schemas sent to Qwen in a **flat**
shape (`{type, name, description, parameters}`) — the nested Chat-Completions
shape is silently ignored by DashScope.

### Prompting
`GLOBAL_RULES` covers: tool-execution-is-mandatory, language lock, Urdu script
rule, feminine verb forms, English loanword list, numbers, spoken quantity
format, email format, person names in Latin script, retry rule, fallback lines,
punctuation-as-delivery, brevity, and tool usage.

### Known prompt defects
- **Retry rule** says *"repeat the SAME scripted line again verbatim"* → with bad
  ASR input this produces the repetition loop.
- **Owner-validation gate** has only three branches (confirmed / wrong number /
  owner busy) — a plain "yes" matches none, so it re-asks forever.
- **Numbers rule self-contradiction** (see §7.7).

### Fallbacks / resilience
- Tool failures return a spoken apology string, not an exception.
- Greeting audio cached to disk (`.greeting_cache/*.mp3`, sha256 of text).
- `SESSION_READY_TIMEOUT_S=45`, `RESPONSE_TIMEOUT_S=60`.
- Qwen WS death now surfaces as a non-recoverable `RealtimeModelError`.

### Deepgram evaluation (not wired in)
Plugins installed locally only. Measured on identical audio:

| Input | Qwen | Deepgram `ur` | Deepgram `multi` |
|---|---|---|---|
| Clean 16 kHz | correct (Devanagari) | correct (Urdu script) | – |
| 8 kHz μ-law telephony | **correct** | correct | correct, keeps English in Latin |

**Conclusion:** Qwen's ASR is *not* broken. `language_type` has **zero** effect on
transcription (verified `auto`/`ur`/`Urdu` produce byte-identical output; DashScope
doesn't even validate the field — it accepts `"Klingon"`).

---

## 13. External Integrations

### LiveKit Cloud — project `scout-x47l9ay3`
```
OUTBOUND trunk  ST_2VH2wvsEU5w4  → +18608544754 via callingai1.pstn.twilio.com
INBOUND  trunk  ST_pTXxRA62Wt2w  → +18608544754
DISPATCH rule   SDR_8FQjgkuzSGfL → agent: mitchells-inbound
```
**Critical history:** `.env` originally pointed at `testing-xp0ybjpm`, a project
with **zero trunks and zero dispatch rules** — that is why SIP never worked. All
telephony lives in Scout.

Agent names: `mitchells-inbound`, `mitchells-outbound`, `marcus`, `scout-persona`
— **all explicit-dispatch only** (no unnamed workers remain in the project).

SIP participant attributes used: `sip.callID`, `sip.callStatus`
(`dialing|ringing|active|automation|hangup`), `sip.phoneNumber`, `sip.ruleID`
(**only set for inbound** → used to infer direction), `sip.trunkPhoneNumber`.

`DisconnectReason` → outcome mapping:
`CLIENT_INITIATED→caller_hung_up`, `USER_UNAVAILABLE→no_answer`,
`USER_REJECTED→declined`, `SIP_TRUNK_FAILURE→trunk_failure`,
`ROOM_DELETED→agent_ended`, plus `SERVER_SHUTDOWN`, `PARTICIPANT_REMOVED`,
`CONNECTION_TIMEOUT`, `MEDIA_FAILURE`, `AGENT_ERROR`, `ROOM_CLOSED`.

### Twilio
Reached **only** through the LiveKit trunk. No credentials in this repo.

### Neon Postgres
Serverless; auto-suspends. **A VPN on the dev machine broke TLS to Neon**
(TCP connected, session reset) — see §16.

---

## 14. Deployment

### Server
AWS EC2, Ubuntu "resolute", `13.62.66.137`, user `ubuntu`,
repo at `/home/ubuntu/mitchell-v1-new`.

### nginx — `/etc/nginx/sites-enabled/default`
```nginx
server {
    listen 80 default_server;
    server_name _;

    location /v1-new/ { proxy_pass http://127.0.0.1:8001/; ... }   # new backend
    location /v1/     { proxy_pass http://127.0.0.1:8000/; ... }   # old backend
    location /new/ {                                               # new SPA
        alias /var/www/mitchell-v1-new/;
        try_files $uri $uri/ /new/index.html;
    }
    location / { return 302 /new/; }        # ← everything else → new UI
}
```
The **trailing slash** on `proxy_pass` strips the `/v1-new` prefix, so
`/v1-new/api/auth/login` reaches the app as `/api/auth/login`.

**Pending nginx change (recommended):**
`proxy_set_header Authorization $http_authorization;` in the `/v1-new/` block —
the webhook's signed JWT arrived **empty**.

### systemd services
| Service | Purpose |
|---|---|
| `mitchell-8001.service` | backend, port 8001 |
| `mitchell-agent-inbound-new.service` | inbound agent |
| `mitchell-agent-outbound-new.service` | outbound agent |

Backend unit essentials:
```ini
WorkingDirectory=/home/ubuntu/mitchell-v1-new/backend
Environment="PATH=/home/ubuntu/mitchell-v1-new/venv/bin"
ExecStart=/home/ubuntu/mitchell-v1-new/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001
StandardOutput=append:/home/ubuntu/mitchell-v1-new/logs/backend-8001.log
StandardError=append:/home/ubuntu/mitchell-v1-new/logs/backend-8001-error.log
```
**Logs go to files, not journald** — `journalctl` shows only start/stop lines.
`tail -f /home/ubuntu/mitchell-v1-new/logs/backend-8001.log`.

### Frontend deploy
```bash
cd ~/mitchell-v1-new/frontend
# .env: VITE_BASE_URL=/v1-new/api
npm run build -- --base=/new/
sudo cp -r dist/* /var/www/mitchell-v1-new/
# then HARD refresh (Ctrl+Shift+R) — index.html is cached
```

### Environment variables
**backend/.env:** `DATABASE_URL`, `SECRET_KEY`, `ROOT_PATH=/v1-new`,
`LIVEKIT_URL/API_KEY/API_SECRET`, `SIP_OUTBOUND_TRUNK_ID=ST_2VH2wvsEU5w4`,
`CORS_ORIGINS`, plus legacy `RETELL_*`, `CLOVER_*`, `SMTP_*`.
**agent env:** `DASHSCOPE_*`, `QWEN_*`, `SONIOX_*`, `MITCHELLS_SONIOX_TTS_VOICE`,
`LIVEKIT_*`, the four `*_WEBHOOK_URL`s, `MITCHELLS_{IN,OUT}BOUND_AGENT_NAME`.
**frontend/.env:** `VITE_BASE_URL=/v1-new/api` (build-time only).

### Not present
No Docker, no PM2, no CI/CD, no SSL, no monitoring/alerting.

---

## 15. Bugs We Encountered

1. **Soniox TTS 408 after every tool call.** *Cause:* message streams closed only
   at `response.done`, which Qwen delays across the tool call → `text_end` never
   sent. *Fix:* close on `response.output_item.done`. *Lesson:* mirror the
   official plugin.
2. **`Conversation already has an active response` (fatal).** *Cause:* explicit
   `response.create` after `function_call_output`. *Fix:* remove it +
   `auto_tool_reply_generation=True`.
3. **`ValueError: Item type mismatch: function_call != message`.** *Cause:*
   passing `id=item_id` to `llm.FunctionCall`. *Fix:* omit it. *Impact:* the tool
   result never reached the model, so the agent **claimed** an order was saved
   without knowing — violating its own prompt rule.
4. **Silent Qwen WS death.** *Cause:* `_main_task` had no done callback. *Symptom:*
   greeting plays, then permanent deafness, **no logs**. *Fix:* `_on_main_task_done`.
5. **A second agent talked over the caller.** *Cause:* `persona_agent.py`
   registered with **no `agent_name`** → auto-dispatch into every room in the
   shared project. *Fix:* `agent_name="scout-persona"` + stop the process.
   *Lesson:* never run an unnamed worker in a project that carries SIP traffic.
6. **Outbound agent repeated its greeting forever.** *Cause:* console mode passes
   no dispatch metadata → `owner_name` falls back to `"there"` → the validation
   gate can never be satisfied. Also wrote `customer_name="there"`,
   `company_name="your shop"` into the DB.
7. **Swagger "not a valid version field".** *Cause:* no `root_path`; Swagger
   fetched `/openapi.json` and got HTML. *Fix:* `ROOT_PATH=/v1-new`.
8. **Login 404 on the server.** *Cause:* `VITE_BASE_URL` missing `/api`.
9. **UI kept falling back to the old build.** *Cause:* React Router had no
   `basename`, so routes dropped `/new` and hit nginx `location /` (old SPA).
   *Fix:* basename from `BASE_URL` + nginx `return 302 /new/`.
10. **Webhook 401.** *Cause:* the Authorization JWT arrived **empty**
    (`rsplit(b".", 1)` → 1 part). *Not* a key mismatch. *Fix (pending):* forward
    the header in nginx; note LiveKit's dashboard "test event" may be unsigned.
11. **🔴 Agent crash loop — `DuplexClosed` / `ConnectionResetError [Errno 104]`.**
    *Cause:* **Python 3.14** changed the default multiprocessing start method
    (`fork` → `forkserver`); LiveKit's worker IPC relies on `fork`.
    *Evidence:* `av` and `numpy` import fine on 3.14, so it is **not** a missing
    wheel. *Fix options:* force `multiprocessing.set_start_method("fork", force=True)`
    at the top of both agent entrypoints, **or** use Python ≤3.13.
    **STILL OPEN.**
12. **Urdu log lines silently destroyed.** *Cause:* Windows console `cp1252` →
    `UnicodeEncodeError` → Python dropped the whole log record (6 turns lost in
    one call). *Fix:* `PYTHONIOENCODING=utf-8`.
13. **Neon DB unreachable / DNS failures.** *Cause:* a **VPN** on the dev machine.
    Broke Neon, LiveKit, Soniox and DashScope in one session.
14. **nginx duplicate default server.** *Cause:* the backup was saved as
    `sites-enabled/default.bak`, and nginx's `include sites-enabled/*` has no
    extension filter.

---

## 16. Things We Should Never Do Again

1. **Never trust a probe that assumes its own conclusion.** The first tool-call
   "fix" was built on synthetic events with `name` stripped out. The real Qwen
   event **does** include `name` — the original code would have worked. Always
   test with a captured real payload.
2. **Never claim a fix without reproducing the failure first.** Three hypotheses
   (missing `name`, `language_type`, telephony audio degradation) were all
   disproven by measurement.
3. **Never assume `git pull` deploys anything.** A running process keeps old code
   in memory. Hours were lost to this — with the backend, then nearly again with
   the agent. **Restart is part of deploying.**
4. **Never run an unnamed LiveKit worker in a project that has SIP trunks.**
5. **Never put nginx backups in `sites-enabled/`** (or `sites-available/`).
6. **Never prescribe `rm -rf venv` before verifying the replacement exists.**
   `python3.12` was not in the repos; the venv was destroyed and the backend
   (which shares it) went down with it. **Verify the target, then remove.**
7. **Never debug voice logs through a non-UTF-8 pipe.**
8. **Never leave a VPN on while debugging network issues** — it produced four
   unrelated-looking failures.
9. **Never `session.say()` and assume the agent works** — the greeting uses TTS
   only and proves nothing about the LLM/ASR path.
10. **Don't hand over snippets when asked for the whole file.** It wasted cycles
    on the nginx config.

---

## 17. Coding Standards

From the project's standing rules and observed style:
- **Minimal, localized changes.** Prefer editing the existing function over
  adding a parallel path.
- **PEP 8**, 79-column soft limit.
- **No emojis in code.** Comments only where they explain *why*, especially
  non-obvious protocol behaviour (the adapter is heavily commented for this reason).
- **No new dependencies without cause.**
- Backend layering: `router → service → repository → db`. Routers stay thin.
- Naming: `snake_case` Python, `PascalCase` React components, kebab-case URLs,
  services suffixed `_service.py`.
- Errors: raise `HTTPException` with a clear `detail`; catch broad exceptions at
  integration boundaries and degrade gracefully (tools return a spoken apology).
- Logging: module-level `logging.getLogger("mitchells.<area>")`;
  loggers `mitchells-agent`, `mitchells-qwen`, `mitchells-tools`, `mitchells.livekit`.
- **Testing:** no formal suite. Verification was done with throwaway probe
  scripts driving real event sequences — keep doing this for protocol code.

---

## 18. Current TODO List

### ✅ Completed
- [x] LiveKit outbound dial inside the existing `/api/outbound/calls/start`
- [x] Removed the duplicate `/api/livekit/calls/start`
- [x] `sync_call_status` guard for LiveKit ids
- [x] `POST /api/livekit/webhook` + signature verification + idempotency
- [x] `livekit_call_events` table + 8 `call_logs` timing columns
- [x] Four `qwen_omni_realtime.py` fixes (408, fatal response.create, id collision, silent WS death)
- [x] `persona_agent` given an `agent_name`
- [x] `.env` repointed to the Scout LiveKit project + trunk id
- [x] `root_path` (Swagger) and router `basename` (SPA routing)
- [x] nginx: root → 302 `/new/`
- [x] Backend deployed and verified on 8001 (69 routes, livekit route live)
- [x] Frontend rebuilt with `VITE_BASE_URL=/v1-new/api` and deployed
- [x] Agent systemd services created (`mitchell-agent-{in,out}bound-new`)

### 🔄 In Progress / 🔴 Blocked
- [ ] **BLOCKED:** agent crash loop (Python 3.14 multiprocessing)
- [ ] **BLOCKED:** server venv deleted → recreate; backend shares it
- [ ] Webhook 401 — add `proxy_set_header Authorization $http_authorization;`

### ⬜ Not Started
- [ ] `PYTHONUNBUFFERED=1` in service units
- [ ] VAD threshold experiment (0.6 → 0.8)
- [ ] Fix the owner-validation gate + numbers-rule contradiction in prompts
- [ ] Investigate the 10.4 s webhook latency
- [ ] SSL / HTTPS
- [ ] Move Scout persona to its own LiveKit project
- [ ] Rotate the exposed LiveKit secret
- [ ] Retire old `/v1/` backend + old root SPA build

---

## 19. Current Project State

### Where development stands
Backend and frontend work. The **voice agent does not run**. Last verified state:

| Component | State |
|---|---|
| Backend `:8001` | ✅ was healthy (69 routes, root_path set) — ⚠ **venv deleted, likely down now** |
| Frontend `/new/` | ✅ deployed, correct API base, routing fixed |
| nginx | ✅ correct |
| Neon DB | ✅ reachable (Postgres 18.4) |
| LiveKit project | ✅ trunks + dispatch rule correct |
| **Agent worker** | 🔴 **crash loop** |
| venv | 🔴 **deleted** |

### Do this next, in order
1. **Recreate the venv on Python 3.14** (backend works fine on 3.14):
   ```bash
   cd /home/ubuntu/mitchell-v1-new
   python3 -m venv venv && source venv/bin/activate
   pip install --upgrade pip
   pip install -r backend/requirements.txt -r requirements.txt
   sudo systemctl restart mitchell-8001
   curl -s http://127.0.0.1:8001/
   ```
2. **Fix the agent** — add to the very top of **both** `agent_inbound.py` and
   `agent_outbound.py`, above all other imports:
   ```python
   import multiprocessing
   multiprocessing.set_start_method("fork", force=True)
   ```
   Test foreground: `./venv/bin/python agent_outbound.py start`.
   If `DuplexClosed` persists → install Python ≤3.13 (pyenv; deadsnakes may not
   support "resolute") and rebuild the venv there.
3. Add the nginx `Authorization` header line; reload.
4. Place a real call from the UI; confirm tool call → 200 → row, and that the
   webhook populates `duration_ms`.

### Do NOT touch
- `qwen_omni_realtime.py` fixes — hard-won, each maps to a reproduced failure.
- The `retell_call_id`-holds-room-name convention — the tool-webhook join depends on it.
- Router `basename` / nginx root redirect — the UI regresses to the old build without them.
- The durable-webhook design in `tools.py` — it demonstrably saved real data.

### Risks
- **One venv serves backend + agents.** Rebuilding it takes both down.
- **No SSL**, backend also bound to `0.0.0.0:8001` (relies on the AWS SG).
- **No Alembic** — schema changes are append-only raw SQL with swallowed errors.
- **Campaign runner is an in-process asyncio task** — dies on restart.
- The LiveKit API secret was pasted in chat; rotate it.

---

## 20. Open Questions
1. **Python version strategy** — force `fork` on 3.14, or install ≤3.13? Untested.
2. **Does forcing `fork` on 3.14 destabilise LiveKit?** 3.14 changed the default
   precisely because fork+threads is unsafe.
3. **Cascaded pipeline (Deepgram + silero VAD)?** Would delete
   `qwen_omni_realtime.py` entirely — the strongest argument for it.
4. **Scout project separation** — where does the persona demo live?
   (Its `testing-xp0ybjpm` credentials were overwritten and are not on disk.)
5. **Why 10.4 s** for a trade-inquiry webhook?
6. **Is LiveKit's dashboard "test event" signed?** Determines whether the 401 is real.
7. Inbound telephony has never been verified end-to-end on the correct project.
8. Concurrency limits for campaign calling.

---

## 21. Important Conversation Insights

1. **The repetition is VAD fragmentation, not ASR language config.** In a real
   call the log showed **four user turns in two seconds**:
   ```
   18:52:10 USER: ये मुझे बिल्कुल आपकी बात समझ आ रही है...   ← real, correct
   18:52:11 USER: 对。            ← sub-second fragment
   18:52:11 USER: Getting.        ← sub-second fragment
   18:52:12 USER: अ जी अभी तो मैं mango jam...              ← real, correct
   ```
   **Every real sentence transcribes correctly; every junk token is a
   sub-second sliver.** The VAD chops one breath into fragments and the ASR
   hallucinates on noise. Swapping ASR vendors would not fix this — turn
   detection would.

2. **Qwen's ASR is fine, even over telephony.** Measured on 8 kHz μ-law audio it
   returned the correct sentence. It writes Hindustani in **Devanagari** rather
   than Urdu script, which is cosmetic — the LLM understands it.

3. **`language_type` does nothing for transcription.** `auto`/`ur`/`Urdu` gave
   byte-identical output. DashScope doesn't validate the field at all (it accepts
   `"Klingon"` and echoes it back) — so a successful `session.updated` proves
   nothing.

4. **The agent lied about saving an order.** Because bug 3 crashed the tool
   executor, the tool result never returned, yet Ayesha said *"آپ کا آرڈر کامیابی
   سے ریکارڈ ہو گیا"*. The durable-write path had already saved it — but the agent
   didn't know that. Fixing the id collision restores honest confirmations.

5. **Removing the Soniox key silently switches to Qwen's native voice** —
   it doesn't disable audio. This masked a real bug during testing.

6. **A 401 with an empty JWT ≠ a key mismatch.** `rsplit(b".", 1)` failing means
   the token had **no dots** — it was absent, not wrong.

7. **`room_started`→`room_finished` overstated a 60 s call as 85 s** in testing.

8. **LiveKit has no official call-duration answer** (issue #3532, closed unresolved).

9. **Deepgram Nova-3 supports Urdu**, but monolingually; its `multi` mode
   excludes Urdu. It would improve script fidelity, not the actual failure.

10. **The `/v1-new/` trailing slash in `proxy_pass` strips the prefix** — the key
    to understanding every 404 in this deployment.

11. **Vite bakes env at build time**; editing `.env` without rebuilding changes nothing.

12. **`agent_name` is the auto-dispatch switch.** Absent → joins every room.
    Present → explicit dispatch only.

---

## 22. Timeline

1. Explored the repo; found tool calls failing and TTS dying.
2. **Misdiagnosis #1:** believed the Qwen event lacked `name`. Built a probe that
   assumed it. Added fallbacks + dedupe (harmless, not the fix).
3. Traced the Soniox 408 to a starved text stream; added a `_start_generation` guard.
4. A real log disproved #1 — Qwen **does** send `name`. Corrected course.
5. Found the true 408 cause (streams closed at `response.done`) and the fatal
   `response.create`; set `auto_tool_reply_generation=True`.
6. First successful end-to-end tool call: `inquiry_id=3d4b9a86…`, HTTP 200.
7. Found the `Item type mismatch` crash (forced `FunctionCall.id`); fixed.
8. Diagnosed the outbound repeat loop as the `"there"` placeholder gate.
9. Researched LiveKit webhooks; built the receiver, event table, timing columns;
   verified five duration scenarios and signature rejection.
10. Discovered `.env` pointed at an **empty** LiveKit project; repointed to Scout.
    Placed a **real outbound call that was answered**.
11. **Incident:** the Scout persona agent auto-joined and talked over the caller.
    Named it; audited every `cli.run_app` in that repo.
12. Rewired outbound into the **existing** endpoint; deleted the duplicate.
13. Server deployment: root_path/Swagger, `VITE_BASE_URL`, router basename,
    nginx root redirect, backend restart (69 routes live).
14. **Misdiagnosis #2/#3:** `language_type`, then telephony audio — both
    disproven by measurement. Real cause identified as VAD fragmentation.
15. Agent crash loop on Python 3.14 (`DuplexClosed`); `python3.12` unavailable;
    **venv deleted** — current blocker.

---

## 23. Full Context Dump

- **Terminology:** "Ayesha" = the agent persona (female; Urdu feminine verb forms
  are a prompt rule). "TG_Ag01" appears in older notes as agent 1 of a 6-agent roadmap.
- **Greeting caching:** `cache_greeting_sync` POSTs to Soniox HTTP, stores
  `.greeting_cache/<sha256[:16]>.mp3`, decodes to frames at 24 kHz.
  **Without a Soniox key the greeting cannot be generated**, and
  `session.say(...)` with `tts=None` is a problem because the model declares
  `supports_say=False`.
- **Audio rates:** input 16 kHz, output 24 kHz, mono; agent resamples input.
- **Console mode** (`python agent_outbound.py console`) uses the local mic;
  room name `console-room`, job `mock-job-*`. It passes **no metadata**, so the
  outbound agent always hits the `"there"` gate — outbound is effectively
  untestable via console.
- **`dev` vs `console` vs `start`:** with `agent_name` set, `dev` registers but
  never auto-dispatches; `start` is the production worker mode for systemd.
- **Concurrent calls interleave in one log** — `conversation_item_added` carries
  only `role` and `text`, no room/job id. Two simultaneous calls are
  indistinguishable except by the owner name in the text.
- **`_livekit_call_context()`** in `tools.py` builds `call_id` from `room.name`
  and infers direction from job metadata.
- **`sip.ruleID` is only set for inbound**, which is how direction is inferred in
  the webhook handler.
- **`_resolve_retell_call_id`** falls back to matching an `OutboundCall` by phone
  number when no call id header is present.
- **Windows dev notes:** the Bash tool is Git Bash; `PYTHONIOENCODING=utf-8` is
  required to see Urdu; `python -m py_compile` for syntax checks; JSX can't be
  checked with `node --check`.
- **Local venv** `D:\Artificizen\Mitchell-s-V1\venv` runs Python 3.11 with
  livekit-agents 1.6.5 and plugins deepgram/openai/silero/soniox all at 1.6.5.
  **Local works; the server's 3.14 does not.**
- **A namespace leak exists locally:** `livekit.plugins` resolves across both the
  venv and the global site-packages (global has 1.3.12) — pin versions explicitly.
- **`pip install -q` hid a failure** during plugin installation; drop `-q` when
  verifying installs.
- **Test numbers used:** +923451452451, +923154161103. Caller ID is the US
  number +18608544754, so calls to Pakistan are an international leg.
- **A successful real order** captured: `Ather`, `923154161103`,
  `Mango Jam 1kg x5`, `retailer`, `company_name="your shop"` (placeholder leak).
- **Backend 8001 baseline after the fix:** 69 routes, `servers: [{"url": "/v1-new"}]`,
  `/api/livekit/webhook` returns **401** to unsigned probes (correct).
- **The old root SPA build** (`/var/www/html`, `index-BJYDpCy4.js`) has
  `http://13.62.66.137:8000/api` baked in — it targets the **old** backend
  directly and should be retired.
- **Soniox voices without a stated regional accent** (for Urdu): Maya, Nina,
  Emma, Claire, Grace, Mina (female); Daniel, Noah, Jack, Adrian, Owen, Kenji.
- **`AGENT_NAME=marcus`** in the root `.env` is unused by the Mitchell's agents;
  they read `MITCHELLS_{IN,OUT}BOUND_AGENT_NAME`.
- **README latency notes** (still valid): `turn_detection=None` avoids loading an
  unused local model; the catalogue is served by tool rather than inlined,
  cutting resident instructions from ~14.6k to ~11k chars.
- The README blames truncated audio on background-noise VAD and suggests raising
  `QWEN_VAD_THRESHOLD`. That is the **wrong lead for post-tool-call truncation**
  (that was the 408) but is **plausibly the right lead** for the mid-conversation
  fragmentation described in §21.
