# Codex Batch — WP-5: Asset Library + Carousel

## Context
You are working in `C:\Users\Dad's PC\Desktop\Scanline\studio-control\`.
Node.js Express app driving OBS via obs-websocket-js v5.
Read `AGENTS.md` for rules. Read `server/overlays/README.md` for the design.

## The Problem
Lower-thirds, recording inserts, and show-and-tell images are all the SAME
library wearing different hats. OBS shows them as browser/image sources. This
system manages the library and lets you fire assets during recording via
Stream Deck ("next, next, next").

## Your Task

### 1. Create `assets/` directory structure

```
assets/
├── manifest.json    ← metadata + ordering for each asset
└── (asset files go here: .png, .html, .svg, etc.)
```

`manifest.json` structure:
```json
{
  "assets": [
    {
      "id": "lower-third-greg",
      "name": "Greg Ferguson - Lower Third",
      "file": "lower-third-greg.html",
      "type": "html",
      "tags": ["lower-third", "presenter"]
    },
    {
      "id": "channel-bug",
      "name": "G&G Arcade Channel Bug",
      "file": "channel-bug.png",
      "type": "image",
      "tags": ["persistent", "branding"]
    }
  ],
  "sessionOrder": []
}
```

Create 2-3 example assets:
- A simple HTML lower-third with the name "Greg Ferguson" and subtitle "G&G Arcade"
  (dark semi-transparent bar with white text, 1920x200px positioned at bottom)
- A simple channel bug PNG placeholder (small corner logo, ~200x60px)
- A "Section Label" HTML template (centered large text on semi-transparent background)

### 2. Create `server/assets.js` module

Routes:
- `GET /api/assets` — list all assets from manifest with metadata
- `GET /api/assets/:id` — get single asset metadata
- `POST /api/assets/order` — body: `{ order: ['id1', 'id2', ...] }` — set session carousel order
- `GET /api/assets/current` — get the currently displayed asset (or null)
- Serve asset files: `GET /api/assets/file/:filename` — serves from `assets/` directory

State:
- `sessionOrder` (array of asset IDs) — the curator's chosen order for this session
- `currentIndex` (number) — current position in the carousel (-1 = nothing shown)
- `currentAssetId` (string|null) — currently displayed asset

Functions (for intent handlers):
- `showAsset(obs, assetId)` — set OBS browser source URL to the asset, make source visible
- `hideAsset(obs, assetId?)` — hide the asset source in OBS
- `nextAsset(obs)` — advance index, show next asset in session order
- `prevAsset(obs)` — go back one asset in session order
- `getStatus()` — current index, total count, current asset info

OBS integration:
- Assets are shown via an OBS **browser source** named "Asset Overlay" (configurable)
- `showAsset` → `SetInputSettings` on the browser source to change URL + `SetSceneItemEnabled` to show
- `hideAsset` → `SetSceneItemEnabled` to hide
- For image assets: serve via Express and set browser source URL to `http://127.0.0.1:4477/api/assets/file/filename.png`
- For HTML assets: same pattern — browser source loads the HTML page

### 3. Create carousel UI in `web/carousel.html`

A standalone page (linked from the main dashboard) for pre-session asset management:

**Layout:**
- Thumbnail grid of all assets (loaded from `/api/assets`)
- Each thumbnail shows: preview (image or rendered HTML), name, tags
- Drag-and-drop reorder (or up/down buttons for simplicity)
- "Set Session Order" button (sends order to server)
- Current carousel state: position X of Y, asset name
- "Show" / "Hide" / "Next" / "Prev" buttons for live control during recording

**Design:**
- Same dark palette as the main dashboard
- Thumbnails with rounded corners, subtle border
- Active/current asset highlighted with accent border
- Clean grid layout, 3-4 columns

### 4. Wire intents in `server/index.js`

Import and call `setupAssetRoutes(app)` before `app.listen()`.

```js
case 'show_asset': {
  const assets = require('./assets');
  const result = await assets.showAsset(obs, req.body.assetId);
  return res.json(result);
}
case 'hide_asset': {
  const assets = require('./assets');
  const result = await assets.hideAsset(obs, req.body.assetId);
  return res.json(result);
}
case 'next_asset': {
  const assets = require('./assets');
  const result = await assets.nextAsset(obs);
  return res.json(result);
}
```

Update INTENTS: all three → `status: 'ready'`

## Rules
- NO emoji in code. ASCII only.
- Assets are FILES ON DISK, not a database. Keep it simple.
- The manifest.json is the single source of truth for available assets.
- OBS browser source name should be configurable (env var or config), default "Asset Overlay".
- Drag-and-drop can be simplified to up/down buttons if complex. Don't over-engineer.
- HTML assets should work when loaded as OBS browser sources (self-contained, no external deps).

## Verification
1. Place test assets in `assets/`, update `manifest.json`
2. `curl http://127.0.0.1:4477/api/assets` → lists all assets
3. Open carousel page → see thumbnails → reorder → save
4. `POST /api/intent/show_asset` with `{ assetId: "lower-third-greg" }` → OBS shows the lower third
5. `POST /api/intent/next_asset` → carousel advances to next asset
6. `POST /api/intent/hide_asset` → OBS hides the overlay

## Files to Create
- `assets/manifest.json`
- `assets/lower-third-greg.html` (example)
- `assets/section-label.html` (example)
- `server/assets.js`
- `web/carousel.html`

## Files to Modify
- `server/index.js` (import module, wire intents)
