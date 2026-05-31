# Claude Code — WP-2B: Dual-Source Recording with Verification Gate

## Context
You are working in `C:\Users\Dad's PC\Desktop\Scanline\studio-control\`.
This is a Node.js Express app that drives OBS via obs-websocket-js v5.
Read `AGENTS.md` for project rules. Read `config/scene-presets.md` for the dual recording spec.

**Key design principle from the spec:** "Verify, don't assume." When we start
dual-source recording, we MUST confirm both files actually started writing
before reporting success. This is a guarded-write pattern.

## Background
The OBS **Source Record** plugin (installed separately in OBS) allows individual
sources to write their own output files alongside the main recording. In Dual
mode, we have:
1. Main recording (the composited output)
2. Source Record on Display Capture 1 (left monitor)
3. Source Record on Display Capture 2 (right monitor)

All three must be running and verified before we tell the user "recording."

## Your Task

### 1. Create `server/dual-record.js` module

This module encapsulates the dual-source recording logic:

```js
/**
 * dual-record.js — Dual-source recording with verification gate
 *
 * Starts main recording + both Source Record outputs, then verifies all three
 * files are actually being written. Returns structured result.
 *
 * The verification gate is the critical piece: Source Record can silently fail
 * (wrong source name, plugin not installed, path not writable). We catch that
 * HERE, not after a 45-minute session.
 */
```

Exports:
- `async startDualRecording(obs)` — returns `{ ok, files[], errors[] }`
- `async stopDualRecording(obs)` — returns `{ ok, files[] }`
- `async getDualStatus(obs)` — returns current state of all three outputs

Implementation notes:
- Source Record exposes its own obs-websocket calls. Research the actual API:
  - It may use `CallVendorRequest` with vendor = "source-record"
  - Or it may expose custom requests like `source-record.startRecording`
  - If the plugin API is unclear, fall back to checking output files on disk
- The verification gate should:
  1. Start all three outputs
  2. Wait 1-2 seconds
  3. Check that each output file exists AND is growing in size
  4. If any file fails: stop everything, report which output failed, why
  5. If all pass: return success with all three file paths
- Source names for the two display captures should be configurable (env var or
  config file), defaulting to "Display Capture 1" and "Display Capture 2"

### 2. Wire intents in `server/index.js`

Add to the switch block:
```js
case 'start_dual_recording': {
  const dualRecord = require('./dual-record');
  const result = await dualRecord.startDualRecording(obs);
  if (!result.ok) return res.status(500).json(result);
  return res.json(result);
}
case 'stop_dual_recording': {
  const dualRecord = require('./dual-record');
  const result = await dualRecord.stopDualRecording(obs);
  return res.json(result);
}
```

Add these to the INTENTS registry:
```js
start_dual_recording: { status: 'ready', tier: 'common', desc: 'Start dual-source recording with verification gate.' },
stop_dual_recording:  { status: 'ready', tier: 'common', desc: 'Stop all three recording outputs.' },
```

### 3. Edge cases to handle

- Source Record plugin not installed → clear error message, not a crash
- Source names don't match OBS scene items → clear error listing available sources
- Output directory not writable → detect and report
- One source starts but the other doesn't → stop everything, report partial failure
- Main recording starts but Source Record doesn't → same treatment
- OBS not connected → existing 503 handler covers this

## Rules
- NO emoji in code. ASCII only.
- All error paths must return structured JSON, never throw unhandled.
- Log every step with `console.log('[dual-record] ...')` prefix.
- Default source names should be configurable without code changes.
- This module must be independently testable (export functions, don't inline in index.js).

## Verification
1. With Source Record properly configured:
   - `POST /api/intent/start_dual_recording` → `{ ok: true, files: [...] }`
   - Check filesystem: 3 files growing
   - `POST /api/intent/stop_dual_recording` → `{ ok: true, files: [...] }`
   - Check filesystem: 3 finalized files

2. With Source Record NOT configured:
   - `POST /api/intent/start_dual_recording` → `{ ok: false, errors: ['...'] }`
   - Main recording should NOT be left running if sources failed

## Files to Create
- `server/dual-record.js` (new module)

## Files to Modify
- `server/index.js` (add intents + switch cases)
