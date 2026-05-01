import Fastify from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyJwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';

export function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

  app.register(fastifyJwt, {
    secret: process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
  });

  app.register(authRoutes, { prefix: '/api/auth' });

  return app;
}
