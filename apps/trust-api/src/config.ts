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
  return {
    port,
    payTo,
    facilitatorUrl: env.ARC_X402_FACILITATOR_URL ?? DEFAULT_FACILITATOR_URL,
    facilitatorApiKey: env.ARC_X402_FACILITATOR_API_KEY,
    network: env.ARC_X402_NETWORK ?? BASE_MAINNET.network,
    asset: env.ARC_X402_ASSET ?? BASE_MAINNET.usdcAddress,
  };
}
