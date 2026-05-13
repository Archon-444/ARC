# Strategic Pivot — ARC Trust Layer

**Effective:** branch `claude/trust-layer-agents-sNcay`
**Status:** W8 — Passport-on-Arc-testnet contracts in tree. `IERC8004Identity.sol`, `ArcIdentityAdapter.sol`, `ArcPassport.sol` (+ 44-spec Hardhat suite), `@arc/passport-sdk` TS client, atomic deploy script, and `ProfileRegistry` migration helper. Compile-only gate green offline; full Hardhat tests + Arc testnet deploy are user-fired (network access required).
**Plan:** `/root/.claude/plans/arc-strategic-synthesis-shimmying-cook.md`

## Shipped to date

| Slice | What landed | Acceptance |
|---|---|---|
| W1 | Monorepo workspaces, `tsconfig.base.json`, freeze notice, marketplace nav stripped | Repo boots, README + pivot doc in tree |
| W2 | `@arc/trust-core` extraction (scoring engine + cache helpers, 33-case test suite) | `npm --workspace @arc/trust-core test` green |
| W3–W5 | `@arc/trust-api`: x402 paywall (read $0.01, deep $0.05), facilitator settlement, APIError + request-id + JSON logger, per-route rate limits, MENA evidence schema drafts, mock + live smoke scripts | `npm run smoke:trust-api`, `smoke:trust-api:paid-mock` green; `paid-live` ready (one live tx pending to publish) |
| W6 | `@arc/mcp-server` (stdio): `arc_trust_read` (stub-quote until funded), `arc_passport_get` (free), `arc_search` (W11 placeholder); programmatic Inspector test (boots stub trust-api, spawns built server, asserts 5 invariants) | `npm run test:mcp-server` green |
| W7 | `@arc/mcp-server` Streamable HTTP transport; signing-payer mode (`ARC_MCP_PAYER_PRIVATE_KEY` -> the server signs $0.01 USDC EIP-3009 authorizations on Base mainnet on the agent's behalf, no manual signing); `skills/use-arc-trust/` bundle; `Dockerfile` + `fly.toml` + `DEPLOY.md`; `docs/bazaar-listing.md` payload draft. `@arc/x402-client` rebuilt with a CJS dist so plain-node consumers (the compiled mcp-server) can load it. | `npm run test:mcp-server` runs three back-to-back specs (stdio, http, paid) — all green |
| (consolidation) | `MILESTONE_W5_W7.md` + `MILESTONE/test-outputs/` capturing all eight in-env gates green; deferral row in `known-live-runs.md` | 8 captured logs with sentinels |
| W8 | `contracts/passport/`: `IERC8004Identity.sol` (interface), `ArcIdentityAdapter.sol` (4015B, REGISTRAR_ROLE-gated storage), `ArcPassport.sol` (5091B, COUNSEL_ROLE-gated attestation hook, pluggable adapter via `setIdentityAdapter`). 44-spec Hardhat suite (18 adapter + 26 integration) covering mint/resolve/revoke, counsel attach, adapter swap routes to new code. `@arc/passport-sdk` TS client over viem (typed reads/writes, ARC_TESTNET chain export). Atomic deploy script (`deploy-passport.js`) + `ProfileRegistry` migration helper (dry-run default). `contracts/docs/PASSPORT.md` runbook. | `npm run check-passport-contracts` green (compile-only, offline); `npm run test:passport-sdk` 8/8 green |

Verification matrix: `type-check:{web,trust-core,trust-api,mcp-server,passport-sdk}`, `test:trust-core`, `smoke:trust-api` (and `:paid-mock`), `test:mcp-server` (3 specs), `test:passport-sdk` (8 specs), `check-passport-contracts` (offline solc-js compile). All green on the branch.

## Open follow-ups before W9

Carryovers from W5/W7 (still open):
- **Live $0.01 tx hash** for trust-api settlement (paste into `apps/trust-api/docs/known-live-runs.md`).
- **`docker build -f apps/mcp-server/Dockerfile .`** from a Docker-capable host.
- **`fly deploy`** + post-deploy `/health` smoke; fund signing-payer wallet if "click and run" Bazaar demo is desired.
- **Bazaar submission** filed once hosted URLs exist.
- **Counsel review** of the MENA schema drafts in `apps/trust-api/src/schemas/` before any partner pitch.

W8-specific:
- **`npm --workspace contracts run test:passport`** from a host with internet access (Hardhat needs to fetch solc 0.8.24).
- **`npm --workspace contracts run deploy:passport:arc-testnet`** from a funded Arc testnet wallet; paste the addresses into `contracts/docs/PASSPORT.md` "Known deployments" table.
- **Reconfigure `apps/trust-api`** to consult the deployed Passport via `@arc/passport-sdk` so `GET /v1/passport/:address` returns real data instead of the placeholder.
- **Optional: migrate `ProfileRegistry`** via `migrate-profile-registry.js` (dry-run first; the helper is idempotent).

## What is changing

ARC is repositioned from "NFT marketplace + token launchpad on Arc" to **the trust, identity, and editorial-verification layer for Circle-native agent commerce**.

Distribution is through an **MCP server** and a pay-per-call **x402 trust-read API**. Identity is anchored by an **ARC Passport** aligned to (DRAFT) ERC-8004 via an adapter. The first vertical is **MENA institutional and treasury-oriented agent commerce**, executed compliance-first and counsel-led.

## What stays the same

- Smart contracts (`ArcMarketplace`, `ArcTokenFactory`, `ArcBondingCurveAMM`, `ArcToken`, `FeeVault`, `ProfileRegistry`, `StakingRewards`, `SimpleGovernance`, diamond facets, `MockUSDC`) remain deployed and **frozen**. They are not the product; they are primitives.
- Circle wallet integration, Arc testnet wiring, RainbowKit, and the existing UI primitive library remain core, not legacy.
- The risk-scoring heuristic in `frontend/src/lib/risk-scoring.ts` (and its 33-case test suite) is being **extracted, not deleted** — it becomes the v0 scoring engine inside `@arc/trust-core`.

## What is frozen

Effective W1, the following are out of scope for new feature work until the trust layer ships:

- Generic NFT marketplace UX (listings, auctions, collection pages, profile feeds, cart).
- `ArcTokenFactory` / `ArcBondingCurveAMM` as consumer features (the contracts stay; the discovery/launchpad UI does not get new investment).
- Rewards/staking UX, agent floor-sweeping, social/feed features.
- Generic "Bloomberg for agents" branding for the public site — reserved for institutional decks only.

## What is being built (90 days)

| Week | Slice |
|---|---|
| W1 | Workspaces root, `tsconfig.base.json`, boundary rule reserved, README + homepage rewrite, marketplace nav stripped |
| W2 | `packages/trust-core` extraction (this PR scope ends here) |
| W3-5 | `apps/trust-api` skeleton + facilitator-backed x402 paywall on Base mainnet USDC ✅ |
| W6 | `apps/mcp-server` stdio + programmatic Inspector test ✅ |
| W7 | Streamable HTTP transport + signing-payer mode + `use-arc-trust` skill + Bazaar listing payload + Fly deploy artifacts ✅ |
| W8 | `ArcPassport.sol` + `ArcIdentityAdapter.sol` + `IERC8004Identity.sol` on Arc testnet (Identity-first); `@arc/passport-sdk` TS client; atomic deploy + migration scripts ✅ (in tree; testnet deploy is user-fired) |
| W9 | `ArcReputationAdapter.sol` (single-signer) + `AttestationRegistry.sol` + first attestation schemas (`counsel.kyb.v1`, `editorial.review.v1`, `treasury.policy.v1`) |
| W8 | `ArcPassport.sol` + identity adapter on Arc testnet (Identity-first) |
| W9 | Reputation adapter + `AttestationRegistry` + initial schemas |
| W10 | MENA-mapped schemas (`token.suitability.v1`, `stablecoin.reserves.v1`) + narrow Validation hook + editorial deep tier |
| W11 | New trust surface in `apps/web` + mass file move into `legacy-primitives/` |
| W12 | Design-partner evidence object + hardening |

## Why now

External platform signals all point at the trust gap:

- **Circle Agent Stack** ships agent wallets, marketplace, CLI, skills, and nanopayments. Agents can hold funds and transact; what they cannot do is independently verify counterparty trust.
- **Coinbase x402 Bazaar** provides MCP-accessible discovery with **objective** (facilitator-derived) quality ranking — not editorial trust scoring.
- **DFSA Crypto Token framework** (effective January 12, 2026) places documented token-suitability responsibility on the firm, including criteria for token characteristics, regulatory status elsewhere, market size/history, technology, and AML compliance.
- **CBUAE Foreign Payment Token regime + ADGM FRT framework** create a regulated institutional corridor; USDU is registered under the CBUAE regime as of January 29, 2026.
- **ERC-8004 (DRAFT)** defines per-chain Identity, Reputation, and Validation registries — the standard surface for the trust primitives we need.

That combination is the wedge: independent, MENA-aware, editorial trust scoring exposed via MCP and monetised via x402.

## Deploy posture

- **Arc testnet** for product truth: Passport contracts, adapters, attestation registry.
- **Base mainnet** for paid x402 settlement so revenue is not blocked on Arc mainnet timing.
- Arc mainnet is optionality. A one-week migration plan stays ready for the day a mainnet beta date is announced.

## Anti-recommendations

- We do not compete with OpenSea or Pump.fun on marketplace breadth.
- We do not market as "ERC-8004 compliant." The spec is DRAFT; we are ERC-8004-**aligned** via adapter and publish a public compatibility matrix.
- We do not build custom EIP-3009 settlement in V0. We rely on the public x402 facilitator and revisit only if economics demand it.
- We do not frame MENA as "regulation solved." Every institutional surface is counsel-led.

## Pointers

- Full plan: `/root/.claude/plans/arc-strategic-synthesis-shimmying-cook.md`
- Project conventions: `CLAUDE.md`
- Branch: `claude/trust-layer-agents-sNcay`
