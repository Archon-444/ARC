# `ArcPassport.setIdentityAdapter()` — operational runbook

`ArcPassport.sol` is built around a single pluggable pointer:
`identityAdapter` (an `IERC8004Identity`). The contract holds no
identity state itself; the live adapter does. `setIdentityAdapter`
swaps the pointer atomically. This runbook is the operator-side
procedure for swapping that pointer *without losing live passport
IDs* — the contract supports the swap, but the on-chain state migration
is your responsibility.

`contracts/test/passport/ArcPassport.test.js` proves the swap routes
subsequent calls to the new code; this runbook is the operational
choreography to keep the data behind those calls coherent.

## When you'd swap an adapter

- **Spec finalisation.** ERC-8004 lands its final field shape and the
  current adapter no longer matches. Stage the new adapter, hydrate,
  flip.
- **Bug or migration in the adapter.** A new adapter that fixes a
  storage bug or migrates to a different layout. Roll it forward
  without rebuilding passport state.
- **Performance / cost change.** New adapter packs storage
  differently or batches events differently. Same passport IDs, same
  counsel attestations, new internals.

## What stays constant across a swap

- **`ArcPassport` contract address.** Off-chain consumers (`@arc/passport-sdk`,
  the trust-api, the indexer, the browser surface) hard-bind to this
  address; they don't care which adapter sits behind it.
- **Counsel attestations.** `counselAttestations[passportId]` lives on
  `ArcPassport`, not the adapter. The W8.2 integration test
  ("counsel attestations are preserved across swap") asserts this
  invariant verbatim.
- **`COUNSEL_ROLE` membership** on the Passport contract.

## What you must hydrate yourself

- **Every identity record** in the old adapter (`subject`, `metadataURI`,
  `revoked`) must be replayed against the new adapter before the
  pointer flips. Passport IDs are issued by the adapter, not the
  Passport contract — a fresh adapter starts at id=1, so unless you
  hydrate, `passport.resolveBySubject(...)` returns 0 for every
  existing user the moment the pointer flips.
- **Reverse subject → id mapping** is rebuilt automatically as you
  replay `register` calls (in the same order).

## Preconditions

Before starting the swap:

- [ ] `COUNSEL_ROLE` is quiet. No counsel attestations are about to be
      written. If you have a multi-counsel workflow, pause it.
- [ ] No in-flight passport mints. The browser surface is read-only
      so this is mostly an MCP-server / agent concern.
- [ ] Deployer wallet is funded with Arc testnet gas.
- [ ] You have the snapshot infrastructure ready (next section).

## Seven-step procedure

### Step 1 — Snapshot the old adapter

Enumerate every `IdentityRegistered`, `IdentityMetadataUpdated`, and
`IdentityRevoked` event from the old adapter's deployment block to
the current head. Serialise to `snapshot-<date>.jsonl`.

```ts
import { createPublicClient, http } from 'viem';
import { ARC_TESTNET } from '@arc/passport-sdk';

const publicClient = createPublicClient({ chain: ARC_TESTNET, transport: http() });
const oldAdapter = '0x...';
const deploymentBlock = 123_456n;

const registered = await publicClient.getContractEvents({
  address: oldAdapter,
  abi: ARC_IDENTITY_ADAPTER_ABI,
  eventName: 'IdentityRegistered',
  fromBlock: deploymentBlock,
  toBlock: 'latest',
});
// Same for IdentityMetadataUpdated and IdentityRevoked.
```

Order the events by `(blockNumber, transactionIndex, logIndex)` so
hydration replays them in original order — that preserves the
issued-id sequence on the new adapter.

### Step 2 — Deploy the new adapter

Deploy `ArcIdentityAdapter2.sol` (or the renamed successor) with the
**same admin** as the old one. Capture the address. **Do NOT grant any
role on it yet** — production hydration runs from a single privileged
key.

```sh
npm --workspace contracts run deploy:passport:arc-testnet -- \
  --adapter-only --admin 0x<admin>
```

### Step 3 — Hydrate

For each snapshot entry, in order, call the new adapter's mutator with
a `HYDRATION_ROLE` (if the new adapter ships one) or a temporary
`REGISTRAR_ROLE` granted to the deployer wallet:

```ts
for (const ev of snapshot) {
  switch (ev.name) {
    case 'IdentityRegistered':
      await adapter2.write.register([ev.args.subject, ev.args.metadataURI]);
      break;
    case 'IdentityMetadataUpdated':
      await adapter2.write.updateMetadata([ev.args.id, ev.args.metadataURI]);
      break;
    case 'IdentityRevoked':
      await adapter2.write.revoke([ev.args.id]);
      break;
  }
}
```

After hydration, verify by re-querying the new adapter and diffing
against the snapshot: `adapter2.resolveBySubject(subject)` must equal
the id the old adapter issued for every subject.

### Step 4 — Grant `REGISTRAR_ROLE` to ArcPassport on the new adapter

```sh
adapter2.grantRole(REGISTRAR_ROLE, passport.address)
```

This is what makes the Passport contract the sole writer once the
pointer flips. Without this step, mints will revert after the swap.

### Step 5 — Revoke `REGISTRAR_ROLE` on the old adapter

```sh
adapter1.revokeRole(REGISTRAR_ROLE, passport.address)
```

The old adapter is now frozen (read-only) but its state stays on-chain
for historic queries via direct adapter address. Existing indexers
that subscribed to the old adapter's events stop seeing new ones.

### Step 6 — Flip the pointer

From the admin wallet:

```sh
passport.setIdentityAdapter(adapter2.address)
```

Emits `IdentityAdapterUpdated(previous=adapter1, next=adapter2)`. From
this block forward, every `passport.getPassport(...)`,
`passport.resolveBySubject(...)`, `passport.mintSelf(...)`, etc. routes
to `adapter2`.

Reconfigure the off-chain indexer to subscribe to `adapter2`'s event
topics. Trust-api consumers do not need a redeploy — they bind to the
Passport contract address, which is unchanged.

### Step 7 — Verify against the snapshot

Walk a deliberate set of sample subjects through `passport.getPassport`
+ `passport.resolveBySubject` and assert equality with the snapshot:

- One **revoked** passport (its `getPassport().revoked` must be `true`).
- One **current** passport that had a metadata update mid-lifetime
  (its `metadataURI` must match the latest update, not the original).
- One **brand-new** mint that landed in the last few blocks before the
  swap.
- One **counsel-attached** passport (its `getPassport().counselAttestation`
  must be unchanged — counsel attestations live on `ArcPassport`).

If any sample diverges, ROLL BACK immediately (see below).

## Rollback

If verification fails:

1. Point the pointer back at the old adapter:
   `passport.setIdentityAdapter(adapter1.address)`.
2. Re-grant `REGISTRAR_ROLE` to the Passport contract on adapter1.
3. Revoke `REGISTRAR_ROLE` from adapter2.
4. Re-subscribe off-chain indexers to adapter1's event topics.

Counsel attestations are preserved by the rollback (they never left
the Passport contract). Identity records on adapter2 are abandoned but
remain on-chain.

If hydration mutated adapter2 mid-swap and you cannot complete it,
keep adapter1 as the live source and redeploy adapter2 from scratch
on the next attempt.

## Indexer reconfigure checklist

- [ ] Trust-api `ARC_PASSPORT_ADDRESS` env: **unchanged**.
- [ ] Indexer's event-subscription config: repoint from `adapter1` to
      `adapter2`. Both old and new adapter event ABIs are identical
      (`IERC8004Identity`), so no schema migration is required.
- [ ] `@arc/passport-sdk` consumers: transparently see the new state
      via the Passport contract's ABI. No code change required.
- [ ] Browser surface (`apps/web/src/app/passport/[address]`): no
      change.

## Test recipe

Before doing the swap on testnet, run the procedure end-to-end on a
local Hardhat network:

```sh
cd contracts
npx hardhat node &  # in background

# In another shell:
PRIVATE_KEY=<anvil key 0> ARC_TESTNET_RPC_URL=http://127.0.0.1:8545 \
  npx hardhat run scripts/deploy-passport.js --network arcTestnet

# Then run scripts/test-adapter-swap.js (see contracts/scripts/)
# which:
#   1. Mints N sample passports through the live adapter
#   2. Snapshots events
#   3. Deploys adapter2
#   4. Hydrates from the snapshot
#   5. Flips the pointer
#   6. Walks the sample subjects through passport.getPassport
#      and asserts equality
```

`contracts/scripts/test-adapter-swap.js` is *not* in this commit;
it's an item for the next-slice trust-api integration session, where
on-chain reads from the Passport are actually exercised end-to-end.
Until then, the W8 integration test `ArcPassport.test.js > setIdentityAdapter > subsequent calls route to the NEW adapter`
holds the line.

## Why this runbook exists

`ArcPassport.setIdentityAdapter()` is in tree, tested, and ready to
fire. But the operator-side state-hydration choreography it depends on
was not documented anywhere — only the contract event existed. The
"swap-without-state-migration" framing in the design docs refers to
the *Passport contract's* state (counsel attestations) — not the
adapter's identity records, which must be hydrated. This doc removes
that ambiguity.

Cross-references:
- `contracts/contracts/passport/ArcPassport.sol` — pointer + setter
- `contracts/contracts/passport/ArcIdentityAdapter.sol` — current
  adapter (the one being swapped from)
- `contracts/contracts/passport/interfaces/IERC8004Identity.sol` — the
  interface every adapter implements (must be the same shape across
  versions for the swap to be ABI-clean)
- `contracts/test/passport/ArcPassport.test.js` — adapter-swap test
  ("subsequent calls route to the NEW adapter" + "counsel attestations
  preserved across swap")
- `contracts/docs/PASSPORT.md` — overall Passport runbook (deploy,
  test, migrate from ProfileRegistry)
