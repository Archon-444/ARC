/**
 * Express-compatible x402 middleware (resource-server side).
 *
 * Flow (synchronous settle, scope: JSON responses only):
 *   1. No X-PAYMENT header     → 402 + `{ x402Version, error, accepts: [...] }`.
 *   2. X-PAYMENT present       → decode + facilitator.verify(); invalid → 402.
 *   3. Wrap `res.json` and call next(). The handler completes by invoking
 *      `res.json(body)`. The wrapper intercepts that call and:
 *      - awaits facilitator.settle() (bounded by `settleTimeoutMs`),
 *      - on success: sets `X-Payment-Response` then sends `body`,
 *      - on failure / timeout: converts the response to 402 with
 *        `errorReason` and an `X-Payment-Response` carrying
 *        `{ success: false, errorReason }`. The handler body is dropped;
 *        callers must retry with a fresh nonce.
 *
 * Contract: this middleware supports JSON API responses only. Handlers
 * must complete via `res.json(body)`. Streaming, file downloads, SSE,
 * long-polling, and chunked transfer are NOT supported in W5 — those
 * would require a different settlement pattern (settle-on-handler-start,
 * settle-on-stream-close-with-out-of-band-receipt, or pre-settled credits).
 *
 * The middleware does not require full @types/express; it relies on the
 * structural shape of Express req/res so Express's own types compose at
 * the call site.
 */

import {
  PaymentPayload,
  PaymentRequirement,
  PaymentRequired,
  SettleResponse,
  X402_VERSION,
} from './types';
import { FacilitatorClient, FacilitatorError } from './facilitator';

export interface MiddlewareRequest {
  headers: { [k: string]: string | string[] | undefined };
  method?: string;
  originalUrl?: string;
  url?: string;
  /**
   * Decoded x402 payment payload, set by the middleware once /verify
   * succeeds. Downstream handlers can read `req.x402` for the verified
   * payer address. Not set when `quoteOnly: true`.
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
  statusCode?: number;
  headersSent?: boolean;
}

export type NextFn = (err?: unknown) => void;

export interface RequirePaymentOptions {
  /**
   * Static or dynamic payment requirement(s). When a function is passed
   * it receives the request and may inspect URL/body to vary `resource`.
   */
  accepts:
    | PaymentRequirement
    | PaymentRequirement[]
    | ((req: MiddlewareRequest) => PaymentRequirement | PaymentRequirement[]);
  facilitator?: FacilitatorClient;
  /**
   * Maximum time to wait for facilitator.settle() before converting the
   * response to a 402 settlement-failed. Default 30_000ms.
   */
  settleTimeoutMs?: number;
  /**
   * Pure quote/placeholder mode. When `true`:
   *   - missing X-PAYMENT → 402 quote as usual,
   *   - X-PAYMENT present → middleware does NOT verify, NOT settle, and
   *     does NOT attach `req.x402`. It calls `next()` so the handler can
   *     return 501 (or any other unpaid status) without money moving.
   * Used for placeholder routes whose paid implementation is not yet live.
   */
  quoteOnly?: boolean;
}

const HDR_PAYMENT = 'x-payment';
const HDR_PAYMENT_RESPONSE = 'X-Payment-Response';
const DEFAULT_SETTLE_TIMEOUT_MS = 30_000;

export function requirePayment(opts: RequirePaymentOptions) {
  const facilitator = opts.facilitator ?? new FacilitatorClient();
  const settleTimeoutMs = opts.settleTimeoutMs ?? DEFAULT_SETTLE_TIMEOUT_MS;
  const quoteOnly = opts.quoteOnly === true;

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

    if (quoteOnly) {
      // Placeholder mode: payment is present, but this route is not yet
      // implemented. Skip verify + settle entirely. No money moves.
      next();
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

    // Wrap res.json so settle runs synchronously inside the response
    // lifecycle. Headers haven't been sent yet at this point — we own
    // the moment the handler tries to flush.
    const originalJson = res.json.bind(res);
    let intercepted = false;

    res.json = function patchedJson(this: MiddlewareResponse, body: unknown) {
      if (intercepted) {
        // Handler called res.json a second time — pass through; the first
        // call already drove settlement.
        return originalJson(body);
      }
      intercepted = true;

      // Fire-and-block: settle, then emit the final response.
      void (async () => {
        let settled: SettleResponse | undefined;
        let failureReason: string | undefined;
        try {
          settled = await withTimeout(
            facilitator.settle(payload, requirement),
            settleTimeoutMs,
            'settlement timed out'
          );
          if (!settled.success) {
            failureReason = settled.errorReason ?? 'facilitator reported settle failure';
          }
        } catch (err) {
          failureReason = (err as Error).message;
          settled = {
            success: false,
            transaction: '',
            network: requirement.network,
            payer: payload.payload.authorization.from,
            errorReason: failureReason,
          };
        }

        if (!res.headersSent) {
          res.setHeader(HDR_PAYMENT_RESPONSE, base64Encode(JSON.stringify(settled)));
        } else {
          // Should not happen — wrapper prevents any earlier flush.
          console.error('[x402] response already sent before settle completed');
        }

        if (failureReason) {
          // Drop the handler's body; convert to 402 with errorReason.
          const errorBody: PaymentRequired = {
            x402Version: X402_VERSION,
            error: `settlement failed: ${failureReason}`,
            accepts,
          };
          res.status(402);
          originalJson(errorBody);
          return;
        }

        originalJson(body);
      })();

      return res;
    };

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

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      }
    );
  });
}

function base64Encode(s: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(s, 'utf8').toString('base64');
  return btoa(unescape(encodeURIComponent(s)));
}

function base64Decode(s: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(s, 'base64').toString('utf8');
  return decodeURIComponent(escape(atob(s)));
}
