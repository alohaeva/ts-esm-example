import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { add, multiply, safeDivide } from '../math.js';

const TwoNumbers = Type.Object({
  a: Type.Number(),
  b: Type.Number(),
});

export const mathRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get('/add', {
    schema: {
      querystring: TwoNumbers,
      response: {
        200: Type.Object({ result: Type.Number() }),
      },
    },
  }, async (req) => {
    return { result: add(req.query.a, req.query.b) };
  });

  app.get('/multiply', {
    schema: {
      querystring: TwoNumbers,
      response: {
        200: Type.Object({ result: Type.Number() }),
      },
    },
  }, async (req) => {
    return { result: multiply(req.query.a, req.query.b) };
  });

  app.get('/divide', {
    schema: {
      querystring: TwoNumbers,
      response: {
        200: Type.Object({ result: Type.Number() }),
        400: Type.Object({ error: Type.String() }),
      },
    },
  }, async (req, reply) => {
    const result = safeDivide(req.query.a, req.query.b);
    if (!result.ok) {
      return reply.code(400).send({ error: result.error });
    }
    return { result: result.value };
  });
};
