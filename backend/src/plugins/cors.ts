import cors from 'cors';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

/**
 * Restricts browser cross-origin requests to an explicit allowlist read
 * from CORS_ALLOWED_ORIGINS. Requests with no Origin header (server-to-
 * server calls, curl, Postman) are always allowed — CORS is a browser
 * concept, not a general auth mechanism.
 */
export function buildCorsMiddleware(): RequestHandler {
  const allowed = new Set(env.corsAllowedOrigins);

  return cors({
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(
        new AppError(403, 'CORS_ORIGIN_NOT_ALLOWED', `Origin ${origin} is not allowed by CORS policy`),
      );
    },
    credentials: true,
  });
}
