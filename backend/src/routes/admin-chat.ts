import { Router } from 'express';
import { z } from 'zod';
import { listAdminConversations } from '../chat/admin-repository.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/conversations', asyncHandler(async (req, res) => {
  const query = z.string().trim().max(200).optional().parse(req.query.q);
  res.json({ data: await listAdminConversations(query) });
}));

export { router as adminChatRouter };