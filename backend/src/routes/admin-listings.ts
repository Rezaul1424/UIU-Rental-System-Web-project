import { Router } from 'express';
import { z } from 'zod';
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminListing,
  listAdminCategories,
  listAdminListings,
  updateAdminCategory,
  updateAdminListingStatus,
} from '../listings/admin-repository.js';
import type { ModerationStatus } from '../listings/admin-repository.js';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { recordAuditEvent } from '../security/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  moderationStatus: z.enum(['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived']).optional(),
  availabilityStatus: z.enum(['available', 'occupied', 'maintenance']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

const statusSchema = z.object({
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived']),
  reason: z.string().trim().min(3).max(500),
});

const categorySchema = z.object({ name: z.string().trim().min(2).max(80) });
const moderationTransitions: Record<ModerationStatus, ModerationStatus[]> = {
  draft: ['pending', 'archived'],
  pending: ['approved', 'rejected', 'archived'],
  approved: ['suspended', 'archived'],
  rejected: ['pending', 'archived'],
  suspended: ['approved', 'archived'],
  archived: [],
};

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/listings', asyncHandler(async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const result = await listAdminListings(query);
  const totalPages = Math.ceil(result.totalItems / query.limit);
  res.json({
    data: result.data,
    meta: {
      page: query.page,
      limit: query.limit,
      totalItems: result.totalItems,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPrevPage: query.page > 1 && totalPages > 0,
    },
  });
}));

router.get('/listings/:identifier', asyncHandler(async (req, res) => {
  const listing = await getAdminListing(String(req.params.identifier));
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');
  res.json({ data: listing });
}));

router.patch('/listings/:identifier/status', asyncHandler(async (req, res) => {
  const actor = req.user;
  if (!actor) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  const identifier = String(req.params.identifier);
  const data = statusSchema.parse(req.body);
  const current = await getAdminListing(identifier);
  if (!current) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');
  if (current.moderationStatus === data.status) throw new AppError(409, 'STATUS_UNCHANGED', 'The listing already has this status');
  if (!moderationTransitions[current.moderationStatus].includes(data.status)) {
    throw new AppError(409, 'INVALID_STATUS_TRANSITION', `Cannot change listing status from ${current.moderationStatus} to ${data.status}`);
  }
  const result = await updateAdminListingStatus(identifier, data.status);
  if (!result) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');
  await recordAuditEvent({
    actorId: actor.id,
    action: 'LISTING_MODERATION_CHANGED',
    resourceType: 'listing',
    resourceId: result.listing.propertyCode,
    previousState: { moderationStatus: result.previousStatus },
    newState: { moderationStatus: result.listing.moderationStatus },
    requestMetadata: { reason: data.reason },
  });
  res.json({ data: result.listing });
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  res.json({ data: await listAdminCategories() });
}));

router.post('/categories', asyncHandler(async (req, res) => {
  const data = categorySchema.parse(req.body);
  const category = await createAdminCategory(data.name);
  await recordAuditEvent({
    actorId: req.user?.id,
    action: 'LISTING_CATEGORY_CREATED',
    resourceType: 'listing_category',
    resourceId: category.id,
    newState: { name: category.name },
  });
  res.status(201).json({ data: category });
}));

router.patch('/categories/:id', asyncHandler(async (req, res) => {
  const data = categorySchema.parse(req.body);
  const id = String(req.params.id);
  const category = await updateAdminCategory(id, data.name);
  if (!category) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category does not exist');
  await recordAuditEvent({
    actorId: req.user?.id,
    action: 'LISTING_CATEGORY_UPDATED',
    resourceType: 'listing_category',
    resourceId: id,
    newState: { name: category.name },
  });
  res.json({ data: category });
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const deleted = await deleteAdminCategory(id);
  if (!deleted) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category does not exist');
  await recordAuditEvent({
    actorId: req.user?.id,
    action: 'LISTING_CATEGORY_DELETED',
    resourceType: 'listing_category',
    resourceId: id,
  });
  res.status(204).send();
}));

export { router as adminListingsRouter };
