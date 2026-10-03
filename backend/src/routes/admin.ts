import { Router } from 'express';
import { z } from 'zod';
import { getAdminUserById, listAdminUsers, updateAdminUserStatus } from '../auth/auth.js';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { recordAuditEvent } from '../security/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  role: z.enum(['admin', 'landlord', 'student']).optional(),
  status: z.enum(['active', 'pending', 'suspended', 'deactivated']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'status']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

const statusUpdateSchema = z.object({
  status: z.enum(['active', 'pending', 'suspended', 'deactivated']),
  reason: z.string().trim().min(3).max(500),
});

const allowedTransitions: Record<string, string[]> = {
  active: ['suspended', 'deactivated'],
  pending: ['active', 'suspended', 'deactivated'],
  suspended: ['active', 'deactivated'],
  deactivated: [],
};

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const result = await listAdminUsers(query);
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
  }),
);

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const userId = String(req.params.id);
    const user = await getAdminUserById(userId);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    res.json({ user });
  }),
);

router.patch(
  '/users/:id/status',
  asyncHandler(async (req, res) => {
    const actor = req.user;
    if (!actor) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    const userId = String(req.params.id);
    if (actor.id === userId) throw new AppError(400, 'SELF_MODERATION_NOT_ALLOWED', 'Administrators cannot change their own account status');

    const data = statusUpdateSchema.parse(req.body);
    const current = await getAdminUserById(userId);
    if (!current) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    if (current.status === data.status) throw new AppError(409, 'STATUS_UNCHANGED', 'The account already has this status');
    if (!allowedTransitions[current.status].includes(data.status)) {
      throw new AppError(409, 'INVALID_STATUS_TRANSITION', `Cannot change account status from ${current.status} to ${data.status}`);
    }

    const result = await updateAdminUserStatus(userId, data.status);
    if (!result) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

    await recordAuditEvent({
      actorId: actor.id,
      action: 'ACCOUNT_STATUS_CHANGED',
      resourceType: 'user',
      resourceId: userId,
      previousState: { status: result.previousStatus },
      newState: { status: result.user.status },
      requestMetadata: { reason: data.reason },
    });

    res.json({ user: result.user });
  }),
);

export { router as adminRouter };