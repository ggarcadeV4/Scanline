# Codex Batch — WP-3: Sync Flash Module

## Context
You are working in `C:\Users\Dad's PC\Desktop\Scanline\studio-control\`.
Node.js Express app driving OBS via obs-websocket-js v5.
Read `AGENTS.md` for rules. Read `config/scene-presets.md` → Sync section.

## The Problem
When recording with dual sources (two monitors = two video files), you need a
way to align them in post-production. A visual flash at the exact start of
recording gives both files a shared reference frame — like a clapboard in film.

## Your Task

### 1. Create `web/sync-flash.html`
A standalone full-screen page that:
- Starts with a black screen
- Listens for a Server-Sent Events (SSE) stream from `/api/sync/events`
- On receiving a `flash` event:
  - Instantly fills the entire viewport with `#FF00FF` (magenta — maximally distinct)
  - Holds for exactly 100ms (3 frames at 30fps)
  - Returns to black
- Shows a small "Sync Ready" indicator in the corner (dim, unobtrusive)
- No UI controls — this page just listens and flashes

```css
body {
  margin: 0;
  background: #000;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.flash {
  background: #FF00FF;
}
```

### 2. Create `server/sync.js` module
```js
/**
 * sync.js — Sync flash for dual-source recording alignment
 *
 * Opens SSE connections from sync-flash.html pages on each monitor.
 * When triggered, fires a flash event to ALL connected clients simultaneously.
 * The flash appears on both monitors at the same instant, providing a shared
 * reference frame for post-production alignment.
 */
```

Exports:
- `setupSyncRoutes(app)` — mounts the SSE endpoint and flash trigger
- SSE endpoint: `GET /api/sync/events` — keeps connections alive, sends `flash` events
- Flash trigger: `POST /api/sync/flash` — fires flash to all connected SSE clients
- Status: `GET /api/sync/status` — reports how many sync pages are connected

Implementation:
- Maintain an array of SSE response objects
- On `POST /api/sync/flash`: iterate all connections, write `event: flash\ndata: now\n\n`
- Clean up closed connections (listen for 'close' event on each response)
- Log connection count on connect/disconnect

### 3. Wire intent in `server/index.js`
- Import and call `setupSyncRoutes(app)` before `app.listen()`
- Wire `sync_flash` intent:
```js
case 'sync_flash': {
  const sync = require('./sync');
  const result = await sync.triggerFlash();
  return res.json(result);
}
```
- Update INTENTS: `sync_flash` → `status: 'ready'`

### 4. Integration point
Add a note in the code that `start_dual_recording` (WP-2B) should call
`sync.triggerFlash()` AFTER verifying both files started but BEFORE telling
the user recording is live. Don't implement that integration — just leave
a `// TODO: WP-2B integration — fire sync flash after dual verify` comment.

## Rules
- NO emoji in code. ASCII only.
- SSE, not WebSocket (simpler, one-directional, exactly what we need).
- The flash page must work with the browser in full-screen mode (F11).
- No external dependencies — use Node's built-in response streaming for SSE.
- The flash must be SIMULTANEOUS across all connected pages. One loop, one instant.

## Verification
1. Open `http://127.0.0.1:4477/sync-flash.html` in two browser windows
2. Position one on each monitor, press F11 for full-screen
3. `curl -X POST http://127.0.0.1:4477/api/sync/flash`
4. Both windows flash magenta simultaneously and return to black
5. `curl http://127.0.0.1:4477/api/sync/status` → `{ connected: 2 }`

## Files to Create
- `web/sync-flash.html`
- `server/sync.js`

## Files to Modify
- `server/index.js` (import sync module, wire intent)
