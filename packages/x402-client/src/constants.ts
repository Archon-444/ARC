/**
 * Constants for facilitator-backed x402 settlement on Base mainnet.
 *
 * Per the synthesised W3 plan: Base mainnet for paid settlement so revenue
 * is not blocked on Arc mainnet timing. Public x402.org facilitator does
 * not require API keys for Base mainnet USDC under the exact scheme.
 */

export const DEFAULT_FACILITATOR_URL = 'https://x402.org/facilitator';

export const BASE_MAINNET = {
  network: 'base-mainnet',
  chainId: 8453,
  /** USDC on Base mainnet (https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913). */
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  usdcDecimals: 6,
  /** EIP-712 domain used in `transferWithAuthorization` signing. */
  usdcEip712: { name: 'USD Coin', version: '2' },
} as const;

/** Convert a USD amount to USDC base units (string of integer, 6 decimals). */
export function usdToBaseUnits(usd: number): string {
  if (!Number.isFinite(usd) || usd < 0) {
    throw new Error(`Invalid USD amount: ${usd}`);
  }
  const cents = Math.round(usd * 100);
  // 6 decimals: $1 = 1_000_000. cents * 10_000.
  return String(cents * 10_000);
}

/** Standard ARC tiers, in USD. */
export const ARC_TRUST_TIERS = {
  read: 0.01,
  readDeep: 0.05,
} as const;
