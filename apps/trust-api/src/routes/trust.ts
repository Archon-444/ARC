import type { Request, Response } from 'express';
import {
  ARC_TRUST_TIERS,
  BASE_MAINNET,
  FacilitatorClient,
  requirePayment,
  usdToBaseUnits,
  X402_VERSION,
  type PaymentRequirement,
  type MiddlewareRequest,
} from '@arc/x402-client';
import {
  DEFAULT_TRUST_CACHE_TTL_MS,
  TtlCache,
  type TokenRiskAssessment,
} from '@arc/trust-core';

import type { TrustApiConfig } from '../config';
import { v0HeuristicAssessment } from '../sources/heuristic';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const cache = new TtlCache<TokenRiskAssessment>({ ttlMs: DEFAULT_TRUST_CACHE_TTL_MS });

function buildRequirement(cfg: TrustApiConfig, usd: number, resource: string): PaymentRequirement {
  return {
    scheme: 'exact',
    network: cfg.network,
    maxAmountRequired: usdToBaseUnits(usd),
    resource,
    description: `ARC trust read — $${usd.toFixed(2)} per call`,
    payTo: cfg.payTo,
    asset: cfg.asset,
    maxTimeoutSeconds: 60,
    extra: { name: BASE_MAINNET.usdcEip712.name, version: BASE_MAINNET.usdcEip712.version },
  };
}

export function makeTrustRoutes(cfg: TrustApiConfig) {
  const facilitator = new FacilitatorClient({
    url: cfg.facilitatorUrl,
    apiKey: cfg.facilitatorApiKey,
  });

  const readPaywall = requirePayment({
    accepts: (req) =>
      buildRequirement(cfg, ARC_TRUST_TIERS.read, resourceFor(req as MiddlewareRequest)),
    facilitator,
  });

  return {
    readPaywall,
    readHandler: (req: Request, res: Response) => {
      const target = String((req.body && req.body.target) || '').toLowerCase();
      if (!ADDRESS_RE.test(target)) {
        res.status(400).json({ error: 'Invalid target address' });
        return;
      }
      if (!cfg.payTo) {
        res.status(500).json({ error: 'trust-api: ARC_PAYTO is not configured' });
        return;
      }
      const assessment = cache.get(target) ?? (() => {
        const a = v0HeuristicAssessment(target);
        cache.set(target, a);
        return a;
      })();

      res.status(200).json({
        x402Version: X402_VERSION,
        target,
        assessment,
      });
    },
  };
}

function resourceFor(req: MiddlewareRequest): string {
  return req.originalUrl ?? req.url ?? '/v1/trust/read';
}
