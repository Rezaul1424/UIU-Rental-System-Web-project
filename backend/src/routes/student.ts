import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  StudentApplicationPayloadSchema,
  StudentMaintenanceRequestSchema,
  StudentProfileSchema,
} from '../contracts/student.js';
import { studentService } from '../student/service.js';
import { listChatConversations, sendStudentChatMessage } from '../chat/repository.js';

const router = Router();

const favoriteParamsSchema = z.object({
  listingId: z.string().trim().min(1),
});

const maintenancePayloadSchema = StudentMaintenanceRequestSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  propertyId: z.string().trim().min(1),
  landlordId: z.string().trim().min(1),
  category: z.string().trim().min(1).max(50).optional(),
  issue: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  attachments: z.array(z.object({
    name: z.string().trim().min(1),
    type: z.string().trim().min(1).optional(),
    sizeBytes: z.number().int().nonnegative().optional(),
  })).optional(),
});

router.use(requireAuth, requireRole('student'));

router.get('/chat', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  res.json({ data: await listChatConversations('student', currentUser.id) });
}));

router.post('/chat', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  const payload = z.object({
    propertyId: z.string().trim().min(1).max(30),
    message: z.string().trim().min(1).max(2000),
  }).parse(req.body);
  res.status(201).json({ data: await sendStudentChatMessage(currentUser.id, payload.propertyId, payload.message) });
}));

router.get('/profile', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const profile = await studentService.getProfile(currentUser.id);
  const safeProfile = StudentProfileSchema.parse(profile ?? {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    studentId: currentUser.studentId,
    phone: (currentUser as any).phone ?? undefined,
    role: currentUser.role,
    status: currentUser.status,
  });

  res.json({ data: safeProfile });
}));

router.patch('/profile', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const payload = z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    studentId: z.string().trim().min(3).max(30).optional(),
  }).parse(req.body);

  const updated = await studentService.updateProfile(currentUser.id, payload);
  res.json({ data: updated });
}));

router.get('/favorites', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const favorites = await studentService.getFavorites(currentUser.id);
  res.json({ data: favorites });
}));

router.post('/favorites', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const listingId = z.string().trim().min(1).parse(req.body?.listingId ?? req.params.listingId);
  const favorite = await studentService.addFavorite(currentUser.id, { listingId });
  res.status(201).json({ data: favorite });
}));

router.post('/favorites/:listingId', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const listingId = favoriteParamsSchema.parse({ listingId: req.params.listingId }).listingId;
  const favorite = await studentService.addFavorite(currentUser.id, { listingId });
  res.status(201).json({ data: favorite });
}));

router.delete('/favorites/:listingId', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const listingId = favoriteParamsSchema.parse({ listingId: req.params.listingId }).listingId;
  await studentService.removeFavorite(currentUser.id, listingId);
  res.status(204).send();
}));

router.get('/applications', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const applications = await studentService.getApplications(currentUser.id);
  res.json({ data: applications });
}));

router.post('/applications', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const payload = StudentApplicationPayloadSchema.parse(req.body);
  const application = await studentService.submitApplication(currentUser.id, payload);
  res.status(201).json({ data: application });
}));

router.patch('/applications/:applicationId/cancel', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const applicationId = z.string().trim().min(1).parse(req.params.applicationId);
  const success = await studentService.cancelApplication(currentUser.id, applicationId);
  if (!success) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Application could not be found to cancel');
  }
  res.json({ data: { success, applicationId, status: 'cancelled' } });
}));

router.get('/leases', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const leases = await studentService.getLeases(currentUser.id);
  res.json({ data: leases });
}));

router.get('/rent', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const summary = await studentService.getRentSummary(currentUser.id);
  res.json({ data: summary });
}));

router.get('/rent-summary', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const summary = await studentService.getRentSummary(currentUser.id);
  res.json({ data: summary });
}));

router.get('/receipts', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const receipts = await studentService.getReceipts(currentUser.id);
  res.json({ data: receipts });
}));

router.post('/rent/:obligationId/pay', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const obligationId = z.string().trim().min(1).parse(req.params.obligationId);
  const method = typeof req.body?.method === 'string' ? req.body.method : undefined;
  const result = await studentService.payRentObligation(currentUser.id, obligationId, method);
  res.status(200).json({ data: result });
}));

router.get('/maintenance', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const requests = await studentService.getMaintenanceRequests(currentUser.id);
  res.json({ data: requests });
}));

router.post('/maintenance', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const payload = maintenancePayloadSchema.parse(req.body);
  const request = await studentService.submitMaintenanceRequest(currentUser.id, payload);
  res.status(201).json({ data: request });
}));

router.get('/maintenance/:requestId/comments', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const requestId = z.string().trim().min(1).parse(req.params.requestId);
  const comments = await studentService.getMaintenanceComments(currentUser.id, requestId);
  res.json({ data: comments });
}));

router.post('/maintenance/:requestId/comments', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const requestId = z.string().trim().min(1).parse(req.params.requestId);
  const { message } = z.object({ message: z.string().trim().min(1).max(2000) }).parse(req.body);
  const comment = await studentService.addMaintenanceComment(currentUser.id, requestId, message);
  res.status(201).json({ data: comment });
}));

const reviewPayloadSchema = z.object({
  propertyId: z.string().trim().min(1),
  landlordId: z.string().trim().min(1).optional(),
  landlordStars: z.coerce.number().int().min(1).max(5),
  propertyStars: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

const complaintPayloadSchema = z.object({
  against: z.string().trim().optional(),
  property: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  category: z.string().trim().min(1).max(100),
  subject: z.string().trim().max(255).optional().default(''),
  description: z.string().trim().min(1).max(2000),
});

router.get('/reviews', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const reviews = await studentService.getReviews(currentUser.id);
  res.json({ data: reviews });
}));

router.post('/reviews', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const payload = reviewPayloadSchema.parse(req.body);
  const review = await studentService.submitReview(currentUser.id, payload);
  res.status(201).json({ data: review });
}));

router.get('/complaints', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const complaints = await studentService.getComplaints(currentUser.id);
  res.json({ data: complaints });
}));

router.post('/complaints', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const payload = complaintPayloadSchema.parse(req.body);
  const complaint = await studentService.submitComplaint(currentUser.id, payload);
  res.status(201).json({ data: complaint });
}));

export { router as studentRouter };
