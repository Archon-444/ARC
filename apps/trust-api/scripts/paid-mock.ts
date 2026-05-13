/**
 * Mock-facilitator end-to-end probe for the paid path.
 *
 * Proves the trust-api's wire protocol round-trip without keys or network.
 *
 * Three scenarios exercise the W5 synchronous-settle middleware:
 *
 *   (A) Success path — verify + settle return success, the response
 *       carries the original 200 body AND X-Payment-Response on the
 *       same flush.
 *   (B) Settle-failure path — verify succeeds, settle rejects; the
 *       middleware drops the handler body, returns 402 with
 *       `error: "settlement failed: ..."` and an X-Payment-Response
 *       carrying `{ success: false, errorReason }`.
 *   (C) quoteOnly path (deep tier placeholder) — payment header
 *       present, but the middleware skips verify and settle entirely
 *       and lets the handler return 501. No facilitator calls recorded.
 *
 * Real cryptographic verification against the live facilitator is
 * exercised by paid-smoke.ts (gated by RUN_LIVE=1 + ARC_TEST_PRIVATE_KEY).
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

type SettleMode = 'ok' | 'reject';

class StubFacilitator extends FacilitatorClient {
  public verifyCalls = 0;
  public settleCalls = 0;
  public lastVerify?: { payload: PaymentPayload; requirement: PaymentRequirement };
  public lastSettle?: { payload: PaymentPayload; requirement: PaymentRequirement };
  public settleMode: SettleMode = 'ok';

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
    if (this.settleMode === 'reject') {
      throw new Error('stub: settle rejected (insufficient gas)');
    }
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

function makeDeepRequirement(): PaymentRequirement {
  return {
    scheme: 'exact',
    network: BASE_MAINNET.network,
    maxAmountRequired: usdToBaseUnits(ARC_TRUST_TIERS.readDeep),
    resource: '/v1/trust/read/deep',
    description: `ARC trust read (deep) — $${ARC_TRUST_TIERS.readDeep.toFixed(2)} per call`,
    payTo: PAYTO,
    asset: BASE_MAINNET.usdcAddress,
    maxTimeoutSeconds: 60,
    extra: { name: BASE_MAINNET.usdcEip712.name, version: BASE_MAINNET.usdcEip712.version },
  };
}

function makeStubApp(facilitator: StubFacilitator) {
  const cache = new TtlCache<TokenRiskAssessment>({ ttlMs: DEFAULT_TRUST_CACHE_TTL_MS });
  const requirement = makeRequirement();
  const deepRequirement = makeDeepRequirement();

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

  app.post(
    '/v1/trust/read/deep',
    requirePayment({ accepts: deepRequirement, facilitator, quoteOnly: true }) as any,
    (_req, res) => {
      res.status(501).json({
        error: 'editorial deep tier ships W10',
        etaWeek: 10,
        notice: 'no settlement attempted; resubmit your X-PAYMENT after W10.',
      });
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
    // (A) success path ---------------------------------------------------
    const quote = await fetchJson(`${base}/v1/trust/read`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target: TARGET }),
    });
    assert(quote.status === 402, `expected 402, got ${quote.status}`);
    assert(quote.body.accepts?.[0]?.maxAmountRequired === '10000', 'quote maxAmountRequired');
    assertEq(facilitator.verifyCalls, 0, 'verify should not be called for the quote');
    log('quote', `402 maxAmountRequired=${quote.body.accepts[0].maxAmountRequired}`);

    const requirement = quote.body.accepts[0] as PaymentRequirement;
    const header = makePaymentHeader(requirement, '0x' + 'ab'.repeat(32));
    log('envelope', `header.length=${header.length}`);

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
    assertEq(facilitator.settleCalls, 1, 'settle called synchronously inside the response');
    assert(facilitator.lastSettle?.requirement.network === requirement.network, 'settle network matches');

    const xpr = paid.headers.get('x-payment-response');
    assert(xpr != null, 'X-Payment-Response header missing on success response');
    const settled = JSON.parse(Buffer.from(xpr!, 'base64').toString('utf8'));
    assertEq(settled.success, true, 'settled.success');
    assert(settled.transaction.startsWith('0xdeadbeef'), 'settled.transaction echoes stub');
    log('paid', `200 overallScore=${body.assessment.overallScore} settle.tx=${settled.transaction.slice(0, 14)}…`);

    // (B) settle-failure path --------------------------------------------
    facilitator.settleMode = 'reject';
    const beforeFailVerify = facilitator.verifyCalls;
    const beforeFailSettle = facilitator.settleCalls;
    const failHeader = makePaymentHeader(requirement, '0x' + 'cd'.repeat(32));
    const failed = await fetchRaw(`${base}/v1/trust/read`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-payment': failHeader },
      body: JSON.stringify({ target: TARGET }),
    });
    assertEq(failed.status, 402, 'settle-failure converts response to 402');
    const failedBody = JSON.parse(failed.text);
    assert(failedBody.x402Version === 1, 'failure body x402Version=1');
    assert(
      typeof failedBody.error === 'string' && failedBody.error.startsWith('settlement failed:'),
      `failure error string: ${failedBody.error}`
    );
    assert(
      Array.isArray(failedBody.accepts) && failedBody.accepts.length === 1,
      'failure body restates accepts'
    );
    assertEq(facilitator.verifyCalls - beforeFailVerify, 1, 'failure path: verify called once');
    assertEq(facilitator.settleCalls - beforeFailSettle, 1, 'failure path: settle called once');
    const failXpr = failed.headers.get('x-payment-response');
    assert(failXpr != null, 'failure response still carries X-Payment-Response');
    const failSettled = JSON.parse(Buffer.from(failXpr!, 'base64').toString('utf8'));
    assertEq(failSettled.success, false, 'failure: settled.success=false');
    assert(
      typeof failSettled.errorReason === 'string' && failSettled.errorReason.length > 0,
      'failure: settled.errorReason populated'
    );
    log('settle-fail', `402 error="${failedBody.error}"`);
    facilitator.settleMode = 'ok';

    // (C) quoteOnly placeholder path (deep tier) -------------------------
    const deepQuoteResp = await fetchJson(`${base}/v1/trust/read/deep`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target: TARGET }),
    });
    assertEq(deepQuoteResp.status, 402, 'deep quote returns 402');
    assertEq(
      deepQuoteResp.body.accepts?.[0]?.maxAmountRequired,
      '50000',
      'deep maxAmountRequired = $0.05 (50000 base units)'
    );
    log('deep-quote', `402 maxAmountRequired=${deepQuoteResp.body.accepts[0].maxAmountRequired}`);

    const deepRequirement = deepQuoteResp.body.accepts[0] as PaymentRequirement;
    const deepHeader = makePaymentHeader(deepRequirement, '0x' + 'ef'.repeat(32));
    const beforeDeepVerify = facilitator.verifyCalls;
    const beforeDeepSettle = facilitator.settleCalls;
    const deepResp = await fetchRaw(`${base}/v1/trust/read/deep`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-payment': deepHeader },
      body: JSON.stringify({ target: TARGET }),
    });
    assertEq(deepResp.status, 501, 'deep tier returns 501 when payment header present');
    const deepBody = JSON.parse(deepResp.text);
    assertEq(deepBody.etaWeek, 10, 'deep tier signals etaWeek=10');
    assertEq(
      facilitator.verifyCalls - beforeDeepVerify,
      0,
      'quoteOnly skips facilitator.verify entirely'
    );
    assertEq(
      facilitator.settleCalls - beforeDeepSettle,
      0,
      'quoteOnly skips facilitator.settle entirely'
    );
    assert(
      deepResp.headers.get('x-payment-response') == null,
      'quoteOnly emits no X-Payment-Response (no settlement happened)'
    );
    log('deep-501', '501 no facilitator calls, no X-Payment-Response');

    console.log('paid-mock OK');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function makePaymentHeader(requirement: PaymentRequirement, nonce: string): string {
  const typedData = buildEvmExactTypedData(requirement, PAYER, { now: 1_700_000_000, nonce });
  const fakeSignature = '0x' + '00'.repeat(65);
  return buildXPaymentHeader(requirement.network, typedData.message, fakeSignature);
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
