import { Router } from 'express';
import { z } from 'zod';
import {
  addAdminComplaintReply,
  getAdminComplaint,
  listAdminComplaints,
  updateAdminComplaintStatus,
} from '../complaints/admin-repository.js';
import type { ComplaintStatus } from '../complaints/admin-repository.js';
import { AppError } from '../errors/AppError.js';
import { requireAuth, requireRole } from '../security/authorization.js';
import { recordAuditEvent } from '../security/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const statusValues = ['Submitted', 'Under Review', 'Responded', 'Resolved', 'Closed'] as const;
const querySchema = z.object({
  status: z.enum(statusValues).optional(),
  q: z.string().trim().max(200).optional(),
});
const statusSchema = z.object({ status: z.enum(statusValues) });
const replySchema = z.object({ message: z.string().trim().min(1).max(5000) });

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/complaints', asyncHandler(async (req, res) => {
  const query = querySchema.parse(req.query);
  res.json({ data: await listAdminComplaints(query) });
}));

router.get('/complaints/:id', asyncHandler(async (req, res) => {
  const id = z.string().trim().min(1).max(30).parse(req.params.id);
  const complaint = await getAdminComplaint(id);
  if (!complaint) throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint does not exist');
  res.json({ data: complaint });
}));

router.patch('/complaints/:id/status', asyncHandler(async (req, res) => {
  const actor = req.user;
  if (!actor) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  const id = z.string().trim().min(1).max(30).parse(req.params.id);
  const { status } = statusSchema.parse(req.body);
  const current = await getAdminComplaint(id);
  if (!current) throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint does not exist');
  if (current.status === status) throw new AppError(409, 'STATUS_UNCHANGED', 'The complaint already has this status');
  const updated = await updateAdminComplaintStatus(id, status as ComplaintStatus);
  if (!updated) throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint does not exist');
  await recordAuditEvent({
    actorId: actor.id,
    action: 'COMPLAINT_STATUS_CHANGED',
    resourceType: 'complaint',
    resourceId: id,
    previousState: { status: current.status },
    newState: { status: updated.status },
  });
  res.json({ data: updated });
}));

router.post('/complaints/:id/replies', asyncHandler(async (req, res) => {
  const actor = req.user;
  if (!actor) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  const id = z.string().trim().min(1).max(30).parse(req.params.id);
  const { message } = replySchema.parse(req.body);
  const updated = await addAdminComplaintReply(id, actor.id, message);
  if (!updated) throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint does not exist');
  await recordAuditEvent({
    actorId: actor.id,
    action: 'COMPLAINT_REPLY_ADDED',
    resourceType: 'complaint',
    resourceId: id,
    newState: { status: updated.status },
    requestMetadata: { messageLength: message.length },
  });
  res.status(201).json({ data: updated });
}));

export { router as adminComplaintsRouter };