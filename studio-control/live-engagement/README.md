# live-engagement/  —  INERT. Phase 2. Do not wire this in.

> **Status: deliberate bookmark, not unfinished business.** Nothing imports this. It ships
> disabled. This is "incomplete code, not dead code" — a labeled placeholder so a future you (or
> a future session) can build it as its OWN standalone application that bolts onto Studio Control
> later. Don't let anyone "clean it up" — it's intentional.

## What it is

A live audience-comment **co-host**. Not "read top comments aloud" as a gimmick — something
less common: the AI curates comments for *conversational quality* and hands you one the way a
co-host hands you a question, so you respond on camera like a real exchange. (The parts exist;
this specific framing is uncommon and is the part worth building.)

## Why it's deferred — and why that's correct

It's the ONLY idea from planning that doesn't fold into the recording app's architecture. It's a
different machine, and it's a **streaming** feature — and you record, you don't stream (yet).
Bolting it onto the recording app now would complicate the calm, basic surface you wanted, for a
capability you can't use yet. It deserves its own build, done when you know your platform and
audience.

## The components it will need (the real spec, preserved)

1. **Live comment feed** — the stream platform's chat API (YouTube Live, etc.). New integration.
2. **Filtering / ranking model** — judge "engaging" in real time. The genuinely hard, subjective
   part. It will mis-surface things; tuning is ongoing, not one-and-done.
3. **Text-to-speech** — ElevenLabs or similar. Easy piece, real cost, adds latency.
4. **Audio routing** — get the TTS voice INTO the stream without it bleeding into your mic and
   re-creating the feedback problem headphones solved. Non-trivial.
5. **Moderation / safety gate** — a live AI reading audience text aloud WILL eventually voice
   something abusive or a name someone didn't want said. Needs a gate. Gates add latency.

## The key insight — latency is a FEATURE, not a bug

The processing lag (filter + TTS render) is **involuntary** latency. Reclassify it as **dramatic
timing** and hide the involuntary clock inside an intentional one:

- A constructive comment gets selected and **pinned to the top**, where it **holds** visibly so
  the audience can read it themselves (1–2 seconds).
- The readout fires **only when you've stopped talking** — so it never interrupts; it feels like
  a co-host with manners. More dramatic than constant interruption.

This works **only if built deliberately** as orchestration with **two triggers, not a timer**:

- **Pin-and-hold** = the audience's reading time (and absorbs the processing latency).
- **Talk-gate** = the readout waits on a *condition* (you finished), not a countdown.

### The talk-gate has two versions — build the simple one first

- **Phase 2 (achievable):** the talk-gate is a **Stream Deck key** — you tap "read me the next
  one" when ready. YOU conduct the rhythm; the AI just supplies the curated question on cue.
  Sidesteps the hardest piece (reliable real-time speech-end detection) and gives you full
  control of the timing. Delivers ~90% of the magic.
- **Phase 3 (fancy):** automatic **speech-end detection** drives the talk-gate. Build later.

## Rule for keeping this inert

Nothing in `server/` or `web/` imports anything here. No live dependency touches the recording
app. When you're ready to build it: do it as a standalone app, then bolt it on. Until then, this
README IS the deliverable.
