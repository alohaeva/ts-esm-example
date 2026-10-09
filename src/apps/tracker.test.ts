import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppTracker } from './tracker.js';
import type { RunningApp } from './source.js';

const safari: RunningApp = { pid: 10, bundleId: 'com.apple.Safari', name: 'Safari' };
const notes: RunningApp = { pid: 20, bundleId: 'com.apple.Notes', name: 'Notes' };

function setup(initial: RunningApp[]) {
  let snapshot = initial;
  let clock = 0;
  const tracker = new AppTracker({ source: async () => snapshot, now: () => clock });
  return {
    tracker,
    set: (apps: RunningApp[]) => { snapshot = apps; },
    advance: (ms: number) => { clock += ms; },
  };
}

test('apps running at the first poll are a baseline, not opens', async () => {
  const { tracker } = setup([safari]);
  assert.deepEqual(await tracker.poll(), []);
  assert.deepEqual(tracker.running(), [safari]);
});

test('reports opens and closes between polls', async () => {
  const { tracker, set, advance } = setup([safari]);
  await tracker.poll();

  set([safari, notes]);
  advance(1000);
  assert.deepEqual(await tracker.poll(), [
    { type: 'open', pid: 20, bundleId: 'com.apple.Notes', name: 'Notes', at: '1970-01-01T00:00:01.000Z' },
  ]);

  set([notes]);
  advance(1000);
  assert.deepEqual(await tracker.poll(), [
    { type: 'close', pid: 10, bundleId: 'com.apple.Safari', name: 'Safari', at: '1970-01-01T00:00:02.000Z' },
  ]);
  assert.equal(tracker.events().length, 2);
  assert.deepEqual(tracker.events({ limit: 1 }).map((e) => e.type), ['close']);
  assert.deepEqual(tracker.events({ since: 1500 }).map((e) => e.name), ['Safari']);
});

test('a relaunch (new pid) is a close followed by an open', async () => {
  const { tracker, set } = setup([safari]);
  await tracker.poll();
  set([{ ...safari, pid: 11 }]);
  const events = await tracker.poll();
  assert.deepEqual(events.map((e) => [e.type, e.pid]), [['close', 10], ['open', 11]]);
});

test('usage sums closed and still-open time per app', async () => {
  const { tracker, set, advance } = setup([safari]);
  await tracker.poll();
  advance(5000);
  set([]);
  await tracker.poll();
  advance(1000);
  set([{ ...safari, pid: 12 }, notes]);
  await tracker.poll();
  advance(2000);

  assert.deepEqual(tracker.usage(), [
    { bundleId: 'com.apple.Safari', name: 'Safari', launches: 1, running: true, totalMs: 7000 },
    { bundleId: 'com.apple.Notes', name: 'Notes', launches: 1, running: true, totalMs: 2000 },
  ]);
});

test('a failing source keeps state and records the error', async () => {
  let fail = false;
  const tracker = new AppTracker({
    source: async () => {
      if (fail) throw new Error('osascript failed');
      return [safari];
    },
  });
  const errors: unknown[] = [];
  tracker.on('pollError', (err) => errors.push(err));
  await tracker.poll();
  fail = true;
  assert.deepEqual(await tracker.poll(), []);
  assert.equal(tracker.lastError, 'osascript failed');
  assert.equal(errors.length, 1);
  assert.deepEqual(tracker.running(), [safari]);
});
