import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJsonlLogger } from './log.js';
import type { AppEvent } from './tracker.js';

test('writes one JSON line per event, in order, creating the directory', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'app-log-')), 'nested', 'events.jsonl');
  const log = createJsonlLogger(path);
  const events: AppEvent[] = Array.from({ length: 20 }, (_, i) => ({
    type: i % 2 ? 'close' : 'open', pid: i, bundleId: null, name: `App ${i}`, at: new Date(i).toISOString(),
  }));
  await Promise.all(events.map(log));
  const lines = (await readFile(path, 'utf8')).trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(lines, events);
});
