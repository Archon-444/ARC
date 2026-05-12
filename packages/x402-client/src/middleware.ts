/**
 * Express-compatible middleware that enforces x402 payment for a route.
 *
 * Flow:
 *   1. No X-PAYMENT header → 402 + `{ x402Version, error, accepts: [...] }`
 *   2. X-PAYMENT present → decode, call facilitator `/verify`. Invalid → 402.
 *   3. Proceed to the handler. On response completion, call facilitator
 *      `/settle` and attach X-PAYMENT-RESPONSE to the response headers.
 *
 * The middleware does not need full @types/express; it relies on the
 * structural shape of Express req/res so Express's own types are
 * compatible at the call site.
 */

import {
  PaymentPayload,
  PaymentRequirement,
  PaymentRequired,
  X402_VERSION,
} from './types';
import { FacilitatorClient, FacilitatorError } from './facilitator';

export interface MiddlewareRequest {
  headers: { [k: string]: string | string[] | undefined };
  method?: string;
  originalUrl?: string;
  url?: string;
  /**
   * Decoded x402 payment payload, set by the middleware once /verify succeeds.
   * Downstream handlers can read `req.x402` for the verified payer address.
   */
  x402?: {
    payload: PaymentPayload;
    requirement: PaymentRequirement;
    payer?: string;
  };
}

export interface MiddlewareResponse {
  status(code: number): MiddlewareResponse;
  json(body: unknown): MiddlewareResponse;
  setHeader(name: string, value: string): void;
  on(event: 'finish' | 'close', cb: () => void): void;
  statusCode?: number;
  headersSent?: boolean;
}

export type NextFn = (err?: unknown) => void;

export interface RequirePaymentOptions {
  /**
   * Static or dynamic payment requirement(s). When a function is passed it
   * receives the request and may inspect URL/body to vary `resource`.
   */
  accepts:
    | PaymentRequirement
    | PaymentRequirement[]
    | ((req: MiddlewareRequest) => PaymentRequirement | PaymentRequirement[]);
  facilitator?: FacilitatorClient;
  /**
   * If false, the middleware will not call /settle automatically; the
   * handler is responsible for settling. Default: true.
   */
  autoSettle?: boolean;
}

const HDR_PAYMENT = 'x-payment';
const HDR_PAYMENT_RESPONSE = 'X-Payment-Response';

export function requirePayment(opts: RequirePaymentOptions) {
  const facilitator = opts.facilitator ?? new FacilitatorClient();
  const autoSettle = opts.autoSettle !== false;

  return async function x402Middleware(
    req: MiddlewareRequest,
    res: MiddlewareResponse,
    next: NextFn
  ): Promise<void> {
    const accepts = resolveAccepts(opts.accepts, req);
    const paymentHeader = pickHeader(req.headers[HDR_PAYMENT]);

    if (!paymentHeader) {
      respond402(res, accepts, 'X-PAYMENT header is required');
      return;
    }

    let payload: PaymentPayload;
    try {
      payload = decodePaymentHeader(paymentHeader);
    } catch (err) {
      respond402(res, accepts, `malformed X-PAYMENT header: ${(err as Error).message}`);
      return;
    }

    const requirement = matchRequirement(accepts, payload);
    if (!requirement) {
      respond402(res, accepts, 'no matching payment requirement for provided scheme/network');
      return;
    }

    try {
      const verified = await facilitator.verify(payload, requirement);
      if (!verified.isValid) {
        respond402(res, accepts, verified.invalidReason ?? 'payment failed verification');
        return;
      }
      req.x402 = { payload, requirement, payer: verified.payer };
    } catch (err) {
      const status = err instanceof FacilitatorError ? err.status : 502;
      res.status(status).json({
        x402Version: X402_VERSION,
        error: `facilitator verify failed: ${(err as Error).message}`,
        accepts,
      });
      return;
    }

    if (autoSettle) {
      // Settle after the handler finishes responding. We attach
      // X-PAYMENT-RESPONSE on `finish` only if not already sent.
      let settled = false;
      const trySettle = async () => {
        if (settled) return;
        settled = true;
        try {
          const result = await facilitator.settle(payload, requirement);
          if (!res.headersSent) {
            res.setHeader(HDR_PAYMENT_RESPONSE, base64Encode(JSON.stringify(result)));
          }
        } catch (err) {
          // Settlement failures are logged but cannot rewrite the response
          // body — operators must monitor logs for reconciliation.
          console.error('[x402] settle failed:', (err as Error).message);
        }
      };
      res.on('finish', () => {
        void trySettle();
      });
      res.on('close', () => {
        void trySettle();
      });
    }

    next();
  };
}

function resolveAccepts(
  source: RequirePaymentOptions['accepts'],
  req: MiddlewareRequest
): PaymentRequirement[] {
  const raw = typeof source === 'function' ? source(req) : source;
  return Array.isArray(raw) ? raw : [raw];
}

function respond402(res: MiddlewareResponse, accepts: PaymentRequirement[], error: string): void {
  const body: PaymentRequired = { x402Version: X402_VERSION, error, accepts };
  res.status(402).json(body);
}

function pickHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function decodePaymentHeader(value: string): PaymentPayload {
  const json = base64Decode(value.trim());
  const parsed = JSON.parse(json) as PaymentPayload;
  if (parsed.x402Version !== X402_VERSION) {
    throw new Error(`unsupported x402Version ${parsed.x402Version}`);
  }
  if (parsed.scheme !== 'exact') {
    throw new Error(`unsupported scheme ${parsed.scheme}`);
  }
  if (!parsed.network || !parsed.payload) {
    throw new Error('missing network or payload');
  }
  return parsed;
}

function matchRequirement(
  accepts: PaymentRequirement[],
  payload: PaymentPayload
): PaymentRequirement | undefined {
  return accepts.find(
    (req) => req.scheme === payload.scheme && req.network === payload.network
  );
}

function base64Encode(s: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(s, 'utf8').toString('base64');
  // Browser fallback.
  return btoa(unescape(encodeURIComponent(s)));
}

function base64Decode(s: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(s, 'base64').toString('utf8');
  return decodeURIComponent(escape(atob(s)));
}
