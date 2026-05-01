import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import Greeter from '../greeting.js';

const greeter = new Greeter();

export const greetingRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get('/:name', {
    schema: {
      params: Type.Object({ name: Type.String() }),
      response: {
        200: Type.Object({ message: Type.String() }),
      },
    },
  }, async (req) => {
    const user = {
      id: 'guest' as Parameters<typeof greeter.greet>[0]['id'],
      name: req.params.name,
      createdAt: Date.now() as Parameters<typeof greeter.greet>[0]['createdAt'],
    };
    return { message: greeter.greet(user) };
  });
};
