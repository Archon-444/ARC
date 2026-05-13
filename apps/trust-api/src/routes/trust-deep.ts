import type { Request, RequestHandler, Response } from 'express';
import {
  ARC_TRUST_TIERS,
  BASE_MAINNET,
  requirePayment,
  usdToBaseUnits,
  type MiddlewareRequest,
  type PaymentRequirement,
} from '@arc/x402-client';

import type { TrustApiConfig } from '../config';

/**
 * Deep-tier placeholder route — POST /v1/trust/read/deep.
 *
 * Posture for W5 (per the plan):
 *   - No X-PAYMENT → 402 quote at $0.05 so clients can see the upcoming
 *     price and bind it to their tooling now.
 *   - X-PAYMENT present → `quoteOnly: true` makes the middleware skip
 *     verify and settle entirely. The handler returns 501 with no money
 *     moving. Production deep-tier settlement starts only when the W10
 *     editorial-commentary implementation lands.
 */
export function makeTrustDeepRoutes(cfg: TrustApiConfig): {
  paywall: RequestHandler;
  handler: (req: Request, res: Response) => void;
} {
  const paywall = requirePayment({
    accepts: (req) => buildDeepRequirement(cfg, resourceFor(req as MiddlewareRequest)),
    quoteOnly: true,
  }) as unknown as RequestHandler;

  return {
    paywall,
    handler: (_req, res) => {
      res.status(501).json({
        error: 'editorial deep tier ships W10',
        etaWeek: 10,
        notice: 'no settlement attempted; resubmit your X-PAYMENT after W10.',
      });
    },
  };
}

function buildDeepRequirement(cfg: TrustApiConfig, resource: string): PaymentRequirement {
  return {
    scheme: 'exact',
    network: cfg.network,
    maxAmountRequired: usdToBaseUnits(ARC_TRUST_TIERS.readDeep),
    resource,
    description: `ARC trust read (deep) — $${ARC_TRUST_TIERS.readDeep.toFixed(2)} per call`,
    payTo: cfg.payTo,
    asset: cfg.asset,
    maxTimeoutSeconds: 60,
    extra: { name: BASE_MAINNET.usdcEip712.name, version: BASE_MAINNET.usdcEip712.version },
  };
}

function resourceFor(req: MiddlewareRequest): string {
  return req.originalUrl ?? req.url ?? '/v1/trust/read/deep';
}
