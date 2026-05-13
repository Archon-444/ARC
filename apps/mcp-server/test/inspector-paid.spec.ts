/**
 * Programmatic MCP Inspector test — signing-payer mode (W7).
 *
 * Boots the stub trust-api in 'paid-on-header' mode, configures the
 * MCP server with ARC_MCP_PAYER_PRIVATE_KEY (a throwaway test key),
 * and asserts arc_trust_read returns an actual assessment instead of
 * a quote. Then re-runs against 'settle-fail' to assert the
 * payment_required + settleError surface.
 *
 * Structural-only: the stub does NOT verify the EIP-3009 signature
 * against a real facilitator. It only checks that an X-PAYMENT header
 * is present and parses as base64 JSON. Real signature verification
 * is exercised by trust-api's paid-mock + paid-smoke scripts.
 *
 * Runs in-process via stdio (spawned child reads ARC_MCP_PAYER_PRIVATE_KEY
 * from env). HTTP variant is left for W8+ once a real funded wallet
 * is wired into a deployed instance.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { startStubTrustApi } from './helpers/stub-trust-api.js';
import { assert, assertEq, log, parseText } from './helpers/assertions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_DIST = resolve(__dirname, '..', 'dist', 'index.js');

// Throwaway anvil-style test key — well-known, never funded on mainnet.
const TEST_PAYER_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_PAYER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();

async function spawnClient(stubUrl: string): Promise<{ client: Client; close: () => Promise<void> }> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_DIST],
    env: {
      ...process.env,
      ARC_TRUST_API_URL: stubUrl,
      ARC_MCP_PAYER_PRIVATE_KEY: TEST_PAYER_KEY,
    },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[child] ${chunk.toString()}`);
  });
  const client = new Client(
    { name: 'arc-inspector-paid-test', version: '0.0.1' },
    { capabilities: {} }
  );
  await client.connect(transport);
  return {
    client,
    close: async () => {
      try {
        await client.close();
      } catch {
        /* ignore */
      }
    },
  };
}

async function runPaidPath(): Promise<void> {
  const stub = await startStubTrustApi('paid-on-header');
  log('stub', `${stub.url} mode=paid-on-header`);
  const { client, close } = await spawnClient(stub.url);
  try {
    const result = await client.callTool({
      name: 'arc_trust_read',
      arguments: { target: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    assert(!result.isError, 'paid arc_trust_read is not an error');
    const body = parseText(result.content);
    assertEq(body.status, 'ok', 'paid status');
    assert(body.assessment, 'paid result has assessment object');
    assertEq(body.assessment.scoreV1.composite, 78, 'paid scoreV1.composite');
    // Stub increments call counter on every POST; the paid response is the
    // second call (first was the unpaid 402 quote), so synthetic tx is _2.
    assertEq(body.txHash, '0xtest_tx_hash_2', 'paid txHash from X-Payment-Response');
    log('arc_trust_read paid', `composite=${body.assessment.scoreV1.composite} tx=${body.txHash}`);

    // The stub recorded the X-PAYMENT header from the retry; assert the
    // server actually signed something base64-shaped.
    assertEq(stub.callCount(), 2, 'stub saw 2 calls (quote + retry)');
    const header = stub.lastPaymentHeader();
    assert(header !== null && header.length > 0, 'X-PAYMENT header captured');
    const decoded = JSON.parse(Buffer.from(header!, 'base64').toString('utf8'));
    assertEq(decoded.scheme, 'exact', 'X-PAYMENT scheme=exact');
    assertEq(decoded.network, 'base-mainnet', 'X-PAYMENT network=base-mainnet');
    assertEq(
      String(decoded.payload.authorization.from).toLowerCase(),
      TEST_PAYER_ADDRESS,
      'X-PAYMENT from = test payer address'
    );
    assertEq(
      decoded.payload.authorization.value,
      '10000',
      'X-PAYMENT value = $0.01 USDC (10000 = 1e4 base units)'
    );
    log('x-payment', `scheme=${decoded.scheme} from=${decoded.payload.authorization.from}`);
  } finally {
    await close();
    await stub.close();
  }
}

async function runSettleFailPath(): Promise<void> {
  const stub = await startStubTrustApi('settle-fail');
  log('stub', `${stub.url} mode=settle-fail`);
  const { client, close } = await spawnClient(stub.url);
  try {
    const result = await client.callTool({
      name: 'arc_trust_read',
      arguments: { target: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    assert(!result.isError, 'settle-fail arc_trust_read is not a JSON-RPC error');
    const body = parseText(result.content);
    assertEq(body.status, 'payment_required', 'settle-fail status');
    assertEq(body.settleError, 'insufficient_funds', 'settle-fail settleError surfaced');
    assert(
      typeof body.notice === 'string' && body.notice.includes('Settlement failed'),
      'settle-fail notice mentions settlement'
    );
    log('arc_trust_read settle-fail', `settleError=${body.settleError}`);
  } finally {
    await close();
    await stub.close();
  }
}

async function main(): Promise<void> {
  await runPaidPath();
  await runSettleFailPath();
  console.log('inspector-paid OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('beforeExit', () => {
  setTimeout(() => process.exit(0), 50).unref();
});
