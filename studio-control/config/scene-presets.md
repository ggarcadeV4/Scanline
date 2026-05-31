# Scene presets — the framing decisions, made concrete

Two presets, one flip between them. This file is the recipe; build them inside OBS.

## SOLO  (default — most sessions)

- **Canvas:** 1920×1080 (16:9).
- **Sources:** Primary monitor (Display Capture) fills the frame + Webcam in a corner.
- **Use:** Your everyday format. Clean 16:9. Crops cleanly to vertical (9:16) / square (1:1)
  for social, because there's one screen of content, not two.
- **Social cuts come from here**, not from Dual.

## DUAL  (the teaching mode — minority of sessions)

- **The point:** Teaching the cross-source move ("find it *here*, carry it *there*"). That
  motion is invisible on one screen; it's the whole lesson on two.
- **Capture strategy — TWO clean 16:9 outputs, not one 32:9 wide canvas:**
  - Each monitor is a native 1920×1080 source.
  - Use the **Source Record** OBS plugin to write *each* Display Capture to its **own file**
    alongside the main recording. (Verify the plugin is current/healthy at build time — that
    ecosystem moves.)
  - Compose them however the story needs **in post**: side-by-side, picture-in-picture, cut
    between, zoom one while the other waits. Full layout freedom, full resolution.
  - **Fallback:** record one 3840×1080 wide canvas and crop in post. Works, but loses
    resolution. Documented escape hatch, not the goal.
- **This is a desktop-first YouTube 16:9 deliverable.** Don't try to make the two-screen
  masterpiece vertical — vertical/square cuts are separate short promos from SOLO footage or a
  single element.

## The flip

SOLO ↔ DUAL is one of your most-used actions → top **Stream Deck** key (`flip_solo_dual`).

## Sync (Dual, and any multi-file take)

- **Anchor is VISUAL, not audio.** One mic = one voice track; the two screen captures are two
  *video* tracks. You align the videos, not the sound. (This is why the clap idea was dropped.)
- **The app paints a full-screen color FLASH across both monitors at record-start** → both
  files capture the same frame → align by that frame in post. Sync is born into every take.
- Sequence: hit record → app starts both captures (Source Record arms both files) → app flashes
  both monitors at the same instant → app clears flash → you talk.
- The on-screen **countdown is for YOU** (when to start performing). The **flash is for the
  machine** (alignment). Don't stack two ceremonies: countdown → flash → roll.
- **Verify, don't assume:** `start dual-source recording` must confirm BOTH files actually
  started writing before you trust it (guarded-write flavored check).

## Audio (applies to both presets)

- **Wear headphones.** Breaks the speaker→mic loop; the hollow "off" sound (comb filtering from
  two slightly-offset copies of the demo audio) disappears. Then OBS captures demo audio clean
  and SEPARATE from your voice — balance them independently in post. Acoustic fix, not software.

## Client calls (bonus, no extra build)

- OBS **Virtual Camera** can output either preset as your "webcam" inside Google Meet. The
  overlays, carousel, and dual layout all ride along. Free upgrade to client meetings.
