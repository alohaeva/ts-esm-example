import Fastify from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyJwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { appRoutes } from './routes/apps.js';
import type { AppTracker } from './apps/tracker.js';

export interface ServerOptions {
  appTracker?: AppTracker;
  logger?: boolean;
}

export function buildServer(options: ServerOptions = {}) {
  const app = Fastify({ logger: options.logger ?? true }).withTypeProvider<TypeBoxTypeProvider>();

  app.register(fastifyJwt, {
    secret: process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
  });

  app.register(authRoutes, { prefix: '/api/auth' });

  if (options.appTracker) {
    app.register(appRoutes, { prefix: '/api/apps', tracker: options.appTracker });
  }

  return app;
}
