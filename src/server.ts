import Fastify from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { mathRoutes } from './routes/math.js';
import { greetingRoutes } from './routes/greeting.js';

export function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

  app.register(mathRoutes, { prefix: '/api/math' });
  app.register(greetingRoutes, { prefix: '/api/greeting' });

  return app;
}
