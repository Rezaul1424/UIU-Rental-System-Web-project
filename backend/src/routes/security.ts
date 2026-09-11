import { Router } from 'express';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/profile/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const targetUserId = req.params.userId;

    if (!currentUser) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    if (currentUser.id !== targetUserId && currentUser.role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this profile');
    }

    res.json({ user: currentUser });
  }),
);

router.get(
  '/admin/inspect/:userId',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const targetUserId = req.params.userId;

    res.json({
      userId: targetUserId,
      inspected: true,
      requester: req.user?.email,
    });
  }),
);

export { router as securityRouter };
