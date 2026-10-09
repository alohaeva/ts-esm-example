# ts-esm-example

## Mac app tracker

Tracks when apps are opened and closed on a Mac. It polls `NSWorkspace` (via
`osascript`, so no extra permissions or native build are needed) every 2
seconds and reports apps that appear in the Dock / Cmd-Tab switcher.

```bash
npm install
npm run track   # live log in the terminal; Ctrl+C prints a usage summary
npm run dev     # HTTP server with /api/apps/* endpoints
```

Every event is appended to `data/app-events.jsonl` (override with
`APP_EVENTS_FILE`):

```json
{"type":"open","pid":4242,"bundleId":"com.apple.Safari","name":"Safari","at":"2026-10-09T09:15:02.113Z"}
```

HTTP endpoints (send `Authorization: Bearer <token>` from `/api/auth/login`):

- `GET /api/apps/running` — apps running right now
- `GET /api/apps/events?since=<ISO date>&limit=<n>` — open/close history
- `GET /api/apps/usage` — launches and total open time per app

To start tracking automatically at login, run `npm run build` and add a
LaunchAgent in `~/Library/LaunchAgents` that runs `node dist/track.js` with
`WorkingDirectory` set to this repo (or an absolute `APP_EVENTS_FILE`).
