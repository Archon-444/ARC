/**
 * Mock-facilitator end-to-end probe for the paid path.
 *
 * Proves the trust-api's wire protocol round-trip without keys or network:
 *
 *   1. Boot trust-api with a stub FacilitatorClient that always verifies
 *      and settles successfully.
 *   2. POST /v1/trust/read once with no X-PAYMENT → expect 402 with a
 *      well-formed quote.
 *   3. Build a deterministic X-PAYMENT envelope (fake signature; the
 *      stub facilitator does not check it) using the @arc/x402-client
 *      builders.
 *   4. POST /v1/trust/read again with X-PAYMENT → expect 200, scoreV1
 *      assessment in the body, and X-Payment-Response on the response.
 *
 * Real cryptographic verification against the live facilitator is exercised
 * by paid-smoke.ts (gated by RUN_LIVE=1 + ARC_TEST_PRIVATE_KEY).
 */

import {
  ARC_TRUST_TIERS,
  BASE_MAINNET,
  FacilitatorClient,
  buildEvmExactTypedData,
  buildXPaymentHeader,
  usdToBaseUnits,
  type PaymentPayload,
  type PaymentRequirement,
  type SettleResponse,
  type VerifyResponse,
} from '@arc/x402-client';

import express from 'express';

// Re-implement the surface of routes/trust.ts but inject our stub
// facilitator so we don't reach the network.
import {
  DEFAULT_TRUST_CACHE_TTL_MS,
  TtlCache,
  type TokenRiskAssessment,
} from '@arc/trust-core';
import { v0HeuristicAssessment } from '../src/sources/heuristic';
import { healthHandler } from '../src/routes/health';
import { passportHandler } from '../src/routes/passport';
import { requirePayment } from '@arc/x402-client';

const PAYER = '0x1111111111111111111111111111111111111111';
const PAYTO = '0x2222222222222222222222222222222222222222';
const TARGET = '0x1234567890abcdef1234567890abcdef12345678';
const RESOURCE = '/v1/trust/read';

class StubFacilitator extends FacilitatorClient {
  public verifyCalls = 0;
  public settleCalls = 0;
  public lastVerify?: { payload: PaymentPayload; requirement: PaymentRequirement };
  public lastSettle?: { payload: PaymentPayload; requirement: PaymentRequirement };

  constructor() {
    super({ url: 'https://stub.invalid', fetchImpl: (async () => {
      throw new Error('stub facilitator should not call fetch');
    }) as unknown as typeof fetch });
  }

  override async verify(
    payload: PaymentPayload,
    requirement: PaymentRequirement
  ): Promise<VerifyResponse> {
    this.verifyCalls++;
    this.lastVerify = { payload, requirement };
    return { isValid: true, payer: payload.payload.authorization.from };
  }

  override async settle(
    payload: PaymentPayload,
    requirement: PaymentRequirement
  ): Promise<SettleResponse> {
    this.settleCalls++;
    this.lastSettle = { payload, requirement };
    return {
      success: true,
      transaction: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      network: requirement.network,
      payer: payload.payload.authorization.from,
    };
  }
}

function makeRequirement(): PaymentRequirement {
  return {
    scheme: 'exact',
    network: BASE_MAINNET.network,
    maxAmountRequired: usdToBaseUnits(ARC_TRUST_TIERS.read),
    resource: RESOURCE,
    description: `ARC trust read — $${ARC_TRUST_TIERS.read.toFixed(2)} per call`,
    payTo: PAYTO,
    asset: BASE_MAINNET.usdcAddress,
    maxTimeoutSeconds: 60,
    extra: { name: BASE_MAINNET.usdcEip712.name, version: BASE_MAINNET.usdcEip712.version },
  };
}

function makeStubApp(facilitator: StubFacilitator) {
  const cache = new TtlCache<TokenRiskAssessment>({ ttlMs: DEFAULT_TRUST_CACHE_TTL_MS });
  const requirement = makeRequirement();

  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/v1/health', healthHandler);
  app.get('/v1/passport/:address', passportHandler);

  app.post(
    '/v1/trust/read',
    requirePayment({ accepts: requirement, facilitator }) as any,
    (req, res) => {
      const target = String((req.body && req.body.target) || '').toLowerCase();
      const assessment = cache.get(target) ?? (() => {
        const a = v0HeuristicAssessment(target);
        cache.set(target, a);
        return a;
      })();
      res.status(200).json({ target, assessment });
    }
  );

  return app;
}

async function main(): Promise<void> {
  const facilitator = new StubFacilitator();
  const app = makeStubApp(facilitator);
  const server = app.listen(0);
  const { port } = server.address() as { port: number };
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1) 402 quote
    const quote = await fetchJson(`${base}/v1/trust/read`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target: TARGET }),
    });
    assert(quote.status === 402, `expected 402, got ${quote.status}`);
    assert(quote.body.accepts?.[0]?.maxAmountRequired === '10000', 'quote maxAmountRequired');
    assertEq(facilitator.verifyCalls, 0, 'verify should not be called for the quote');
    log('quote', `402 maxAmountRequired=${quote.body.accepts[0].maxAmountRequired}`);

    // 2) Build a payment envelope (fake signature; stub facilitator accepts it).
    const requirement = quote.body.accepts[0] as PaymentRequirement;
    const typedData = buildEvmExactTypedData(requirement, PAYER, {
      now: 1_700_000_000,
      nonce: '0x' + 'ab'.repeat(32),
    });
    const fakeSignature = '0x' + '00'.repeat(65);
    const header = buildXPaymentHeader(requirement.network, typedData.message, fakeSignature);
    log('envelope', `header.length=${header.length} domain=${typedData.domain.name}@${typedData.domain.version}`);

    // 3) Paid call
    const paid = await fetchRaw(`${base}/v1/trust/read`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-payment': header },
      body: JSON.stringify({ target: TARGET }),
    });
    assert(paid.status === 200, `paid call status ${paid.status}: ${paid.text}`);
    const body = JSON.parse(paid.text);
    assert(body.target === TARGET.toLowerCase(), 'target echoes');
    assert(body.assessment?.scoringVersion?.startsWith('v1.0.0'), 'scoring version v1.0.0*');
    assert(typeof body.assessment?.overallScore === 'number', 'overallScore present');
    assertEq(facilitator.verifyCalls, 1, 'verify called exactly once');

    // 4) Settlement is async (res.on('finish')); poll briefly.
    await waitFor(() => facilitator.settleCalls === 1, 1500, 'settle never called');
    assert(facilitator.lastSettle?.requirement.network === requirement.network, 'settle network matches');

    // 5) X-Payment-Response header should be attached on success.
    const xpr = paid.headers.get('x-payment-response');
    assert(xpr != null, 'X-Payment-Response header missing');
    const settled = JSON.parse(Buffer.from(xpr!, 'base64').toString('utf8'));
    assert(settled.success === true, 'settled.success');
    assert(settled.transaction.startsWith('0xdeadbeef'), 'settled.transaction echoes stub');

    log('paid', `200 overallScore=${body.assessment.overallScore} settle.tx=${settled.transaction.slice(0, 14)}…`);
    console.log('paid-mock OK');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

interface RawResponse {
  status: number;
  text: string;
  headers: Headers;
}

async function fetchRaw(url: string, init: RequestInit): Promise<RawResponse> {
  const res = await fetch(url, init);
  return { status: res.status, text: await res.text(), headers: res.headers };
}

async function fetchJson(
  url: string,
  init: RequestInit
): Promise<{ status: number; body: any }> {
  const r = await fetchRaw(url, init);
  return { status: r.status, body: r.text ? JSON.parse(r.text) : null };
}

async function waitFor(cond: () => boolean, timeoutMs: number, msg: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (cond()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`waitFor timeout: ${msg}`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

function assertEq<T>(actual: T, expected: T, msg: string): void {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function log(stage: string, msg: string): void {
  console.log(`  [${stage}] ${msg}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
