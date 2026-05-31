# AGENTS.md — Studio Control Agent Rules

## Project Identity
- **Project:** Studio Control (working name — rename to taste)
- **Location:** `C:\Users\Dad's PC\Desktop\Scanline\studio-control\`
- **What it is:** A control layer + overlay system that DRIVES OBS via obs-websocket
- **What it is NOT:** An OBS replacement. OBS is the engine. This app is the brain.

## Source of Truth
- **Spec:** `README.md` (the design document, agent manifest, AND reference doc)
- **Build order:** `IMPLEMENTATION_PLAN.md` (work packages, agent assignments, verification)
- **Intent contract:** `server/intent/intents.md` (the function-calling manifest)
- **Scene recipes:** `config/scene-presets.md`

## Rules for ALL Agents

### Code Standards
1. **No emoji in code.** ASCII only. Windows charmap codec will crash on emoji in print/log.
2. **501 on unimplemented.** If an intent isn't built yet, return HTTP 501. Never fake success.
3. **Guarded writes.** Any action that modifies persistent OBS config: preview → apply → backup → log.
4. **Verify, don't assume.** Confirm file writes, connection states, source arming before reporting success.
5. **Offline-first.** The common path never needs the cloud. No external API calls for core ops.

### AI Integration — DO NOT BUILD YET
- The three AI seats (runtime summoner, build-time generator, config-repair) are **intentionally deferred**.
- The scaffold is designed to RECEIVE AI later via `GET /api/intents` and the Tier 2/3 script pattern.
- **No LLM calls, no API keys, no model wiring in any work package.** Build the deterministic app first.

### Architecture Constraints
- **Express server** on port 4477.
- **obs-websocket-js v5** connecting to `ws://127.0.0.1:4455`.
- **Plain HTML/JS** for the front-end (no framework required; React upgrade is a future option).
- **Node.js only.** No Python, no compiled binaries.
- **Stream Deck integration** via HTTP POST (Website action type in Stream Deck).

### File Ownership
- `server/index.js` — main server, intent dispatcher, websocket connection
- `server/intent/scripts/` — pre-staged Tier 2 scripts (self-growing library)
- `server/overlays/` — asset library documentation and templates
- `web/` — all front-end pages (dashboard, teleprompter, sync-flash, carousel)
- `config/` — OBS configuration templates and scene recipes
- `assets/` — pre-rendered overlay assets (images, HTML lower-thirds)
- `prompts/` — agent handoff prompts for Codex and Claude Code
- `live-engagement/` — INERT. Phase 2. Do not import. Do not wire. Leave it alone.

### Commit Discipline
- One WP per commit (or logical sub-unit if WP is large).
- Commit message format: `Studio Control WP-X: [brief description]`
- No secrets in commits. `config/obs-websocket.json` is gitignored.

### Testing
- Every WP has a verification step in `IMPLEMENTATION_PLAN.md`.
- Server endpoints: test with `curl` or the dashboard.
- OBS integration: requires OBS running with obs-websocket enabled.
- No automated test framework required for MVP — manual verification per WP.
