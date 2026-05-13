import type { Request, Response, NextFunction } from 'express';
import { APIError } from '../errors';

/**
 * Express error handler. Pairs with @arc/trust-api errors.ts (APIError).
 *
 * Response shape: { message, code?, details?, requestId? }
 *
 * - APIError instances surface their statusCode + message + code + details.
 * - Unknown errors return 500 with the literal message in development and
 *   a generic 'Internal server error' string in production.
 * - The handler always logs the failure as a JSON line so it can be
 *   correlated against the access-log line emitted by middleware/logger.ts.
 */
export function errorHandler() {
  return function errorHandlerMiddleware(
    err: Error | APIError,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    const isApi = err instanceof APIError;
    const status = isApi ? (err as APIError).statusCode : 500;
    const code = isApi ? (err as APIError).code : 'INTERNAL_ERROR';
    const details = isApi ? (err as APIError).details : undefined;
    const message = isApi
      ? err.message
      : process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: req.id,
        level: 'error',
        method: req.method,
        path: req.path,
        status,
        code,
        message: err.message,
      })
    );

    const body: Record<string, unknown> = { message };
    if (code) body.code = code;
    if (details !== undefined) body.details = details;
    if (req.id) body.requestId = req.id;
    res.status(status).json(body);
  };
}
