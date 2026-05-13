/**
 * Streamable HTTP transport for @arc/mcp-server.
 *
 * Wires `StreamableHTTPServerTransport` from
 * @modelcontextprotocol/sdk/server/streamableHttp.js into an Express
 * app. Stateful sessions: one transport per `Mcp-Session-Id`. The SDK
 * generates the session ID on `initialize`; we keep the
 * sessionId -> transport map and clean up on session close.
 *
 * Endpoints:
 *   POST   /mcp     -> JSON-RPC requests (initialize, tools/*, etc.)
 *   GET    /mcp     -> SSE stream for server -> client notifications
 *   DELETE /mcp     -> explicit session termination
 *   GET    /health  -> liveness probe for the deploy platform
 *
 * Optional bearer-token gate via `MCP_HTTP_AUTH_TOKEN`. Off by default
 * so the MCP Inspector and Bazaar's crawler can probe anonymously.
 */

import { randomUUID } from 'crypto';
import express, { type Request, type Response, type NextFunction, type Application } from 'express';
import { type Server as HttpServer } from 'http';
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

export interface StartHttpTransportOptions {
  /**
   * Factory for a fresh MCP server instance per session. We build a new
   * Server per session rather than sharing one — the SDK transport is
   * designed to be paired 1:1 with a Server, and sharing risks bleed.
   */
  createMcpServer: () => McpServer;
  port?: number;
  host?: string;
  /** If set, requests to /mcp must include `Authorization: Bearer <token>`. */
  authToken?: string;
}

export interface HttpTransportHandle {
  httpServer: HttpServer;
  port: number;
  close(): Promise<void>;
}

const SESSION_HEADER = 'mcp-session-id';

export async function startHttpTransport(
  opts: StartHttpTransportOptions
): Promise<HttpTransportHandle> {
  const { createMcpServer, port = 8080, host = '0.0.0.0', authToken } = opts;

  const app: Application = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: '@arc/mcp-server',
      transport: 'http',
    });
  });

  const transports = new Map<string, StreamableHTTPServerTransport>();

  const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!authToken) {
      next();
      return;
    }
    const header = req.header('authorization') ?? '';
    if (header !== `Bearer ${authToken}`) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  };

  app.post('/mcp', requireAuth, async (req: Request, res: Response) => {
    const sessionId = req.header(SESSION_HEADER);
    let transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      if (!isInitializeRequest(req.body)) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'no active session for request' },
          id: null,
        });
        return;
      }
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports.set(sid, transport!);
        },
      });
      transport.onclose = () => {
        if (transport!.sessionId) {
          transports.delete(transport!.sessionId);
        }
      };
      const server = createMcpServer();
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.get('/mcp', requireAuth, async (req: Request, res: Response) => {
    const sessionId = req.header(SESSION_HEADER);
    const transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      res.status(404).json({ error: 'unknown session' });
      return;
    }
    await transport.handleRequest(req, res);
  });

  app.delete('/mcp', requireAuth, async (req: Request, res: Response) => {
    const sessionId = req.header(SESSION_HEADER);
    const transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      res.status(404).json({ error: 'unknown session' });
      return;
    }
    await transport.close();
    res.status(204).end();
  });

  const httpServer = app.listen(port, host);
  await new Promise<void>((resolve, reject) => {
    httpServer.once('listening', () => resolve());
    httpServer.once('error', reject);
  });

  const boundPort = (httpServer.address() as { port: number }).port;

  return {
    httpServer,
    port: boundPort,
    close: () =>
      new Promise<void>((resolve) => {
        for (const t of transports.values()) {
          t.close().catch(() => {
            /* swallow during shutdown */
          });
        }
        transports.clear();
        httpServer.close(() => resolve());
      }),
  };
}
