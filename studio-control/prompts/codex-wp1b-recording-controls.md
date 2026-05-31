# Codex Batch — WP-1B: Recording Controls (Pause + Mute + Source Visibility)

## Context
You are working in `C:\Users\Dad's PC\Desktop\Scanline\studio-control\`.
This is a Node.js Express app that drives OBS via obs-websocket-js v5.
Read `AGENTS.md` for project rules. Read `README.md` for the full spec.

The server (`server/index.js`) already has:
- Express on port 4477
- obs-websocket connection with retry loop
- INTENTS registry with 10 intents defined (3 wired: start_recording, stop_recording, set_scene)
- Intent dispatcher at `POST /api/intent/:name`

## Your Task
Wire three currently-planned intents into the existing switch block in `server/index.js`.

### 1. `pause_recording`
```js
case 'pause_recording':
  await obs.call('ToggleRecordPause');
  break;
```
Update INTENTS entry: `status: 'planned'` → `status: 'ready'`

### 2. `mute`
```js
case 'mute':
  await obs.call('SetInputMute', {
    inputName: req.body.input,
    inputMuted: req.body.muted !== false  // default true if not specified
  });
  break;
```
Update INTENTS entry: `status: 'planned'` → `status: 'ready'`
Update desc to include the param behavior.

### 3. `set_source_visible`
```js
case 'set_source_visible': {
  // Need to look up the sceneItemId first — OBS requires it
  const sceneName = req.body.scene || (await obs.call('GetCurrentProgramScene')).currentProgramSceneName;
  const { sceneItemId } = await obs.call('GetSceneItemId', {
    sceneName,
    sourceName: req.body.source
  });
  await obs.call('SetSceneItemEnabled', {
    sceneName,
    sceneItemId,
    sceneItemEnabled: req.body.visible !== false
  });
  break;
}
```
Update INTENTS entry: `status: 'planned'` → `status: 'ready'`

### 4. Also wire `flip_solo_dual`
```js
case 'flip_solo_dual': {
  const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
  const target = currentProgramSceneName === 'Solo' ? 'Dual' : 'Solo';
  await obs.call('SetCurrentProgramScene', { sceneName: target });
  break;
}
```
Update INTENTS entry: `status: 'planned'` → `status: 'ready'`

## Rules
- NO emoji in code. ASCII only.
- Keep the existing code structure intact. Only expand the switch block and update INTENTS.
- Do NOT add new dependencies.
- Do NOT modify any other files.
- The `if (intent.status === 'planned')` check at line 79 must be REMOVED or changed to only
  apply to intents that are STILL planned. Since you're moving these to 'ready', the check
  will naturally pass them through.

## Verification
After your changes, these should all return `{ ok: true }`:
```
POST /api/intent/pause_recording
POST /api/intent/mute          body: { "input": "Mic/Aux", "muted": true }
POST /api/intent/set_source_visible  body: { "source": "Webcam", "visible": false }
POST /api/intent/flip_solo_dual
```

## Files to Change
- `server/index.js` (ONLY this file)
