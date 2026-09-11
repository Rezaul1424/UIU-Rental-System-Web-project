import { Router } from 'express';
import { healthRouter } from './health.js';

/**
 * All v1 API routes are mounted here and registered under /api/v1 in
 * app.ts. Bumping to /api/v2 later means creating a new router here and
 * mounting it alongside this one — v1 consumers keep working unchanged.
 */
const v1Router = Router();

v1Router.use(healthRouter);

// Future modules register their routers here, e.g.:
// v1Router.use('/listings', listingsRouter);

export { v1Router };