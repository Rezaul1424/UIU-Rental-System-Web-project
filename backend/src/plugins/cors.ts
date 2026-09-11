import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

/**
 * Restricts browser cross-origin requests to an explicit allowlist read
 * from CORS_ALLOWED_ORIGINS. Requests with no Origin header (server-to-
 * server calls, curl, Postman) are always allowed — CORS is a browser
 * concept, not a general auth mechanism.
 */
export async function registerCors(app: FastifyInstance): Promise<void> {
  const allowed = new Set(env.corsAllowedOrigins);

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(
        new AppError(403, 'CORS_ORIGIN_NOT_ALLOWED', `Origin ${origin} is not allowed by CORS policy`),
        false,
      );
    },
    credentials: true,
  });
}