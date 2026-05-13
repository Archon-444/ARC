import type { Request, RequestHandler, Response } from 'express';
import {
  ARC_TRUST_TIERS,
  BASE_MAINNET,
  FacilitatorClient,
  requirePayment,
  usdToBaseUnits,
  X402_VERSION,
  type MiddlewareRequest,
  type PaymentRequirement,
} from '@arc/x402-client';
import {
  DEFAULT_TRUST_CACHE_TTL_MS,
  TtlCache,
} from '@arc/trust-core';

import type { TrustApiConfig } from '../config';
import { v0HeuristicAssessment } from '../sources/heuristic';
import { EditorialClient } from '../editorial/client';
import { stubCommentary } from '../editorial/stub';
import type { DeepTierCommentary } from '../editorial/prompt';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

interface CachedDeepResult {
  commentary: DeepTierCommentary;
  source: 'editorial' | 'stub';
  generatedAt: string;
  model?: string;
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

/**
 * Deep-tier route — POST /v1/trust/read/deep.
 *
 * W10 posture:
 *   - No X-PAYMENT → 402 quote at $0.05.
 *   - X-PAYMENT present → middleware verifies, runs the handler,
 *     settles, then returns 200 with editorial commentary +
 *     X-Payment-Response. This is the LIVE deep tier; W5's
 *     `quoteOnly: true` flag is gone.
 *
 * Editorial sourcing:
 *   - If ARC_ANTHROPIC_API_KEY is set, calls Haiku 4.5 with a cached
 *     system prompt and a strict JSON-schema output. Cache the
 *     response by target for ARC_DEEP_CACHE_TTL_MS (default 1h) so
 *     repeat queries do not re-pay the Anthropic token cost.
 *   - If unset, returns deterministic stub commentary with the
 *     correct wire shape so paid-mock + unfunded deployments work.
 *
 * Logging notes:
 *   - The Anthropic usage payload (input/output/cache tokens) is
 *     attached to the log entry via req.x402.deep so the JSON logger
 *     can surface cache-hit rate over time.
 */
export function makeTrustDeepRoutes(cfg: TrustApiConfig): {
  paywall: RequestHandler;
  handler: (req: Request, res: Response) => Promise<void>;
} {
  const facilitator = new FacilitatorClient({
    url: cfg.facilitatorUrl,
    apiKey: cfg.facilitatorApiKey,
  });

  const paywall = requirePayment({
    accepts: (req) => buildDeepRequirement(cfg, resourceFor(req as MiddlewareRequest)),
    facilitator,
  });

  const responseCache = new TtlCache<CachedDeepResult>({
    ttlMs: cfg.deepCacheTtlMs || DEFAULT_TRUST_CACHE_TTL_MS,
  });

  const editorial = cfg.anthropicApiKey
    ? new EditorialClient({ apiKey: cfg.anthropicApiKey })
    : null;

  return {
    paywall,
    handler: async (req: Request, res: Response) => {
      const target = String((req.body && req.body.target) || '').toLowerCase();
      if (!ADDRESS_RE.test(target)) {
        res.status(400).json({ error: 'Invalid target address' });
        return;
      }
      if (!cfg.payTo) {
        res.status(500).json({ error: 'trust-api: ARC_PAYTO is not configured' });
        return;
      }

      const assessment = v0HeuristicAssessment(target);
      const scoreV1 = {
        composite: assessment.overallScore,
        factors: {
          creator: assessment.creatorRisk.score,
          contract: assessment.contractRisk.score,
          trading: assessment.tradingRisk.score,
          liquidity: assessment.liquidityRisk.score,
        },
      };

      const cacheKey = target;
      const cached = responseCache.get(cacheKey);
      if (cached) {
        res.status(200).json({
          x402Version: X402_VERSION,
          target,
          assessment,
          commentary: cached.commentary,
          source: cached.source,
          cache: { hit: true, key: cacheKey, generatedAt: cached.generatedAt },
          model: cached.model,
        });
        return;
      }

      let result: CachedDeepResult;
      try {
        if (editorial) {
          const live = await editorial.generate(target, scoreV1);
          result = {
            commentary: live.commentary,
            source: 'editorial',
            generatedAt: new Date().toISOString(),
            model: live.model,
          };
          // Attach usage to the request so the logger can surface it.
          (req as any).x402 = { ...(req as any).x402, deep: { ...live.usage, cacheHit: live.cacheHit } };
        } else {
          result = {
            commentary: stubCommentary(target, scoreV1),
            source: 'stub',
            generatedAt: new Date().toISOString(),
          };
        }
      } catch (err) {
        // Editorial failures must not consume a paid call without
        // returning something usable to the agent. Fall back to the
        // stub and flag the failure in the response so the operator
        // can investigate without re-charging the caller.
        result = {
          commentary: stubCommentary(target, scoreV1),
          source: 'stub',
          generatedAt: new Date().toISOString(),
        };
        (req as any).x402 = {
          ...(req as any).x402,
          deepError: (err as Error).message,
        };
      }

      responseCache.set(cacheKey, result);

      res.status(200).json({
        x402Version: X402_VERSION,
        target,
        assessment,
        commentary: result.commentary,
        source: result.source,
        cache: { hit: false, key: cacheKey, generatedAt: result.generatedAt },
        ...(result.model ? { model: result.model } : {}),
      });
    },
  };
}

function resourceFor(req: MiddlewareRequest): string {
  return req.originalUrl ?? req.url ?? '/v1/trust/read/deep';
}
