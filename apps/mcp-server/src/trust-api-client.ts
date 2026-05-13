/**
 * Minimal HTTP client for @arc/trust-api.
 *
 * Two postures:
 *
 *   - Stub-quote (W6 default): no payer configured. On 402 the client
 *     returns the structured quote so the tool handler can surface it
 *     to the agent as "payment required". No wallet held by the server.
 *
 *   - Signing-payer (W7 opt-in): payer.privateKey configured. On 402
 *     the client signs an EIP-3009 transferWithAuthorization for USDC
 *     on Base mainnet (via @arc/x402-client builders + viem), retries
 *     POST /v1/trust/read once with the X-PAYMENT header, and either:
 *       - 200 -> { paid: true, assessment, txHash? }
 *       - 402 -> { paid: false, quote, settleError } so the agent can
 *               decide whether to retry later (e.g. funding issue)
 *       - other -> throws TrustApiError
 *
 * On non-402 / non-200 errors at any stage: throw TrustApiError with
 * status + body. viem and @arc/x402-client are dynamic-imported inside
 * the retry branch so the unfunded boot path doesn't pay for them.
 */

export interface PayerConfig {
  /** 0x-prefixed 32-byte hex private key. Held in memory; never logged. */
  privateKey: string;
  /**
   * Optional override for the chain ID resolved from the quote network.
   * Default behavior matches @arc/x402-client.buildEvmExactTypedData:
   * 'base-mainnet' -> 8453, 'base-sepolia' -> 84532.
   */
  chainId?: number;
}

export interface TrustApiClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  payer?: PayerConfig;
}

export interface PaymentQuoteBody {
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
}

export type TrustReadResult =
  | { paid: false; quote: PaymentQuoteBody; settleError?: string }
  | { paid: true; assessment: unknown; txHash?: string };

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
  private readonly payer?: PayerConfig;

  constructor(opts: TrustApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? 15_000;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.payer = opts.payer;
  }

  hasPayer(): boolean {
    return Boolean(this.payer);
  }

  async getPassport(address: string): Promise<unknown> {
    const res = await this.request('GET', `/v1/passport/${address}`);
    if (res.status !== 200) {
      throw new TrustApiError(res.status, `passport lookup failed (${res.status})`, res.body);
    }
    return res.body;
  }

  async trustRead(target: string): Promise<TrustReadResult> {
    const first = await this.request('POST', '/v1/trust/read', { target });

    if (first.status === 200) {
      return { paid: true, assessment: first.body };
    }
    if (first.status !== 402) {
      throw new TrustApiError(first.status, `trust read failed (${first.status})`, first.body);
    }

    const quote = first.body as PaymentQuoteBody;

    if (!this.payer) {
      return { paid: false, quote };
    }

    return await this.attemptPaidRetry(target, quote, this.payer);
  }

  async health(): Promise<unknown> {
    const res = await this.request('GET', '/v1/health');
    if (res.status !== 200) {
      throw new TrustApiError(res.status, `health failed (${res.status})`, res.body);
    }
    return res.body;
  }

  private async attemptPaidRetry(
    target: string,
    quote: PaymentQuoteBody,
    payer: PayerConfig
  ): Promise<TrustReadResult> {
    const accept = quote.accepts.find((a) => a.scheme === 'exact');
    if (!accept) {
      throw new TrustApiError(
        402,
        `no supported scheme in quote (have: ${quote.accepts.map((a) => a.scheme).join(',')})`,
        quote
      );
    }

    const { buildEvmExactTypedData, buildXPaymentHeader } = await import('@arc/x402-client');
    const { privateKeyToAccount } = await import('viem/accounts');

    const pk = payer.privateKey.startsWith('0x') ? payer.privateKey : `0x${payer.privateKey}`;
    const account = privateKeyToAccount(pk as `0x${string}`);

    const requirement = {
      scheme: accept.scheme as 'exact',
      network: accept.network,
      maxAmountRequired: accept.maxAmountRequired,
      resource: accept.resource,
      description: accept.description,
      payTo: accept.payTo,
      asset: accept.asset,
      maxTimeoutSeconds: accept.maxTimeoutSeconds,
      extra: accept.extra,
    };

    const typedData = buildEvmExactTypedData(requirement, account.address, {
      chainId: payer.chainId,
    });
    // viem's strict typed-data types want branded `0x${string}` fields and
    // a `Record<string, unknown>` message. The x402-client builders return
    // structured strings; the runtime values are correct, so cast across.
    const signature = await account.signTypedData({
      domain: typedData.domain as unknown as Parameters<typeof account.signTypedData>[0]['domain'],
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message as unknown as Record<string, unknown>,
    });
    const xPayment = buildXPaymentHeader(requirement.network, typedData.message, signature);

    const retry = await this.request('POST', '/v1/trust/read', { target }, { 'x-payment': xPayment });

    if (retry.status === 200) {
      const txHash = decodeTxHash(retry.headers['x-payment-response']);
      return { paid: true, assessment: retry.body, txHash };
    }
    if (retry.status === 402) {
      const settleError =
        decodeSettleError(retry.headers['x-payment-response']) ??
        (retry.body && typeof retry.body === 'object' && 'error' in retry.body
          ? String((retry.body as { error: unknown }).error)
          : 'unknown settlement error');
      return { paid: false, quote: retry.body as PaymentQuoteBody, settleError };
    }
    throw new TrustApiError(retry.status, `paid retry failed (${retry.status})`, retry.body);
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<{ status: number; body: unknown; headers: Record<string, string> }> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = { ...(extraHeaders ?? {}) };
      if (body !== undefined) headers['content-type'] = 'application/json';

      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ac.signal,
      });
      const text = await res.text();
      const parsed = text ? safeJson(text) : null;
      const headerMap: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headerMap[key.toLowerCase()] = value;
      });
      return { status: res.status, body: parsed, headers: headerMap };
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

function decodeTxHash(header: string | undefined): string | undefined {
  const decoded = decodePaymentResponse(header);
  if (!decoded || typeof decoded !== 'object') return undefined;
  const tx = (decoded as { transaction?: unknown }).transaction;
  return typeof tx === 'string' ? tx : undefined;
}

function decodeSettleError(header: string | undefined): string | undefined {
  const decoded = decodePaymentResponse(header);
  if (!decoded || typeof decoded !== 'object') return undefined;
  const err = (decoded as { errorReason?: unknown }).errorReason;
  return typeof err === 'string' ? err : undefined;
}

function decodePaymentResponse(header: string | undefined): unknown {
  if (!header) return undefined;
  try {
    return JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
  } catch {
    return undefined;
  }
}
