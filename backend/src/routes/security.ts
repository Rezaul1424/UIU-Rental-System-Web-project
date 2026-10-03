import { Router } from 'express';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireOwnership, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/profile/:userId',
  requireAuth,
  requireOwnership('userId'),
  asyncHandler(async (req, res) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
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
