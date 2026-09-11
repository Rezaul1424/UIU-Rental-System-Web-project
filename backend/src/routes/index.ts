import { Router } from 'express';
import { authRouter } from './auth.js';
import { healthRouter } from './health.js';
import { securityRouter } from './security.js';
import { listingsRouter } from './listings.js';
import { studentRouter } from './student.js';
import { landlordRouter } from './landlord.js';

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
v1Router.use('/student', studentRouter);
v1Router.use('/students', studentRouter);
v1Router.use('/landlord', landlordRouter);
v1Router.use('/landlords', landlordRouter);

export { v1Router };