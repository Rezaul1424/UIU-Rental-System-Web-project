import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { registerCors } from './plugins/cors.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerV1Routes } from './routes/index.js';
import { healthRoutes } from './routes/health.js';

/**
 * Builds and fully configures a Fastify instance but never calls
 * `.listen()`. This is what makes the app testable: tests import
 * buildApp() and use `app.inject()` to simulate HTTP requests entirely
 * in-memory, with no real socket, no port collisions, no flakiness.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      // Pretty, colorized logs in dev; raw JSON (better for log
      // aggregators) in production and test.
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
  });

  await registerErrorHandler(app);
  await registerCors(app);

  // Bare /health for load balancers / uptime monitors that don't know
  // about API versioning.
  await app.register(healthRoutes);

  // Everything else lives behind the versioned prefix.
  await app.register(registerV1Routes, { prefix: '/api/v1' });

  return app;
}