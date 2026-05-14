# `@arc/indexer` — trust-layer indexer skeleton

Express + WebSocket skeleton extracted from the pre-pivot `backend/`
workspace as part of the W11 codemod (W14 follow-up). The marketplace
+ token-activity routes, the Prisma marketplace schema, the offer
controllers, the NFT/collection/user/search/analytics routes, the
auth middleware, and the Typesense schema are all gone — they shipped
with the consumer surface that the strategic pivot froze. See
[`../../legacy-primitives/README.md`](../../legacy-primitives/README.md)
and [`../../STRATEGIC_PIVOT.md`](../../STRATEGIC_PIVOT.md).

## What's here

```
apps/indexer/
├── package.json                # @arc/indexer (express + ws only)
├── tsconfig.json
├── .env.example                # PORT / RATE_LIMIT_* / ALLOWED_ORIGINS / SENTRY_DSN
└── src/
    ├── server.ts               # express app + /health + /v1 rate-limiter + WS at /ws
    ├── lib/error-reporting.ts  # Sentry shim (soft-dep, no-op without DSN)
    ├── middleware/
    │   ├── error.middleware.ts # APIError + errorHandler + asyncHandler
    │   └── logger.middleware.ts
    └── websocket/
        └── index.ts            # generic room infra (join/leave/broadcastToRoom)
```

There is **no route mounted** yet — the future work is to index
`ArcPassport` + `AttestationRegistry` events from Arc testnet RPC and
broadcast them to WebSocket rooms (`passport:<address>`,
`attestation:<id>`). The first event-listener slice will land as
`src/listeners/passport.ts` + `src/listeners/attestation.ts`.

## What's NOT here (intentionally)

- **Routes**: the seven marketplace routes (`nft`, `collection`,
  `offer`, `activity`, `search`, `analytics`, `user`) plus the token
  activity broadcaster are all gone. They were tied to the legacy
  consumer surface.
- **Prisma**: the marketplace schema is dropped. The new indexer will
  re-introduce storage with a passport/attestation-shaped schema once
  the data model stabilizes (Postgres + Prisma is the likely target,
  but is not pinned).
- **Typesense**: marketplace search index is gone.
- **Auth middleware**: wallet-signature auth was for the offer flow.
  The indexer is read-only from the consumer side; signed writes go
  through the trust-api / mcp-server stack.
- **API spec + token activity doc**: `api-spec.yaml` and
  `TOKEN_ACTIVITY_BROADCAST.md` lived for the marketplace API. New
  endpoints get their own docs as they ship.

## Why this lives at `apps/indexer/`

It's a stateful server with a long-running event loop and a different
deploy lifecycle than the trust-api (which is stateless HTTPS) or the
mcp-server (which is a stateless container). Putting it under
`apps/` reflects that it's a deployable surface; using a fresh name
(`indexer` not `backend`) reflects that its role is different from
the pre-pivot ArcMarket API.

## Quick start

```sh
# From repo root
npm install --workspaces
npm --workspace @arc/indexer run dev   # ts-node-dev, watches src/
curl http://localhost:3001/health      # { status: healthy, service: @arc/indexer }
```

## Cross-references

- [`../../STRATEGIC_PIVOT.md`](../../STRATEGIC_PIVOT.md) — pivot
  rationale + freeze notice.
- [`../../docs/w11-followups.md`](../../docs/w11-followups.md) — the
  W11 follow-up doc that scoped this extraction.
- [`../trust-api/README.md`](../trust-api/README.md) — the trust
  layer's stateless HTTPS surface (x402 paywall on Base mainnet).
- [`../mcp-server/README.md`](../mcp-server/README.md) — the MCP
  client surface that consumes trust-api.
