/**
 * Minimal HTTP client for @arc/trust-api.
 *
 * Two posture choices that simplify W6:
 *   - On 402: do NOT throw. Return the structured quote so the tool
 *     handler can surface it to the MCP client as a "payment required"
 *     notice. The MCP server itself does not hold a wallet in W6;
 *     upgrading to a real signer is a one-shot env var swap later.
 *   - On other errors: throw a TrustApiError with status + body so the
 *     handler can map to an MCP tool error response with useful context.
 */

export interface TrustApiClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface PaymentQuote {
  status: 402;
  body: {
    x402Version: number;
    error?: string;
    accepts: Array<{
      scheme: string;
      network: string;
      maxAmountRequired: string;
      resource: string;
      description: string;
      payTo: string;
      asset: string;
      maxTimeoutSeconds?: number;
      extra?: Record<string, unknown>;
    }>;
  };
}

export class TrustApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = 'TrustApiError';
  }
}

export class TrustApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: TrustApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? 15_000;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async getPassport(address: string): Promise<unknown> {
    const res = await this.request('GET', `/v1/passport/${address}`);
    if (res.status !== 200) {
      throw new TrustApiError(res.status, `passport lookup failed (${res.status})`, res.body);
    }
    return res.body;
  }

  /**
   * POST /v1/trust/read.
   *
   * Returns either a successful assessment (200) or the 402 quote. The
   * MCP server treats 402 as data, not an error — surfaced to the agent
   * so it can decide how to fund the call.
   */
  async trustRead(target: string): Promise<
    | { paid: false; quote: PaymentQuote['body'] }
    | { paid: true; assessment: unknown }
  > {
    const res = await this.request('POST', '/v1/trust/read', { target });
    if (res.status === 402) {
      return { paid: false, quote: res.body as PaymentQuote['body'] };
    }
    if (res.status === 200) {
      return { paid: true, assessment: res.body };
    }
    throw new TrustApiError(res.status, `trust read failed (${res.status})`, res.body);
  }

  async health(): Promise<unknown> {
    const res = await this.request('GET', '/v1/health');
    if (res.status !== 200) {
      throw new TrustApiError(res.status, `health failed (${res.status})`, res.body);
    }
    return res.body;
  }

  private async request(
    method: string,
    path: string,
    body?: unknown
  ): Promise<{ status: number; body: unknown }> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: body
          ? { 'content-type': 'application/json' }
          : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ac.signal,
      });
      const text = await res.text();
      const parsed = text ? safeJson(text) : null;
      return { status: res.status, body: parsed };
    } finally {
      clearTimeout(timer);
    }
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
