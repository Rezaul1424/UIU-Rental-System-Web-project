import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so that if it throws (or rejects), the
 * error is passed to next(err) automatically — routing it into our
 * central error handler. Without this, an unhandled rejection inside an
 * async Express route handler is silently swallowed (in Express 4) and
 * the client's request just hangs forever with no response.
 *
 * Usage: app.get('/thing', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}