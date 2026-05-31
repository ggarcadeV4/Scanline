# Intent contract

> This is the spec, the agent's function-calling manifest, and your build checklist — one file.
> Each intent: name · what it does · params · tier · status.
> status:  ready (wired) · staged (script exists) · planned (501 for now)

## Tier 1 — common (buttons / Stream Deck)

| intent | does | params | status |
|---|---|---|---|
| `start_recording` | start recording | — | ready |
| `stop_recording` | stop recording | — | ready |
| `pause_recording` | pause/resume recording | — | planned |
| `set_scene` | switch program scene | `{scene}` | ready |
| `flip_solo_dual` | toggle Solo ↔ Dual preset | — | planned |
| `set_source_visible` | show/hide a source | `{source, visible}` | planned |
| `mute` | mute/unmute an input | `{input, muted}` | planned |
| `save_replay` | save last 30s (replay buffer) | — | planned |
| `start_dual_recording` | arm both Source Record files + verify both started | — | planned |

## App-only — things OBS/hardware can't do

| intent | does | params | status |
|---|---|---|---|
| `sync_flash` | full-screen color flash on BOTH monitors at record-start | — | planned |
| `show_asset` | show a carousel asset / lower-third (browser source) | `{assetId}` | planned |
| `hide_asset` | hide current asset | `{assetId?}` | planned |
| `next_asset` | advance the carousel (Stream Deck "next") | — | planned |
| `teleprompter_load` | load a script into the prompter | `{scriptId}` | planned |
| `teleprompter_scroll` | start/stop/speed the prompter | `{action, speed?}` | planned |

## Tier 2 — foreseeable-rare (pre-staged scripts in ./scripts/)

| intent | does | params | status |
|---|---|---|---|
| `chroma_key_cam` | apply chroma key filter to webcam | `{source}` | planned |
| `crop_source` | crop a source to a region | `{source, region}` | planned |
| `switch_profile` | switch OBS profile (e.g. streaming @ 6000kbps) | `{profile}` | planned |
| `build_scene` | assemble a scene from a source list | `{name, sources[]}` | planned |

## Tier 3 — guarded (desktop agent, seat #3 — your patent domain)

| intent | does | params | status |
|---|---|---|---|
| `repair_config` | detect + repair broken OBS config (JSON on disk) | `{collection?}` | planned |
| `backup_config` | snapshot scene collection / profile before changes | — | planned |

> Tier 3 ALWAYS runs guarded: **preview → apply → backup → log.** Agent proposes, you clear,
> it applies. Never autonomous-write without review.

## Deferred (not in this app — see ../../live-engagement/)

Live audience-comment co-host. Inert. Documented there as a future standalone build.
