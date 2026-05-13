/**
 * trust-api smoke probe.
 *
 * Boots the app on an ephemeral port, then exercises the three V0 routes:
 *  1. GET  /v1/health
 *  2. GET  /v1/passport/0x...
 *  3. POST /v1/trust/read  WITHOUT X-PAYMENT (expects 402 with x402Version + accepts)
 *
 * The full paid path is intentionally NOT exercised here — that requires
 * a signed EIP-3009 X-PAYMENT header from a wallet with USDC on Base
 * mainnet and a live facilitator round-trip. The W3 acceptance gate is
 * "402 quote is well-formed and the facilitator URL is callable." Full
 * paid round-trip lives in apps/trust-api/test/paid.e2e.ts (W4+).
 */

import { createApp } from '../src/index';
import { loadConfig } from '../src/config';

async function main(): Promise<void> {
  const cfg = {
    ...loadConfig(),
    payTo: process.env.ARC_PAYTO ?? '0x000000000000000000000000000000000000dEaD',
    port: 0,
  };
  const app = createApp(cfg);
  const server = app.listen(0);
  const { port } = server.address() as { port: number };
  const base = `http://127.0.0.1:${port}`;

  try {
    await check('GET /v1/health', `${base}/v1/health`, { method: 'GET' }, (status, body) => {
      assert(status === 200, `status ${status}`);
      assert(body.status === 'ok', 'status field');
    });

    await check(
      'GET /v1/passport/:address',
      `${base}/v1/passport/0x1234567890abcdef1234567890abcdef12345678`,
      { method: 'GET' },
      (status, body) => {
        assert(status === 200, `status ${status}`);
        assert(body.passport === null, 'placeholder passport');
      }
    );

    await check(
      'POST /v1/trust/read without payment',
      `${base}/v1/trust/read`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target: '0x1234567890abcdef1234567890abcdef12345678' }),
      },
      (status, body) => {
        assert(status === 402, `status ${status}`);
        assert(body.x402Version === 1, 'x402Version');
        assert(Array.isArray(body.accepts) && body.accepts.length === 1, 'accepts array');
        const req = body.accepts[0];
        assert(req.scheme === 'exact', 'scheme');
        assert(req.network === cfg.network, 'network');
        assert(req.maxAmountRequired === '10000', `maxAmountRequired=${req.maxAmountRequired}`);
        assert(req.asset === cfg.asset, 'asset');
      }
    );

    await check(
      'POST /v1/trust/read/deep without payment (W5 placeholder)',
      `${base}/v1/trust/read/deep`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target: '0x1234567890abcdef1234567890abcdef12345678' }),
      },
      (status, body) => {
        assert(status === 402, `deep status ${status}`);
        assert(body.x402Version === 1, 'deep x402Version');
        const req = body.accepts?.[0];
        assert(req && req.maxAmountRequired === '50000', `deep maxAmountRequired=${req?.maxAmountRequired}`);
      }
    );

    console.log('smoke OK');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function check(
  label: string,
  url: string,
  init: RequestInit,
  expect: (status: number, body: any) => void
): Promise<void> {
  const res = await fetch(url, init);
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  expect(res.status, body);
  console.log(`  ${label}: ${res.status}`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
