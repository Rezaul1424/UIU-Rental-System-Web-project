import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
};

function toErrorBody(code: string, message: string, statusCode: number): ErrorBody {
  return { error: { code, message, statusCode } };
}

/**
 * Express detects this as an error handler specifically because it has
 * 4 parameters (err, req, res, next) — that arity is how Express tells
 * error middleware apart from regular middleware. Must be registered
 * AFTER all routes in app.ts.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(toErrorBody(err.code, err.message, err.statusCode));
    return;
  }

  if (err instanceof z.ZodError) {
    const firstIssue = err.issues[0];
    const field = firstIssue?.path.join('.') || 'request';
    const message = firstIssue?.message || 'Invalid request data';

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `${field}: ${message}`,
        statusCode: 400,
      },
    });
    return;
  }

  // Unknown/unexpected error: log full detail server-side, but never
  // leak internals (stack traces, DB errors, etc.) to the client.
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);

  const isProd = env.NODE_ENV === 'production';
  res
    .status(500)
    .json(toErrorBody('INTERNAL_SERVER_ERROR', isProd ? 'Something went wrong' : err.message, 500));
}

/**
 * Registered BEFORE the error handler but AFTER all routes — catches
 * requests to routes that don't exist at all.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json(toErrorBody('ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404));
}