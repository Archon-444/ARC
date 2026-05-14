/**
 * Trust-API client for the W11 public trust surface.
 *
 * Wraps the three endpoints `apps/trust-api` exposes:
 *   GET  /v1/health                     -> liveness
 *   GET  /v1/passport/:address          -> free passport read
 *   POST /v1/trust/read                 -> $0.01 scoreV1 (402 quote
 *                                          if no X-PAYMENT)
 *
 * The W11 surface only consumes the FREE paths or surfaces the 402
 * quote shape to the user. Payment is initiated through the agent
 * surface (Claude / Codex / Cursor via @arc/mcp-server), never from
 * the browser — browsers do not hold spending wallets in V0.
 *
 * Honest error posture: every method returns a discriminated union
 * so the route handler can render a structured error state instead
 * of throwing. No fetch directly in the page components — they call
 * these helpers via React server components.
 */

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function trustApiBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_TRUST_API_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

export interface TrustQuoteAccept {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds?: number;
  extra?: Record<string, unknown>;
}

export interface TrustQuoteBody {
  x402Version: number;
  error?: string;
  accepts: TrustQuoteAccept[];
}

export interface PassportPlaceholder {
  address: string;
  passport: null | unknown;
  status: string;
  notice?: string;
}

export type TrustReadResult =
  | { ok: true; status: 'quote'; quote: TrustQuoteBody }
  | { ok: false; status: 'unconfigured'; reason: string }
  | { ok: false; status: 'not_found'; reason: string }
  | { ok: false; status: 'invalid_address'; reason: string }
  | { ok: false; status: 'error'; reason: string };

export type PassportLookupResult =
  | { ok: true; passport: PassportPlaceholder }
  | { ok: false; status: 'unconfigured'; reason: string }
  | { ok: false; status: 'invalid_address'; reason: string }
  | { ok: false; status: 'not_found'; reason: string }
  | { ok: false; status: 'error'; reason: string };

export function isValidEvmAddress(value: string): boolean {
  return ADDRESS_RE.test(value);
}

/**
 * Fetch the 402 quote shape for `target`. The W11 trust surface
 * renders the quote (network, asset, payTo, maxAmountRequired,
 * description) so the user understands what an MCP-driven agent
 * call would cost. A 200 response (rare in browser flow — agents
 * pay, browsers don't) is treated as a configuration anomaly.
 */
export async function fetchTrustQuote(target: string): Promise<TrustReadResult> {
  if (!isValidEvmAddress(target)) {
    return { ok: false, status: 'invalid_address', reason: 'Address must be 0x-prefixed 40-hex.' };
  }
  const baseUrl = trustApiBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      status: 'unconfigured',
      reason: 'NEXT_PUBLIC_TRUST_API_URL is not set on this deployment.',
    };
  }

  try {
    const res = await fetch(`${baseUrl}/v1/trust/read`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target }),
      cache: 'no-store',
    });
    if (res.status === 402) {
      const body = (await res.json()) as TrustQuoteBody;
      return { ok: true, status: 'quote', quote: body };
    }
    if (res.status === 200) {
      return {
        ok: false,
        status: 'error',
        reason: `Unexpected 200 from /v1/trust/read; this deployment is paying for its own reads (browser surface should never).`,
      };
    }
    if (res.status === 404) {
      return { ok: false, status: 'not_found', reason: 'trust-api route not found.' };
    }
    return { ok: false, status: 'error', reason: `trust-api returned ${res.status}.` };
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      reason: `Network error talking to trust-api: ${(err as Error).message}`,
    };
  }
}

/** Fetch the free passport-lookup placeholder. */
export async function fetchPassport(address: string): Promise<PassportLookupResult> {
  if (!isValidEvmAddress(address)) {
    return { ok: false, status: 'invalid_address', reason: 'Address must be 0x-prefixed 40-hex.' };
  }
  const baseUrl = trustApiBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      status: 'unconfigured',
      reason: 'NEXT_PUBLIC_TRUST_API_URL is not set on this deployment.',
    };
  }
  try {
    const res = await fetch(`${baseUrl}/v1/passport/${address}`, {
      cache: 'no-store',
    });
    if (res.status === 200) {
      const passport = (await res.json()) as PassportPlaceholder;
      return { ok: true, passport };
    }
    if (res.status === 404) {
      return { ok: false, status: 'not_found', reason: 'No passport recorded.' };
    }
    return { ok: false, status: 'error', reason: `trust-api returned ${res.status}.` };
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      reason: `Network error talking to trust-api: ${(err as Error).message}`,
    };
  }
}

/** Format $0.01 USDC base units (10000) for display. */
export function formatUsdcAmount(baseUnits: string): string {
  const n = Number(baseUnits);
  if (!Number.isFinite(n)) return baseUnits;
  return `$${(n / 1_000_000).toFixed(2)}`;
}
