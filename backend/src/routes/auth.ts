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
  revokeAuthToken,
} from '../auth/auth.js';
import { AppError } from '../errors/AppError.js';
import { buildRateLimiter } from '../security/authorization.js';

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  studentId: z.string().trim().min(3).optional(),
  role: z.enum(['admin', 'landlord', 'student']).default('student'),
}).superRefine((data, context) => {
  if (data.role === 'student' && !data.studentId) {
    context.addIssue({
      code: 'custom',
      path: ['studentId'],
      message: 'Student ID is required for student accounts',
    });
  }
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
const loginRateLimiter = buildRateLimiter({ windowMs: 60_000, maxRequests: 5 });
const resetRateLimiter = buildRateLimiter({ windowMs: 60_000, maxRequests: 3 });

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    if (data.role === 'admin') {
      throw new AppError(403, 'ADMIN_REGISTRATION_DISABLED', 'Administrator accounts are provisioned securely');
    }
    const result = await registerUser(data);
    const token = await createAuthToken(result.user);

    res.status(201).json({
      user: result.user,
      token,
    });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    res.json({ user: req.user });
  }),
);

router.post(
  '/login',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await verifyCredentials(data.email, data.password);
    const token = await createAuthToken(user);

    res.json({
      user,
      token,
    });
  }),
);

router.post(
  '/password-reset/request',
  resetRateLimiter,
  asyncHandler(async (req, res) => {
    const data = passwordResetRequestSchema.parse(req.body);
    const result = await requestPasswordReset(data.email);

    res.json(result);
  }),
);

router.post(
  '/password-reset/confirm',
  resetRateLimiter,
  asyncHandler(async (req, res) => {
    const data = confirmResetSchema.parse(req.body);
    const result = await confirmPasswordReset(data.token, data.newPassword);

    res.json(result);
  }),
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authorization = req.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      await revokeAuthToken(authorization.slice('Bearer '.length));
    }
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

    const result = await deactivateAccount(authenticatedUser, data.password);
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
    const result = await suspendUserByEmail(email);
    res.json(result);
  }),
);

export { router as authRouter };
