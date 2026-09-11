import express, { type Express } from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { buildCorsMiddleware } from './plugins/cors.js';
import { errorHandler, notFoundHandler } from './plugins/error-handler.js';
import { applySecurityHeaders } from './security/authorization.js';
import { healthRouter } from './routes/health.js';
import { v1Router } from './routes/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: 'admin' | 'landlord' | 'student' | 'guest';
        status: 'active' | 'pending' | 'suspended' | 'deactivated';
        studentId?: string;
      };
    }
  }
}

/**
 * Builds and fully configures an Express app but never calls
 * `.listen()`. This is what makes the app testable: tests import
 * buildApp() and use supertest to simulate HTTP requests against it
 * with no real socket opened.
 *
 * ORDER MATTERS in Express — middleware and routes run top-to-bottom
 * in the order they're registered:
 *   1. Request logging (see everything, even bad requests)
 *   2. CORS (reject disallowed origins before doing any real work)
 *   3. Body parsing (so route handlers can read req.body)
 *   4. Routes
 *   5. 404 handler (catches anything no route matched)
 *   6. Error handler (MUST be last — Express identifies it by its
 *      4-argument signature)
 */
export function buildApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  // Structured request logging. 'dev' format is concise/colored for
  // local development; 'combined' is the standard Apache-style log
  // line, better suited for production log aggregation.
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  app.use(applySecurityHeaders);
  app.use(buildCorsMiddleware());
  app.use(express.json());

  // Bare /health for load balancers / uptime monitors that don't know
  // about API versioning.
  app.use(healthRouter);

  // Everything else lives behind the versioned prefix.
  app.use('/api/v1', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}