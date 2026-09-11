import type { FastifyInstance } from 'fastify';

/**
 * Public, unauthenticated health check. Intentionally has no dependency
 * on a database or external service — this proves "the process is up and
 * can answer HTTP requests", nothing more. Once you add a DB in a later
 * module, add a *separate* /health/ready endpoint that checks it, so you
 * can distinguish "process alive" from "fully ready to serve traffic".
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  }));
}