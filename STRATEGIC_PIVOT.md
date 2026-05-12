# Strategic Pivot — ARC Trust Layer

**Effective:** branch `claude/trust-layer-agents-sNcay`
**Status:** W1 — structural minimum + visible freeze of marketplace feature work
**Plan:** `/root/.claude/plans/arc-strategic-synthesis-shimmying-cook.md`

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
| W3-5 | `apps/trust-api` skeleton + facilitator-backed x402 paywall on Base mainnet USDC |
| W6-7 | `apps/mcp-server` (stdio first) + IDE plugin skill publication |
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
