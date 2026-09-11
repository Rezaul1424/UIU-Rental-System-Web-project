import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  registerUser,
  verifyCredentials,
  createAuthToken,
  requestPasswordReset,
  confirmPasswordReset,
  deactivateAccount,
  suspendUserByEmail,
  requireAuth,
} from '../auth/auth.js';
import { AppError } from '../errors/AppError.js';

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  studentId: z.string().trim().min(3).optional(),
  role: z.enum(['admin', 'landlord', 'student']).default('student'),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email(),
});

const confirmResetSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8),
});

const deactivateSchema = z.object({
  confirm: z.boolean(),
  password: z.string().min(8),
});

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const result = registerUser(data);
    const token = createAuthToken(result.user);

    res.status(201).json({
      user: result.user,
      token,
    });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = verifyCredentials(data.email, data.password);
    const token = createAuthToken(user);

    res.json({
      user,
      token,
    });
  }),
);

router.post(
  '/password-reset/request',
  asyncHandler(async (req, res) => {
    const data = passwordResetRequestSchema.parse(req.body);
    const result = requestPasswordReset(data.email);

    res.json(result);
  }),
);

router.post(
  '/password-reset/confirm',
  asyncHandler(async (req, res) => {
    const data = confirmResetSchema.parse(req.body);
    const result = confirmPasswordReset(data.token, data.newPassword);

    res.json(result);
  }),
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({ message: 'Logged out successfully' });
  }),
);

router.post(
  '/deactivate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = deactivateSchema.parse(req.body);
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    if (!data.confirm) {
      throw new AppError(400, 'CONFIRMATION_REQUIRED', 'Account deactivation requires confirmation');
    }

    const result = deactivateAccount(authenticatedUser, data.password);
    res.json(result);
  }),
);

router.post(
  '/admin/suspend-user',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    if (authenticatedUser.role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Only admins can suspend users');
    }

    const { email } = z.object({ email: z.string().trim().email() }).parse(req.body);
    const result = suspendUserByEmail(email);
    res.json(result);
  }),
);

export { router as authRouter };
