#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

/**
 * stdio entrypoint for @arc/mcp-server.
 *
 * Spawned by MCP clients (Claude Code, Cursor, MCP Inspector, ...) via:
 *   command: "node", args: ["apps/mcp-server/dist/index.js"]
 *
 * Env:
 *   ARC_TRUST_API_URL   — base URL of @arc/trust-api. Required.
 *                         Example: https://trust.arc.example.com
 *
 * The stdio transport sends JSON-RPC over stdin / stdout. ALL non-protocol
 * output MUST go to stderr to avoid corrupting the channel.
 */

const trustApiUrl = process.env.ARC_TRUST_API_URL;
if (!trustApiUrl) {
  process.stderr.write(
    'fatal: ARC_TRUST_API_URL is required (point at a running @arc/trust-api)\n'
  );
  process.exit(1);
}

const server = createServer({ trustApiUrl });
const transport = new StdioServerTransport();

server.connect(transport).then(
  () => {
    process.stderr.write(
      `[arc-mcp-server] connected stdio transport (trustApi=${trustApiUrl})\n`
    );
  },
  (err: unknown) => {
    process.stderr.write(
      `[arc-mcp-server] failed to connect transport: ${(err as Error).message}\n`
    );
    process.exit(1);
  }
);
