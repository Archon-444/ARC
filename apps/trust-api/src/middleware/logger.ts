import type { Request, Response, NextFunction } from 'express';

/**
 * Structured JSON logger — one line per request, machine-readable.
 *
 * Emits on response 'finish':
 *   { timestamp, requestId, method, path, status, duration_ms, ip, payer? }
 *
 * `payer` is populated when the request passed through the x402 paywall
 * (req.x402.payer is set by @arc/x402-client/middleware on successful
 * verify). No external logger dependency — `console.log(JSON.stringify(...))`
 * is enough for the W5 production spine. Sentry/DataDog/OTEL are deferred
 * to W12 hardening.
 *
 * Adapted from backend/src/middleware/logger.middleware.ts; trust-api
 * drops the ANSI-colored line in favour of JSON, but keeps the >1s
 * slow-request flag.
 */
export function logger() {
  return function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    res.on('finish', () => {
      const duration_ms = Date.now() - start;
      // x402 payer is attached by the paywall middleware on req as `x402`.
      const payer = (req as Request & { x402?: { payer?: string } }).x402?.payer;
      const entry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        requestId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms,
        ip: req.ip,
      };
      if (payer) entry.payer = payer;
      if (duration_ms > 1000) entry.slow = true;
      console.log(JSON.stringify(entry));
    });
    next();
  };
}
