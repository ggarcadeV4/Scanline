/**
 * server/index.js  —  the control app's backend (SCAFFOLD)
 * ---------------------------------------------------------------------------
 * What's real here:  the obs-websocket connection + retry loop, the intent
 * endpoint shape, and the house rules (501 on unimplemented, guarded-write
 * placeholder, offline-first — the common path never calls the cloud).
 *
 * What's stubbed:  most intents return 501 on purpose. Fill them in per the
 * build order in README.md. Do NOT fake success — 501 means "not built yet."
 */

const express = require('express');
const { OBSWebSocket } = require('obs-websocket-js');

const PORT = process.env.PORT || 4477;
const OBS_WS_URL = process.env.OBS_WS_URL || 'ws://127.0.0.1:4455';
const OBS_WS_PASSWORD = process.env.OBS_WS_PASSWORD || '';

const obs = new OBSWebSocket();
let obsConnected = false;

async function connectOBS(attempts = 10, delayMs = 1500) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await obs.connect(OBS_WS_URL, OBS_WS_PASSWORD);
      obsConnected = true;
      console.log('[obs] connected');
      return;
    } catch (err) {
      console.log(`[obs] connect attempt ${i}/${attempts} failed (${err.message})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.log('[obs] giving up for now — app still serves; will reconnect on demand');
}
obs.on('ConnectionClosed', () => { obsConnected = false; console.log('[obs] disconnected'); });

// ---------------------------------------------------------------------------
// INTENT REGISTRY  (AI seat #1 reads this; it's also the discoverability source)
// status: 'ready' = wired to websocket | 'staged' = pre-written script exists
//         'planned' = on the roadmap, returns 501 for now
// ---------------------------------------------------------------------------
const INTENTS = {
  start_recording:   { status: 'ready',   tier: 'common',     desc: 'Start recording.' },
  stop_recording:    { status: 'ready',   tier: 'common',     desc: 'Stop recording.' },
  set_scene:         { status: 'ready',   tier: 'common',     desc: 'Switch program scene. params: {scene}' },
  flip_solo_dual:    { status: 'planned', tier: 'common',     desc: 'Toggle Solo <-> Dual scene preset.' },
  mute:              { status: 'planned', tier: 'common',     desc: 'Mute an input. params: {input}' },
  sync_flash:        { status: 'planned', tier: 'app',        desc: 'Paint color flash on both monitors at record-start.' },
  show_asset:        { status: 'planned', tier: 'app',        desc: 'Show a carousel asset / lower-third. params: {assetId}' },
  chroma_key_cam:    { status: 'planned', tier: 'foreseeable',desc: 'Apply chroma key filter to webcam source.' },
  crop_source:       { status: 'planned', tier: 'foreseeable',desc: 'Crop a source. params: {source, region}' },
  repair_config:     { status: 'planned', tier: 'guarded',    desc: 'Seat #3: detect+repair OBS config. preview->apply->backup->log.' }
};

const app = express();
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '..', 'web')));

// Live status strip feeds off this.
app.get('/api/status', async (req, res) => {
  if (!obsConnected) return res.json({ obsConnected: false });
  try {
    const rec = await obs.call('GetRecordStatus');
    const scene = await obs.call('GetCurrentProgramScene');
    res.json({ obsConnected: true, recording: rec.outputActive, timecode: rec.outputTimecode, scene: scene.currentProgramSceneName });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// The agent (and the UI) hit this. Discoverability: GET returns the registry.
app.get('/api/intents', (req, res) => res.json(INTENTS));

app.post('/api/intent/:name', async (req, res) => {
  const name = req.params.name;
  const intent = INTENTS[name];
  if (!intent) return res.status(404).json({ error: `unknown intent: ${name}` });
  if (intent.status === 'planned') {
    // HOUSE RULE: 501 on unimplemented. Do not fake success.
    return res.status(501).json({ error: `intent "${name}" not implemented yet`, intent });
  }
  if (!obsConnected) await connectOBS(3, 1000);
  if (!obsConnected) return res.status(503).json({ error: 'OBS not connected' });

  try {
    switch (name) {
      case 'start_recording': await obs.call('StartRecord'); break;
      case 'stop_recording':  await obs.call('StopRecord'); break;
      case 'set_scene':       await obs.call('SetCurrentProgramScene', { sceneName: req.body.scene }); break;
      default: return res.status(501).json({ error: `handler for "${name}" not wired yet` });
    }
    res.json({ ok: true, intent: name });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`[app] Studio Control on http://127.0.0.1:${PORT}`);
  connectOBS();
});
