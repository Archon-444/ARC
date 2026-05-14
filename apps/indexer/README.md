# `@arc/indexer` — trust-layer indexer

Express + WebSocket service that watches `ArcPassport` + `AttestationRegistry`
on Arc testnet and broadcasts each event into WebSocket rooms so the
trust surface (and any other subscriber) can update in real-time
without polling.

Extracted from the pre-pivot `backend/` workspace as part of the W11
codemod (W14 follow-up). The marketplace surface — token-activity
routes, the Prisma marketplace schema, the offer controllers, the
NFT/collection/user/search/analytics routes, the auth middleware, and
the Typesense schema — was dropped. See
[`../../legacy-primitives/README.md`](../../legacy-primitives/README.md)
and [`../../STRATEGIC_PIVOT.md`](../../STRATEGIC_PIVOT.md).

## What's here

```
apps/indexer/
├── package.json                # @arc/indexer (express + ws + viem)
├── tsconfig.json
├── .env.example                # PORT / RATE_LIMIT_* / ARC_RPC_URL / ARC_*_ADDRESS
└── src/
    ├── server.ts               # express app + /health + /v1 rate-limiter + WS /ws + listener boot
    ├── lib/error-reporting.ts  # Sentry shim (soft-dep, no-op without DSN)
    ├── middleware/
    │   ├── error.middleware.ts # APIError + errorHandler + asyncHandler
    │   └── logger.middleware.ts
    ├── websocket/
    │   └── index.ts            # generic room infra (join/leave/broadcastToRoom)
    └── listeners/
        ├── index.ts            # boot helper — env-gated per-contract
        ├── passport.ts         # 5 ArcPassport events → passport:<id|addr>
        └── attestation.ts      # 2 AttestationRegistry events → attestation:<id> + attestation-subject:<addr>
```

## Watched events + room conventions

`ArcPassport`:

| Event | Rooms broadcast to |
|---|---|
| `PassportMinted(id, subject, metadataURI)` | `passport:<id>`, `passport:<subject-lower>` |
| `PassportMetadataUpdated(id, metadataURI)` | `passport:<id>` (and `passport:<subject>` if `resolveSubject` is wired) |
| `PassportRevoked(id)` | `passport:<id>` (and `passport:<subject>` if `resolveSubject` is wired) |
| `CounselAttestationAttached(id, attestationId, counsel)` | `passport:<id>` |
| `IdentityAdapterUpdated(previous, next)` | _no room — operational signal, not subject-keyed_ |

`AttestationRegistry`:

| Event | Rooms broadcast to |
|---|---|
| `Attested(id, subject, schemaId, dataHash, expiry, signer)` | `attestation:<id-lower>`, `attestation-subject:<subject-lower>` |
| `Revoked(id, by)` | `attestation:<id-lower>` (and `attestation-subject:<addr>` if `resolveSubject` is wired) |

Payload shape (consistent across both listeners):

```json
{
  "kind": "passport" | "attestation",
  "event": "PassportMinted" | ...,
  "txHash": "0x…",
  "blockNumber": "12345",
  "logIndex": 0,
  "passportId": "7",            // passport listener only
  "id": "0x…",                  // attestation listener only
  "args": { /* viem-decoded args; bigints → string */ }
}
```

Bigints (`expiry`, `blockNumber`, `passportId`) are always serialised
as decimal strings so the message survives `JSON.stringify` on the wire.

## Env-gated boot

The listeners are no-op unless their contract address is configured.
A deployment with only the passport address set boots only the
passport listener; with neither, the indexer stays a pure WS skeleton.

| Env var | Purpose |
|---|---|
| `ARC_RPC_URL` | Arc testnet RPC. Required to boot any listener. |
| `ARC_PASSPORT_ADDRESS` | Deployed `ArcPassport`. Boots `passport.ts`. |
| `ARC_ATTESTATION_REGISTRY_ADDRESS` | Deployed `AttestationRegistry`. Boots `attestation.ts`. |

This matches the trust-api's gating posture (see
`apps/trust-api/src/sources/passport.ts`) so a single set of env vars
configures both services consistently.

## Tests

```sh
npm --workspace @arc/indexer test
```

Runs three back-to-back tsx specs:

1. `test/passport-listener.test.ts` — 5 watchEvent registrations, room
   keying, bigint serialisation, async `resolveSubject` path.
2. `test/attestation-listener.test.ts` — same, 2 events, both rooms.
3. `test/end-to-end.test.ts` — boots a real WS server, connects a
   client, subscribes to `passport:7`, fires a synthetic
   `PassportMinted(7, …)` through the listener's stubbed RPC, asserts
   the client receives the broadcast payload over the wire.

All three use a stub `watchEvent` — no real RPC, no anvil, no Docker.

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
