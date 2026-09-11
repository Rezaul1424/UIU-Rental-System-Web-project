import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  StudentApplicationPayloadSchema,
  StudentFavoritePayloadSchema,
  StudentMaintenanceRequestSchema,
  StudentProfileSchema,
} from '../contracts/student.js';
import { studentService } from '../student/service.js';

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
  issue: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
});

router.use(requireAuth, requireRole('student'));

router.get('/profile', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const profile = await studentService.getProfile(currentUser.id);
  res.json({
    data: StudentProfileSchema.parse(profile ?? {
      id: currentUser.id,
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      studentId: currentUser.studentId,
    }),
  });
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

  const payload = StudentFavoritePayloadSchema.parse(req.body);
  const favorite = await studentService.addFavorite(currentUser.id, payload);
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

router.get('/leases', asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

  const leases = await studentService.getLeases(currentUser.id);
  res.json({ data: leases });
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

export { router as studentRouter };
