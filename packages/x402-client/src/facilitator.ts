/**
 * HTTP client for an x402 facilitator. Implements POST /verify and POST /settle.
 *
 * Uses the global fetch (Node 18+) so this is dependency-free at runtime.
 */

import type {
  PaymentPayload,
  PaymentRequirement,
  SettleResponse,
  VerifyResponse,
} from './types';
import { DEFAULT_FACILITATOR_URL } from './constants';

export interface FacilitatorClientOptions {
  url?: string;
  /** Optional bearer token for non-public facilitators (e.g. CDP). */
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export class FacilitatorClient {
  private readonly url: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: FacilitatorClientOptions = {}) {
    this.url = (opts.url ?? DEFAULT_FACILITATOR_URL).replace(/\/$/, '');
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error(
        '@arc/x402-client: no fetch implementation available; pass fetchImpl in Node <18.'
      );
    }
  }

  async verify(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirement
  ): Promise<VerifyResponse> {
    return this.post<VerifyResponse>('/verify', { paymentPayload, paymentRequirements });
  }

  async settle(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirement
  ): Promise<SettleResponse> {
    return this.post<SettleResponse>('/settle', { paymentPayload, paymentRequirements });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;

    const res = await this.fetchImpl(`${this.url}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await safeText(res);
      throw new FacilitatorError(`facilitator ${path} returned ${res.status}: ${text}`, res.status);
    }
    return (await res.json()) as T;
  }
}

export class FacilitatorError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'FacilitatorError';
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
