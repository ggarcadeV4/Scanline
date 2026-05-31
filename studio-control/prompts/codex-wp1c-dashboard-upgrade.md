# Codex Batch — WP-1C: Dashboard Status Strip Upgrade

## Context
You are working in `C:\Users\Dad's PC\Desktop\Scanline\studio-control\`.
This is a Node.js Express app that drives OBS via obs-websocket-js v5.
Read `AGENTS.md` for project rules.

The current `web/index.html` is a placeholder shell with:
- A dark card with 4 status items (OBS connection, REC state, Scene name, Timecode)
- A single Start/Stop Recording button
- 1-second polling loop to `/api/status`

The current `/api/status` returns: `obsConnected`, `recording`, `timecode`, `scene`.

## Your Task
Upgrade both the status endpoint and the dashboard UI.

### 1. Expand `/api/status` in `server/index.js`

Add these fields to the response:

```js
const stats = await obs.call('GetStats');
const rec = await obs.call('GetRecordStatus');
const scene = await obs.call('GetCurrentProgramScene');

res.json({
  obsConnected: true,
  recording: rec.outputActive,
  paused: rec.outputPaused,
  timecode: rec.outputTimecode,
  outputBytes: rec.outputBytes,
  scene: scene.currentProgramSceneName,
  cpuUsage: stats.cpuUsage,
  memoryUsage: stats.memoryUsage,
  availableDiskSpace: stats.availableDiskSpace,
  renderSkippedFrames: stats.renderSkippedFrames,
  outputSkippedFrames: stats.outputSkippedFrames,
  activeFps: stats.activeFps
});
```

### 2. Upgrade `web/index.html`

Replace the placeholder with a production dashboard. Requirements:

**Status Strip (top bar):**
- OBS connection dot (green = connected, gray = disconnected)
- Recording state with pulsing red dot when active, amber when paused
- Live timecode counter
- Scene name with click-to-switch dropdown
- FPS counter
- Dropped/skipped frame counters (warn color if > 0)
- Free disk space (human-readable: GB)
- CPU usage percentage

**Control buttons (below strip):**
- Start Recording / Stop Recording (toggle)
- Pause / Resume (toggle, only visible when recording)
- Solo / Dual flip button (shows current mode)
- Mute Mic toggle
- Mute System toggle

**Scene list (sidebar or below):**
- Fetch scene list from a new `GET /api/scenes` endpoint
- Each scene is a clickable button
- Active scene is highlighted

### 3. Add `GET /api/scenes` endpoint in `server/index.js`

```js
app.get('/api/scenes', async (req, res) => {
  if (!obsConnected) return res.json({ scenes: [] });
  try {
    const { scenes, currentProgramSceneName } = await obs.call('GetSceneList');
    res.json({ scenes: scenes.map(s => s.sceneName), active: currentProgramSceneName });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});
```

## Design Specifications

Use the existing color palette from the current `index.html`:
```css
--bg: #14110f; --panel: #1e1a17; --line: #3a322c;
--ink: #efe7dd; --muted: #9c8f81; --live: #d6452b; --ok: #6fae6a; --accent: #e0a64a;
```

Add:
```css
--warn: #e8a335;   /* amber for pause state and frame drops */
--danger: #d6452b; /* same as --live, for error states */
```

- Keep the serif font (Iowan Old Style / Palatino / Georgia)
- Monospace font for the status strip (already in place)
- Recording dot should pulse with a CSS animation when recording
- Status strip should be a fixed bar at the top
- Controls should be accessible without scrolling
- Responsive but desktop-first (this runs on the recording machine)

## Rules
- NO emoji in code. ASCII only.
- NO external CDN or framework. Plain HTML/CSS/JS.
- NO placeholder text like "coming soon." If it's not built, don't show it.
- Poll interval stays at 1 second.
- Keep the existing card aesthetic — dark, warm, serif. This is a studio tool, not a gamer dashboard.

## Files to Change
- `server/index.js` — expand `/api/status`, add `/api/scenes`
- `web/index.html` — full UI upgrade (overwrite the placeholder)
