import { Router } from 'express';
import { authRouter } from './auth.js';
import { healthRouter } from './health.js';
import { securityRouter } from './security.js';
import { listingsRouter } from './listings.js';
import { adminRouter } from './admin.js';
import { adminListingsRouter } from './admin-listings.js';

/**
 * All v1 API routes are mounted here and registered under /api/v1 in
 * app.ts. Bumping to /api/v2 later means creating a new router here and
 * mounting it alongside this one — v1 consumers keep working unchanged.
 */
const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/security', securityRouter);
v1Router.use('/listings', listingsRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/admin', adminListingsRouter);

export { v1Router };