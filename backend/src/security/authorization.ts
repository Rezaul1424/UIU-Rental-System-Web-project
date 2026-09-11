import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { requireAuth as authenticate, type AuthUser } from '../auth/auth.js';
import { AppError } from '../errors/AppError.js';

export type Role = 'admin' | 'landlord' | 'student' | 'guest';

export function applySecurityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('X-XSS-Protection', '0');
  next();
}

export function buildRateLimiter(options: { windowMs?: number; maxRequests?: number } = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 5;
  const history = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'unknown';
    const key = `${req.ip ?? 'unknown'}:${req.path}:${email}`;
    const now = Date.now();
    const timestamps = history.get(key) ?? [];
    const fresh = timestamps.filter((timestamp) => now - timestamp < windowMs);

    if (fresh.length >= maxRequests) {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          statusCode: 429,
        },
      });
      return;
    }

    fresh.push(now);
    history.set(key, fresh);
    next();
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  authenticate(req, _res, next);
}

export function requireRole(role: Role | Role[]): RequestHandler {
  const allowed = Array.isArray(role) ? role : [role];

  return (req: Request, _res: Response, next: NextFunction): void => {
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

export function requireOwnership(resourceParamName: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user as AuthUser | undefined;
    const targetId = req.params[resourceParamName];

    if (!user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    if (user.role === 'admin') {
      next();
      return;
    }

    if (!targetId || user.id !== targetId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this resource');
    }

    next();
  };
}
