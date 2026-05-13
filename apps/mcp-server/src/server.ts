import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TrustApiClient, type PayerConfig } from './trust-api-client.js';
import {
  arcPassportGetTool,
  handleArcPassportGet,
} from './tools/passport-get.js';
import { arcTrustReadTool, handleArcTrustRead } from './tools/trust-read.js';
import { arcSearchTool, handleArcSearch } from './tools/search.js';

export interface CreateServerOptions {
  trustApiUrl: string;
  trustApiTimeoutMs?: number;
  fetchImpl?: typeof fetch;
  /**
   * If set, the server will sign EIP-3009 X-PAYMENT envelopes and
   * retry POST /v1/trust/read on 402. The private key is held in
   * memory and never logged. Default: undefined (stub-quote mode).
   */
  payer?: PayerConfig;
}

const SERVICE = {
  name: '@arc/mcp-server',
  version: '0.0.1',
} as const;

/**
 * Build the low-level MCP `Server` with three tools wired to a
 * @arc/trust-api client. The factory is dependency-injection-friendly
 * so the programmatic Inspector test can pass an in-process fetch stub.
 *
 * Tools:
 *   - arc_trust_read   ($0.01, surfaced as "payment required" quote in
 *                      W6 since the server holds no wallet)
 *   - arc_passport_get (free)
 *   - arc_search       (W11 placeholder, returns empty)
 */
export function createServer(opts: CreateServerOptions): Server {
  const client = new TrustApiClient({
    baseUrl: opts.trustApiUrl,
    timeoutMs: opts.trustApiTimeoutMs,
    fetchImpl: opts.fetchImpl,
    payer: opts.payer,
  });

  const server = new Server(SERVICE, {
    capabilities: { tools: {} },
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [arcTrustReadTool, arcPassportGetTool, arcSearchTool],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name;
    const args = req.params.arguments;
    switch (name) {
      case arcTrustReadTool.name:
        return handleArcTrustRead(client, args);
      case arcPassportGetTool.name:
        return handleArcPassportGet(client, args);
      case arcSearchTool.name:
        return handleArcSearch(args);
      default:
        return {
          content: [{ type: 'text' as const, text: `unknown tool: ${name}` }],
          isError: true,
        };
    }
  });

  return server;
}
