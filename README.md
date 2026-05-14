# ARC — Trust Layer for Circle-Native Agent Commerce

> **Strategic pivot in progress.** ARC is being repositioned from "NFT marketplace + token launchpad" into the trust, identity, and editorial-verification layer for agent commerce on Circle's Arc blockchain. See [STRATEGIC_PIVOT.md](./STRATEGIC_PIVOT.md) for the why and the 90-day plan.

## What ARC is becoming

The independent trust layer Circle Agent Stack and Coinbase x402 Bazaar do not provide:

- **`@arc/mcp-server`** — an MCP server that exposes `arc_trust_read`, `arc_search`, and `arc_passport_get` so any Claude / Codex / Cursor / Bazaar-aware agent can look up agent and counterparty trust before transacting.
- **`@arc/trust-api`** — a pay-per-call x402 trust-read API priced at $0.01 / $0.05 per call, settled in USDC on Base mainnet via the public x402 facilitator. Decouples revenue from Arc mainnet timing.
- **ARC Passport** — an Arc-native, ERC-8004-aligned identity primitive (Identity → Reputation → narrow Validation, behind an adapter so DRAFT-spec changes do not require migration).
- **AttestationRegistry + schemas** — EIP-712 typed-data attestations covering KYB, editorial review, treasury policy, **token suitability** (DFSA-mapped), and **stablecoin reserves** (ADGM FRT-mapped) so MENA institutional firms have machine-readable evidence for the documented suitability assessments their regulators now require.

## What ARC was

A full-stack NFT marketplace + token launchpad. The smart contracts (`ArcMarketplace`, `ArcTokenFactory`, `ArcBondingCurveAMM`, `FeeVault`, `ProfileRegistry`, `StakingRewards`, `SimpleGovernance`, diamond facets) remain deployed on Arc testnet and are **preserved as primitives**. They are not the product; they are not the focus of new feature work. See [STRATEGIC_PIVOT.md](./STRATEGIC_PIVOT.md) for the freeze scope.

## Monorepo layout

```
ARC/
├── frontend/                    # Next.js 16 app (trust-layer routes incoming; marketplace links removed from nav)
├── backend/                     # Express REST + WebSocket (narrowing to passport/attestation indexing)
├── contracts/                   # Solidity 0.8.24 (Passport + AttestationRegistry incoming)
├── subgraph/                    # The Graph indexing
├── packages/
│   └── trust-core/              # Scoring engine + cache helpers (extracted from frontend)
├── apps/                        # NEW — trust-api, mcp-server, indexer (added W3+)
├── tsconfig.base.json           # shared TS config
├── package.json                 # npm workspaces root
├── STRATEGIC_PIVOT.md           # pivot rationale + freeze notice
└── CLAUDE.md                    # project conventions
```

## Quick start

```bash
npm install                       # workspace install at repo root
npm --workspace frontend run dev  # web app
npm --workspace @arc/trust-core test

# Trust layer (W3–W7 — landed)
npm run dev:trust-api             # @arc/trust-api on :3030 (x402 paywall)
npm run smoke:trust-api           # health + 402 quote shape
npm run smoke:trust-api:paid-mock # paid round-trip vs mock facilitator
npm run build:x402-client         # required before mcp-server (CJS dist)
npm run build:mcp-server          # @arc/mcp-server (stdio + http MCP)
npm run test:mcp-server           # 3 inspector specs back-to-back:
                                  #   stdio + http + signing-payer
npm --workspace @arc/mcp-server run dev:http  # Streamable HTTP on :8080

# Passport + Reputation + Attestations + Validation (W8/W9/W10 — landed in tree)
npm run check-trust-contracts     # offline compile: 4 contract groups
npm run test:passport-sdk         # 8 SDK unit tests (stubbed RPC)
npm run test:attestations         # 5 schemas × sign + verify + tamper round-trip
# Full Hardhat tests + Arc testnet deploy are user-fired:
npm --workspace contracts run test:trust-contracts     # 109 specs, needs internet
npm --workspace contracts run deploy:passport:arc-testnet

# W12 marquee artifacts
npm --workspace @arc/attestations run demo:mena        # compose + verify MENA evidence envelope
npm --workspace @arc/trust-api run smoke:load          # autocannon at 10rps, SLO-gated
```

Frontend specifics still apply per [CLAUDE.md](./CLAUDE.md): path alias `@/*` → `frontend/src/*`, design tokens via `primary-*` / `accent-*` / `error-*`, mobile-first breakpoints, wagmi + viem + RainbowKit, Circle App Kit for wallet integration.

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

- **ERC-8004**: DRAFT. We are aligned via adapter (`packages/erc8004-adapter`, coming W8), staged Identity → Reputation → narrow Validation. We publish a public compatibility matrix. We do not market as "compliant."
- **x402**: rely on the public facilitator for V0 settlement on Base mainnet USDC. No custom EIP-3009 path until economics demand it.
- **MCP**: stdio transport first per the spec recommendation; Streamable HTTP added later.
- **EIP-712 attestations**: bodies in IPFS/S3, hashes on-chain via `AttestationRegistry`.

## Plan

The 90-day execution plan lives at `/root/.claude/plans/arc-strategic-synthesis-shimmying-cook.md`. Weekly milestones, critical files, and verification gates are listed there. Slice status is tracked in [STRATEGIC_PIVOT.md](./STRATEGIC_PIVOT.md#shipped-to-date) — **W1–W12 are complete in tree.** The marquee W12 artifact is the MENA design-partner evidence object (`packages/attestations/scripts/demo-mena.ts` + [`docs/demo-mena.md`](./docs/demo-mena.md)) composing all five attestation schemas + a placeholder passport into a single verifiable JSON envelope. The trust-api is load-tested at 10rps with the [W12 baseline](./apps/trust-api/docs/load-tests/w12-baseline.json) captured. The x402 facilitator integration carries a 13-finding [self-review](./apps/trust-api/docs/security-review-w12.md) (0 OPEN). The one explicit deferral is the W11 codemod (mass file move + indexer extraction), scoped in [`docs/w11-followups.md`](./docs/w11-followups.md).

## Documentation

- [STRATEGIC_PIVOT.md](./STRATEGIC_PIVOT.md) — pivot rationale and freeze notice
- [CLAUDE.md](./CLAUDE.md) — project conventions
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) — security audit findings (carryover from v0.4)
- [DAPPS_ALIGNMENT_REVIEW.md](./DAPPS_ALIGNMENT_REVIEW.md) — code-vs-documentation audit
- [subgraph/DEPLOY.md](./subgraph/DEPLOY.md) — subgraph deployment notes
- [backend/TOKEN_ACTIVITY_BROADCAST.md](./backend/TOKEN_ACTIVITY_BROADCAST.md) — legacy token activity broadcast (frozen)
- [docs/archived/](./docs/archived/) — historical phase docs

## License

MIT.

## Links

- Circle Arc: https://www.circle.com/en/circle-arc
- Branch: `claude/trust-layer-agents-sNcay`
