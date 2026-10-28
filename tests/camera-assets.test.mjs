import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const version = app.match(/@mediapipe\/tasks-vision@([^/]+)/)?.[1];

test('pinned MediaPipe bundle and WASM assets are published', async () => {
  assert.ok(version, 'app.js should pin a MediaPipe Tasks Vision version');

  for (const asset of ['vision_bundle.mjs', 'wasm/vision_wasm_internal.js']) {
    const url = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${version}/${asset}`;
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(20_000) });
    assert.equal(response.status, 200, `${url} should exist (got HTTP ${response.status})`);
  }
});
