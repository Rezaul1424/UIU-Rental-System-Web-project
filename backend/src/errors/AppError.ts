/**
 * Throw this (or a subclass) anywhere in route handlers/services when you
 * want a specific, predictable HTTP response instead of a generic 500.
 *
 * Example:
 *   throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request') {
    super(400, 'VALIDATION_ERROR', message);
  }
}