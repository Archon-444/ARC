import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Two-layer rate limiting for trust-api.
 *
 * 1. globalLimiter — per-IP across all /v1/* routes. Looser than the
 *    arc backend's 100/15min default because trust-api is hit by
 *    automated agents. Configurable via RATE_LIMIT_WINDOW_MS and
 *    RATE_LIMIT_MAX.
 *
 * 2. paidLimiter   — mounted only on the /v1/trust/read* paths. Keyed
 *    off `req.x402.payer` when the paywall has verified, else falling
 *    back to ip. Stops a single payer (or anonymous IP) from rapid-
 *    firing malformed/expensive payloads that would burn facilitator
 *    capacity. Configurable via PAID_RATE_LIMIT_WINDOW_MS and
 *    PAID_RATE_LIMIT_MAX.
 *
 * In-memory store; multi-instance deploys would need rate-limit-redis,
 * deferred to W12 hardening.
 */

const num = (v: string | undefined, fallback: number): number => {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function globalLimiter() {
  return rateLimit({
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: num(process.env.RATE_LIMIT_MAX, 120),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests; slow down.' },
  });
}

export function paidLimiter() {
  return rateLimit({
    windowMs: num(process.env.PAID_RATE_LIMIT_WINDOW_MS, 60_000),
    max: num(process.env.PAID_RATE_LIMIT_MAX, 30),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
      const payer = (req as Request & { x402?: { payer?: string } }).x402?.payer;
      return payer ?? req.ip ?? 'unknown';
    },
    message: { error: 'Too many paid-route requests; slow down.' },
  });
}
