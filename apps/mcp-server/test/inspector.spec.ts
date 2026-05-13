/**
 * Programmatic MCP Inspector test (W6 acceptance gate).
 *
 * Boots a stub @arc/trust-api on an ephemeral port, spawns the built
 * @arc/mcp-server over stdio with ARC_TRUST_API_URL pointing at the
 * stub, connects an MCP Client, and asserts:
 *
 *   1. listTools() returns the three W6 tools in order.
 *   2. arc_passport_get returns a 200 placeholder body for a valid
 *      address (free path).
 *   3. arc_passport_get rejects an invalid address with isError=true.
 *   4. arc_trust_read against the unpaid stub returns the 402 quote
 *      payload as JSON text (the W6 "stub-quote" posture: no wallet
 *      configured, surface the quote to the agent).
 *   5. arc_search returns the W11 placeholder body with results=[].
 *
 * No keys, no network beyond loopback. This is what CI runs by default.
 */

import { spawn } from 'child_process';
import { once } from 'events';
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_DIST = resolve(__dirname, '..', 'dist', 'index.js');

interface TrustApiStub {
  url: string;
  close(): Promise<void>;
}

async function startStubTrustApi(): Promise<TrustApiStub> {
  const server = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '';
    if (req.method === 'GET' && url === '/v1/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'stub' }));
      return;
    }
    if (req.method === 'GET' && url.startsWith('/v1/passport/')) {
      const address = url.slice('/v1/passport/'.length);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          address: address.toLowerCase(),
          passport: null,
          status: 'not_indexed',
          notice: 'stub trust-api',
        })
      );
      return;
    }
    if (req.method === 'POST' && url === '/v1/trust/read') {
      res.writeHead(402, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
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
        })
      );
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'stub trust-api: route not found', path: url }));
  });
  server.listen(0);
  await once(server, 'listening');
  const { port } = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => server.close(() => r())),
  };
}

async function main(): Promise<void> {
  const stub = await startStubTrustApi();
  log('stub', stub.url);

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_DIST],
    env: { ...process.env, ARC_TRUST_API_URL: stub.url },
    stderr: 'pipe',
  });

  // Surface the child's stderr so failures are debuggable.
  transport.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[child] ${chunk.toString()}`);
  });

  const client = new Client({ name: 'arc-inspector-test', version: '0.0.1' }, { capabilities: {} });

  try {
    await client.connect(transport);

    // 1. listTools
    const list = await client.listTools();
    const names = list.tools.map((t) => t.name);
    assertEq(names, ['arc_trust_read', 'arc_passport_get', 'arc_search'], 'tool order/names');
    log('listTools', names.join(', '));

    // 2. arc_passport_get — happy path
    const passport = await client.callTool({
      name: 'arc_passport_get',
      arguments: { address: '0x1234567890ABCDEF1234567890ABCDEF12345678' },
    });
    assert(!passport.isError, 'arc_passport_get success path is not an error');
    const passportBody = parseText(passport.content);
    assertEq(passportBody.status, 'not_indexed', 'passport status');
    assertEq(passportBody.address, '0x1234567890abcdef1234567890abcdef12345678', 'passport address echoes lowercase');
    log('arc_passport_get', `status=${passportBody.status}`);

    // 3. arc_passport_get — invalid address
    const badPassport = await client.callTool({
      name: 'arc_passport_get',
      arguments: { address: 'not-an-address' },
    });
    assertEq(badPassport.isError, true, 'invalid address is an error');
    log('arc_passport_get invalid', 'isError=true');

    // 4. arc_trust_read — unpaid stub-quote
    const trust = await client.callTool({
      name: 'arc_trust_read',
      arguments: { target: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    assert(!trust.isError, 'unpaid arc_trust_read is not an error');
    const trustBody = parseText(trust.content);
    assertEq(trustBody.status, 'payment_required', 'arc_trust_read status');
    assertEq(trustBody.quote.maxAmountRequired, '10000', 'arc_trust_read quote.maxAmountRequired');
    assertEq(trustBody.quote.network, 'base-mainnet', 'arc_trust_read quote.network');
    log('arc_trust_read', `payment_required maxAmountRequired=${trustBody.quote.maxAmountRequired}`);

    // 5. arc_search — placeholder
    const search = await client.callTool({
      name: 'arc_search',
      arguments: { query: 'usdu', min_score: 50 },
    });
    assert(!search.isError, 'arc_search is not an error');
    const searchBody = parseText(search.content);
    assertEq(searchBody.status, 'not_indexed', 'arc_search status');
    assert(Array.isArray(searchBody.results) && searchBody.results.length === 0, 'arc_search results is []');
    log('arc_search', `not_indexed results=${searchBody.results.length}`);

    console.log('inspector OK');
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    await stub.close();
  }
}

function parseText(content: unknown): any {
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error('tool result has no content');
  }
  const first = content[0] as { type?: string; text?: string };
  if (first.type !== 'text' || typeof first.text !== 'string') {
    throw new Error('tool result first content is not text');
  }
  return JSON.parse(first.text);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

function assertEq<T>(actual: T, expected: T, msg: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}: expected ${e}, got ${a}`);
}

function log(stage: string, msg: string): void {
  console.log(`  [${stage}] ${msg}`);
}

main().catch((err) => {
  console.error(err);
  // Force exit so a hung child process doesn't keep the test alive.
  process.exit(1);
});

// Ensure the script exits cleanly after main() resolves; if a stdio
// pipe somehow stays open, hard-kill after a beat.
process.on('beforeExit', () => {
  setTimeout(() => process.exit(0), 50).unref();
});
