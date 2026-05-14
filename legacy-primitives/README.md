# `legacy-primitives/` — frozen marketplace + token-launcher surfaces

Quarantined contracts, tests, and deploy scripts from before the
trust-layer pivot. None of this is in active feature work; all of it
stays on-chain as preserved primitives. See
[`STRATEGIC_PIVOT.md`](../STRATEGIC_PIVOT.md) for the pivot rationale
and freeze notice.

## What lives here

```
legacy-primitives/
├── contracts/                # 11 frozen Solidity contracts
│   ├── ArcMarketplace.sol
│   ├── ArcMarketNFT.sol
│   ├── ArcTokenFactory.sol
│   ├── ArcToken.sol
│   ├── ArcBondingCurveAMM.sol
│   ├── ProfileRegistry.sol   # superseded by ArcPassport (W8); see migrate-profile-registry.js
│   ├── StakingRewards.sol
│   ├── SimpleGovernance.sol
│   ├── ArcGovernance.sol
│   ├── FeeVault.sol
│   ├── MockUSDC.sol
│   └── archive/              # earlier iterations (ArcStaking.sol)
├── test/                     # 5 Hardhat tests for the legacy contracts
│   ├── ArcMarket.test.js
│   ├── ArcTokenFactory.test.js
│   ├── NFTMarketplace.test.js
│   ├── SimpleGovernance.test.js
│   └── StakingRewards.test.js
└── scripts/                  # legacy deploy scripts
    ├── deploy.js
    └── deploy-arc.js
```

## What's quarantined and why

These were the consumer-facing surfaces before ARC pivoted to the
trust, identity, and editorial-verification layer for Circle-native
agent commerce:

- The **NFT marketplace** (`ArcMarketplace`, `ArcMarketNFT`,
  `FeeVault`).
- The **token launcher** (`ArcTokenFactory`, `ArcToken`,
  `ArcBondingCurveAMM`).
- **Profile + governance + staking** (`ProfileRegistry`,
  `SimpleGovernance`, `ArcGovernance`, `StakingRewards`).
- **Test fixtures** (`MockUSDC`).

After the pivot, ARC ships the trust layer — `apps/trust-api`,
`apps/mcp-server`, the four trust-layer Solidity surfaces under
`contracts/contracts/{passport,reputation,attestations,validation}/`,
the five `@arc/attestations` schemas, the public trust surface at
`apps/web/src/app/{trust,passport,agents,docs,legacy}/`. The legacy
contracts stay deployed on Arc testnet as preserved primitives; the
consumer-facing UX is frozen and lives behind a 308 redirect to
`/legacy` (see [`apps/web/src/middleware.ts`](../apps/web/src/middleware.ts)).

`ProfileRegistry` specifically is **superseded** by `ArcPassport`
([`contracts/contracts/passport/ArcPassport.sol`](../contracts/contracts/passport/ArcPassport.sol)).
The W8 migration helper at
[`contracts/scripts/migrate-profile-registry.js`](../contracts/scripts/migrate-profile-registry.js)
hydrates passports from the existing registry; details in
[`contracts/docs/PASSPORT.md`](../contracts/docs/PASSPORT.md).

## Why these files are NOT under `contracts/`

The active `contracts/` Hardhat workspace compiles only the
trust-layer surfaces. `paths.sources = "./contracts"` resolves to
`contracts/contracts/`, which now holds exactly four subdirectories:
`passport/`, `reputation/`, `attestations/`, and `validation/`.
Keeping the legacy `.sol` files there would compile + ship as part of
the trust-layer tests, blurring the boundary. The boundary is the
point.

The eslint boundary rule armed in W11.3 already forbids importing
from `legacy-primitives/**` into `apps/*` or `packages/*`:

```json
"no-restricted-imports": [
  "error",
  {
    "patterns": [
      {
        "group": ["**/legacy-primitives/**", "legacy-primitives/**"],
        "message": "Files in legacy-primitives/ are quarantined…"
      }
    ]
  }
]
```

Trying to import a legacy contract or test from anywhere outside this
directory fails CI by design.

## Running the legacy suite

The legacy contracts still compile with solc 0.8.24 (their original
pinned version) and the tests still pass under their original Hardhat
config. Running them requires:

```sh
# From contracts/ workspace, point a one-off Hardhat config at the
# legacy sources. NOT in the standard `npm test` rotation by design.
cd contracts
npx hardhat --config hardhat.config.legacy.js test ../legacy-primitives/test/*.test.js
```

`hardhat.config.legacy.js` is **not currently in tree** — landing it
is a follow-up if anyone needs to re-run the legacy suite. Until then,
the tests are frozen artifacts: useful for git-blame archaeology, not
for CI signal.

The original `deploy.js` and `deploy-arc.js` scripts also live here.
The `contracts/` workspace exposes wrappers as `deploy:legacy:*`
scripts that point at these paths; running them produces compilation
errors today (the trust-layer Hardhat config doesn't compile the
legacy `.sol` files). To re-enable, write the legacy Hardhat config
referenced above and re-run.

## Cross-references

- [`STRATEGIC_PIVOT.md`](../STRATEGIC_PIVOT.md) — pivot rationale +
  shipped-to-date table.
- [`docs/w11-followups.md`](../docs/w11-followups.md) — the W11
  follow-up doc that scoped this codemod (now executed).
- [`apps/web/src/app/legacy/page.tsx`](../apps/web/src/app/legacy/page.tsx)
  — the user-facing explainer that the 308 middleware redirects legacy
  URLs to.
- [`contracts/docs/PASSPORT.md`](../contracts/docs/PASSPORT.md) —
  Passport runbook + ProfileRegistry migration recipe.

## What does NOT live here

- The five new trust-layer Solidity contracts. Those live in
  `contracts/contracts/{passport,reputation,attestations,validation}/`
  and are active product code.
- `@arc/trust-core` (the v0 scoring heuristic extracted from the
  pre-pivot `apps/web/src/lib/risk-scoring.ts`). The original is not
  in this directory — the migration was an extraction, not a move; the
  Tests + helpers run in `packages/trust-core/`.
- The pre-pivot marketplace + token-launcher pages from
  `apps/web/src/app/{cart,collection,collections,explore,launch,nft,rewards,token}/`.
  Those still mount in the Next.js routing tree so the W11 308
  middleware can intercept any deep link; they remain in
  `apps/web/src/app/` for the operational reason that splitting them
  out would require either moving the routing config or running two
  Next.js apps. The middleware is the trust boundary; the file layout
  isn't.
