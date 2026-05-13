# @arc/mcp-server

ARC's Model Context Protocol server. Exposes three tools so agents
(Claude Code, Codex, Cursor, the MCP Inspector, ...) can talk to the
ARC trust layer over **either stdio or Streamable HTTP**.

| Tool | Tier | Status |
|---|---|---|
| `arc_trust_read(target)` | $0.01 | Paid via x402 on Base mainnet. Surfaces 402 quote when the server is unfunded; returns the actual scoreV1 assessment when `ARC_MCP_PAYER_PRIVATE_KEY` is set. |
| `arc_passport_get(address)` | free | Returns the trust-api passport placeholder; real on-chain data lands once `ArcPassport.sol` ships. |
| `arc_search(query, min_score?)` | free | Stub. Real index lands with the public trust surface. |

## Transports

Two transports, picked by `MCP_TRANSPORT` (default `stdio`):

| Transport | When to use | Boot |
|---|---|---|
| **stdio** | Local dev, Claude Code / Cursor / Codex spawning the server as a child process. | `node dist/index.js` |
| **Streamable HTTP** | Hosted endpoint for the Bazaar listing or any MCP client that prefers a URL. | `MCP_TRANSPORT=http node dist/index.js` (binds `:8080/mcp` + `:8080/health`) |

Both transports share the same `createServer({ trustApiUrl, payer? })`
factory in `src/server.ts`, so tool wiring drift surfaces in every
transport's inspector test.

## Posture: stub-quote vs. signing-payer

`arc_trust_read` is a paid call ($0.01 USDC on Base mainnet, settled
via x402). The server has two postures, selected by env var:

| Posture | Behavior | Trigger |
|---|---|---|
| **stub-quote** (default) | On 402 the tool returns the quote to the agent. The MCP server holds no wallet. Demoable without funding. | `ARC_MCP_PAYER_PRIVATE_KEY` unset. |
| **signing-payer** | On 402 the server signs an EIP-3009 USDC `transferWithAuthorization` (via `@arc/x402-client` + viem), retries once with `X-PAYMENT`, and returns `{ status: 'ok', assessment, txHash }` to the agent. If settlement fails (insufficient funds, bad nonce, ...) the tool returns `payment_required` with `settleError` so the agent can decide to retry. | `ARC_MCP_PAYER_PRIVATE_KEY` set to a 0x-prefixed 32-byte hex private key. |

The signing-payer wallet is funded by the **operator** of the MCP
server, not by ARC. The key is held in process memory and never logged.

## Environment

| Variable | Default | Notes |
|---|---|---|
| `ARC_TRUST_API_URL` | _(required)_ | Base URL of a running `@arc/trust-api`. Example: `https://trust.arc.example.com` |
| `MCP_TRANSPORT` | `stdio` | `stdio` or `http`. |
| `PORT` | `8080` | HTTP transport bind port. |
| `HOST` | `0.0.0.0` | HTTP transport bind host. |
| `MCP_HTTP_AUTH_TOKEN` | _(unset)_ | If set, `/mcp` requires `Authorization: Bearer <token>`. Off by default so MCP Inspector + Bazaar's crawler can probe anonymously. |
| `ARC_MCP_PAYER_PRIVATE_KEY` | _(unset)_ | Optional. Enables signing-payer mode. Held in memory only. |

## Run (local)

### stdio

```bash
# 1. Boot @arc/trust-api in another shell
ARC_PAYTO=0x... npm --workspace @arc/trust-api run dev

# 2. Build x402-client + mcp-server
npm run build:x402-client
npm --workspace @arc/mcp-server run build

# 3. Inspect manually (MCP Inspector CLI)
ARC_TRUST_API_URL=http://127.0.0.1:3030 \
  npx @modelcontextprotocol/inspector node apps/mcp-server/dist/index.js
```

### Streamable HTTP

```bash
# Same build steps, then:
ARC_TRUST_API_URL=http://127.0.0.1:3030 \
  npm --workspace @arc/mcp-server run dev:http
# -> http://127.0.0.1:8080/mcp + /health

# In another shell:
npx @modelcontextprotocol/inspector http://127.0.0.1:8080/mcp
```

## Programmatic Inspector tests (CI)

`npm --workspace @arc/mcp-server test` runs three back-to-back specs:

1. **`inspector.spec.ts`** — stdio transport, stub-quote posture. Five
   invariants (tool list, valid passport, invalid passport, 402 quote,
   search placeholder).
2. **`inspector-http.spec.ts`** — Streamable HTTP transport, in-process,
   same five invariants + `/health` smoke.
3. **`inspector-paid.spec.ts`** — stdio with `ARC_MCP_PAYER_PRIVATE_KEY`
   set to a throwaway test key. Paid path asserts the tool returned a
   real assessment + tx hash, and that the X-PAYMENT envelope the
   server signed has the correct address, value, scheme, and network.
   Settle-failure path asserts the `settleError` is surfaced.

No keys, no real network beyond loopback. The signing path is
structural-only — real signature verification against a facilitator is
exercised by trust-api's own `paid-mock` + `paid-smoke` scripts.

## Deploy

See [`DEPLOY.md`](./DEPLOY.md) for Fly.io-specific instructions and
post-deploy smoke. The included `Dockerfile` is platform-agnostic —
the same image runs on Render, Railway, Fargate, Cloud Run, etc.

## Architecture pointers

- `src/index.ts` — env reader + transport branch. ALL non-protocol output goes to stderr to avoid corrupting the stdio channel.
- `src/server.ts` — `createServer({ trustApiUrl, payer? })` factory. DI-friendly so tests can swap fetch / inject in-process state.
- `src/transport-http.ts` — Streamable HTTP transport wired into Express; sessionful (one transport per `Mcp-Session-Id`); cleans up on session close.
- `src/trust-api-client.ts` — HTTP client for `@arc/trust-api`. Treats 402 as data; signs + retries on 402 if a payer is configured. viem + `@arc/x402-client` are dynamic-imported inside the retry branch only.
- `src/tools/{trust-read,passport-get,search}.ts` — one file per tool. Each exports both the `Tool` descriptor (JSON Schema input) and the handler.
- `test/helpers/{stub-trust-api,assertions}.ts` — shared across the three specs so tool-wiring drift surfaces everywhere, not silently in one transport.

## Distribution

- Skill bundle for the trust-read gate: [`skills/use-arc-trust/`](../../skills/use-arc-trust/).
- Coinbase x402 Bazaar listing payload: [`docs/bazaar-listing.md`](../../docs/bazaar-listing.md).

## Roadmap

- **Now (W7):** Streamable HTTP, signing-payer mode, `use-arc-trust`
  skill, Fly deploy artifacts, Bazaar listing payload.
- **Next:** Real `arc_passport_get` once `ArcPassport.sol` is live on
  Arc testnet.
- **Later:** `arc_trust_read_deep` ($0.05) once editorial commentary
  ships. Multi-chain payer once Arc mainnet revenue is real.
