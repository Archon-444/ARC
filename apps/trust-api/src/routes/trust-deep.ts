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
  /**
   * Set when the editorial path was attempted and failed; the caller
   * paid for editorial but got the stub. Surfaced in the response body
   * so the caller can choose to retry / surface a warning to the user.
   * Distinct from the unconfigured-key path (which is just `source: stub`
   * with no `degraded` flag and no `degradedReason`).
   */
  degraded?: true;
  degradedReason?: string;
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
        // Status 400 → middleware skips settle by default (settleOnStatus
        // predicate). Paid caller is not charged for malformed input.
        res.status(400).json({ error: 'Invalid target address' });
        return;
      }
      if (!cfg.payTo) {
        // Status 503 → operator misconfiguration. Paid caller is not
        // charged for a server we cannot settle through.
        res.status(503).json({ error: 'trust-api: ARC_PAYTO is not configured' });
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
          ...(cached.degraded
            ? { degraded: true, degradedReason: cached.degradedReason }
            : {}),
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
        // Editorial path attempted and failed (Anthropic outage, 5xx,
        // schema-validation rejection, etc.). The caller paid for the
        // deep tier and is owed transparency: we surface a degraded
        // flag so they can choose to retry, alert, or accept the stub.
        // The fallback stub is cached so a retry burst doesn't fan out
        // to a still-flapping Anthropic.
        result = {
          commentary: stubCommentary(target, scoreV1),
          source: 'stub',
          generatedAt: new Date().toISOString(),
          degraded: true,
          degradedReason: 'editorial_generation_failed',
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
        ...(result.degraded
          ? { degraded: true, degradedReason: result.degradedReason }
          : {}),
      });
    },
  };
}

function resourceFor(req: MiddlewareRequest): string {
  return req.originalUrl ?? req.url ?? '/v1/trust/read/deep';
}
