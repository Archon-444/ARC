# @arc/mcp-server

ARC's Model Context Protocol server. Exposes three tools over stdio so agents (Claude Code, Codex, Cursor, the MCP Inspector, ...) can talk to the ARC trust layer:

| Tool | Tier | Status (W6) |
|---|---|---|
| `arc_trust_read(target)` | $0.01 | Surfaces 402 quote as the tool result. No wallet held by the server. |
| `arc_passport_get(address)` | free | Returns the trust-api passport placeholder; real on-chain data lands W8. |
| `arc_search(query, min_score?)` | free | Stub. Real index lands W11. |

## Why stdio first

Per the MCP spec, stdio is the recommended transport for locally-installed servers and the simplest to test against. Streamable HTTP is intentionally deferred to W7 once the stdio + payment loop is stable.

## Why no wallet in the server (W6)

`arc_trust_read` is a paid call ($0.01 USDC on Base mainnet, settled via x402). The W6 server posture is **stub-quote**: it calls `@arc/trust-api` without `X-PAYMENT`, receives the 402 quote, and surfaces it to the calling agent as the tool result. The agent (or the MCP client wrapping it) decides how to fund the next attempt. This keeps the server stateless, key-free, and demoable without funding a wallet.

Upgrading to a real signer is a one-shot env var swap (`ARC_MCP_PAYER_PRIVATE_KEY` — not yet wired). Tracked for W7+.

## Environment

| Variable | Default | Notes |
|---|---|---|
| `ARC_TRUST_API_URL` | _(required)_ | Base URL of a running `@arc/trust-api`. Example: `https://trust.arc.example.com` |

## Run (local)

```bash
# 1. Boot @arc/trust-api in another shell
ARC_PAYTO=0x... npm --workspace @arc/trust-api run dev

# 2. Build the MCP server
npm --workspace @arc/mcp-server run build

# 3. Inspect manually (MCP Inspector CLI)
ARC_TRUST_API_URL=http://127.0.0.1:3030 \
  npx @modelcontextprotocol/inspector node apps/mcp-server/dist/index.js
```

## Programmatic Inspector test (CI)

`npm --workspace @arc/mcp-server test` boots a stub trust-api on an ephemeral port, spawns the built MCP server over stdio, connects an MCP `Client`, and asserts the five W6 invariants:

1. `listTools()` returns `[arc_trust_read, arc_passport_get, arc_search]` in order.
2. `arc_passport_get` with a valid address → 200 placeholder body.
3. `arc_passport_get` with an invalid address → `isError: true` (no JSON-RPC error escape).
4. `arc_trust_read` against an unpaid stub → `{ status: 'payment_required', quote: { ... maxAmountRequired: '10000' } }`.
5. `arc_search` → `{ status: 'not_indexed', results: [] }` with the W11 notice.

No keys, no real network beyond loopback.

## Architecture pointers

- `src/index.ts` — stdio entrypoint. ALL non-protocol output goes to stderr to avoid corrupting the channel.
- `src/server.ts` — `createServer({ trustApiUrl, ... })` factory. DI-friendly so the test can pass an in-process fetch stub if needed.
- `src/trust-api-client.ts` — HTTP client for `@arc/trust-api`. Treats 402 as data (returns the quote), not an error.
- `src/tools/{trust-read,passport-get,search}.ts` — one file per tool. Each exports both the `Tool` descriptor (JSON Schema input) and the handler.

## Roadmap (90-day plan)

- **W7** — Streamable HTTP transport; skill installer (`use-arc-trust`); MCP listing submission.
- **W8** — Real `arc_passport_get` once `ArcPassport.sol` is live on Arc testnet.
- **W10** — `arc_trust_read_deep` ($0.05) once W10 editorial commentary ships.
- **Later** — Optional `ARC_MCP_PAYER_PRIVATE_KEY` for a signing-payer mode, paid from a server-side wallet.
