import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';

/**
 * All API routes live under /api/v1. Bumping to /api/v2 later means adding
 * a new registerRoutes-style function and mounting it alongside this one —
 * v1 consumers keep working unchanged.
 */
export async function registerV1Routes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);

  // Future modules register their routes here, e.g.:
  // await app.register(authRoutes);
  // await app.register(listingRoutes, { prefix: '/listings' });
}