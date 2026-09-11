import type { FastifyInstance, FastifyError } from 'fastify';
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
 * Every error thrown (or passed to `reply.send(err)`) anywhere in the app
 * funnels through here, so API consumers always get the same JSON shape:
 *   { "error": { "code": "...", "message": "...", "statusCode": 400 } }
 */
export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      reply
        .status(error.statusCode)
        .send(toErrorBody(error.code, error.message, error.statusCode));
      return;
    }

    // Fastify's own schema-validation errors carry a `validation` array.
    if ('validation' in error && error.validation) {
      reply
        .status(400)
        .send(toErrorBody('VALIDATION_ERROR', error.message, 400));
      return;
    }

    // Unknown/unexpected error: log full detail server-side, but never
    // leak internals (stack traces, DB errors, etc.) to the client.
    request.log.error({ err: error }, 'Unhandled error');

    const isProd = env.NODE_ENV === 'production';
    reply.status(500).send(
      toErrorBody(
        'INTERNAL_SERVER_ERROR',
        isProd ? 'Something went wrong' : error.message,
        500,
      ),
    );
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .send(toErrorBody('ROUTE_NOT_FOUND', `Route ${request.method} ${request.url} not found`, 404));
  });
}