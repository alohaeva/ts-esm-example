import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from '../server.js';
import { AppTracker } from '../apps/tracker.js';
import type { RunningApp } from '../apps/source.js';

async function setup() {
  let snapshot: RunningApp[] = [];
  const appTracker = new AppTracker({ source: async () => snapshot });
  await appTracker.poll();
  snapshot = [{ pid: 1, bundleId: 'com.apple.Safari', name: 'Safari' }];
  await appTracker.poll();

  const app = buildServer({ appTracker, logger: false });
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { username: `user${Math.random()}`, password: 'password123' },
  });
  const { token } = res.json() as { token: string };
  return { app, auth: { authorization: `Bearer ${token}` } };
}

test('app routes require a token', async () => {
  const { app } = await setup();
  const res = await app.inject({ method: 'GET', url: '/api/apps/running' });
  assert.equal(res.statusCode, 401);
});

test('GET /api/apps/running, /events and /usage', async () => {
  const { app, auth } = await setup();

  const running = await app.inject({ method: 'GET', url: '/api/apps/running', headers: auth });
  assert.equal(running.statusCode, 200);
  assert.deepEqual(running.json(), [{ pid: 1, bundleId: 'com.apple.Safari', name: 'Safari' }]);

  const events = await app.inject({ method: 'GET', url: '/api/apps/events?limit=10', headers: auth });
  assert.equal(events.statusCode, 200);
  assert.deepEqual((events.json() as { type: string }[]).map((e) => e.type), ['open']);

  const future = await app.inject({
    method: 'GET',
    url: `/api/apps/events?since=${encodeURIComponent(new Date(Date.now() + 60_000).toISOString())}`,
    headers: auth,
  });
  assert.deepEqual(future.json(), []);

  const bad = await app.inject({ method: 'GET', url: '/api/apps/events?since=yesterday', headers: auth });
  assert.equal(bad.statusCode, 400);

  const usage = await app.inject({ method: 'GET', url: '/api/apps/usage', headers: auth });
  assert.equal(usage.statusCode, 200);
  assert.equal((usage.json() as { name: string; launches: number }[])[0]?.launches, 1);
});
