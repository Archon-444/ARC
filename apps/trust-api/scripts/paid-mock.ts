/**
 * Mock-facilitator end-to-end probe for the paid path.
 *
 * Proves the trust-api's wire protocol round-trip without keys or network.
 *
 * Four scenarios exercise the W5/W10 middleware + deep tier:
 *
 *   (A) Success path — verify + settle return success, the response
 *       carries the original 200 body AND X-Payment-Response on the
 *       same flush.
 *   (B) Settle-failure path — verify succeeds, settle rejects; the
 *       middleware drops the handler body, returns 402 with
 *       `error: "settlement failed: ..."` and an X-Payment-Response
 *       carrying `{ success: false, errorReason }`.
 *   (C) Deep tier quote — no payment header returns 402 at $0.05.
 *   (D) Deep tier paid (W10) — payment header present, verify+settle
 *       run, handler returns 200 with `{ assessment, commentary,
 *       source, cache: { hit, key, generatedAt } }`. The stub `source`
 *       is used because ARC_ANTHROPIC_API_KEY is unset in CI.
 *   (D2) Deep tier cache hit — repeating the same target returns
 *        cache.hit=true while still settling the payment (the cache
 *        is on the editorial layer only).
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
import { stubCommentary } from '../src/editorial/stub';

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

  // W10 deep tier — real handler, stub-source commentary (no API key).
  const deepCache = new TtlCache<{
    commentary: any;
    source: 'editorial' | 'stub';
    generatedAt: string;
  }>({ ttlMs: 60 * 60 * 1000 });

  app.post(
    '/v1/trust/read/deep',
    requirePayment({ accepts: deepRequirement, facilitator }) as any,
    (req, res) => {
      const target = String((req.body && req.body.target) || '').toLowerCase();
      const assessment = v0HeuristicAssessment(target);
      const scoreV1 = {
        composite: assessment.overallScore,
        factors: {
          creator: assessment.creatorRisk.score,
          contract: assessment.contractRisk.score,
          trading: assessment.tradingRisk.score,
          liquidity: assessment.liquidityRisk.score,
        },
      };

      const hit = deepCache.get(target);
      if (hit) {
        res.status(200).json({
          target,
          assessment,
          commentary: hit.commentary,
          source: hit.source,
          cache: { hit: true, key: target, generatedAt: hit.generatedAt },
        });
        return;
      }

      const commentary = stubCommentary(target, scoreV1);
      const entry = {
        commentary,
        source: 'stub' as const,
        generatedAt: new Date().toISOString(),
      };
      deepCache.set(target, entry);

      res.status(200).json({
        target,
        assessment,
        commentary,
        source: 'stub',
        cache: { hit: false, key: target, generatedAt: entry.generatedAt },
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

    // (C) deep tier live (W10) -------------------------------------------
    // No payment -> 402 quote at $0.05.
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

    // Paid path (stub commentary because ARC_ANTHROPIC_API_KEY is unset
    // in the mock): verify+settle happen, X-Payment-Response is set, the
    // response body carries the assessment + commentary + cache miss.
    const deepRequirement = deepQuoteResp.body.accepts[0] as PaymentRequirement;
    const deepHeader = makePaymentHeader(deepRequirement, '0x' + 'ef'.repeat(32));
    const beforeDeepVerify = facilitator.verifyCalls;
    const beforeDeepSettle = facilitator.settleCalls;
    const deepResp = await fetchRaw(`${base}/v1/trust/read/deep`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-payment': deepHeader },
      body: JSON.stringify({ target: TARGET }),
    });
    assertEq(deepResp.status, 200, 'deep tier paid call returns 200');
    const deepBody = JSON.parse(deepResp.text);
    assertEq(deepBody.target, TARGET, 'deep body target echoes');
    assert(deepBody.assessment, 'deep body carries assessment');
    assert(deepBody.commentary, 'deep body carries commentary');
    assertEq(deepBody.source, 'stub', 'no ARC_ANTHROPIC_API_KEY -> stub source');
    assertEq(deepBody.cache.hit, false, 'first deep call is a cache miss');
    assert(
      ['low-risk', 'moderate-risk', 'elevated-risk', 'do-not-engage'].includes(
        deepBody.commentary.verdict
      ),
      'commentary.verdict is one of the four bands'
    );
    assertEq(
      facilitator.verifyCalls - beforeDeepVerify,
      1,
      'deep paid path: facilitator.verify called once'
    );
    assertEq(
      facilitator.settleCalls - beforeDeepSettle,
      1,
      'deep paid path: facilitator.settle called once'
    );
    const deepXpr = deepResp.headers.get('x-payment-response');
    assert(deepXpr != null, 'deep paid response carries X-Payment-Response');
    const deepSettled = JSON.parse(Buffer.from(deepXpr!, 'base64').toString('utf8'));
    assertEq(deepSettled.success, true, 'deep settled.success=true');
    log('deep-paid', `200 verdict=${deepBody.commentary.verdict} source=${deepBody.source}`);

    // Second call against the same target must HIT the response cache —
    // no Anthropic / stub regeneration, and the payment still settles
    // (the cache is on the editorial layer only, not the paywall).
    const beforeCacheVerify = facilitator.verifyCalls;
    const beforeCacheSettle = facilitator.settleCalls;
    const cacheHeader = makePaymentHeader(deepRequirement, '0x' + 'ee'.repeat(32));
    const deepRepeat = await fetchRaw(`${base}/v1/trust/read/deep`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-payment': cacheHeader },
      body: JSON.stringify({ target: TARGET }),
    });
    assertEq(deepRepeat.status, 200, 'repeat deep call returns 200');
    const repeatBody = JSON.parse(deepRepeat.text);
    assertEq(repeatBody.cache.hit, true, 'repeat call is a cache HIT');
    assertEq(
      repeatBody.cache.generatedAt,
      deepBody.cache.generatedAt,
      'cached generatedAt is preserved across the hit'
    );
    assertEq(
      facilitator.verifyCalls - beforeCacheVerify,
      1,
      'cache hit still settles: verify called once'
    );
    assertEq(
      facilitator.settleCalls - beforeCacheSettle,
      1,
      'cache hit still settles: settle called once'
    );
    log('deep-cache-hit', `200 cache.hit=true generatedAt preserved`);

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
