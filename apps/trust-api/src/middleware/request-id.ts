import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Read `x-request-id` from the request. If absent, generate a v4 UUID.
 * Attach to `req.id` and echo on the response so log lines from any
 * layer can be joined back to a single client call. Mounted before the
 * rate limiter and logger so every audit trail entry carries it.
 */
export function requestId() {
  return function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header('x-request-id');
    const id = incoming && incoming.length > 0 && incoming.length <= 128 ? incoming : randomUUID();
    req.id = id;
    res.setHeader('x-request-id', id);
    next();
  };
}
