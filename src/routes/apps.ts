import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import type { AppTracker } from '../apps/tracker.js';

const RunningApp = Type.Object({
  pid: Type.Integer(),
  bundleId: Type.Union([Type.String(), Type.Null()]),
  name: Type.String(),
});

const AppEvent = Type.Object({
  type: Type.Union([Type.Literal('open'), Type.Literal('close')]),
  pid: Type.Integer(),
  bundleId: Type.Union([Type.String(), Type.Null()]),
  name: Type.String(),
  at: Type.String(),
});

const AppUsage = Type.Object({
  bundleId: Type.Union([Type.String(), Type.Null()]),
  name: Type.String(),
  launches: Type.Integer(),
  running: Type.Boolean(),
  totalMs: Type.Integer(),
});

export interface AppRoutesOptions {
  tracker: AppTracker;
}

// App activity is personal data, so every route requires a valid JWT.
export const appRoutes: FastifyPluginAsyncTypebox<AppRoutesOptions> = async (app, { tracker }) => {
  app.addHook('onRequest', async (req) => {
    await req.jwtVerify();
  });

  app.get('/running', {
    schema: { response: { 200: Type.Array(RunningApp) } },
  }, async () => tracker.running());

  app.get('/events', {
    schema: {
      querystring: Type.Object({
        since: Type.Optional(Type.String({ format: 'date-time' })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 10_000 })),
      }),
      response: { 200: Type.Array(AppEvent) },
    },
  }, async (req) => tracker.events({
    ...(req.query.since !== undefined && { since: Date.parse(req.query.since) }),
    ...(req.query.limit !== undefined && { limit: req.query.limit }),
  }));

  app.get('/usage', {
    schema: { response: { 200: Type.Array(AppUsage) } },
  }, async () => tracker.usage());
};
