import { Router } from 'express';
import { z } from 'zod';
import { listAdminNotifications, markAdminNotificationsRead } from '../notifications/admin-repository.js';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/notifications', asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  res.json({ data: await listAdminNotifications(user.id) });
}));

router.patch('/notifications/read', asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  const body = z.object({ notificationId: z.number().int().positive().optional() }).default({}).parse(req.body);
  await markAdminNotificationsRead(user.id, body.notificationId);
  res.status(204).send();
}));

export { router as adminNotificationsRouter };