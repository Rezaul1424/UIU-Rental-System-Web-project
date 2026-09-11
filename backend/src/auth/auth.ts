import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';

export const AuthRoleSchema = z.enum(['admin', 'landlord', 'student', 'guest']);
export const AuthStatusSchema = z.enum(['active', 'pending', 'suspended', 'deactivated']);

export type AuthRole = z.infer<typeof AuthRoleSchema>;
export type AuthStatus = z.infer<typeof AuthStatusSchema>;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  status: AuthStatus;
  studentId?: string;
};

export type TokenPayload = {
  sub: string;
  role: AuthRole;
  email: string;
};

const users = new Map<string, {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  status: AuthStatus;
  studentId?: string;
  resetToken?: string;
  resetTokenExpiresAt?: number;
}>();

const resetTokens = new Map<string, { email: string; expiresAt: number }>();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createUserRecord(payload: {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AuthRole;
  status: AuthStatus;
  studentId?: string;
}) {
  const passwordHash = bcrypt.hashSync(payload.password, 10);

  users.set(payload.email, {
    id: payload.id,
    name: payload.name,
    email: normalizeEmail(payload.email),
    passwordHash,
    role: payload.role,
    status: payload.status,
    studentId: payload.studentId,
  });

  return users.get(normalizeEmail(payload.email));
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  role?: AuthRole;
}) {
  const email = normalizeEmail(input.email);
  const role = input.role ?? 'student';

  if (users.has(email)) {
    throw new AppError(409, 'USER_ALREADY_EXISTS', 'A user with this email already exists');
  }

  const user = createUserRecord({
    id: `user_${randomBytes(8).toString('hex')}`,
    name: input.name,
    email,
    password: input.password,
    role,
    status: 'active',
    studentId: input.studentId,
  });

  if (!user) {
    throw new AppError(500, 'USER_REGISTRATION_FAILED', 'User registration failed');
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      studentId: user.studentId,
    },
  };
}

export function verifyCredentials(email: string, password: string) {
  const key = normalizeEmail(email);
  const user = users.get(key);

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.status === 'suspended') {
    throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended');
  }

  if (user.status === 'deactivated') {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'This account is no longer active');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    studentId: user.studentId,
  } as AuthUser;
}

export function createAuthToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '12h',
  });
}

export function getUserByEmail(email: string): AuthUser | undefined {
  const user = users.get(normalizeEmail(email));
  if (!user) return undefined;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    studentId: user.studentId,
  };
}

export function requestPasswordReset(email: string) {
  const user = users.get(normalizeEmail(email));
  if (!user) {
    return { message: 'If the account exists, a reset link has been sent.' };
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000;

  resetTokens.set(token, { email: user.email, expiresAt });
  user.resetToken = token;
  user.resetTokenExpiresAt = expiresAt;

  return {
    message: 'If the account exists, a reset link has been sent.',
    token,
  };
}

export function confirmPasswordReset(token: string, newPassword: string) {
  const resetToken = resetTokens.get(token);
  if (!resetToken) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'This reset token is invalid or expired');
  }

  if (Date.now() > resetToken.expiresAt) {
    resetTokens.delete(token);
    throw new AppError(400, 'RESET_TOKEN_EXPIRED', 'This reset token has expired');
  }

  const user = users.get(resetToken.email);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  user.resetToken = undefined;
  user.resetTokenExpiresAt = undefined;
  resetTokens.delete(token);

  return { message: 'Password reset successfully' };
}

export function deactivateAccount(user: AuthUser, password: string) {
  const currentUser = users.get(normalizeEmail(user.email));
  if (!currentUser) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (!bcrypt.compareSync(password, currentUser.passwordHash)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  currentUser.status = 'deactivated';

  return {
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      status: currentUser.status,
      studentId: currentUser.studentId,
    },
  };
}

export function suspendUserByEmail(email: string) {
  const user = users.get(normalizeEmail(email));
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  user.status = 'suspended';

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      studentId: user.studentId,
    },
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = getUserByEmail(payload.email);

    if (!user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    if (user.status === 'suspended') {
      throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended');
    }

    if (user.status === 'deactivated') {
      throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'This account is no longer active');
    }

    req.user = user;
    next();
  } catch (_error) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  }
}

export function requireRole(role: AuthRole | AuthRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const allowed = Array.isArray(role) ? role : [role];
    const user = req.user as AuthUser | undefined;

    if (!user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    if (!allowed.includes(user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource');
    }

    next();
  };
}

export const authRouter = {
  registerUser,
  verifyCredentials,
  createAuthToken,
  getUserByEmail,
  requestPasswordReset,
  confirmPasswordReset,
  deactivateAccount,
  suspendUserByEmail,
  requireAuth,
  requireRole,
};
