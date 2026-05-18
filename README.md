# ARC — Trust Layer for Circle-Native Agent Commerce

> **Strategic pivot complete in tree; production activation pending.** ARC was repositioned from "NFT marketplace + token launchpad" into the trust, identity, and editorial-verification layer for agent commerce on Circle's Arc blockchain. The 90-day implementation plan is shipped; remaining steps are operator-fired and listed in [docs/PHASE_A_RUNBOOK.md](./docs/PHASE_A_RUNBOOK.md). See [STRATEGIC_PIVOT.md](./STRATEGIC_PIVOT.md) for the why.

## What ARC is becoming

The independent trust layer Circle Agent Stack and Coinbase x402 Bazaar do not provide:

- **`@arc/mcp-server`** — an MCP server that exposes `arc_trust_read`, `arc_search`, and `arc_passport_get` so any Claude / Codex / Cursor / Bazaar-aware agent can look up agent and counterparty trust before transacting.
- **`@arc/trust-api`** — a pay-per-call x402 trust-read API priced at $0.01 / $0.05 per call, settled in USDC on Base mainnet via the public x402 facilitator. Decouples revenue from Arc mainnet timing.
- **ARC Passport** — an Arc-native, ERC-8004-aligned identity primitive (Identity → Reputation → narrow Validation, behind an adapter so DRAFT-spec changes do not require migration).
- **AttestationRegistry + schemas** — EIP-712 typed-data attestations covering KYB, editorial review, treasury policy, **token suitability** (DFSA-mapped), and **stablecoin reserves** (ADGM FRT-mapped) so MENA institutional firms have machine-readable evidence for the documented suitability assessments their regulators now require.

## What ARC was

A full-stack NFT marketplace + token launchpad. The 11 legacy contracts (`ArcMarketplace`, `ArcTokenFactory`, `ArcBondingCurveAMM`, `FeeVault`, `ProfileRegistry`, `StakingRewards`, `SimpleGovernance`, `ArcGovernance`, `ArcToken`, `ArcMarketNFT`, `MockUSDC`) are **preserved as primitives** under [`legacy-primitives/`](./legacy-primitives/). They are not the product, not in active feature work, and the trust-layer Hardhat workspace doesn't compile them. See [STRATEGIC_PIVOT.md](./STRATEGIC_PIVOT.md) for the freeze scope.

## Monorepo layout

```
ARC/
├── apps/                        # Trust layer + product surface
│   ├── trust-api/               # Express + facilitator-backed x402 paywall
│   ├── mcp-server/              # Model Context Protocol server (stdio + Streamable HTTP)
│   ├── web/                     # Next.js 16 app (W14 — moved from `frontend/`; trust surface + legacy redirect)
│   └── indexer/                 # Express + WebSocket skeleton (W14 — moved from `backend/`, route-pruned; future: Passport + AttestationRegistry event listeners)
├── packages/
│   ├── trust-core/              # Scoring engine + cache helpers (extracted from apps/web)
│   ├── x402-client/             # Facilitator-backed x402 client
│   ├── passport-sdk/            # TS client for ArcPassport
│   ├── attestation-reader/      # Read-only viem client for AttestationRegistry
│   └── attestations/            # EIP-712 schemas + sign/verify/validate helpers
├── contracts/                   # Solidity 0.8.24 (passport / reputation / attestations / validation; legacy `.sol` quarantined under legacy-primitives/)
├── legacy-primitives/           # W14 — 11 frozen contracts + 5 tests + 2 deploy scripts (preserved, not active)
├── subgraph/                    # The Graph indexing
├── skills/                      # Claude Skill bundles (use-arc-trust)
├── tsconfig.base.json           # shared TS config
├── package.json                 # npm workspaces root
├── STRATEGIC_PIVOT.md           # pivot rationale + freeze notice
└── CLAUDE.md                    # project conventions
```

## Quick start

```bash
npm install                                   # workspaces install at repo root
npm run dev:web                               # apps/web Next.js on :3000
npm run dev:trust-api                         # @arc/trust-api on :3030 (x402 paywall)
npm --workspace @arc/mcp-server run dev:http  # @arc/mcp-server Streamable HTTP on :8080
```

```bash
# Verification
npm run test:trust-core                              # 33-case scoring suite
npm run smoke:trust-api                              # health + 402 quote shape
npm run smoke:trust-api:paid-mock                    # 6-scenario paid round-trip vs mock facilitator
npm run build:x402-client && npm run test:mcp-server # 3 inspector specs (stdio + http + signing-payer)
npm run test:passport-sdk                            # 8 SDK unit tests (stubbed RPC)
npm run test:attestation-reader                      # 6 read-client unit tests (stubbed RPC)
npm run test:attestations                            # 5 schemas × sign + verify + tamper round-trip
npm run check-trust-contracts                        # offline compile: 4 contract groups
npm --workspace @arc/indexer test                    # 3 listener specs (passport / attestation / e2e)

# Marquee artifacts
npm --workspace @arc/attestations run demo:mena      # compose + verify MENA evidence envelope
npm --workspace @arc/trust-api run smoke:load        # autocannon at 10rps, SLO-gated

# Operator-fired (needs internet / a funded wallet / a deploy target)
npm --workspace contracts run test:trust-contracts        # 109 Hardhat specs, needs solc download
npm --workspace contracts run deploy:passport:arc-testnet
npm --workspace contracts run deploy:trust-suite:arc-testnet
```

Frontend specifics still apply per [CLAUDE.md](./CLAUDE.md): path alias `@/*` → `apps/web/src/*`, design tokens via `primary-*` / `accent-*` / `error-*`, mobile-first breakpoints, wagmi + viem + RainbowKit, Circle App Kit for wallet integration.

## Deploy posture

| Component | Chain | Why |
|---|---|---|
| ARC Passport, adapters, AttestationRegistry | Arc testnet | Product truth where agent commerce happens |
| Existing marketplace + launcher contracts | Arc testnet (frozen) | Read-only references |
| `@arc/trust-api` x402 settlement | Base mainnet USDC via x402 facilitator | Revenue decoupled from Arc mainnet timing |
| `@arc/mcp-server` | Stateless container (Fly/Render/Vercel) | Calls `trust-api` over HTTPS |
| `apps/web` | Vercel | SSR via indexer + Arc RPC |

Arc mainnet is upside, not a dependency. A one-week migration plan stays ready.

## Vertical

**MENA institutional and treasury-oriented agent commerce** is the first vertical:

- DFSA's Crypto Token framework (effective Jan 12, 2026) requires firms to document token suitability — `token.suitability.v1` attestations map directly onto that evidentiary burden.
- ADGM's FRT regime + CBUAE's Foreign Payment Token regime (USDU registered Jan 29, 2026) create a regulated stablecoin corridor — `stablecoin.reserves.v1` attestations capture reserve, governance, disclosure, prudential, and redemption coverage.
- The founder is UAE-based; the operating motion (counsel, compliance docs, design-partner BD) is location- and time-zone-dependent.

This is **not** "regulation solved." Every institutional surface is counsel-led, and counsel review precedes any pitch.

## What's frozen

See [STRATEGIC_PIVOT.md](./STRATEGIC_PIVOT.md) for the full freeze scope. Short version: no new investment in generic NFT marketplace UX, token launcher consumer features, rewards/staking UX, social/feed features. The contracts stay; the consumer surface does not get new work.

## Standards posture

- **ERC-8004**: DRAFT. Aligned via the adapter pattern in `contracts/contracts/passport/` (`IERC8004Identity` + `ArcIdentityAdapter`), `contracts/contracts/reputation/` (`IERC8004Reputation` + `ArcReputationAdapter`), and `contracts/contracts/validation/` (`IERC8004Validation` + `ArcValidationAdapter` stub). Staged Identity → Reputation → narrow Validation. Not marketed as "compliant."
- **x402**: rely on the public facilitator for V0 settlement on Base mainnet USDC. No custom EIP-3009 path until economics demand it.
- **MCP**: stdio transport first per the spec recommendation; Streamable HTTP added later.
- **EIP-712 attestations**: bodies in IPFS/S3, hashes on-chain via `AttestationRegistry`.

## Status

**The 90-day implementation plan is complete in tree.** Slice-by-slice detail in [STRATEGIC_PIVOT.md § Shipped to date](./STRATEGIC_PIVOT.md#shipped-to-date); milestone evidence in [docs/milestones/](./docs/milestones/).

What's live in code:

- W1–W14 shipped: trust-api, mcp-server, indexer, contracts (passport / reputation / attestations / validation), five `@arc/*` packages, public trust surface, legacy quarantine.
- W13 real reads: `GET /v1/passport/:address` and `GET /v1/attestations/:subject` consume real on-chain state via `@arc/passport-sdk` + `@arc/attestation-reader` when `ARC_PASSPORT_ADDRESS` + `ARC_ATTESTATION_REGISTRY_ADDRESS` + `ARC_RPC_URL` are set; otherwise they return the W8 placeholder / 503-unconfigured.
- W14.6 hardening: paid-route middleware skips settlement on 4xx/5xx (callers not billed for their own bad input or our misconfig); deep-tier surfaces `degraded: true` when editorial generation falls back to the stub.
- W14.7 operator readiness: trust-api + mcp-server Dockerfiles + fly.toml + DEPLOY.md, AttestationRegistry/Reputation/Validation deploy script, single Phase A runbook.

The marquee evidence artifact is the MENA design-partner JSON envelope (`packages/attestations/scripts/demo-mena.ts` + [`docs/demo-mena.md`](./docs/demo-mena.md)) composing all five attestation schemas. Trust-api is load-tested at 10rps ([W12 baseline](./apps/trust-api/docs/load-tests/w12-baseline.json)) and carries a 13-finding [self-review](./apps/trust-api/docs/security-review-w12.md), 0 OPEN.

**Production activation is a separate gate**, listed step-by-step in [docs/PHASE_A_RUNBOOK.md](./docs/PHASE_A_RUNBOOK.md): live Base settlement, Arc testnet deploys, hosted MCP, funded signing-payer wallet, Bazaar submission, counsel sign-off on the MENA schemas, and an eventual third-party audit. All user-fired.

## Documentation

- [docs/PHASE_A_RUNBOOK.md](./docs/PHASE_A_RUNBOOK.md) — operator go-live runbook (7 steps, no coding required)
- [STRATEGIC_PIVOT.md](./STRATEGIC_PIVOT.md) — pivot rationale and freeze notice
- [CLAUDE.md](./CLAUDE.md) — project conventions
- [apps/trust-api/docs/security-review-w12.md](./apps/trust-api/docs/security-review-w12.md) — 13-finding trust-layer self-review (0 OPEN)
- [docs/milestones/](./docs/milestones/) — W5–W7 + W8–W12 milestone records (commit ranges, captured test outputs, deferral notices)
- [docs/archived/pre-pivot/](./docs/archived/pre-pivot/) — pre-pivot marketplace docs (ACCESSIBILITY, TESTING, DEPLOYMENT_GUIDE, OAUTH_SETUP, DAPPS_ALIGNMENT_REVIEW, SECURITY_AUDIT v0.4, MASTER_REFACTOR_PLAN) — preserved as historical record, not active
- [subgraph/DEPLOY.md](./subgraph/DEPLOY.md) — subgraph deployment notes
- [legacy-primitives/README.md](./legacy-primitives/README.md) — frozen contracts + tests + deploy scripts (preserved as primitives; not active feature work)
- [docs/archived/](./docs/archived/) — historical phase docs

## License

MIT.

## Links

- Circle Arc: https://www.circle.com/en/circle-arc
- Branch: `claude/trust-layer-agents-sNcay`
