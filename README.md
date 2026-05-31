# Studio Control

> Working name — rename to taste. A simplified control layer + overlay system that
> *drives* OBS instead of replacing it. OBS stays the engine; this app is the brain
> and the things OBS/hardware can't do.

This document is three things at once:
1. The **spec** — what we're building and why.
2. The **agent manifest** — the toolset the AI reads to route your spoken requests.
3. The **reference doc** — the record of every decision, so a future session (or future you)
   can pick this up cold without re-deriving it.

---

## The one-sentence design

**Don't replace OBS — drive it.** OBS keeps doing the hard part (capture, encode,
composite, audio). This app talks to it over `obs-websocket` (built into OBS 28+) and
exposes only the workflows you actually use, named and laid out the way *you* think.
The Stream Deck you already own is the physical trigger surface. The AI handles the rare
long-tail and the config-repair chores. That turns a multi-year rebuild into a buildable
project.

---

## Who does what (the division of labor)

| Layer | Owner | Why |
|---|---|---|
| Capture / encode / composite / audio | **OBS** | Battle-tested. Never rebuild this. |
| Common actions (record, scene flip, mute, source on/off) | **Stream Deck + obs-websocket** | You own the hardware. Physical key beats a software button. |
| Things OBS/hardware can't do (teleprompter, sync-flash, asset carousel, overlays) | **This app** | Pure front-end + websocket. The real reason the app exists. |
| Rare "hard-to-find menu" actions | **AI intent layer** (seat #1) | You describe it; agent routes to the right websocket call or pre-staged script. |
| Building the app, scripts, templates, assets | **Build-time AI** (seat #2) | Your existing Claude → agent loop. Highest value, zero runtime risk. |
| Repairing broken OBS config | **Desktop agent under guard** (seat #3) | JSON on disk. Literally your patent domain. |

---

## Settled decisions (the spec)

- **Mode:** Record-only. YouTube-primary, social cuts made afterward.
- **Live:** Parked, *not* precluded — record and stream are the same OBS pipeline, so live
  is a config flip later, not a rebuild. Build nothing stream-specific now.
- **Client calls:** Google Meet stays the live tool. OBS **Virtual Camera** lets this app's
  composited scene (overlays, carousel, dual monitor) become your "webcam" inside Meet —
  free upgrade, no video-conferencing to build.
- **Two scene presets + a flip:**
  - **Solo** — primary monitor fills frame, webcam corner. Default, most sessions, clean
    16:9, crops to vertical/square for social.
  - **Dual** — both monitors, the teaching mode for cross-source workflow ("find it here,
    carry it there"). Desktop-first wide; lives on YouTube as-is.
  - The Solo↔Dual flip is a top Stream Deck key.
- **Dual capture = two clean 16:9 outputs**, not one 32:9 wide canvas. Each monitor is a
  native 1920×1080 source; capture each to its own file (via **Source Record** plugin —
  verify current/healthy at build time). Compose freely in post. Single-wide kept as a
  documented fallback (crop loses resolution).
- **Sync:** Visual **color flash** painted by *this app* across both monitors at
  record-start → shared frame in both files → align by frame in post. Audio is NOT the
  anchor (one mic = one voice track, two video tracks). Countdown is for *you*; flash is
  for the *machine*.
- **Audio feedback fix:** Headphones. Breaks the speaker→mic loop physically; the hollow
  "off" sound (comb filtering from two copies of the demo audio) just disappears. OBS then
  captures demo audio clean + separate from voice. Acoustic fix, not code.
- **Overlays / lower-thirds / carousel = ONE asset library** (see below). Record- and
  live-agnostic by design.

---

## Must-have controls (Tier 1 — mostly Stream Deck)

Record start / stop / pause · Scene switch · **Solo↔Dual flip** · Source visibility
(cam, screen 1, screen 2) · Mute (mic, system) · **Start dual-source recording** (with a
"did both files actually start?" verification — guarded-write flavored) · Live status strip
(recording state + timer, dropped/skipped frames, free disk) · Replay buffer "save last 30s"
(optional).

---

## The asset library (overlays + lower-thirds + carousel — one system)

Three things you were tracking separately collapse into **one** library with a carousel front door:

- **What it is:** A folder of pre-rendered assets (lower-thirds, channel bug, section labels,
  show-and-tell images). OBS shows them as browser/image sources.
- **How you operate it:** *Pre-load and pre-order before record* (curate up front), then
  *fire with the Stream Deck* during ("next, next, next"). The carousel is for organizing and
  picking between; the Stream Deck is for triggering during. Don't browse thumbnails mid-sentence.
- **Live + Meet:** Same library serves recordings *and* Google Meet (via Virtual Camera). No
  separate build.
- **Honest scope:** Polished animated name-cards stay in your **Adobe post workflow** (you can
  edit in 2–3 hrs — it's not a bottleneck). Build *live* overlays only for what truly earns
  record-time presence: persistent bug, section labels, live data.

---

## The three AI seats (and the one trap)

1. **Build-time generator (seat #2)** — the workhorse. Generates app code, pre-staged scripts,
   lower-third HTML/CSS templates, carousel assets, *draft teleprompter scripts*. Never touches
   a live recording. Your existing agent loop.
2. **Runtime long-tail summoner (seat #1)** — the original reason AI is here. You describe a
   rare action in a sentence; agent routes it to the right `obs-websocket` call or pre-staged
   script. The Stream Deck owns the common stuff *so this can own the uncommon stuff.*
3. **Runtime config-repair (seat #3)** — your patent domain. "My scene collection is broken."
   OBS scenes/profiles are JSON on disk. The one place a *desktop* agent (not websocket) earns
   its keep at runtime — and it runs **guarded** (preview → apply → backup → log), your house rule.

**The trap (do NOT build):** an AI "co-host" that improvises your teleprompter lines or
auto-throws lower-thirds live. For a *scripted teaching* channel, authored-ahead beats
improvised-live. AI *drafting* your script at build-time = great (seat #2). AI *driving* it
live = undermines the thing that makes the content good.

---

## The three execution tiers (how an action fires)

- **Common → buttons.** Stream Deck / app buttons via websocket. Deterministic.
- **Foreseeable-rare → pre-staged scripts.** Written, tested, sitting ready in
  `server/intent/scripts/`. Agent picks and fires. (chroma key, crop, profile switch…)
- **Unforeseen-rare → agent generates under guard.** Agent proposes a new script → you review
  and clear (your existing loop) → once vetted it **graduates into the pre-staged library.**
  The library *grows*; it isn't a fixed list. This is also the config-repair pattern.

> Discoverability rule: the agent can read its own script registry, so "what can you do with
> OBS?" is answerable from the manifest. Build this early or the long tail goes stale on you.

---

## House rules (carried over from Arcade Assistant, for consistency)

- **Guarded writes** on anything that modifies OBS config: preview → apply → backup → log.
- **501** on unimplemented routes (don't fake success).
- **Offline-first** — the common path never needs the cloud.
- **Verify, don't assume** — e.g. confirm both dual-source files actually started writing.

---

## Launch order (the gotcha that makes first-run "just work")

OBS must be **up with obs-websocket listening** before the app connects. `launch.bat` starts
OBS first, then the app connects with a short **retry loop** (don't assume the socket is ready
on the first ping). See `launch.bat` and `scripts/connect-test.js`.

---

## Build order (de-risked)

1. **Prove the connection** — `scripts/connect-test.js`. Enable obs-websocket in OBS, run it,
   fire one command. Validates the whole concept in an afternoon. **Do this first.**
2. **Solo/Dual scene presets** in OBS + the flip. See `config/scene-presets.md`.
3. **Dual-source recording** via Source Record + the "both files started?" check.
4. **Sync-flash module** (app-painted, both monitors, on record-start).
5. **Teleprompter** (app front-end; text under the webcam for eyeline).
6. **Asset library + carousel** (browser sources; Stream Deck triggers).
7. **AI intent layer** (seat #1) reading the script registry.
8. **Stream Deck mapping** for Tier-1 + the flip + asset "next."

> `live-engagement/` is **inert** — a documented bookmark for a future standalone build.
> Nothing imports it. It ships disabled. See its README.

---

## Folder map

```
studio-control/
├── README.md                  ← this file (spec + manifest + reference)
├── launch.bat                 ← OBS-first launch sequence + retry
├── package.json               ← Node deps
├── config/
│   ├── scene-presets.md       ← Solo / Dual canvas sizes + scene recipes
│   └── obs-websocket.example.json
├── scripts/
│   └── connect-test.js        ← STEP 1: the "does this even work" proof (runnable)
├── server/
│   ├── index.js               ← Express + obs-websocket connect w/ retry; 501 on unimplemented
│   ├── intent/
│   │   ├── README.md          ← AI seat #1: long-tail summoner + tiers
│   │   ├── intents.md         ← intent contract = spec AND agent toolset
│   │   └── scripts/           ← pre-staged scripts (Tier 2); grows under guard
│   └── overlays/
│       └── README.md          ← asset library, lower-thirds, sync-flash
├── web/
│   ├── index.html             ← dashboard shell (placeholder; build out per build order)
│   └── README.md
└── live-engagement/
    └── README.md              ← INERT Phase 2. Pin-and-hold + talk-gate design preserved.
```
