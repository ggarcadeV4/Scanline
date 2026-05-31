# Asset library + overlays (one system, three jobs)

Lower-thirds, recording inserts, and live show-and-tell are **the same library** wearing
different hats. Build it once.

## What it is

A folder of pre-rendered assets. OBS shows them as **browser/image sources** composited over
your video. Your app serves the HTML and pushes text/visibility over the intent layer.

- Lower-third = an HTML/CSS element your app serves. `show_asset` → it appears; `hide_asset` → gone.
- Carousel = a thumbnail gallery front door to the same library. Browse + pick.
- Sync-flash = a special full-screen asset painted on BOTH monitors at record-start (see
  `../../config/scene-presets.md`).

## How you operate it (the physical reality)

- **Pre-load and pre-order BEFORE record.** The win isn't browsing live — it's curating the
  carousel up front in the order you'll likely need. Live, it's mostly "next, next, next."
- **Fire with the Stream Deck**, not by hunting thumbnails mid-sentence. The carousel is for
  *organizing and picking between* takes; the Stream Deck is for *triggering during*. On a live
  call your attention is already split — a physical key is far less disruptive than eyeing a strip.

## Live + Meet (free)

Same library works in recordings AND inside Google Meet via OBS **Virtual Camera**. No separate
build for the client-call case.

## Honest scope — what's live vs. post

- **Live (build here):** only what truly earns record-time presence — persistent channel bug,
  section labels, live data readouts.
- **Post (stays in Adobe):** polished animated name-cards. You can edit in 2–3 hrs; it's not a
  bottleneck, and post gives you fix-it-later control that live burning-in doesn't.

## Build-time AI (seat #2)

Generating the lower-third HTML/CSS *templates* from your brand is a great fit for your existing
agent loop — generate once, refine, keep. (AI improvising lower-third *copy* live = the trap.
Skip it for scripted teaching content.)

## Record- and live-agnostic by design

This library doesn't care whether OBS is recording or streaming — "show this asset now" is the
same call either way. So the live capability is a *consequence* of building this, not extra work.
Stream-only plumbing (chat, alerts, follower notifications) is **deferred** — don't build it
until you actually stream.
