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
      'POST /v1/trust/read/deep without payment (W10 deep tier)',
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

    // W13: /v1/attestations/:subject unconfigured-path smoke. With
    // ARC_ATTESTATION_REGISTRY_ADDRESS + ARC_RPC_URL unset (default
    // CI posture), the route returns 503 with a structured body
    // naming the env vars an operator needs to set.
    await check(
      'GET /v1/attestations/:subject (W13 unconfigured)',
      `${base}/v1/attestations/0x1234567890abcdef1234567890abcdef12345678`,
      { method: 'GET' },
      (status, body) => {
        assert(status === 503, `attestations status ${status}`);
        assert(body.status === 'unconfigured', 'unconfigured marker');
        assert(
          typeof body.reason === 'string' && body.reason.includes('ARC_ATTESTATION_REGISTRY_ADDRESS'),
          'reason names the env var'
        );
      }
    );

    // W13: invalid subject still 400s ahead of the configuration
    // check so callers see "bad input" before "service down."
    await check(
      'GET /v1/attestations/:subject 400 on bad subject',
      `${base}/v1/attestations/0xZZ`,
      { method: 'GET' },
      (status, body) => {
        assert(status === 400, `bad-subject status ${status}`);
        assert(body.error === 'Invalid subject address', 'error field');
      }
    );

    // W13: unknown schema name fails fast (still ahead of the
    // configuration check, because schema validation is cheap).
    await check(
      'GET /v1/attestations/:subject?schema=unknown 400',
      `${base}/v1/attestations/0x1234567890abcdef1234567890abcdef12345678?schema=counsel.unknown.v1`,
      { method: 'GET' },
      (status, body) => {
        assert(status === 400, `unknown-schema status ${status}`);
        assert(
          typeof body.error === 'string' && body.error.startsWith('Unknown schema name'),
          'error names the unknown schema'
        );
        assert(Array.isArray(body.known) && body.known.length === 5, 'known list (5 canonical)');
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
