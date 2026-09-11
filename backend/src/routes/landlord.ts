import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApplicationReviewPayloadSchema, LandlordListingPayloadSchema, MaintenanceUpdatePayloadSchema, LandlordProfileSchema } from '../contracts/landlord.js';
import { landlordService } from '../landlord/service.js';

const router = Router();

const listingUpdateSchema = LandlordListingPayloadSchema.partial();

router.use(requireAuth, requireRole('landlord'));

router.get('/profile', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const profile = await landlordService.getProfile(currentUser.id);
  res.json({ data: LandlordProfileSchema.parse(profile ?? {
    id: currentUser.id,
    userId: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    companyName: undefined,
    propertyCount: 0,
    isVerified: false,
  }) });
}));

router.get('/listings', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const listings = await landlordService.getMyListings(currentUser.id);
  res.json({ data: listings });
}));

router.post('/listings', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const payload = LandlordListingPayloadSchema.parse(req.body);
  const listing = await landlordService.createListing(currentUser.id, payload);
  res.status(201).json({ data: listing });
}));

router.patch('/listings/:listingId', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const listingId = z.string().trim().min(1).parse(req.params.listingId);
  const payload = listingUpdateSchema.parse(req.body);
  const listing = await landlordService.updateListing(currentUser.id, listingId, payload);
  res.json({ data: listing });
}));

router.get('/applications', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const applications = await landlordService.getApplications(currentUser.id);
  res.json({ data: applications });
}));

router.patch('/applications/:applicationId/review', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const applicationId = z.string().trim().min(1).parse(req.params.applicationId);
  const payload = ApplicationReviewPayloadSchema.parse({ ...req.body, applicationId });
  const result = await landlordService.reviewApplication(currentUser.id, applicationId, payload);
  res.json({ data: result });
}));

router.get('/leases', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const leases = await landlordService.getLeases(currentUser.id);
  res.json({ data: leases });
}));

router.get('/maintenance', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const requests = await landlordService.getMaintenanceRequests(currentUser.id);
  res.json({ data: requests });
}));

router.patch('/maintenance/:requestId/status', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const requestId = z.string().trim().min(1).parse(req.params.requestId);
  const payload = MaintenanceUpdatePayloadSchema.parse({ ...req.body, requestId });
  const result = await landlordService.updateMaintenanceStatus(currentUser.id, requestId, payload);
  res.json({ data: result });
}));

export { router as landlordRouter };
