# Front-end

`index.html` is a **placeholder shell** — it proves the front-end can read `/api/status` and
fire an intent, nothing more. It is not the finished UI.

Build out per the README build order. The app's *real* job (the stuff OBS and the Stream Deck
can't do) lives here:

- **Solo ↔ Dual flip** control + a live **status strip** (recording, timer, dropped frames, disk).
- **Teleprompter** — scrolling text, adjustable speed. Put the text directly UNDER the webcam so
  your eyeline sits as close to the lens as possible.
- **Sync-flash** — full-screen color frame on both monitors at record-start.
- **Carousel** — thumbnail gallery over the asset library; pick/order before record, fire via
  Stream Deck during.

Plain HTML/JS is fine to start. If you move to React (matching your Dewey UI / fleet console),
your build-time agent (seat #2) can scaffold it from here.
