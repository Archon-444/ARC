# W11 follow-up — mass file move + indexer extraction

> **Status: executed.** The codemod landed in W14 across three commits — `W14.1` (`frontend/` → `apps/web/`), `W14.2` (legacy contracts + tests + deploy scripts → `legacy-primitives/`), `W14.3` (`backend/` → `apps/indexer/`, route-pruned). The doc below is preserved as the executed plan of record; section anchors stay valid for blame archaeology. See `STRATEGIC_PIVOT.md` W14 row for what shipped.

The W11 plan combined three slices:

| Slice | Status | Shipped in |
|---|---|---|
| Trust surface in `apps/web` (`/trust`, `/passport`, `/agents`, `/docs`) | Live | W11.1 (in `frontend/`, not yet renamed) |
| Legacy URLs return 410 / redirect to `/legacy`; boundary rule activated | Live | W11.2 (308 redirect via middleware) + W11.3 (eslint rule reserved) |
| Mass file move (`frontend` → `apps/web` + `legacy-primitives/`), `apps/indexer` extracted from `backend/`, boundary rule activated in CI | **Executed** | W14.1 + W14.2 + W14.3 |

This is the deferral plan for the third slice. The trust surface is consumer-visible; the file move is plumbing. Splitting the slice kept the trust surface shippable on W11 and the codemod reviewable on its own merits.

---

## Why the codemod is its own pass

The 90-day plan flagged the W11 codemod as the highest-blast-radius change in the whole programme:

> **W11 codemod blast radius**: deferred to W11 (after trust-api + MCP are real) so a botched move can be rolled back without losing revenue path. Codemod is one diff, ~3k moves, ~5 content rewrites — reviewed by diff size.

Bundling it with the trust surface delivery would either (a) make this PR unreviewable or (b) couple the consumer-visible product change to a tooling change that could regress in dozens of small ways. They are split.

The trust-api, MCP server, contracts, and trust surface are all live. The cost of rolling back the file move (if the codemod produces a bad import graph) is zero — none of the revenue paths depend on the file layout. That is exactly the condition the plan said to wait for.

---

## Scope of the deferred work

### 1. Mass file move

| From | To |
|---|---|
| `frontend/` (Next.js 16 app) | `apps/web/` |
| `backend/` (Express + WS) | `apps/indexer/` (route-pruned) |
| `contracts/contracts/{ArcMarketplace, ArcMarketNFT, ArcTokenFactory, ArcBondingCurveAMM, ArcToken, ProfileRegistry, StakingRewards, SimpleGovernance, ArcGovernance, FeeVault, MockUSDC}.sol` | `legacy-primitives/contracts/...` (read-only) |
| `frontend/src/app/{cart,collection,collections,explore,launch,nft,rewards,token}/` | `legacy-primitives/app/...` (still served at the URLs after the 308 hits `/legacy`, but the source is quarantined and the eslint boundary rule rejects new imports) |

### 2. `apps/indexer` extraction

The current `backend/` carries:
- Token + NFT activity routes (legacy, frozen)
- WebSocket activity rooms (legacy)
- Express + Prisma skeleton + middleware (reusable)

Plan:
- Pull the Express + Prisma skeleton + `lib/`, `middleware/`, `websocket.ts` into `apps/indexer/src/`.
- Drop the marketplace + token activity routes; the new indexer's job is to index Passport + AttestationRegistry events from Arc testnet RPC + the (eventual) subgraph.
- Keep the legacy backend running until the deployed environments cut over.

### 3. Import rewrites

Per the plan, ~5 content rewrites are expected:
- `@/lib/risk-scoring` → `@arc/trust-core` (the scoring engine is already extracted; this is the import path update at the call sites).
- Any `@/services/api` calls that still point at the legacy backend get repointed at `@arc/trust-api` or removed if the route is being quarantined.

The rest of the codebase preserves the `@/*` path alias, so most files compile unchanged after the move. Hardhat config moves with the contracts.

### 4. Boundary rule activation in CI

`.eslintrc.json` already carries the `no-restricted-imports` rule reserved for `legacy-primitives/**`. Once the file move lands, every `apps/*` and `packages/*` workspace inherits the rule from the root config. Activation in CI means adding a workflow step:

```yaml
- run: npm run lint --workspaces --if-present
```

Until the codemod ships, the rule is a no-op (no paths match the patterns).

---

## Acceptance gate for the codemod

When this work finally lands, the following must be true:

1. `npm install` from the repo root resolves cleanly with no workspace shadowing.
2. `npm run type-check:trust-core / x402-client / trust-api / mcp-server / passport-sdk / attestations` all green.
3. `npm run check-trust-contracts` (offline solc-js) still green across all four contract groups.
4. `npm run smoke:trust-api / :paid-mock` and `npm run test:mcp-server` still green.
5. The four W11 trust surface routes resolve correctly under the new `apps/web/` path.
6. The middleware's legacy 308 redirects continue to work — either through the quarantined `legacy-primitives/app/` source files staying mounted, or through equivalent route stubs in `apps/web/`.
7. `eslint **/*.ts` with the no-restricted-imports rule active produces zero violations.
8. A `next build` of `apps/web/` succeeds.

Until all eight are true, the codemod does not land.

---

## Until then

The W11.1 + W11.2 + W11.3 commits already deliver the user-visible payoff:
- `/trust/[target]`, `/passport/[address]`, `/agents`, `/docs` are live in `frontend/`.
- `/legacy` explains the freeze; the eight legacy prefixes 308-redirect there.
- The eslint boundary rule is reserved and will engage the moment `legacy-primitives/` exists.

The file move is a clean-up the team can sequence whenever risk tolerance allows; nothing in the revenue path requires it.
