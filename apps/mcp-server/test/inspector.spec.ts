/**
 * Programmatic MCP Inspector test — stdio transport (W6 acceptance gate).
 *
 * Boots a stub @arc/trust-api on an ephemeral port, spawns the built
 * @arc/mcp-server over stdio with ARC_TRUST_API_URL pointing at the
 * stub, connects an MCP Client, and runs the canonical "stub-quote"
 * assertions (see runStubQuoteAssertions for the five invariants).
 *
 * The HTTP-transport variant lives in inspector-http.spec.ts and runs
 * the same assertions through StreamableHTTPClientTransport. Sharing
 * the helpers means tool-wiring drift surfaces in every transport.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { startStubTrustApi } from './helpers/stub-trust-api.js';
import { log, runStubQuoteAssertions } from './helpers/assertions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_DIST = resolve(__dirname, '..', 'dist', 'index.js');

async function main(): Promise<void> {
  const stub = await startStubTrustApi('always-quote');
  log('stub', stub.url);

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_DIST],
    env: { ...process.env, ARC_TRUST_API_URL: stub.url },
    stderr: 'pipe',
  });

  transport.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[child] ${chunk.toString()}`);
  });

  const client = new Client(
    { name: 'arc-inspector-test', version: '0.0.1' },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    await runStubQuoteAssertions(client);
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('beforeExit', () => {
  setTimeout(() => process.exit(0), 50).unref();
});
