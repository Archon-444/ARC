/**
 * Runtime configuration for trust-api.
 *
 * All values are read from environment variables once at startup so the
 * server fails fast when misconfigured.
 */

import { BASE_MAINNET, DEFAULT_FACILITATOR_URL } from '@arc/x402-client';

export interface TrustApiConfig {
  port: number;
  payTo: string;
  facilitatorUrl: string;
  facilitatorApiKey?: string;
  network: string;
  asset: string;
  /**
   * Optional. When set, the W10 deep-tier route calls Haiku 4.5 for
   * editorial commentary with prompt caching. When unset, the route
   * still settles (paid-tier wire shape unchanged) but returns
   * deterministic stub commentary so CI and unfunded deployments work.
   */
  anthropicApiKey?: string;
  /** Deep-tier response cache TTL in ms. Default: 1 hour. */
  deepCacheTtlMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): TrustApiConfig {
  const port = Number(env.PORT ?? 3030);
  const payTo = env.ARC_PAYTO ?? '';
  if (!payTo) {
    // Soft-fail at startup but allow the health probe to come up so
    // ops can detect missing config without the process restarting.
    console.warn(
      '[trust-api] ARC_PAYTO is not set; paid routes will return 500 until configured.'
    );
  }
  const deepCacheTtlMs = Number(env.ARC_DEEP_CACHE_TTL_MS ?? 60 * 60 * 1000);

  return {
    port,
    payTo,
    facilitatorUrl: env.ARC_X402_FACILITATOR_URL ?? DEFAULT_FACILITATOR_URL,
    facilitatorApiKey: env.ARC_X402_FACILITATOR_API_KEY,
    network: env.ARC_X402_NETWORK ?? BASE_MAINNET.network,
    asset: env.ARC_X402_ASSET ?? BASE_MAINNET.usdcAddress,
    anthropicApiKey: env.ARC_ANTHROPIC_API_KEY,
    deepCacheTtlMs,
  };
}
