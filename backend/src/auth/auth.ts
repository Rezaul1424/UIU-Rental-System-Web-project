import { createHash, randomBytes, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
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
const revokedTokens = new Set<string>();

const JWT_SECRET = process.env.JWT_SECRET || 'development-only-jwt-secret-change-this-value-1234';
const persistentAuth = process.env.NODE_ENV !== 'test';
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 10,
});

type DbUser = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: AuthRole;
  status: AuthStatus;
  student_id?: string;
};

type ResetRow = RowDataPacket & { user_id: number };

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toAuthUser(user: { id: string | number; name: string; email: string; role: AuthRole; status: AuthStatus; studentId?: string | null }): AuthUser {
  return {
    id: String(user.id),
    name: user.name,
    email: normalizeEmail(user.email),
    role: user.role,
    status: user.status,
    studentId: user.studentId ?? undefined,
  };
}

async function findPersistentUser(email: string): Promise<AuthUser | undefined> {
  const [rows] = await db.query<DbUser[]>('SELECT id, name, email, password_hash, role, status, student_id FROM users WHERE email = ? LIMIT 1', [normalizeEmail(email)]);
  const user = rows[0];
  return user ? toAuthUser({ ...user, studentId: user.student_id }) : undefined;
}

async function findPersistentUserWithPassword(email: string): Promise<DbUser | undefined> {
  const [rows] = await db.query<DbUser[]>('SELECT id, name, email, password_hash, role, status, student_id FROM users WHERE email = ? LIMIT 1', [normalizeEmail(email)]);
  return rows[0];
}

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

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  role?: AuthRole;
}) {
  const email = normalizeEmail(input.email);
  const role = input.role ?? 'student';

  if (persistentAuth) {
    const existing = await findPersistentUser(email);
    if (existing) {
      throw new AppError(409, 'USER_ALREADY_EXISTS', 'A user with this email already exists');
    }

    const passwordHash = bcrypt.hashSync(input.password, 10);
    await db.execute('INSERT INTO users (role, name, email, password_hash, student_id, status) VALUES (?, ?, ?, ?, ?, ?)', [role, input.name.trim(), email, passwordHash, input.studentId ?? null, 'active']);
    const user = await findPersistentUser(email);
    if (!user) throw new AppError(500, 'USER_REGISTRATION_FAILED', 'User registration failed');
    return { user };
  }

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

export async function verifyCredentials(email: string, password: string) {
  if (persistentAuth) {
    const user = await findPersistentUserWithPassword(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (user.status === 'suspended') throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended');
    if (user.status === 'deactivated') throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'This account is no longer active');
    return toAuthUser({ ...user, studentId: user.student_id });
  }

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

export async function createAuthToken(user: AuthUser): Promise<string> {
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '12h',
  });
  if (persistentAuth) {
    await db.execute('INSERT INTO auth_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 12 HOUR))', [randomUUID(), Number(user.id), hashToken(token)]);
  }
  return token;
}

export async function revokeAuthToken(token: string): Promise<void> {
  revokedTokens.add(token);
  if (persistentAuth) {
    await db.execute('UPDATE auth_sessions SET revoked_at = NOW() WHERE token_hash = ?', [hashToken(token)]);
  }
}

export async function getUserByEmail(email: string): Promise<AuthUser | undefined> {
  if (persistentAuth) return findPersistentUser(email);

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

export async function requestPasswordReset(email: string) {
  if (persistentAuth) {
    const user = await findPersistentUser(email);
    const response: { message: string; token?: string } = { message: 'If the account exists, a reset link has been sent.' };
    if (!user) return response;
    const token = randomBytes(32).toString('hex');
    await db.execute('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))', [hashToken(token), Number(user.id)]);
    if (process.env.NODE_ENV === 'test') response.token = token;
    return response;
  }

  const user = users.get(normalizeEmail(email));
  if (!user) {
    return { message: 'If the account exists, a reset link has been sent.' };
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000;

  resetTokens.set(token, { email: user.email, expiresAt });
  user.resetToken = token;
  user.resetTokenExpiresAt = expiresAt;

  const response: { message: string; token?: string } = {
    message: 'If the account exists, a reset link has been sent.',
  };

  if (process.env.NODE_ENV === 'test') {
    response.token = token;
  }

  return response;
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  if (persistentAuth) {
    const [rows] = await db.query<ResetRow[]>('SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1', [hashToken(token)]);
    const reset = rows[0];
    if (!reset) throw new AppError(400, 'INVALID_RESET_TOKEN', 'This reset token is invalid or expired');
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [bcrypt.hashSync(newPassword, 10), reset.user_id]);
    await db.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?', [hashToken(token)]);
    return { message: 'Password reset successfully' };
  }

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

export async function deactivateAccount(user: AuthUser, password: string) {
  if (persistentAuth) {
    const currentUser = await findPersistentUserWithPassword(user.email);
    if (!currentUser || !bcrypt.compareSync(password, currentUser.password_hash)) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    await db.execute("UPDATE users SET status = 'deactivated' WHERE id = ?", [currentUser.id]);
    return { user: toAuthUser({ ...currentUser, status: 'deactivated', studentId: currentUser.student_id }) };
  }

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

export async function suspendUserByEmail(email: string) {
  if (persistentAuth) {
    const user = await findPersistentUser(email);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    await db.execute("UPDATE users SET status = 'suspended' WHERE email = ?", [normalizeEmail(email)]);
    return { user: { ...user, status: 'suspended' as const } };
  }

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

  if (revokedTokens.has(token)) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const sessionCheck = persistentAuth
      ? db.query<RowDataPacket[]>('SELECT id FROM auth_sessions WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1', [hashToken(token)])
      : Promise.resolve([[], undefined] as const);

    void sessionCheck.then(([sessions]) => {
      if (persistentAuth && !sessions[0]) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      return getUserByEmail(payload.email);
    }).then((user) => {
      if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      if (user.status === 'suspended') throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended');
      if (user.status === 'deactivated') throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'This account is no longer active');
      req.user = user;
      next();
    }).catch(next);
  } catch (_error) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
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
  revokeAuthToken,
  getUserByEmail,
  requestPasswordReset,
  confirmPasswordReset,
  deactivateAccount,
  suspendUserByEmail,
  requireAuth,
  requireRole,
};
