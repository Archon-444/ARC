/**
 * Programmatic MCP Inspector test — Streamable HTTP transport (W7).
 *
 * Boots a stub @arc/trust-api on an ephemeral port, starts the MCP
 * server's HTTP transport in-process on another ephemeral port,
 * connects an MCP Client via StreamableHTTPClientTransport, and runs
 * the canonical "stub-quote" assertions (same five invariants as the
 * stdio test; see helpers/assertions.ts).
 *
 * In-process is intentional: it exercises the createServer() factory +
 * transport-http.ts wiring directly, with no Node child process. The
 * deploy artifact (Dockerfile / fly.toml) is verified separately.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { createServer } from '../src/server.js';
import { startHttpTransport } from '../src/transport-http.js';
import { startStubTrustApi } from './helpers/stub-trust-api.js';
import { log, runStubQuoteAssertions } from './helpers/assertions.js';

async function main(): Promise<void> {
  const stub = await startStubTrustApi('always-quote');
  log('stub', stub.url);

  const handle = await startHttpTransport({
    createMcpServer: () => createServer({ trustApiUrl: stub.url }),
    port: 0,
    host: '127.0.0.1',
  });
  const url = `http://127.0.0.1:${handle.port}/mcp`;
  log('http', url);

  const transport = new StreamableHTTPClientTransport(new URL(url));
  const client = new Client(
    { name: 'arc-inspector-http-test', version: '0.0.1' },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    await runStubQuoteAssertions(client);

    // Health endpoint sanity check.
    const health = await fetch(`http://127.0.0.1:${handle.port}/health`);
    if (health.status !== 200) throw new Error(`health status ${health.status}`);
    const healthBody = await health.json();
    if (healthBody.transport !== 'http') {
      throw new Error(`unexpected health body: ${JSON.stringify(healthBody)}`);
    }
    log('health', 'transport=http');

    console.log('inspector-http OK');
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    await handle.close();
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
