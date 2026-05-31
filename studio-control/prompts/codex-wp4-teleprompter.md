# Codex Batch — WP-4: Teleprompter

## Context
You are working in `C:\Users\Dad's PC\Desktop\Scanline\studio-control\`.
Node.js Express app driving OBS via obs-websocket-js v5.
Read `AGENTS.md` for rules.

## The Problem
When recording teaching content, you need a scrolling script visible on screen
but positioned directly UNDER the webcam so your eyeline sits close to the lens.
This is a separate browser window the presenter sees, NOT composited into OBS.

## Your Task

### 1. Create `web/teleprompter.html`

A standalone full-screen teleprompter page:

**Layout:**
- Dark background (`#0a0a0a`)
- Large, high-contrast text (white/near-white on dark, sans-serif for readability)
- Text centered horizontally, filling ~70% of viewport width
- A thin colored line (the "read here" marker) fixed at the top third of the viewport
- Text scrolls upward past the marker line

**Features:**
- **Pre-record mode:** Large textarea to paste or type script text. "Load" button.
- **Prompter mode:** Full-screen scrolling text (textarea hidden).
- **Speed control:** Adjustable scroll speed (pixels per frame). Default: moderate reading pace.
- **Keyboard shortcuts:**
  - `Space` — pause / resume scroll
  - `Up Arrow` — decrease speed
  - `Down Arrow` — increase speed
  - `Home` — jump to top
  - `End` — jump to bottom
  - `F` — toggle fullscreen
  - `Escape` — back to edit mode
  - `+` / `-` — increase / decrease font size
- **Server control:** Listens on SSE from `/api/teleprompter/events` for remote commands:
  - `start` — begin scrolling
  - `stop` — pause scrolling
  - `speed` — set speed value
  - `load` — load new text content
  - `reset` — jump to top

**Visual design:**
- Minimalist. No chrome, no distracting UI elements during prompter mode.
- Current speed shown as a tiny indicator in the bottom-right corner (dims after 3s of no interaction).
- Progress bar along the right edge (how far through the script).
- Smooth scrolling (requestAnimationFrame, not setInterval).

### 2. Create `server/teleprompter.js` module

```js
/**
 * teleprompter.js — Remote teleprompter control
 *
 * Stores the current script text server-side. Exposes REST endpoints for
 * loading text and SSE for real-time scroll control from the dashboard
 * or Stream Deck.
 */
```

Exports:
- `setupTeleprompterRoutes(app)` — mounts all routes

Routes:
- `POST /api/teleprompter/load` — body: `{ text: "..." }` — stores script, sends SSE `load` event
- `POST /api/teleprompter/control` — body: `{ action: 'start'|'stop'|'speed'|'reset', speed?: number }` — sends SSE event
- `GET /api/teleprompter/events` — SSE stream for the prompter page
- `GET /api/teleprompter/text` — returns current stored text (for page reload recovery)

State:
- `currentText` (string) — the loaded script
- `sseClients` (array) — connected prompter pages

### 3. Wire intents in `server/index.js`

Import and call `setupTeleprompterRoutes(app)` before `app.listen()`.

Wire intents:
```js
case 'teleprompter_load': {
  // Forward to the teleprompter module
  const tp = require('./teleprompter');
  tp.loadText(req.body.scriptId || req.body.text);
  return res.json({ ok: true });
}
case 'teleprompter_scroll': {
  const tp = require('./teleprompter');
  tp.control(req.body.action, req.body.speed);
  return res.json({ ok: true });
}
```

Update INTENTS: both → `status: 'ready'`

## Rules
- NO emoji in code. ASCII only.
- NO external dependencies. Plain HTML/CSS/JS on the front end.
- Smooth scrolling via `requestAnimationFrame` — no jank.
- The teleprompter is for the PRESENTER to see, not for OBS to capture.
  It is NOT an OBS browser source.
- Text should support basic markdown-style formatting (bold with **, headers with #)
  rendered as HTML. Keep it simple — no full markdown parser needed.

## Verification
1. Open `http://127.0.0.1:4477/teleprompter.html`
2. Paste text, click Load
3. Text scrolls smoothly at default speed
4. Space pauses/resumes, Up/Down adjusts speed
5. `curl -X POST http://127.0.0.1:4477/api/teleprompter/control -H 'Content-Type: application/json' -d '{"action":"stop"}'` → prompter pauses
6. `curl -X POST http://127.0.0.1:4477/api/teleprompter/load -H 'Content-Type: application/json' -d '{"text":"New script text here"}'` → prompter loads new text

## Files to Create
- `web/teleprompter.html`
- `server/teleprompter.js`

## Files to Modify
- `server/index.js` (import module, wire intents)
