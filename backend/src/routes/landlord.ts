import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApplicationReviewPayloadSchema, LandlordListingPayloadSchema, MaintenanceUpdatePayloadSchema, LandlordProfileSchema } from '../contracts/landlord.js';
import { landlordService } from '../landlord/service.js';
import { listChatConversations, sendLandlordChatMessage } from '../chat/repository.js';
import { listUserNotifications, markUserNotificationsRead } from '../notifications/user-repository.js';

const router = Router();

const listingUpdateSchema = LandlordListingPayloadSchema.partial();

router.use(requireAuth, requireRole('landlord'));

router.get('/notifications', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  res.json({ data: await listUserNotifications(Number(currentUser.id), 'landlord') });
}));

router.patch('/notifications/read', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  const body = z.object({ notificationId: z.number().int().positive().optional() }).default({}).parse(req.body);
  await markUserNotificationsRead(Number(currentUser.id), body.notificationId);
  res.status(204).send();
}));

router.get('/chat', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  res.json({ data: await listChatConversations('landlord', currentUser.id) });
}));

router.post('/chat', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  const payload = z.object({
    studentId: z.string().trim().min(1),
    propertyId: z.string().trim().min(1).max(30),
    message: z.string().trim().min(1).max(2000),
  }).parse(req.body);
  res.status(201).json({ data: await sendLandlordChatMessage(currentUser.id, payload.studentId, payload.propertyId, payload.message) });
}));

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

router.patch('/profile', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const payload = z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    companyName: z.string().trim().min(1).optional(),
  }).parse(req.body);

  const updated = await landlordService.updateProfile(currentUser.id, payload);
  res.json({ data: updated });
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

router.patch('/applications/:applicationId/status', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const applicationId = z.string().trim().min(1).parse(req.params.applicationId);
  const payload = ApplicationReviewPayloadSchema.parse({ ...req.body, applicationId });
  const result = await landlordService.reviewApplication(currentUser.id, applicationId, payload);
  res.json({ data: result });
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

router.get('/maintenance/:requestId/comments', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const requestId = z.string().trim().min(1).parse(req.params.requestId);
  const comments = await landlordService.getMaintenanceComments(currentUser.id, requestId);
  res.json({ data: comments });
}));

router.post('/maintenance/:requestId/comments', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const requestId = z.string().trim().min(1).parse(req.params.requestId);
  const { message } = z.object({ message: z.string().trim().min(1).max(2000) }).parse(req.body);
  const comment = await landlordService.addMaintenanceComment(currentUser.id, requestId, message);
  res.status(201).json({ data: comment });
}));

router.delete('/listings/:listingId', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const listingId = z.string().trim().min(1).parse(req.params.listingId);
  const deleted = await landlordService.deleteListing(currentUser.id, listingId);
  if (!deleted) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');
  res.status(204).send();
}));

const landlordComplaintSchema = z.object({
  against: z.string().trim().optional(),
  property: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  category: z.string().trim().min(1).max(100),
  subject: z.string().trim().max(255).optional().default(''),
  description: z.string().trim().min(1).max(2000),
});

router.get('/complaints', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const complaints = await landlordService.getComplaints(currentUser.id);
  res.json({ data: complaints });
}));

router.post('/complaints', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const payload = landlordComplaintSchema.parse(req.body);
  const complaint = await landlordService.submitComplaint(currentUser.id, payload);
  res.status(201).json({ data: complaint });
}));

export { router as landlordRouter };
