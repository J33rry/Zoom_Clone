<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/header.svg"/><img src="assets/header.svg" alt="Zoom Workplace Clone"/></picture>

<div align="center">

<a href="#features"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/FEATURES-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/FEATURES-ffffff?style=flat-square&logoColor=000000" alt="FEATURES"/></picture></a>
<a href="#quickstart"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/QUICKSTART-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/QUICKSTART-ffffff?style=flat-square&logoColor=000000" alt="QUICKSTART"/></picture></a>
<a href="#schema"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/SCHEMA-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/SCHEMA-ffffff?style=flat-square&logoColor=000000" alt="SCHEMA"/></picture></a>
<a href="#api"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/API-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/API-ffffff?style=flat-square&logoColor=000000" alt="API"/></picture></a>
<a href="#deploy"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/DEPLOY-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/DEPLOY-ffffff?style=flat-square&logoColor=000000" alt="DEPLOY"/></picture></a>

</div>

<br>

<a id="overview"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s01.svg"/><img src="assets/s01.svg" alt="01 overview"/></picture>

A video-conferencing web app modelled on the **Zoom Workplace** web client. It covers the Home
dashboard, instant and scheduled meetings, joining by Meeting ID or invite link, and a live
meeting room with real peer-to-peer audio/video, chat, reactions, screen sharing and host controls.

```
core      dashboard · instant meeting · join · schedule
bonus     host controls · responsive layout
media     webrtc full mesh, fastapi websocket signalling
auth      none — a seeded default user is signed in
tests     30 backend (services, rest api, realtime, host tools)
```

<br>

<a id="stack"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s02.svg"/><img src="assets/s02.svg" alt="02 stack"/></picture>

<div align="center">

<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Next.js%2016-0d1117?style=flat-square&logo=nextdotjs&logoColor=ffffff"/><img src="https://img.shields.io/badge/Next.js%2016-ffffff?style=flat-square&logo=nextdotjs&logoColor=000000" alt="Next.js 16"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/React%2019-0d1117?style=flat-square&logo=react&logoColor=ffffff"/><img src="https://img.shields.io/badge/React%2019-ffffff?style=flat-square&logo=react&logoColor=000000" alt="React 19"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/TypeScript-0d1117?style=flat-square&logo=typescript&logoColor=ffffff"/><img src="https://img.shields.io/badge/TypeScript-ffffff?style=flat-square&logo=typescript&logoColor=000000" alt="TypeScript"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Tailwind%20CSS%20v4-0d1117?style=flat-square&logo=tailwindcss&logoColor=ffffff"/><img src="https://img.shields.io/badge/Tailwind%20CSS%20v4-ffffff?style=flat-square&logo=tailwindcss&logoColor=000000" alt="Tailwind CSS v4"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Python%203.12-0d1117?style=flat-square&logo=python&logoColor=ffffff"/><img src="https://img.shields.io/badge/Python%203.12-ffffff?style=flat-square&logo=python&logoColor=000000" alt="Python 3.12"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/FastAPI-0d1117?style=flat-square&logo=fastapi&logoColor=ffffff"/><img src="https://img.shields.io/badge/FastAPI-ffffff?style=flat-square&logo=fastapi&logoColor=000000" alt="FastAPI"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/SQLAlchemy%202-0d1117?style=flat-square&logo=sqlalchemy&logoColor=ffffff"/><img src="https://img.shields.io/badge/SQLAlchemy%202-ffffff?style=flat-square&logo=sqlalchemy&logoColor=000000" alt="SQLAlchemy 2"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Pydantic%202-0d1117?style=flat-square&logo=pydantic&logoColor=ffffff"/><img src="https://img.shields.io/badge/Pydantic%202-ffffff?style=flat-square&logo=pydantic&logoColor=000000" alt="Pydantic 2"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/SQLite-0d1117?style=flat-square&logo=sqlite&logoColor=ffffff"/><img src="https://img.shields.io/badge/SQLite-ffffff?style=flat-square&logo=sqlite&logoColor=000000" alt="SQLite"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Turso-0d1117?style=flat-square&logo=turso&logoColor=ffffff"/><img src="https://img.shields.io/badge/Turso-ffffff?style=flat-square&logo=turso&logoColor=000000" alt="Turso"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/WebRTC-0d1117?style=flat-square&logo=webrtc&logoColor=ffffff"/><img src="https://img.shields.io/badge/WebRTC-ffffff?style=flat-square&logo=webrtc&logoColor=000000" alt="WebRTC"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/WebSockets-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/WebSockets-ffffff?style=flat-square&logoColor=000000" alt="WebSockets"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/pytest-0d1117?style=flat-square&logo=pytest&logoColor=ffffff"/><img src="https://img.shields.io/badge/pytest-ffffff?style=flat-square&logo=pytest&logoColor=000000" alt="pytest"/></picture>

</div>

<br>

| layer | tech |
| --- | --- |
| frontend | Next.js 16 (App Router, client-rendered SPA), React 19, TypeScript, Tailwind CSS v4, lucide-react |
| backend | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic 2, native WebSockets |
| database | SQLite (local file) or Turso (hosted SQLite) |
| realtime | WebRTC full mesh for media; FastAPI WebSocket for signalling and room events |

<br>

<a id="features"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s03.svg"/><img src="assets/s03.svg" alt="03 features"/></picture>

**Core**
- **Home dashboard:** live clock, the New meeting / Join / Schedule tiles, a calendar day view with a date-picker popover and Today/‹/› navigation, a meeting details slide-over, and **Recent meetings**.
- **Instant meeting:** creates a unique 11-digit Meeting ID and a passcode-protected invite link, then drops the host straight into the room. The chevron menu offers *Start with video* and *Use my PMI*.
- **Join meeting:** the Join dialog accepts a Meeting ID (spaces allowed) or a full invite link, and validates that the meeting exists before routing to Zoom's full-screen **Enter Meeting Info** join screen. It has a camera preview with Mute / Stop Video (blocked-device warnings included), your name with "Remember my name for future meetings", and a passcode field that appears only when the link didn't carry one.
- **Schedule meeting:** topic, description, date picker, time + AM/PM, duration, time zone, auto-generated ID or PMI, passcode, waiting room and host/participant video. Scheduled meetings are stored in SQLite and appear in the Home calendar and in Meetings → Upcoming.
- **Meetings tab:** Upcoming/Recent list with a detail pane: Start, Copy Invitation, Edit and Delete, plus a Show/Hide invitation toggle. Edit reuses the Schedule form.

**Meeting room**
- Real audio/video between browsers (WebRTC mesh).
- **Speaker view** by default: one person on the stage and a thumbnail strip on top, like Zoom. The header grid icon switches to **Gallery view**.
- Participants get a full-screen meeting without the Workplace navbar or side rail; the host's meeting runs inside Workplace.
- Account users show an avatar when video is off; guests show their name, as Zoom does for people without a profile picture. Name tags show mute state.
- Mic/camera toggles, including the permission-denied banner and blocked-device icons from the designs, plus screen sharing.
- Participants panel, emoji reactions and a meeting-info popover with a copy-link action.
- Meeting chat, persisted: *Meeting Group Chat* plus **direct messages**. Direct messages are delivered, and replayed in chat history, only to the sender and recipient.
- Controls auto-hide after 3 s of inactivity, as in the Zoom web client.
- Reconnects automatically after a network blip or page refresh.
- **Minimized meeting:** leaving the meeting page (e.g. clicking Home) shrinks the call to a mini window in the bottom-right corner. The call keeps running; the mini window has mic, video, leave and back-to-meeting controls. Home then shows **Back to Meeting** instead of New meeting, and **Join** is greyed out. The meeting is rendered once by a `MeetingDock` in the root layout, driven by a small active-meeting store (`lib/activeMeeting.ts`), so navigation never tears down the WebSocket or WebRTC connections.

**Bonus**
- **Host controls:** a Zoom-style **Host tools** panel, all enforced server-side.
  - **Enable waiting room:** guests wait in a lobby until the host admits or removes them. It defaults to the meeting's scheduled Waiting Room option.
  - **Lock Meeting:** new joins are rejected.
  - **Hide profile pictures:** tiles show names instead of avatars.
  - **Participants →** *Suspend Participant Activities*, plus *Allow participants to:* Chat, Rename Themselves, Unmute Themselves and Start Video.
  - **Share →** also opened from the Share button's **^ → Host tools for share**:
    - *How many participants can share at the same time?* One at a time, or multiple simultaneously.
    - *Who can share?* All Participants or Only Host.
    - *Who can start sharing when someone else is sharing?* All Participants or Only Host. When allowed, starting a share takes over the current one.
    - In multiple mode the two "who" settings are fixed to All Participants, as in Zoom.
  - **Advanced →** Mute all.
  - The host can also mute, rename or remove individual participants, and end the meeting for everyone.
- **Responsive:** a bottom tab bar on phones; stacked list/detail on the Meetings tab; form labels above inputs; a single-column video grid; secondary room controls folded into *More*.

<br>

<a id="quickstart"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s04.svg"/><img src="assets/s04.svg" alt="04 quickstart"/></picture>

Prerequisites: Python 3.12+ and Node.js 20+.

### 1. Backend (http://localhost:8000)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed            # optional: the API also seeds an empty DB on startup
uvicorn app.main:app --reload --port 8000
```

Interactive API docs are at http://localhost:8000/docs. Reset the sample data with `python -m app.seed --reset`.

### 2. Frontend (http://localhost:3000)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### 3. Try a two-person call
1. Home → **New meeting**. You join as host.
2. Open the ⓘ icon in the meeting's top bar → **Copy link**.
3. Paste the link into a second browser, or an incognito window, and join as a guest.

Browsers only allow camera and microphone access on `https://` or `localhost`.

### Tests

```bash
cd backend && pytest       # 30 tests: services, REST API, realtime and Host tools
cd frontend && npm run lint && npx tsc --noEmit
```

<br>

<a id="config"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s05.svg"/><img src="assets/s05.svg" alt="05 config"/></picture>

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | backend | `sqlite:///./zoom_clone.db` | A local SQLite file, or a Turso URL (`libsql://<db>.turso.io`) |
| `DATABASE_AUTH_TOKEN` | backend | — | Turso auth token (secret). Only read for `libsql://` URLs |
| `FRONTEND_URL` | backend | `http://localhost:3000` | Base URL used in invite links |
| `CORS_ORIGINS` | backend | `http://localhost:3000` | Comma-separated allowed origins. `FRONTEND_URL` is always allowed as well |
| `SEED_ON_STARTUP` | backend | `true` | Seed sample data when the DB is empty |
| `EMPTY_ROOM_GRACE_SECONDS` | backend | `30` | How long an empty live meeting waits before it ends |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:8000` | Backend base URL |
| `NEXT_PUBLIC_WS_URL` | frontend | derived from the API URL (`http→ws`) | WebSocket base URL |
| `NEXT_PUBLIC_TURN_URL` / `_USERNAME` / `_CREDENTIAL` | frontend | — | Optional TURN server for strict NATs |

### Using Turso instead of a local file

The backend talks to Turso through the `sqlalchemy-libsql` dialect, so nothing else in the code changes. In `backend/.env`:

```
DATABASE_URL=libsql://<your-db>-<your-org>.turso.io
DATABASE_AUTH_TOKEN=<token from `turso db tokens create <your-db>`>
```

On first start the app creates the tables and seeds the sample data in the empty Turso database, exactly as it does for a local file. Keep `.env` out of version control (it is already in `.gitignore`); the token is a secret. Remove both lines to go back to the local SQLite file.

<br>

<a id="structure"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s06.svg"/><img src="assets/s06.svg" alt="06 structure"/></picture>

```
backend/app/
  main.py             FastAPI app, CORS, error mapping, startup (create tables + seed)
  config.py, db.py    settings; engine/session/Base (SQLite foreign keys enabled)
  deps.py             get_current_user: the "signed-in" default user (auth seam)
  models/             User, Meeting, MeetingParticipant, ChatMessage, enums
  schemas/            Pydantic request/response models + serializers
  services/           business rules: meeting_service, participant_service,
                      id_generator, invitation, timezones, domain errors
  routers/            users.py, meetings.py (REST), ws.py (WebSocket)
  realtime/           room_manager.py (in-memory rooms), handlers.py (message dispatch)
  seed.py             sample data
backend/tests/        pytest suite

frontend/src/
  app/(app)/          routes inside the Workplace shell: home, meetings,
                      meetings/schedule, meetings/[id]/edit, chat/contacts/settings
  app/(meeting)/      full-screen routes: j/[code] (join screen), wc/[code] (meeting room)
  components/shell/   TopBar, SideRail/BottomNav, AppChrome, AppProviders, CurrentUser
  components/home/    Clock, ActionTiles, CalendarCard, MeetingDetailsPanel, RecentMeetings
  components/meetings JoinMeetingModal, MeetingForm (+ form state), MeetingList,
                      MeetingDetailPane, PreJoin
  components/room/    MeetingDock (full / mini window), MeetingRoom (orchestrator),
                      VideoGrid/VideoTile, ControlBar, RoomHeader, ParticipantsPanel,
                      ChatPanel, HostToolsPanel, reactions, banners
  components/ui/      Button, Modal, ConfirmDialog, Toast, form controls, Avatar
  hooks/              useLocalMedia, useMeetingSocket, useWebRTCMesh, useAsync,
                      useStartMeeting, useIdle, useNow, useLatest, useClickOutside
  lib/                api client, time-zone math, invite-link parsing, session storage,
                      activeMeeting store
  types/api.ts        API + realtime message types (mirrors the backend schemas)
```

<br>

<a id="schema"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s07.svg"/><img src="assets/s07.svg" alt="07 schema"/></picture>

```mermaid
erDiagram
    users ||--o{ meetings : hosts
    users ||--o{ meeting_participants : "joins as (nullable for guests)"
    meetings ||--o{ meeting_participants : has
    meetings ||--o{ chat_messages : has
    meeting_participants ||--o{ chat_messages : sends
    meeting_participants |o--o{ chat_messages : "receives (direct)"

    users {
        int id PK
        string name
        string email UK
        string avatar_color
        string personal_meeting_id UK "10-digit PMI"
        string timezone "IANA"
        datetime created_at
    }
    meetings {
        int id PK
        string meeting_code UK "11-digit public ID; NULL when use_pmi"
        int host_id FK
        string topic
        text description
        enum meeting_type "instant | scheduled | personal"
        bool use_pmi
        datetime start_time "UTC"
        int duration_minutes
        string timezone "IANA, for display"
        string passcode
        bool passcode_enabled
        bool waiting_room_enabled
        bool host_video_on
        bool participant_video_on
        enum status "scheduled | live | ended"
        datetime started_at
        datetime ended_at
        datetime created_at
        datetime updated_at
    }
    meeting_participants {
        string id PK "UUID; doubles as the WebSocket session token"
        int meeting_id FK
        int user_id FK "nullable"
        string display_name
        enum role "host | participant"
        datetime joined_at
        datetime left_at
        bool is_audio_muted
        bool is_video_on
        bool removed_by_host
    }
    chat_messages {
        int id PK
        int meeting_id FK
        string participant_id FK "sender"
        string recipient_id FK "NULL = group chat"
        text body
        datetime created_at
    }
```

**Design notes**
- **All timestamps are stored in UTC.** The meeting keeps the host's IANA `timezone` only for display and the invitation text ("Sep 30, 2026 08:30 PM India"). The browser does the wall-clock ↔ UTC conversion with `Intl`, with no date library.
- **Personal Meeting ID.** Each user has one persistent *personal room* (`meeting_type = personal`, `meeting_code = PMI`). A scheduled meeting that uses the PMI stores `meeting_code = NULL` and `use_pmi = true`; its join code resolves to the host's PMI. This keeps `meeting_code` UNIQUE even though many scheduled meetings can share one PMI. SQLite allows multiple NULLs under a UNIQUE index.
- **`meeting_participants` stores one row per join session,** not per person. It is the attendance history (who joined and left, and when; who was removed), and its UUID is the bearer token for the WebSocket. That way a guest never needs an account, and a removed participant cannot reconnect.
- **Recent meetings** are meetings that actually started (`started_at IS NOT NULL`), ordered by `started_at`. **Upcoming** meetings are scheduled meetings that haven't ended and whose time slot isn't over yet.
- Indexes: unique `meeting_code`, unique `personal_meeting_id`, `(host_id, start_time)` for calendar/range queries, and `status`. Foreign keys use `ON DELETE CASCADE` so deleting a meeting removes its participants and chat. `PRAGMA foreign_keys=ON` is set on every SQLite connection.
- Enums are stored as constrained strings (`native_enum=False`), which is portable to Postgres.
- `chat_messages.recipient_id` (nullable FK) marks direct messages; NULL means the group chat. Columns added after the first release are applied to existing SQLite files by a small additive migration on startup (`db.migrate_schema`).

<br>

<a id="api"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s08.svg"/><img src="assets/s08.svg" alt="08 api"/></picture>

REST, prefix `/api`:

| Method | Path | Description |
|---|---|---|
| GET | `/me` | Default signed-in user |
| GET | `/timezones` | Time-zone options, e.g. `(GMT+5:30) India` |
| GET | `/meetings?from=&to=` | Scheduled meetings starting in a UTC range (calendar day view) |
| GET | `/meetings/upcoming` | Upcoming scheduled meetings |
| GET | `/meetings/recent` | Meetings that were held, most recent first |
| POST | `/meetings/instant` | Create an instant meeting `{use_pmi, video_on}` |
| POST | `/meetings` | Schedule a meeting |
| GET / PUT / DELETE | `/meetings/{id}` | Read / edit / delete (host only for writes) |
| POST | `/meetings/{id}/end` | End for everyone (host only) |
| GET | `/meetings/{id}/participants` | Everyone who joined (one entry per person, host first) with an "in meeting" flag |
| GET | `/meetings/code/{code}` | Validate a Meeting ID before joining: 404 unknown, 410 ended |
| POST | `/meetings/code/{code}/join` | `{display_name, passcode, as_host, audio_muted, video_on}` returns a participant session |

WebSocket `/ws/meetings/{meeting_id}?pid={participant_id}`:

| Direction | Messages |
|---|---|
| client → server | `signal {to, data}` · `media-state` · `chat` · `reaction` · `rename` · host only: `mute`, `mute-all`, `remove`, `admit`, `admit-all`, `deny`, `update-settings`, `suspend`, `end-meeting` |
| server → client | `waiting` · `room-state` (on entering) · `room-settings` · `waiting-list` (hosts) · `peer-joined` · `peer-updated` · `peer-left` · `signal` · `chat` · `reaction` · `force-mute` · `force-video-off` · `force-share-off` · `removed` · `meeting-ended` · `error` |

Host tools state (`RoomSettings`: waiting_room, locked, hide_profile_pictures, allow_chat / rename / unmute / video / share, share_mode, share_takeover) lives with the live room in memory and resets each session, as in Zoom.

<br>

<a id="decisions"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s09.svg"/><img src="assets/s09.svg" alt="09 decisions"/></picture>

- **WebRTC full mesh.** Every participant holds one `RTCPeerConnection` per other participant. There's no media server, which makes it simple and free, and it's ideal for small meetings of about 2–6 people. Larger meetings would need an SFU such as LiveKit or mediasoup.
- **No offer glare.** Only the newcomer sends offers (to everyone listed in `room-state`); existing members only answer.
- **No renegotiation.** Each connection gets one audio and one video transceiver up front. Mute (`track.enabled`), camera on/off and screen share all go through `RTCRtpSender.replaceTrack`. Turning video off stops the camera track, so the camera light goes off.
- **Server-side authority.** Host tools are checked against the participant's role on the server, not just hidden in the UI. Passcodes are validated on join.
- **Resilience.** A dropped socket reconnects with the same participant session. A live meeting ends only after it has been empty for `EMPTY_ROOM_GRACE_SECONDS`, so a refresh doesn't kill it.
- **Thin routers.** Business rules live in `services/` and raise domain errors that one exception handler maps to HTTP codes. This keeps the logic unit-testable without HTTP.

<br>

<a id="limits"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s10.svg"/><img src="assets/s10.svg" alt="10 limits"/></picture>

- **No login.** The first seeded user ("Jerry NotAbout") is treated as signed in via `get_current_user`. Any browser pressing **Start** on a meeting joins as its host; people who join through the Join dialog or an invite link join as participants. Swapping that one dependency for real auth is the only backend change needed.
- **The Edit form deliberately mirrors the Schedule form.** Recurring meetings, invitees, whiteboards, docs and encryption options from Zoom's full edit page are out of scope.
- **Host tools permissions are enforced at the signalling layer.** The server rejects disallowed actions, and every client renders the server's view of each participant, e.g. a blocked camera shows as an avatar. Media is peer-to-peer, though, so a deliberately modified client could still send raw frames; true media enforcement needs an SFU.
- **Scheduled PMI meetings** start in the host's personal room, so the scheduled row itself isn't marked live.
- **Realtime state is in-memory** in a single backend process, which fits SQLite. Horizontal scaling would need Redis pub/sub for room fan-out.
- **NAT traversal** uses public STUN only. Some corporate or mobile networks will need a TURN server (see the env vars).
- Chat, Contacts and Settings in the side rail are placeholders, as are search, notifications and calendar connection.
- The sample-data user name and IDs match the provided design screenshots.

<br>

<a id="deploy"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/s11.svg"/><img src="assets/s11.svg" alt="11 deploy"/></picture>

The app is platform-agnostic; everything is configured through environment variables.

- **Frontend** (e.g. Vercel): set `NEXT_PUBLIC_API_URL` (and optionally `NEXT_PUBLIC_WS_URL`) to the public backend URL.
- **Backend** (e.g. Render or Railway): run `uvicorn app.main:app --host 0.0.0.0 --port $PORT` with **one worker**. Either mount a persistent disk and set `DATABASE_URL=sqlite:////data/zoom_clone.db`, or use Turso (see [config](#config)), which needs no disk. Set `FRONTEND_URL` and `CORS_ORIGINS` to the frontend URL. The host must support WebSockets.
- **Python 3.12 is required on the host.** The Turso driver has no prebuilt package for Python 3.14, so a newer default (as on Render) tries to compile it from Rust source and the build fails. The repo pins 3.12 with `.python-version`; on Render you can also set the `PYTHON_VERSION=3.12.8` environment variable.
- Serve both over **HTTPS**, since browsers block camera and mic access on insecure origins, and `wss://` is required from an https page.

<br>

<div align="center">

<a href="https://github.com/J33rry"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/GITHUB-0d1117?style=flat-square&logo=github&logoColor=ffffff"/><img src="https://img.shields.io/badge/GITHUB-ffffff?style=flat-square&logo=github&logoColor=000000" alt="GITHUB"/></picture></a>

<br>
<br>

<sub><code>status: built for the scaler sde fullstack assignment</code></sub>

</div>
