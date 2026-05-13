/**
 * Shared test stub for @arc/trust-api.
 *
 * Mirrors only the routes the MCP server actually calls:
 *   - GET  /v1/health                     -> 200 ok
 *   - GET  /v1/passport/:address          -> 200 placeholder body
 *   - POST /v1/trust/read                 -> behavior selectable per test:
 *       'always-quote'  : 402 quote on every call (W6 default)
 *       'paid-on-header': 402 with no X-PAYMENT, 200 + assessment with X-PAYMENT
 *       'settle-fail'   : 402 with no X-PAYMENT, 402 + errorReason with X-PAYMENT
 *
 * The 'paid-on-header' mode is structural: it does NOT verify the EIP-3009
 * signature against a real facilitator. It only checks that an X-PAYMENT
 * header is present and parses as base64 JSON. That is enough to assert
 * the MCP server's signing-payer pipeline assembled the request correctly;
 * the real signature verification path is exercised by trust-api's own
 * tests (apps/trust-api/scripts/{paid-mock,paid-smoke}.ts).
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { once } from 'events';

export type StubMode = 'always-quote' | 'paid-on-header' | 'settle-fail';

export interface TrustApiStub {
  url: string;
  close(): Promise<void>;
  /** Number of POST /v1/trust/read calls the stub has received. */
  callCount(): number;
  /** Most recent X-PAYMENT header value (or null). Useful for assertions. */
  lastPaymentHeader(): string | null;
}

export async function startStubTrustApi(
  mode: StubMode = 'always-quote'
): Promise<TrustApiStub> {
  let calls = 0;
  let lastPayment: string | null = null;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '';

    if (req.method === 'GET' && url === '/v1/health') {
      json(res, 200, { status: 'ok', service: 'stub' });
      return;
    }

    if (req.method === 'GET' && url.startsWith('/v1/passport/')) {
      const address = url.slice('/v1/passport/'.length);
      json(res, 200, {
        address: address.toLowerCase(),
        passport: null,
        status: 'not_indexed',
        notice: 'stub trust-api',
      });
      return;
    }

    if (req.method === 'POST' && url === '/v1/trust/read') {
      calls += 1;
      const xPayment = req.headers['x-payment'];
      lastPayment = typeof xPayment === 'string' ? xPayment : null;

      const hasPayment = lastPayment !== null;

      if (mode === 'always-quote' || !hasPayment) {
        json(res, 402, quoteBody());
        return;
      }

      if (mode === 'paid-on-header') {
        // Structural check: header is base64-encoded JSON.
        if (!isBase64Json(lastPayment)) {
          json(res, 402, { ...quoteBody(), error: 'malformed X-PAYMENT' });
          return;
        }
        res.setHeader(
          'X-Payment-Response',
          Buffer.from(
            JSON.stringify({
              success: true,
              transaction: '0xtest_tx_hash_' + calls,
              network: 'base-mainnet',
              payer: '0xpayertest',
            })
          ).toString('base64')
        );
        json(res, 200, assessmentBody());
        return;
      }

      if (mode === 'settle-fail') {
        res.setHeader(
          'X-Payment-Response',
          Buffer.from(
            JSON.stringify({
              success: false,
              errorReason: 'insufficient_funds',
              network: 'base-mainnet',
            })
          ).toString('base64')
        );
        json(res, 402, {
          ...quoteBody(),
          error: 'settlement failed: insufficient_funds',
        });
        return;
      }
    }

    json(res, 404, { message: 'stub trust-api: route not found', path: url });
  });

  server.listen(0);
  await once(server, 'listening');
  const { port } = server.address() as { port: number };

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => server.close(() => r())),
    callCount: () => calls,
    lastPaymentHeader: () => lastPayment,
  };
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function quoteBody(): unknown {
  return {
    x402Version: 1,
    error: 'X-PAYMENT header is required',
    accepts: [
      {
        scheme: 'exact',
        network: 'base-mainnet',
        maxAmountRequired: '10000',
        resource: '/v1/trust/read',
        description: 'ARC trust read — $0.01 per call',
        payTo: '0x0000000000000000000000000000000000000001',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        maxTimeoutSeconds: 60,
        extra: { name: 'USD Coin', version: '2' },
      },
    ],
  };
}

function assessmentBody(): unknown {
  return {
    target: '0x1234567890abcdef1234567890abcdef12345678',
    scoreV1: {
      composite: 78,
      factors: {
        creator: 80,
        contract: 75,
        trading: 82,
        liquidity: 70,
      },
    },
    passport: null,
    attestations: [],
    notice: 'stub trust-api assessment',
  };
}

function isBase64Json(s: string): boolean {
  try {
    const decoded = Buffer.from(s, 'base64').toString('utf8');
    JSON.parse(decoded);
    return true;
  } catch {
    return false;
  }
}
