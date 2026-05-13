/**
 * APIError — ported verbatim from backend/src/middleware/error.middleware.ts
 * so trust-api throws the same shape the broader ARC monorepo already
 * recognises. The error handler that interprets these lives in
 * middleware/error.ts.
 */

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}
