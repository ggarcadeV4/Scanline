# Studio Control — Implementation Plan

> **Project Manager:** Antigravity (Nova)
> **Builders:** Codex (primary implementer) + Claude Code (auditor/complex logic)
> **Environment:** `C:\Users\Dad's PC\Desktop\Scanline\studio-control\`
> **Source of Truth:** `README.md` (spec + manifest + reference)
> **Created:** 2026-05-31

---

## Context

Claude and Greg designed a complete spec for **Studio Control** — a simplified
control layer + overlay system that *drives* OBS instead of replacing it. OBS
stays the engine; this app is the brain and handles the things OBS/hardware
can't do (teleprompter, sync-flash, asset carousel, overlays).

The scaffold is already in place: Express server, obs-websocket connection with
retry, intent registry, placeholder dashboard, scene preset recipes, and full
documentation. Three recording intents are wired (`start_recording`,
`stop_recording`, `set_scene`). Everything else returns 501 by design.

This plan breaks the spec's 8-step build order into discrete, agent-executable
**work packages (WPs)**. Each WP is self-contained, testable, and can be handed
to Codex or Claude Code with a single prompt.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│  Stream Deck  (physical keys — common actions)   │
└────────────┬─────────────────────────────────────┘
             │ HTTP POST /api/intent/:name
┌────────────▼─────────────────────────────────────┐
│  Express Server  (server/index.js, port 4477)    │
│  ├─ Intent Registry (INTENTS object)             │
│  ├─ Pre-staged Scripts (server/intent/scripts/)  │
│  └─ obs-websocket-js ←──── retry loop            │
└────────────┬─────────────────────────────────────┘
             │ obs-websocket v5 (ws://127.0.0.1:4455)
┌────────────▼─────────────────────────────────────┐
│  OBS Studio  (capture, encode, composite, audio) │
│  ├─ Source Record plugin (dual-file output)      │
│  └─ Virtual Camera (Google Meet passthrough)     │
└──────────────────────────────────────────────────┘
             ▲
┌────────────┴─────────────────────────────────────┐
│  Web Dashboard  (web/index.html, port 4477)      │
│  ├─ Status strip (OBS state, REC, timer, disk)   │
│  ├─ Teleprompter (scrolling text under webcam)   │
│  ├─ Sync-flash trigger (both monitors)           │
│  └─ Asset carousel (browse, order, fire)         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  AI Seats (INTENTIONALLY DEFERRED)               │
│  Seat #1: Runtime long-tail summoner             │
│  Seat #2: Build-time generator (this agent loop) │
│  Seat #3: Config-repair under guard              │
└──────────────────────────────────────────────────┘
```

---

## AI Integration — Intentional Deferral

> [!IMPORTANT]
> **The three AI seats are intentionally left as scaffolds.**
> The intent layer (`server/intent/`), the script graduation pattern, and the
> config-repair guard are all *designed* but NOT wired to any model. The app
> must be functional and stable before we decide how AI plugs in. The scaffold
> is built to receive it — the `GET /api/intents` discoverability endpoint and
> the Tier 2/3 script pattern are the integration surface. When the time comes,
> AI wires into those existing hooks. No AI code ships in Phase 1.

---

## Work Packages

### Phase 0 — Foundation (PREREQUISITE)

#### WP-0: Prove the Connection
- **Owner:** Greg (manual) + Codex (verification script)
- **Prerequisite:** OBS Studio installed with obs-websocket enabled
- **Deliverables:**
  - [ ] OBS installed on this machine
  - [ ] obs-websocket enabled in OBS (Tools > WebSocket Server Settings)
  - [ ] `config/obs-websocket.json` created from example (gitignored)
  - [ ] `npm install` run in `studio-control/`
  - [ ] `npm run test-connection` passes — reports OBS version + current scene
- **Verification:** `node scripts/connect-test.js` prints "Success. The pipe works."
- **Files touched:** `config/obs-websocket.json` (new, from example)
- **Risk:** None. Pure validation. If this fails, nothing else matters.

---

### Phase 1 — Core Recording Controls

#### WP-1A: Solo/Dual Scene Presets (OBS-side)
- **Owner:** Greg (manual OBS setup) + Codex (flip intent)
- **Spec source:** `config/scene-presets.md`
- **Deliverables:**
  - [ ] Create "Solo" scene in OBS (Display Capture fills frame + Webcam corner)
  - [ ] Create "Dual" scene in OBS (both monitors as separate Display Capture sources)
  - [ ] Wire `flip_solo_dual` intent in `server/index.js`:
    - Read current scene name
    - If "Solo" → switch to "Dual"; if "Dual" → switch to "Solo"
    - Update INTENTS registry: `planned` → `ready`
  - [ ] Update `intents.md`: status → `ready`
- **Verification:** `POST /api/intent/flip_solo_dual` toggles scene. Dashboard reflects new scene name.
- **Files:** `server/index.js` (modify switch block)

#### WP-1B: Recording Controls — Pause + Mute
- **Owner:** Codex
- **Deliverables:**
  - [ ] Wire `pause_recording` intent:
    - `obs.call('ToggleRecordPause')`
    - Update INTENTS status to `ready`
  - [ ] Wire `mute` intent:
    - `obs.call('SetInputMute', { inputName: args.input, inputMuted: args.muted })`
    - Update INTENTS status to `ready`
  - [ ] Wire `set_source_visible` intent:
    - `obs.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: args.visible })`
    - Requires scene item ID lookup first via `GetSceneItemId`
    - Update INTENTS status to `ready`
- **Verification:** Each intent returns `{ ok: true }` and OBS reflects the change.
- **Files:** `server/index.js` (expand switch block + INTENTS)

#### WP-1C: Live Status Strip (Dashboard Upgrade)
- **Owner:** Codex
- **Spec source:** `web/README.md`
- **Deliverables:**
  - [ ] Expand `/api/status` endpoint to include:
    - `droppedFrames` (from `GetOutputStatus` or `GetStats`)
    - `skippedFrames` (from `GetStats`)
    - `freeDiskSpace` (from `GetStats` → `availableDiskSpace`)
    - `paused` state
  - [ ] Upgrade `web/index.html` status strip:
    - Dropped/skipped frame counters
    - Free disk space indicator
    - Pause state indicator (distinct from recording)
    - Visual recording timer that updates every second (not just timecode from OBS)
  - [ ] Add scene switcher buttons (list scenes from OBS, highlight active)
- **Verification:** Dashboard shows all live stats. Stats update in real-time during recording.
- **Files:** `server/index.js` (expand status endpoint), `web/index.html` (UI upgrade)

---

### Phase 2 — Dual-Source Recording

#### WP-2A: Source Record Plugin Verification
- **Owner:** Greg (manual) + Codex (verification endpoint)
- **Prerequisite:** Source Record OBS plugin installed
- **Deliverables:**
  - [ ] Verify Source Record plugin is installed and current in OBS
  - [ ] Configure Source Record on both Display Capture sources (each writes its own file)
  - [ ] Create `/api/status/sources` endpoint listing all sources and their record states
- **Verification:** Both sources show as armed and producing separate output files.
- **Files:** `server/index.js` (new endpoint)

#### WP-2B: Dual-Source Recording Intent
- **Owner:** Claude Code (complex verification logic)
- **Spec source:** `config/scene-presets.md` → "Verify, don't assume"
- **Deliverables:**
  - [ ] Wire `start_dual_recording` intent:
    1. Start main recording via `StartRecord`
    2. Arm both Source Record outputs
    3. **Verification gate:** confirm BOTH files actually started writing
       (poll file existence / size growth for up to 3 seconds)
    4. Return `{ ok: true, files: [path1, path2] }` on success
    5. Return `{ ok: false, error: '...' }` if either file failed to start
  - [ ] Add corresponding `stop_dual_recording` that stops all three outputs
  - [ ] Update INTENTS registry
- **Verification:** Start dual recording → verify 3 files appear (main + 2 source) → stop → all 3 finalize.
- **Files:** `server/index.js` (new intent handlers), may need utility module
- **Why Claude Code:** The verification gate has edge cases (Source Record API surface, timing, error recovery). Needs careful auditing.

---

### Phase 3 — Sync Flash

#### WP-3: Sync Flash Module
- **Owner:** Codex
- **Spec source:** `config/scene-presets.md` → Sync section
- **Deliverables:**
  - [ ] Create `web/sync-flash.html` — full-screen page that:
    - Listens on a WebSocket or SSE channel from the server
    - On signal: fills entire viewport with a solid, bright, distinctive color
      (e.g., `#FF00FF` magenta — maximally distinct from any content)
    - Holds for exactly 3 frames (~100ms at 30fps) then clears
  - [ ] Create `server/sync.js` module:
    - Exposes a function that opens the flash page on BOTH monitors
      (use `window.open` with specific `left`/`top` positioning, or instruct
      user to pre-position two browser windows)
    - Fires the flash signal to both simultaneously
  - [ ] Wire `sync_flash` intent to trigger the module
  - [ ] Integrate into `start_dual_recording` flow:
    - Sequence: arm files → verify both started → flash → recording is live
- **Verification:** Hit record → both monitors flash magenta simultaneously → both video files contain the same flash frame for post alignment.
- **Files:** `web/sync-flash.html` (new), `server/sync.js` (new), `server/index.js` (wire intent)

---

### Phase 4 — Teleprompter

#### WP-4: Teleprompter Front-End
- **Owner:** Codex
- **Spec source:** `web/README.md`
- **Deliverables:**
  - [ ] Create `web/teleprompter.html` — a standalone page designed to sit
    directly UNDER the webcam (eyeline management):
    - Large, high-contrast text on dark background
    - Smooth auto-scroll at adjustable speed
    - Keyboard shortcuts: Space (pause/resume), Up/Down (speed), Home (restart)
    - Font size control
    - Accepts script text via:
      - Paste into a textarea (pre-record)
      - `POST /api/teleprompter/load` with `{ text }` body
  - [ ] Create `/api/teleprompter/load` endpoint (server)
  - [ ] Create `/api/teleprompter/control` endpoint (server):
    - `{ action: 'start' | 'stop' | 'speed', speed?: number }`
  - [ ] Wire `teleprompter_load` and `teleprompter_scroll` intents
  - [ ] Server→client communication via WebSocket (real-time scroll control)
- **Verification:** Load text via API → teleprompter displays it → scroll starts/stops/speeds via API and keyboard.
- **Files:** `web/teleprompter.html` (new), `server/teleprompter.js` (new), `server/index.js` (mount routes + wire intents)

---

### Phase 5 — Asset Library + Carousel

#### WP-5A: Asset Library Backend
- **Owner:** Codex
- **Spec source:** `server/overlays/README.md`
- **Deliverables:**
  - [ ] Create `assets/` directory for pre-rendered assets (images, HTML lower-thirds)
  - [ ] Create `server/assets.js` module:
    - `GET /api/assets` — list all assets with thumbnails and metadata
    - `POST /api/assets/order` — set the carousel order for a session
    - Assets are files on disk, not a database. Metadata in a `manifest.json`.
  - [ ] Wire `show_asset`, `hide_asset`, `next_asset` intents:
    - `show_asset` → set OBS browser source URL to the asset
    - `hide_asset` → disable the browser source
    - `next_asset` → advance carousel index, show next asset
- **Verification:** Place test assets in `assets/` → API lists them → show/hide/next cycle works via OBS browser source.
- **Files:** `assets/` (new dir), `assets/manifest.json` (new), `server/assets.js` (new), `server/index.js` (mount + wire)

#### WP-5B: Carousel Front-End
- **Owner:** Codex
- **Spec source:** `server/overlays/README.md`
- **Deliverables:**
  - [ ] Create carousel UI in the dashboard (or separate page):
    - Thumbnail grid view of all assets
    - Drag-and-drop reorder
    - "Load order" button (sends order to server)
    - Current position indicator
    - Preview pane
  - [ ] "Next" button wired to `next_asset` intent (also Stream Deck)
- **Verification:** Browse assets → reorder → fire "next" during recording → OBS shows correct asset.
- **Files:** `web/` (carousel UI), may be integrated into `web/index.html` or a new page

---

### Phase 6 — Stream Deck Mapping

#### WP-6: Stream Deck Configuration Guide + Scripts
- **Owner:** Codex (docs) + Greg (physical setup)
- **Deliverables:**
  - [ ] Create `docs/STREAM_DECK_MAP.md`:
    - Recommended key layout for 15-key Stream Deck
    - Each key: label, icon suggestion, HTTP action, URL target
    - Key map:
      - Row 1: Record Start | Record Stop | Pause | Solo↔Dual Flip | Sync+Record
      - Row 2: Mute Mic | Mute System | Show Cam | Hide Cam | [spare]
      - Row 3: Prev Asset | Next Asset | Teleprompter Start | Teleprompter Stop | Nova Voice Toggle
  - [ ] Create companion `.streamDeckProfile` export (if feasible) or manual setup guide
  - [ ] Each Stream Deck key uses the "Website" action type pointing to
    `http://127.0.0.1:4477/api/intent/<name>` with POST method
- **Verification:** Each Stream Deck key triggers the correct intent. Visual feedback in dashboard confirms.
- **Files:** `docs/STREAM_DECK_MAP.md` (new)

---

### Phase 7 — Replay Buffer (Optional)

#### WP-7: Replay Buffer Intent
- **Owner:** Codex
- **Deliverables:**
  - [ ] Wire `save_replay` intent:
    - `obs.call('SaveReplayBuffer')`
    - Requires replay buffer to be enabled in OBS settings
  - [ ] Add replay buffer status to `/api/status`
- **Verification:** Enable replay buffer in OBS → `POST /api/intent/save_replay` → file saved.
- **Files:** `server/index.js`

---

### Phase 8 — Polish + Integration Test

#### WP-8: End-to-End Integration
- **Owner:** Greg (test) + Claude Code (audit)
- **Deliverables:**
  - [ ] Full recording workflow test:
    1. Launch via `launch.bat`
    2. Dashboard connects and shows live status
    3. Solo↔Dual flip works
    4. Start dual-source recording with sync flash
    5. Teleprompter scrolls during recording
    6. Asset carousel fires overlays during recording
    7. Stream Deck controls all of the above
    8. Stop recording → verify 3 output files
    9. Align files in Premiere Pro using sync flash frame
  - [ ] Security audit (Claude Code):
    - No unguarded write endpoints
    - All planned intents still return 501 (not silently succeeding)
    - No secrets in committed files
  - [ ] Update `README.md` with final state
- **Verification:** One complete recording session using the full workflow.

---

## DEFERRED (Do NOT build now)

| Item | Why Deferred | Where Documented |
|------|-------------|-----------------|
| AI Seat #1 (runtime long-tail summoner) | App must be stable first; integration surface is ready | `server/intent/README.md` |
| AI Seat #3 (config-repair under guard) | Same — needs guarded-write pattern proven in production | `server/intent/README.md` |
| Live-engagement co-host | Streaming feature; we record, not stream (yet) | `live-engagement/README.md` |
| Streaming mode | Config flip from recording; no code to build | `README.md` line 42 |
| Lower-third animation | Stays in Adobe post workflow; not a bottleneck | `server/overlays/README.md` |

---

## Agent Assignment Matrix

| WP | Primary Builder | Reviewer | Reason |
|----|----------------|----------|--------|
| WP-0 | Greg + Codex | — | Manual OBS setup + npm install |
| WP-1A | Greg + Codex | Antigravity | Manual scene creation + simple intent |
| WP-1B | Codex | Antigravity | Straightforward websocket calls |
| WP-1C | Codex | Antigravity | UI work, status expansion |
| WP-2A | Greg + Codex | — | Plugin verification |
| WP-2B | Claude Code | Antigravity | Complex verification logic, edge cases |
| WP-3 | Codex | Claude Code | Multi-window timing, dual-monitor sync |
| WP-4 | Codex | Antigravity | UI-heavy, self-contained module |
| WP-5A | Codex | Antigravity | Backend module, filesystem ops |
| WP-5B | Codex | Antigravity | UI-heavy, drag-and-drop |
| WP-6 | Codex + Greg | — | Documentation + physical setup |
| WP-7 | Codex | — | Trivial one-liner |
| WP-8 | Greg + Claude Code | Antigravity (PM) | Integration test + security audit |

---

## House Rules (from spec — enforced on all WPs)

1. **Guarded writes** on anything modifying OBS config: preview → apply → backup → log
2. **501** on unimplemented routes — don't fake success
3. **Offline-first** — the common path never needs the cloud
4. **Verify, don't assume** — confirm file writes, connection states, source arming
5. **No AI code in Phase 1** — the scaffold receives AI later; don't wire it now
6. **No emoji in code** — ASCII only (Windows charmap lesson from Arcade Assistant)

---

## File Inventory (what exists vs. what's needed)

### EXISTS (from Claude scaffold)
- `README.md` — spec + manifest + reference ✓
- `package.json` — express + obs-websocket-js ✓
- `server/index.js` — Express + websocket + 3 ready intents ✓
- `scripts/connect-test.js` — Step 1 proof ✓
- `config/scene-presets.md` — Solo/Dual recipes ✓
- `config/obs-websocket.example.json` — config template ✓
- `server/intent/intents.md` — full intent contract ✓
- `server/intent/README.md` — AI seat #1 design ✓
- `server/intent/scripts/README.md` — Tier 2 script pattern ✓
- `server/overlays/README.md` — asset library design ✓
- `web/index.html` — placeholder dashboard ✓
- `web/README.md` — front-end build list ✓
- `live-engagement/README.md` — deferred Phase 2 ✓
- `launch.bat` — OBS-first launch ✓
- `.gitignore` ✓

### NEEDS TO BE BUILT
- `config/obs-websocket.json` — actual credentials (WP-0)
- `server/sync.js` — sync-flash module (WP-3)
- `server/teleprompter.js` — teleprompter backend (WP-4)
- `server/assets.js` — asset library backend (WP-5A)
- `web/sync-flash.html` — full-screen flash page (WP-3)
- `web/teleprompter.html` — teleprompter UI (WP-4)
- `web/index.html` — upgraded dashboard (WP-1C, WP-5B)
- `assets/` directory + `manifest.json` (WP-5A)
- `docs/STREAM_DECK_MAP.md` — key mapping guide (WP-6)
