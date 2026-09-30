<picture><source media="(prefers-color-scheme: dark)" srcset="../assets/frontend/dark/header.svg"/><img src="../assets/frontend/header.svg" alt="Zoom Clone — Frontend"/></picture>

<div align="center">

<a href="#quickstart"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/QUICKSTART-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/QUICKSTART-ffffff?style=flat-square&logoColor=000000" alt="QUICKSTART"/></picture></a>
<a href="#config"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/CONFIG-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/CONFIG-ffffff?style=flat-square&logoColor=000000" alt="CONFIG"/></picture></a>
<a href="#routes"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/ROUTES-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/ROUTES-ffffff?style=flat-square&logoColor=000000" alt="ROUTES"/></picture></a>
<a href="#structure"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/STRUCTURE-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/STRUCTURE-ffffff?style=flat-square&logoColor=000000" alt="STRUCTURE"/></picture></a>
<a href="#deploy"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/DEPLOY-0d1117?style=flat-square&logoColor=ffffff"/><img src="https://img.shields.io/badge/DEPLOY-ffffff?style=flat-square&logoColor=000000" alt="DEPLOY"/></picture></a>

</div>

<br>

<a id="overview"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="../assets/frontend/dark/s01.svg"/><img src="../assets/frontend/s01.svg" alt="01 overview"/></picture>

The browser client of the Zoom Workplace clone: the Home dashboard, the Meetings tab, the
Schedule / Edit form, the join screen and the live meeting room. It talks to the FastAPI backend
over REST and one WebSocket per meeting, and to other browsers directly over WebRTC.

```
rendering  client-rendered single-page app (next.js app router)
data       rest + websocket to the fastapi backend
media      webrtc full mesh, peer to peer
state      react state and hooks, one small external store
checks     typescript, eslint
```

Architecture, database design, the API reference and assumptions are in the
[root README](../README.md). Requirements and design notes are in [`docs/`](../docs/README.md).

<br>

<a id="stack"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="../assets/frontend/dark/s02.svg"/><img src="../assets/frontend/s02.svg" alt="02 stack"/></picture>

<div align="center">

<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Next.js%2016-0d1117?style=flat-square&logo=nextdotjs&logoColor=ffffff"/><img src="https://img.shields.io/badge/Next.js%2016-ffffff?style=flat-square&logo=nextdotjs&logoColor=000000" alt="Next.js 16"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/React%2019-0d1117?style=flat-square&logo=react&logoColor=ffffff"/><img src="https://img.shields.io/badge/React%2019-ffffff?style=flat-square&logo=react&logoColor=000000" alt="React 19"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/TypeScript-0d1117?style=flat-square&logo=typescript&logoColor=ffffff"/><img src="https://img.shields.io/badge/TypeScript-ffffff?style=flat-square&logo=typescript&logoColor=000000" alt="TypeScript"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Tailwind%20CSS%20v4-0d1117?style=flat-square&logo=tailwindcss&logoColor=ffffff"/><img src="https://img.shields.io/badge/Tailwind%20CSS%20v4-ffffff?style=flat-square&logo=tailwindcss&logoColor=000000" alt="Tailwind CSS v4"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/lucide--react-0d1117?style=flat-square&logo=lucide&logoColor=ffffff"/><img src="https://img.shields.io/badge/lucide--react-ffffff?style=flat-square&logo=lucide&logoColor=000000" alt="lucide-react"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/WebRTC-0d1117?style=flat-square&logo=webrtc&logoColor=ffffff"/><img src="https://img.shields.io/badge/WebRTC-ffffff?style=flat-square&logo=webrtc&logoColor=000000" alt="WebRTC"/></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/ESLint-0d1117?style=flat-square&logo=eslint&logoColor=ffffff"/><img src="https://img.shields.io/badge/ESLint-ffffff?style=flat-square&logo=eslint&logoColor=000000" alt="ESLint"/></picture>

</div>

<br>

| package | used for |
| --- | --- |
| `next` 16, `react` 19 | App Router pages, all rendered on the client |
| `tailwindcss` 4 | styling; Zoom's colours are theme tokens in `src/app/globals.css` |
| `tailwind-merge` | lets a component's `className` prop override its defaults (`lib/cn.ts`) |
| `lucide-react` | icons |

There is no state library, date library or WebRTC wrapper: those parts are plain React hooks,
`Intl` and the browser APIs.

<br>

<a id="quickstart"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="../assets/frontend/dark/s03.svg"/><img src="../assets/frontend/s03.svg" alt="03 quickstart"/></picture>

Prerequisites: Node.js 20+ and the backend running (see the [root README](../README.md#quickstart)).

```bash
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at the backend
npm install
npm run dev                  # http://localhost:3000
```

| script | what it does |
| --- | --- |
| `npm run dev` | development server with hot reload |
| `npm run build` | production build |
| `npm run start` | serve the production build |
| `npm run lint` | ESLint, including the React compiler rules |
| `npx tsc --noEmit` | type-check |

To try a call: start a meeting from Home, copy the invite link from the ⓘ icon, and open it in a
second browser or an incognito window. Browsers only allow camera and microphone on `https://` or `localhost`.

<br>

<a id="config"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="../assets/frontend/dark/s04.svg"/><img src="../assets/frontend/s04.svg" alt="04 config"/></picture>

Set in `.env.local` for development, or in the hosting dashboard for production. These are read
at **build time**, so redeploy after changing them.

| variable | default | purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | backend base URL, no trailing slash |
| `NEXT_PUBLIC_WS_URL` | derived from the API URL (`http→ws`, `https→wss`) | WebSocket base URL; only needed if it differs |
| `NEXT_PUBLIC_TURN_URL` | — | optional TURN server for strict networks |
| `NEXT_PUBLIC_TURN_USERNAME` | — | TURN username |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | — | TURN credential |

Everything prefixed `NEXT_PUBLIC_` is visible in the browser. Do not put secrets here.

<br>

<a id="routes"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="../assets/frontend/dark/s05.svg"/><img src="../assets/frontend/s05.svg" alt="05 routes"/></picture>

| route | page |
| --- | --- |
| `/` | redirects to `/home` |
| `/home` | dashboard: clock, New meeting / Join / Schedule, calendar day view, recent meetings |
| `/meetings` | Upcoming / Recent list with a detail pane |
| `/meetings/schedule` | schedule a meeting |
| `/meetings/[id]/edit` | edit a meeting (the same form) |
| `/j/[code]` | full-screen "Enter Meeting Info" join screen; the target of invite links |
| `/wc/[code]` | the meeting room |
| `/chat`, `/contacts`, `/settings` | placeholders |
| anything else | custom 404 page |

Routes under `(app)` render inside the Workplace shell (top bar and side rail). Routes under
`(meeting)` are full screen.

<br>

<a id="structure"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="../assets/frontend/dark/s06.svg"/><img src="../assets/frontend/s06.svg" alt="06 structure"/></picture>

```
src/
  app/
    layout.tsx          root layout: providers + MeetingDock (the meeting lives here)
    (app)/              pages inside the Workplace shell
    (meeting)/          full-screen pages: j/[code], wc/[code]
    not-found.tsx       404 page
    globals.css         Tailwind theme tokens and animations
  components/
    shell/              TopBar, SideRail/BottomNav, AppChrome, AppProviders, CurrentUser
    home/               Clock, ActionTiles, CalendarCard, MeetingDetailsPanel, RecentMeetings
    calendar/           MiniCalendar (date-picker popover)
    meetings/           JoinMeetingModal, MeetingForm (+ meetingFormState), MeetingList,
                        MeetingDetailPane, PreJoin
    room/               MeetingDock, MeetingRoom, VideoGrid/VideoTile, ControlBar,
                        RoomHeader, ParticipantsPanel, ChatPanel, HostToolsPanel,
                        MiniMeetingView, WaitingRoomScreen, dialogs and banners
    ui/                 Button, Modal, ConfirmDialog, Toast, Toggle, form controls, Avatar
  hooks/
    useLocalMedia       camera, microphone, screen share and permission state
    useMeetingSocket    WebSocket connection, reconnect, typed messages
    useWebRTCMesh       one RTCPeerConnection per remote participant
    useStartMeeting     start or create a meeting and enter the room
    useAsync, useLatest, useNow, useIdle, useClickOutside
  lib/
    api.ts              typed REST client
    activeMeeting.ts    store for the meeting in progress (survives navigation)
    session.ts          per-meeting session in sessionStorage
    time.ts             time-zone and calendar math with Intl
    meetingLink.ts      parse Meeting IDs and invite links
  types/api.ts          API and realtime message types, mirroring the backend schemas
```

**How the meeting survives navigation.** The meeting room is rendered once by `MeetingDock` in the
root layout, not by the `/wc/[code]` page. Leaving that page only changes the dock's CSS position
from full size to a corner window, so the WebSocket and WebRTC connections are never torn down.

<br>

<a id="deploy"></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="../assets/frontend/dark/s07.svg"/><img src="../assets/frontend/s07.svg" alt="07 deploy"/></picture>

Any Next.js host works; Vercel is the simplest.

- Set the project's **root directory** to `frontend`.
- Set `NEXT_PUBLIC_API_URL` to the public backend URL, e.g. `https://your-backend.onrender.com`.
- On the **backend**, set `FRONTEND_URL` (and `CORS_ORIGINS`) to this site's exact address,
  `https://` with no trailing slash. If they do not match, every request fails its CORS check and
  the app shows "Unable to reach the server".
- Serve over HTTPS. Camera, microphone and `wss://` all require it.

<br>

<div align="center">

<sub><code>part of the zoom workplace clone — see the root readme</code></sub>

</div>
