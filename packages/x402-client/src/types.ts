/**
 * x402 protocol types — resource-server side.
 *
 * Field names are case-sensitive wire fields per the x402 spec
 * (https://github.com/coinbase/x402, docs.cdp.coinbase.com/x402).
 * x402Version = 1 is the only version currently in production.
 */

export const X402_VERSION = 1;

/** A single payment requirement returned inside a 402 `accepts` array. */
export interface PaymentRequirement {
  scheme: 'exact';
  network: string; // e.g. "base-mainnet"
  /** Amount in token base units (USDC: 6 decimals, so "10000" = $0.01). */
  maxAmountRequired: string;
  resource: string;
  description: string;
  /** Recipient address (0x-prefixed for EVM). */
  payTo: string;
  /** ERC-20 contract address (0x-prefixed). */
  asset: string;
  /** Optional handler timeout in seconds. */
  maxTimeoutSeconds?: number;
  /** Optional MIME type. Reserved by spec; may be omitted. */
  mimeType?: string;
  /** Optional output schema for the resource. */
  outputSchema?: Record<string, unknown>;
  /**
   * Optional extra metadata. For EVM `exact`, typically carries EIP-712
   * domain info, e.g. `{ name: "USD Coin", version: "2" }`.
   */
  extra?: Record<string, unknown>;
}

/** 402 response body. */
export interface PaymentRequired {
  x402Version: number;
  error?: string;
  accepts: PaymentRequirement[];
}

/**
 * Payload of the X-PAYMENT header for the EVM `exact` scheme:
 * a signed EIP-3009 `transferWithAuthorization` envelope.
 */
export interface EvmExactPayload {
  signature: string; // 0x-prefixed 65-byte hex
  authorization: {
    from: string;
    to: string;
    value: string; // base units
    validAfter: string; // unix seconds
    validBefore: string; // unix seconds
    nonce: string; // 0x-prefixed 32-byte hex
  };
}

/** Decoded X-PAYMENT header (after base64-decoding). */
export interface PaymentPayload<P = EvmExactPayload> {
  x402Version: number;
  scheme: 'exact';
  network: string;
  payload: P;
}

/** Facilitator /verify response. */
export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

/** Facilitator /settle response, also used as X-PAYMENT-RESPONSE body. */
export interface SettleResponse {
  success: boolean;
  transaction: string;
  network: string;
  payer?: string;
  errorReason?: string;
}
