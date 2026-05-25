# Strategic Pivot — ARC Trust Layer

> ARC's trust, identity, and editorial-verification layer ships as rail-agnostic infrastructure for agent commerce — because in a world where no human is at the keyboard at decision time, the rail wars are not where value accrues; the editorial layer is.

## Strategic environment

> "No human decision point exists between resource request and payment execution." — Forrester

That sentence is the trust-attestation thesis in one line. Agent commerce moves money before any human reviews the counterparty, so the work a human would have done — KYC the counterparty, score the contract, verify the operator — has to be done somewhere else, in advance, by infrastructure. That somewhere is the editorial trust layer. ARC ships that layer.

**Rail competition (ARC stays neutral).** Two agent-payment rails are now in active competition: Coinbase / Circle's x402 (settled on Base mainnet USDC) and Mastercard's MPP (announced after the $1.8B BVNK acquisition). ARC is rail-agnostic by design — the rail is not where value accrues for the editorial layer; the editorial layer is the asset. The trust-api ships paid settlement on x402 today and stages MPP as a recognised first-class rail in the same `accepts[]` quote ([W17.1](#w17--forward-pointing-scope-sliding-from-previous-w15--new-punch-list-items) follow-up).

**Acquirer landscape.** Three buckets are buying agent-commerce infrastructure in 2025–26:
- *Stablecoin-native*: Circle (Arc + USDC + agent stack), Coinbase (x402 + Bazaar).
- *Card-native*: Mastercard (post BVNK), Visa, PayPal.
- *Agent-native*: Anthropic (MCP host), Stripe (post Privy + Bridge — payments + wallets + protocol; one announcement from a discovery layer).

The hosted offering, the editorial layer, and the schema layer all need to read as institutional acquirable infrastructure — not as a one-person app. The codebase is structured accordingly: open-source contracts + `@arc/*` schema packages; closed hosted offering; portable evidence envelopes ([data portability commitment is W17.3](#w17--forward-pointing-scope-sliding-from-previous-w15--new-punch-list-items)).

**Effective:** branch `claude/trust-layer-agents-sNcay`
**Status:** W14 — the W11-deferred codemod has landed in three commits. (W14.1) `git mv frontend apps/web`, root workspaces cleaned up, CLAUDE.md + CONTRIBUTING.md + README.md repathed. (W14.2) Eleven legacy `.sol` contracts + five Hardhat tests + two deploy scripts moved to `legacy-primitives/contracts/`, `legacy-primitives/test/`, `legacy-primitives/scripts/`; `contracts/contracts/` now holds exactly four trust-layer subdirs (passport / reputation / attestations / validation); `contracts/package.json` deploy scripts renamed to `deploy:legacy:*`; `legacy-primitives/README.md` documents the quarantine. (W14.3) `git mv backend apps/indexer`, pruned the seven marketplace routes + both services + offer controller + Prisma marketplace schema + Typesense schema + auth middleware + `broadcastTokenActivity()` — kept the express + helmet + cors + rate-limit + ws skeleton + APIError + JSON logger + Sentry shim; `package.json` is now `@arc/indexer` with marketplace deps dropped (no @prisma/client, redis, ioredis, ethers, joi, jwt, bcryptjs, uuid, ts-jest). Net: -2.5k LOC of legacy surface. The eslint `no-restricted-imports` rule armed in W11.3 is now active by virtue of `legacy-primitives/` existing on disk. Pre-W14 status preserved: W13 trust-api → real on-chain reads, W8-W12 consolidation + four hardening items, W12 marquee artifacts.
**Plan:** `/root/.claude/plans/arc-strategic-synthesis-shimmying-cook.md`

## Shipped to date

| Slice | What landed | Acceptance |
|---|---|---|
| W1 | Monorepo workspaces, `tsconfig.base.json`, freeze notice, marketplace nav stripped | Repo boots, README + pivot doc in tree |
| W2 | `@arc/trust-core` extraction (scoring engine + cache helpers, 33-case test suite) | `npm --workspace @arc/trust-core test` green |
| W3–W5 | `@arc/trust-api`: x402 paywall (read $0.01, deep $0.05), facilitator settlement, APIError + request-id + JSON logger, per-route rate limits, MENA evidence schema drafts, mock + live smoke scripts | `npm run smoke:trust-api`, `smoke:trust-api:paid-mock` green; `paid-live` ready (one live tx pending to publish) |
| W6 | `@arc/mcp-server` (stdio): `arc_trust_read` (stub-quote until funded), `arc_passport_get` (free), `arc_search` (W11 placeholder); programmatic Inspector test (boots stub trust-api, spawns built server, asserts 5 invariants) | `npm run test:mcp-server` green |
| W7 | `@arc/mcp-server` Streamable HTTP transport; signing-payer mode (`ARC_MCP_PAYER_PRIVATE_KEY` -> the server signs $0.01 USDC EIP-3009 authorizations on Base mainnet on the agent's behalf, no manual signing); `skills/use-arc-trust/` bundle; `Dockerfile` + `fly.toml` + `DEPLOY.md`; `docs/bazaar-listing.md` payload draft. `@arc/x402-client` rebuilt with a CJS dist so plain-node consumers (the compiled mcp-server) can load it. | `npm run test:mcp-server` runs three back-to-back specs (stdio, http, paid) — all green |
| (consolidation) | `docs/milestones/W5_W7.md` + `docs/milestones/test-outputs/` capturing all eight in-env gates green; deferral row in `known-live-runs.md` | 8 captured logs with sentinels |
| W8 | `contracts/passport/`: `IERC8004Identity.sol` (interface), `ArcIdentityAdapter.sol` (4015B, REGISTRAR_ROLE-gated storage), `ArcPassport.sol` (5091B, COUNSEL_ROLE-gated attestation hook, pluggable adapter via `setIdentityAdapter`). 44-spec Hardhat suite (18 adapter + 26 integration) covering mint/resolve/revoke, counsel attach, adapter swap routes to new code. `@arc/passport-sdk` TS client over viem (typed reads/writes, ARC_TESTNET chain export). Atomic deploy script (`deploy-passport.js`) + `ProfileRegistry` migration helper (dry-run default). `contracts/docs/PASSPORT.md` runbook. | `npm run check-passport-contracts` green (compile-only, offline); `npm run test:passport-sdk` 8/8 green |
| W9 | `contracts/reputation/`: `IERC8004Reputation.sol` + `ArcReputationAdapter.sol` (2865B, FEEDBACK_ROLE-gated, append-only single-signer feedback with sentiment in [-100,100], deterministic id derivation, per-subject pagination). `contracts/attestations/`: `AttestationRegistry.sol` (4016B, ATTESTER_ROLE-gated, EIP-712 dataHash anchoring, revocable, deterministic id, isValid checks expiry+revocation). 44-spec Hardhat suite (20 reputation + 24 attestation). `@arc/attestations` TS package: `counsel.kyb.v1`, `editorial.review.v1`, `treasury.policy.v1` schemas with full sign + verify + tamper-detect + wrong-signer-detect round-trip via viem. Generalized `check-contracts.js` walks all three contract groups. | `npm run check-trust-contracts` green; `npm run test:attestations` 4/4 round-trip groups green |
| W10 | `@arc/attestations`: `token.suitability.v1` (DFSA-mapped, nested `criteria` struct) + `stablecoin.reserves.v1` (ADGM FRT-mapped, reserves vs supply numerical fields) with round-trip tests including nested-struct tamper detection. `contracts/validation/`: `IERC8004Validation.sol` + `ArcValidationAdapter.sol` (3960B, VALIDATOR_ROLE-gated single-signer validations, deterministic id derivation, `isValid` independent of `outcome`, revocable). `apps/trust-api`: editorial deep tier live — `POST /v1/trust/read/deep` settles $0.05, returns Haiku 4.5 commentary with prompt caching (5KB system prompt cached as ephemeral) + structured JSON output + in-memory per-target response cache (default 1h TTL); deterministic stub commentary when `ARC_ANTHROPIC_API_KEY` is unset so CI + unfunded deployments exercise the full wire shape. `paid-mock` adds `deep-paid` + `deep-cache-hit` scenarios proving facilitator.verify+settle each fire on cache HIT (the cache is on editorial only, not the paywall). | `npm run check-trust-contracts` green across 4 groups; `npm run test:attestations` 5/5 round-trip groups (incl. 2 new MENA-mapped); `npm run smoke:trust-api:paid-mock` 7 assertions green incl. deep-paid + deep-cache-hit |
| W11 | Public trust surface in `frontend/src/app/`: four routes (`/trust/[target]`, `/passport/[address]`, `/agents`, `/docs`) with thin-route pattern (page + loading + error) + a `trust-surface.ts` lib that wraps the trust-api 402-quote and free-passport endpoints behind discriminated unions. `frontend/src/middleware.ts` 308-redirects eight legacy prefixes (cart, collection(s), explore, launch, nft, rewards, token) to `/legacy?from=...`. `/legacy/page.tsx` explainer references the eleven preserved contracts and cross-links the new surface. Footer rewritten to advertise the trust-layer surface. `.eslintrc.json` arms the `no-restricted-imports` rule against `legacy-primitives/**` (no-op until the codemod lands). `docs/w11-followups.md` scopes the deferred third slice (mass file move + indexer extraction + CI activation) with an 8-item acceptance gate. | New routes type-check cleanly; middleware matcher only fires on the eight quarantined prefixes (zero latency on surviving routes); eslint rule armed and waiting |
| W12 | `packages/attestations/scripts/demo-mena.ts` + `docs/demo-mena.md`: composes the five-schema MENA evidence envelope (counsel.kyb.v1 + editorial.review.v1 + treasury.policy.v1 + token.suitability.v1 + stablecoin.reserves.v1) over a placeholder passport with deterministic anvil signers; every body is signed AND re-verified before the envelope is emitted; bigints serialised as decimal strings; `kind: "arc.evidence.mena.v1"` format marker so downstream consumers key behaviour off the version. `apps/trust-api/scripts/smoke-load.ts` + captured `w12-baseline.json` + README: autocannon at 10rps against the three documented routes, SLO-gated, in-process bench with rate-limit ceiling raised so the test measures handler latency. `apps/trust-api/docs/security-review-w12.md`: 13-finding self-review covering replay, settle timeout, facilitator compromise, body parsing, address validation, ARC_PAYTO misconfig, two env-var exposures, prompt-injection bound, cache poisoning, memory exhaustion, TLS posture, body parsing DoS. 10 MITIGATED + 2 ACCEPT-WITH-DOCS + 1 OPERATOR RESPONSIBILITY + 0 OPEN. | `npm run demo:mena` emits all 5 schemas signed + verified; `npm run smoke:load` p50=2ms / p99 ≤ 31ms across all three routes, SLO OK; security review committed |
| W8–W12 consolidation + hardening | `docs/milestones/W8_W12.md` + 12 captured logs (`09..20` continuing the W5–W7 numbering); body validators in `@arc/attestations` (5 validators + `signAttestation` `validator?` hook + `AttestationValidationError`); `contracts/docs/ADAPTER_SWAP_RUNBOOK.md` (7-step operational procedure); `AttestationRegistry.sol` "schema-id posture" header + `apps/trust-api/src/sources/attestation-schemas.ts` canonical allowlist + `apps/trust-api/docs/attestation-schemas.md` rationale; `@arc/attestations` description sync. | All 12 logs sentinel-green; `test:attestations` runs index + validate suites; 5 happy + 15 failure paths + 2 sign-wiring assertions |
| W13 | `@arc/attestation-reader` workspace: viem-based read client for AttestationRegistry (getAttestation / isValid / attestationCount / attestationAt + listCurrentAttestations convenience). `apps/trust-api/src/sources/passport.ts`: assembles `{ passport, attestations[] }` by walking the canonical schema allowlist in parallel. `apps/trust-api/src/routes/passport.ts` repointed: when `ARC_PASSPORT_ADDRESS` + `ARC_ATTESTATION_REGISTRY_ADDRESS` + `ARC_RPC_URL` are set, returns real on-chain state; otherwise W8 placeholder. New `GET /v1/attestations/:subject?schema=<name>` route: free, read-only, walks one canonical schema or all five; 503 with `status: 'unconfigured'` when env unset; 400 on unknown schema names. | `npm run test:attestation-reader` 6/6 OK; `npm run smoke:trust-api` 7 assertions green (4 pre-existing + 3 new W13); `paid-mock` unchanged |
| W14 | W11 deferred codemod executed: `frontend/` → `apps/web/` (W14.1, ~340 files, preserved with rename history; `@/*` alias unchanged so the workspace compiles unchanged at the new path); 11 legacy `.sol` + 5 tests + 2 deploy scripts → `legacy-primitives/` (W14.2; `contracts/contracts/` now holds exactly 4 trust-layer subdirs); `backend/` → `apps/indexer/` (W14.3, route-pruned: -28 files, -2.5k LOC of marketplace surface; kept express + ws skeleton). `legacy-primitives/README.md` + `apps/indexer/README.md` document the new roles. `contracts/package.json` deploy scripts repathed to `deploy:legacy:*`. Root workspaces array stripped of bare `backend` (apps/* glob covers `apps/indexer`). Eslint `no-restricted-imports` rule against `legacy-primitives/**` is now active by virtue of the path existing. Trust-api header comments + `apps/web/src/services/api.ts` repathed to reflect the move. | `type-check:{web,trust-core,x402-client,trust-api,mcp-server,passport-sdk,attestations,attestation-reader}` all green from a fresh `npm install`; `@arc/indexer` type-checks; `check-trust-contracts` green across 4 trust-layer groups (passport 4015+5091B, reputation 2865B, attestations 4016B, validation 3960B) confirming the 11 legacy contracts no longer compile as part of the trust-layer rotation |

Verification matrix: `type-check:{web,trust-core,trust-api,mcp-server,passport-sdk,attestations,attestation-reader}`, `test:trust-core`, `smoke:trust-api` (and `:paid-mock`, `:load`), `test:mcp-server` (3 specs), `test:passport-sdk` (8 specs), `test:attestations` (5 round-trip + 5 validate groups), `test:attestation-reader` (6 stubbed-RPC tests), `check-trust-contracts` (offline solc-js compile across passport / reputation / attestations / validation), `demo:mena` (composer + verifier). All green on the branch.

Verification matrix: `type-check:{web,trust-core,trust-api,mcp-server,passport-sdk,attestations}`, `test:trust-core`, `smoke:trust-api` (and `:paid-mock`), `test:mcp-server` (3 specs), `test:passport-sdk` (8 specs), `test:attestations` (5 round-trip groups), `check-trust-contracts` (offline solc-js compile across passport / reputation / attestations / validation). All green on the branch.

## Open follow-ups after the 90-day plan

**90-day implementation plan complete in tree; production activation remains gated by operator, counsel, deploy, and live-payment steps.** Every artifact the plan promised exists and type-checks/tests green on the branch (trust-api + mcp-server + 4 contract groups + 5 packages + W14 codemod + indexer event listeners + the W14.6 paid-route hardening). Production go-live is **not** complete: live Base mainnet settlement, Arc testnet deploys, hosted MCP, funded payer, counsel sign-off on MENA schemas, and a third-party audit all remain open. Avoid phrasing this as "complete" in investor/user-facing language without the qualifier.

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
- The risk-scoring heuristic — extracted from the pre-pivot `frontend/src/lib/risk-scoring.ts` (path now `apps/web/src/lib/risk-scoring.ts` after the W14 codemod) along with its 33-case test suite — was **extracted, not deleted** and lives at `packages/trust-core/src/scoring/v1-heuristic.ts` as the v0 scoring engine.

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
| W11 | Public trust surface (`/trust`, `/passport`, `/agents`, `/docs`) live in `apps/web/` (path-renamed from `frontend/` in W14); legacy 308 redirect + `/legacy` explainer; footer rewritten; eslint boundary rule armed ✅ |
| W12 | MENA design-partner evidence object (composer + verifier + runbook) + trust-api 10rps load test (baseline captured, SLO-gated) + x402 facilitator security review (13 findings; 0 OPEN) ✅ |
| W14 | W11-deferred codemod executed in three commits: `frontend/` → `apps/web/` (W14.1), 11 legacy `.sol` + 5 tests + 2 deploy scripts → `legacy-primitives/` (W14.2), `backend/` → `apps/indexer/` route-pruned (W14.3, -28 files, -2.5k LOC). Eslint `no-restricted-imports` rule now active by virtue of `legacy-primitives/` existing. ✅ |
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
