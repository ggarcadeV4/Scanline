/**
 * connect-test.js  —  BUILD STEP 1: "does this even work?"
 * ---------------------------------------------------------------------------
 * Run this FIRST, before building anything else. If it connects and reports
 * OBS's version + current scene, the entire project is validated. That's the
 * whole de-risking move: prove the pipe in an afternoon.
 *
 * SETUP (one time):
 *   1. In OBS:  Tools > WebSocket Server Settings
 *        - Enable WebSocket server: ON
 *        - Note the Port (default 4455) and Password (click "Show Connect Info")
 *   2. npm install   (installs obs-websocket-js — see package.json)
 *   3. Set OBS_WS_PASSWORD below or via env var, then:  node scripts/connect-test.js
 *
 * This script ONLY reads + (optionally) toggles recording. It writes no config.
 */

const { OBSWebSocket } = require('obs-websocket-js');

const URL = process.env.OBS_WS_URL || 'ws://127.0.0.1:4455';
const PASSWORD = process.env.OBS_WS_PASSWORD || ''; // <-- put your password here or in env

// Flip to true to also prove WRITE access (starts then stops a 3s recording).
const PROVE_RECORDING = false;

async function connectWithRetry(obs, attempts = 5, delayMs = 1500) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const { obsWebSocketVersion } = await obs.connect(URL, PASSWORD);
      console.log(`Connected. obs-websocket v${obsWebSocketVersion}`);
      return true;
    } catch (err) {
      console.log(`  attempt ${i}/${attempts} failed (${err.message}). retrying...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return false;
}

(async () => {
  const obs = new OBSWebSocket();

  if (!(await connectWithRetry(obs))) {
    console.error('\nCould not connect. Checklist:');
    console.error('  - Is OBS running?');
    console.error('  - Is the WebSocket server enabled in OBS?');
    console.error('  - Do URL + password match? (URL=' + URL + ')');
    process.exit(1);
  }

  // READ: prove we can see OBS state.
  const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
  const { scenes } = await obs.call('GetSceneList');
  console.log(`Current scene: ${currentProgramSceneName}`);
  console.log(`Scenes found:  ${scenes.map(s => s.sceneName).join(', ') || '(none yet)'}`);

  // WRITE (optional): prove we can control recording.
  if (PROVE_RECORDING) {
    console.log('Starting a 3-second test recording...');
    await obs.call('StartRecord');
    await new Promise(r => setTimeout(r, 3000));
    const { outputPath } = await obs.call('StopRecord');
    console.log(`Stopped. File written to: ${outputPath}`);
  }

  await obs.disconnect();
  console.log('\nSuccess. The pipe works — you can build on this.');
})();
