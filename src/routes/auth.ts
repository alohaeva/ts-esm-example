import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { register, login } from '../auth.js';

const Credentials = Type.Object({
  username: Type.String({ minLength: 3 }),
  password: Type.String({ minLength: 8 }),
});

const TokenResponse = Type.Object({ token: Type.String() });
const ErrorResponse = Type.Object({ error: Type.String() });

export const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post('/register', {
    schema: {
      body: Credentials,
      response: {
        201: TokenResponse,
        409: ErrorResponse,
      },
    },
  }, async (req, reply) => {
    const result = await register(req.body.username, req.body.password);
    if (!result.ok) {
      return reply.code(409).send({ error: result.error });
    }
    const token = app.jwt.sign({ sub: result.value.id, username: result.value.username });
    return reply.code(201).send({ token });
  });

  app.post('/login', {
    schema: {
      body: Credentials,
      response: {
        200: TokenResponse,
        401: ErrorResponse,
      },
    },
  }, async (req, reply) => {
    const result = await login(req.body.username, req.body.password);
    if (!result.ok) {
      return reply.code(401).send({ error: result.error });
    }
    const token = app.jwt.sign({ sub: result.value.id, username: result.value.username });
    return reply.send({ token });
  });
};
