# Intent layer — AI seat #1 (the long-tail summoner)

This is the **original reason AI is in this project**: the rare, hard-to-find OBS action you
didn't build a button for. You describe it in a sentence; the agent routes it to the right
`obs-websocket` call or a pre-staged script.

The Stream Deck and carousel own the common stuff **precisely so** this layer can own the
uncommon stuff without competing. Don't put an LLM between you and a light switch.

## The three execution tiers

1. **Common → buttons.** Stream Deck / app, via websocket. Deterministic. Not handled here.
2. **Foreseeable-rare → pre-staged scripts** (`./scripts/`). Written, tested, ready. Agent
   picks and fires. Examples: chroma-key cam, crop screen 2, switch to streaming profile @ 6000kbps.
   Most "rare menu items" are STILL deterministic websocket calls — the agent only translates
   your sentence into the right one.
3. **Unforeseen-rare → agent generates under guard.** Something you didn't anticipate. Agent
   proposes a new script → **you review and clear it** (your existing loop) → once vetted it
   **graduates into `./scripts/`**. The library *grows*. This is also the config-repair pattern
   (seat #3): generate a fix, apply under guard.

## Discoverability (build early)

Six months out you won't remember what's in here. The agent can read the intent registry
(`GET /api/intents` in `server/index.js`) so **"what can you do with OBS?"** is answerable from
the manifest. Without this, the long tail goes stale and unusable.

## The contract

See `intents.md` — it is simultaneously the human spec AND the function-calling manifest the
agent reads. One artifact, three jobs: spec, agent toolset, build checklist.

## What AI seat #1 is NOT

Not the operator for common actions (that's the Stream Deck). Not a live improv co-host (that's
the trap — authored-ahead beats improvised-live for teaching content). Live audience-comment
handling is a *separate, deferred* project — see `../../live-engagement/`.
