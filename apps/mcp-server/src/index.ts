#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { startHttpTransport } from './transport-http.js';

/**
 * Entrypoint for @arc/mcp-server.
 *
 * Transport is selected by `MCP_TRANSPORT` (default: "stdio"):
 *   - stdio : spawned by MCP clients via `node dist/index.js` (Claude
 *             Code, Cursor, MCP Inspector, ...).
 *   - http  : Streamable HTTP per MCP spec; binds Express on PORT
 *             (default 8080) and serves /mcp + /health.
 *
 * Env:
 *   ARC_TRUST_API_URL       — base URL of @arc/trust-api. Required.
 *   MCP_TRANSPORT           — "stdio" (default) | "http"
 *   PORT                    — HTTP port (default 8080)
 *   HOST                    — HTTP bind (default 0.0.0.0)
 *   MCP_HTTP_AUTH_TOKEN     — if set, /mcp requires `Authorization: Bearer <token>`
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

const transportKind = (process.env.MCP_TRANSPORT ?? 'stdio').toLowerCase();

if (transportKind === 'stdio') {
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
        `[arc-mcp-server] failed to connect stdio transport: ${(err as Error).message}\n`
      );
      process.exit(1);
    }
  );
} else if (transportKind === 'http') {
  const port = process.env.PORT ? Number(process.env.PORT) : 8080;
  const host = process.env.HOST ?? '0.0.0.0';
  const authToken = process.env.MCP_HTTP_AUTH_TOKEN;

  startHttpTransport({
    createMcpServer: () => createServer({ trustApiUrl }),
    port,
    host,
    authToken,
  }).then(
    (handle) => {
      process.stderr.write(
        `[arc-mcp-server] http transport listening on http://${host}:${handle.port}/mcp ` +
          `(trustApi=${trustApiUrl}${authToken ? ', auth=bearer' : ''})\n`
      );
    },
    (err: unknown) => {
      process.stderr.write(
        `[arc-mcp-server] failed to start http transport: ${(err as Error).message}\n`
      );
      process.exit(1);
    }
  );
} else {
  process.stderr.write(
    `fatal: unknown MCP_TRANSPORT="${transportKind}" (expected "stdio" or "http")\n`
  );
  process.exit(1);
}
