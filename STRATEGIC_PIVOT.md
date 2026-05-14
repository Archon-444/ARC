# Strategic Pivot — ARC Trust Layer

**Effective:** branch `claude/trust-layer-agents-sNcay`
**Status:** W12 — 90-day plan complete in tree. MENA design-partner evidence object composes + verifies all five attestation schemas + a placeholder passport into a single `arc.evidence.mena.v1` JSON envelope (`packages/attestations/scripts/demo-mena.ts`, runbook in `docs/demo-mena.md`). trust-api 10rps load test captured with p50/p95/p99/p999 across health, passport, and 402-quote routes (`apps/trust-api/docs/load-tests/w12-baseline.json` + README). Self-review of the x402 facilitator integration documents 13 findings (10 mitigated, 2 accept-with-docs, 1 operator responsibility, 0 open) in `apps/trust-api/docs/security-review-w12.md`. The W11 codemod (mass file move + apps/indexer extraction) remains the single deferred item, scoped in `docs/w11-followups.md` with an 8-item acceptance gate.
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
| W9 | `contracts/reputation/`: `IERC8004Reputation.sol` + `ArcReputationAdapter.sol` (2865B, FEEDBACK_ROLE-gated, append-only single-signer feedback with sentiment in [-100,100], deterministic id derivation, per-subject pagination). `contracts/attestations/`: `AttestationRegistry.sol` (4016B, ATTESTER_ROLE-gated, EIP-712 dataHash anchoring, revocable, deterministic id, isValid checks expiry+revocation). 44-spec Hardhat suite (20 reputation + 24 attestation). `@arc/attestations` TS package: `counsel.kyb.v1`, `editorial.review.v1`, `treasury.policy.v1` schemas with full sign + verify + tamper-detect + wrong-signer-detect round-trip via viem. Generalized `check-contracts.js` walks all three contract groups. | `npm run check-trust-contracts` green; `npm run test:attestations` 4/4 round-trip groups green |
| W10 | `@arc/attestations`: `token.suitability.v1` (DFSA-mapped, nested `criteria` struct) + `stablecoin.reserves.v1` (ADGM FRT-mapped, reserves vs supply numerical fields) with round-trip tests including nested-struct tamper detection. `contracts/validation/`: `IERC8004Validation.sol` + `ArcValidationAdapter.sol` (3960B, VALIDATOR_ROLE-gated single-signer validations, deterministic id derivation, `isValid` independent of `outcome`, revocable). `apps/trust-api`: editorial deep tier live — `POST /v1/trust/read/deep` settles $0.05, returns Haiku 4.5 commentary with prompt caching (5KB system prompt cached as ephemeral) + structured JSON output + in-memory per-target response cache (default 1h TTL); deterministic stub commentary when `ARC_ANTHROPIC_API_KEY` is unset so CI + unfunded deployments exercise the full wire shape. `paid-mock` adds `deep-paid` + `deep-cache-hit` scenarios proving facilitator.verify+settle each fire on cache HIT (the cache is on editorial only, not the paywall). | `npm run check-trust-contracts` green across 4 groups; `npm run test:attestations` 5/5 round-trip groups (incl. 2 new MENA-mapped); `npm run smoke:trust-api:paid-mock` 7 assertions green incl. deep-paid + deep-cache-hit |
| W11 | Public trust surface in `frontend/src/app/`: four routes (`/trust/[target]`, `/passport/[address]`, `/agents`, `/docs`) with thin-route pattern (page + loading + error) + a `trust-surface.ts` lib that wraps the trust-api 402-quote and free-passport endpoints behind discriminated unions. `frontend/src/middleware.ts` 308-redirects eight legacy prefixes (cart, collection(s), explore, launch, nft, rewards, token) to `/legacy?from=...`. `/legacy/page.tsx` explainer references the eleven preserved contracts and cross-links the new surface. Footer rewritten to advertise the trust-layer surface. `.eslintrc.json` arms the `no-restricted-imports` rule against `legacy-primitives/**` (no-op until the codemod lands). `docs/w11-followups.md` scopes the deferred third slice (mass file move + indexer extraction + CI activation) with an 8-item acceptance gate. | New routes type-check cleanly; middleware matcher only fires on the eight quarantined prefixes (zero latency on surviving routes); eslint rule armed and waiting |
| W12 | `packages/attestations/scripts/demo-mena.ts` + `docs/demo-mena.md`: composes the five-schema MENA evidence envelope (counsel.kyb.v1 + editorial.review.v1 + treasury.policy.v1 + token.suitability.v1 + stablecoin.reserves.v1) over a placeholder passport with deterministic anvil signers; every body is signed AND re-verified before the envelope is emitted; bigints serialised as decimal strings; `kind: "arc.evidence.mena.v1"` format marker so downstream consumers key behaviour off the version. `apps/trust-api/scripts/smoke-load.ts` + captured `w12-baseline.json` + README: autocannon at 10rps against the three documented routes, SLO-gated, in-process bench with rate-limit ceiling raised so the test measures handler latency. `apps/trust-api/docs/security-review-w12.md`: 13-finding self-review covering replay, settle timeout, facilitator compromise, body parsing, address validation, ARC_PAYTO misconfig, two env-var exposures, prompt-injection bound, cache poisoning, memory exhaustion, TLS posture, body parsing DoS. 10 MITIGATED + 2 ACCEPT-WITH-DOCS + 1 OPERATOR RESPONSIBILITY + 0 OPEN. | `npm run demo:mena` emits all 5 schemas signed + verified; `npm run smoke:load` p50=2ms / p99 ≤ 31ms across all three routes, SLO OK; security review committed |

Verification matrix (90-day plan complete): `type-check:{web,trust-core,trust-api,mcp-server,passport-sdk,attestations}`, `test:trust-core`, `smoke:trust-api` (and `:paid-mock`, `:load`), `test:mcp-server` (3 specs), `test:passport-sdk` (8 specs), `test:attestations` (5 round-trip groups), `check-trust-contracts` (offline solc-js compile across passport / reputation / attestations / validation), `demo:mena` (composer + verifier). All green on the branch.

Verification matrix: `type-check:{web,trust-core,trust-api,mcp-server,passport-sdk,attestations}`, `test:trust-core`, `smoke:trust-api` (and `:paid-mock`), `test:mcp-server` (3 specs), `test:passport-sdk` (8 specs), `test:attestations` (5 round-trip groups), `check-trust-contracts` (offline solc-js compile across passport / reputation / attestations / validation). All green on the branch.

## Open follow-ups after the 90-day plan

The 90-day plan is complete in tree. The remaining items are operator-side go-live tasks (none of which block contracts or app workspaces) plus one explicit deferral.

### Operator go-live (user-fired)

Carryovers from W5/W7 (still open):
- **Live $0.01 tx hash** for trust-api settlement (paste into `apps/trust-api/docs/known-live-runs.md`).
- **`docker build -f apps/mcp-server/Dockerfile .`** from a Docker-capable host.
- **`fly deploy`** + post-deploy `/health` smoke; fund signing-payer wallet if "click and run" Bazaar demo is desired.
- **Bazaar submission** filed once hosted URLs exist.

W8/W9/W10 contract gates:
- **`npm --workspace contracts run test:trust-contracts`** from a host with internet access (Hardhat needs to fetch solc 0.8.24). Runs 109 specs across passport / reputation / attestations / validation in one invocation.
- **`npm --workspace contracts run deploy:passport:arc-testnet`** from a funded Arc testnet wallet; paste the addresses into `contracts/docs/PASSPORT.md` "Known deployments" table.
- **Deploy ArcReputationAdapter + AttestationRegistry + ArcValidationAdapter** to Arc testnet (W11 trust-surface launch ships the unified deploy script; for now, deploy ad-hoc from `npx hardhat console --network arcTestnet`).
- **Reconfigure `apps/trust-api`** to consult the deployed Passport + AttestationRegistry via `@arc/passport-sdk` + `@arc/attestations` so `GET /v1/passport/:address` returns real data with attached attestation rows.

W10 editorial deep tier:
- **Set `ARC_ANTHROPIC_API_KEY`** on the trust-api host to flip the deep tier from stub to live Haiku 4.5 commentary. Verify with `curl` + decode `X-Payment-Response`; expect `source: "editorial"` in the response body and `usage.cache_read_input_tokens > 0` on the second call against the same target (visible in the trust-api JSON logger).
- **Validate prompt-cache hit rate** in production. Target is high (the system prompt is frozen and sized above Haiku 4.5's 4096-token minimum cacheable prefix); a low rate indicates a silent invalidator worth debugging against the `shared/prompt-caching.md` checklist.

Counsel-side:
- **Counsel review** of the W9 attestation schemas (`counsel.kyb.v1` field shape against actual DIFC/ADGM evidence requirements) before any production signing.
- **Counsel review** of the W10 MENA-mapped schemas (`token.suitability.v1` against DFSA Crypto Token framework criteria; `stablecoin.reserves.v1` against ADGM FRT regime criteria). Both currently marked "COUNSEL-REVIEW DRAFT" in their source files; production signing waits on counsel sign-off.

### Deferred (post-90-day)

- **Mass file move + indexer extraction** — scoped in `docs/w11-followups.md` with an 8-item acceptance gate. Lands when risk tolerance allows; revenue path does not depend on it.
- **Third-party audit** — for institutional-volume deployments, engage an external auditor against `packages/x402-client/`, the four Solidity contract suites, and the deploy posture. Self-review is in `apps/trust-api/docs/security-review-w12.md`.
- **Per-API-key rate limiting** + **Sentry/DataDog/OTEL wiring** — explicitly out of scope for V0; the W5 structured JSON logger holds the line until a key-issuance flow exists.

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
| W9 | `ArcReputationAdapter.sol` (single-signer) + `AttestationRegistry.sol` + `@arc/attestations` schemas + sign/verify round-trip ✅ (in tree; testnet deploy is user-fired) |
| W10 | MENA-mapped schemas (`token.suitability.v1` DFSA-mapped, `stablecoin.reserves.v1` ADGM FRT-mapped) + narrow Validation hook (`IERC8004Validation` + `ArcValidationAdapter` stub) + editorial deep tier ($0.05 Haiku 4.5 with prompt caching) ✅ (in tree; live source flips with `ARC_ANTHROPIC_API_KEY`) |
| W11 | Public trust surface (`/trust`, `/passport`, `/agents`, `/docs`) live in `frontend/`; legacy 308 redirect + `/legacy` explainer; footer rewritten; eslint boundary rule armed ✅ (mass file move + indexer extraction deferred per `docs/w11-followups.md`) |
| W12 | MENA design-partner evidence object (composer + verifier + runbook) + trust-api 10rps load test (baseline captured, SLO-gated) + x402 facilitator security review (13 findings; 0 OPEN) ✅ |
| Deferred | Mass file move (`frontend` → `apps/web`, `backend` → `apps/indexer`, legacy contracts + marketplace pages → `legacy-primitives/`); scoped in `docs/w11-followups.md` with 8-item acceptance gate. Lands when risk tolerance allows; revenue path does not depend on it. |
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
