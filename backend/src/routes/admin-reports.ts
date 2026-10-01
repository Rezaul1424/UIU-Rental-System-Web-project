import { Router } from 'express';
import { getAdminReportData } from '../reports/admin-repository.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/reports', asyncHandler(async (_req, res) => {
  res.json({ data: await getAdminReportData() });
}));

export { router as adminReportsRouter };