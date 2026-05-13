# ArcPassport on Arc testnet (W8)

This doc covers everything operator-side: compile, deploy, smoke,
migrate from `ProfileRegistry`. The contract surface and rationale
live in the Solidity files themselves; this is the runbook.

## Files

| Path | Purpose |
|---|---|
| `contracts/passport/interfaces/IERC8004Identity.sol` | TS-mirrorable Identity interface (DRAFT spec) |
| `contracts/passport/ArcIdentityAdapter.sol` | Identity storage; gated by `REGISTRAR_ROLE` |
| `contracts/passport/ArcPassport.sol` | Public-facing primitive; holds adapter pointer + counsel attestations |
| `scripts/deploy-passport.js` | Atomic deploy: adapter → passport → grant REGISTRAR_ROLE |
| `scripts/migrate-profile-registry.js` | Hydrate Passport from legacy `ProfileRegistry` events |
| `scripts/check-passport.js` | Offline solc-js compile gate (no internet required) |
| `test/passport/*.test.js` | Hardhat behavioral test suite (44 specs across adapter + passport) |

## Quick gate (no internet required)

```bash
npm --workspace contracts run check-passport
# compiler: solc 0.8.26+commit.8a97fa7a.Emscripten.clang
# contracts:
#   passport/ArcIdentityAdapter.sol:ArcIdentityAdapter bytecode=4015B
#   passport/ArcPassport.sol:ArcPassport               bytecode=5091B
# check-passport OK
```

This proves the contracts parse and imports resolve. It does NOT
exercise behavior — for that, run the full Hardhat suite below.

## Full Hardhat test gate (requires internet — fetches solc 0.8.24)

```bash
npm --workspace contracts run test:passport
```

44 specs across `ArcIdentityAdapter.test.js` (18) and `ArcPassport.test.js`
(26). Covers the W8 acceptance gate verbatim:

- mint / resolve / revoke (both adapter and integration)
- role-gated counsel attach
- `setIdentityAdapter` adapter swap routes subsequent calls to the
  NEW code (proven by minting a new subject into adapter2 and
  observing id=1, not id=2)
- counsel attestations preserved across adapter swap
- migration helper path (`mintFor` admin-only)

## Deploy to Arc testnet

### 1. Configure `contracts/.env`

```ini
PRIVATE_KEY=0x...                          # deployer / admin wallet
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PASSPORT_COUNSEL_ADDRESS=0x...             # optional; counsel multisig
ARCSCAN_API_KEY=...                        # optional; verification
```

Fund the deployer with Arc testnet USDC (gas is paid in USDC on Arc).

### 2. Deploy

```bash
npm --workspace contracts run deploy:passport:arc-testnet
```

The script:

1. Deploys `ArcIdentityAdapter(admin)`.
2. Deploys `ArcPassport(admin, adapter)`.
3. Grants the Passport contract `REGISTRAR_ROLE` on the adapter so it
   is the sole writer.
4. Optionally grants `COUNSEL_ROLE` on the Passport if
   `PASSPORT_COUNSEL_ADDRESS` is set.
5. Reads back `passport.identityAdapter()` as a smoke check.
6. Prints a copy/paste row for the "Known deployments" table below.

### 3. Verify on ArcScan (optional)

```bash
npm --workspace contracts run verify:arc-testnet -- <ADAPTER_ADDR> <ADMIN_ADDR>
npm --workspace contracts run verify:arc-testnet -- <PASSPORT_ADDR> <ADMIN_ADDR> <ADAPTER_ADDR>
```

### 4. Paste the deployment row

Append to "Known deployments" below, then commit.

## Known deployments

| Date (UTC) | Network | Adapter | Passport | Notes |
|---|---|---|---|---|
| _pending_ | arcTestnet (5042002) | `0x…` | `0x…` | First W8 deploy |

After the row lands, also update the `apps/trust-api` config so
`GET /v1/passport/:address` consults the deployed Passport instead of
returning the W8 placeholder.

## Migrate from ProfileRegistry

The legacy `ProfileRegistry.sol` carried per-address `metadataURI`
strings. The migration helper walks `ProfileUpdated` events between
two block heights and mints a Passport for every subject that does
not already have one.

### Dry run first

```bash
PASSPORT_ADDRESS=0x... \
PROFILE_REGISTRY_ADDRESS=0x... \
FROM_BLOCK=<deployment block of ProfileRegistry> \
TO_BLOCK=latest \
DRY_RUN=true \
  npx hardhat run scripts/migrate-profile-registry.js --network arcTestnet
```

The dry run prints a per-subject preview without sending any
transactions. Review the output, confirm the URIs look right, then:

### Run for real

```bash
DRY_RUN=false \
PASSPORT_ADDRESS=0x... \
PROFILE_REGISTRY_ADDRESS=0x... \
FROM_BLOCK=... \
  npx hardhat run scripts/migrate-profile-registry.js --network arcTestnet
```

The script is idempotent — re-running after a partial migration is
safe. Subjects already holding a passport are skipped.

## Adapter rotation runbook

When ERC-8004 finalizes its identity field shape (or any other reason
to swap the adapter):

1. Deploy `ArcIdentityAdapter2(admin)` separately.
2. Grant the existing Passport contract `REGISTRAR_ROLE` on the new
   adapter.
3. Call `passport.setIdentityAdapter(adapter2)` from the admin wallet.
4. Off-chain consumers (trust-api, passport-sdk, indexer) re-index
   from the new adapter's `IdentityRegistered` events.

Counsel attestations are preserved automatically — they live on the
Passport contract, not the adapter. Existing passports issued into
the old adapter become unreachable through the Passport surface (the
records still exist on the old adapter for historic queries, but
`passport.resolveBySubject(...)` returns 0 for them post-swap).
Communicate the cutover to subjects so they can re-mint into the new
adapter.

## Verification matrix

| Gate | Where | When |
|---|---|---|
| compile-only (offline) | `npm run check-passport-contracts` | every commit touching `contracts/passport/**` |
| behavioral tests | `npm --workspace contracts run test:passport` | every commit before push; user-fired in this dev environment due to network constraints |
| deploy + smoke read | `deploy-passport.js` output | once per environment (testnet, eventually mainnet) |
| paste deployment row | this file's "Known deployments" | immediately after a successful deploy |
| trust-api passport route returns real data | `curl /v1/passport/<subject>` | after the deployment row lands and trust-api is reconfigured |
