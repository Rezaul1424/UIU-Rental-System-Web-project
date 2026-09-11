import { Router } from 'express';

const router = Router();

/**
 * Public, unauthenticated health check. Intentionally has no dependency
 * on a database or external service — this proves "the process is up and
 * can answer HTTP requests", nothing more. Once a database is added in a
 * later module, add a SEPARATE /health/ready endpoint that checks it, so
 * you can distinguish "process alive" from "fully ready to serve traffic".
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };