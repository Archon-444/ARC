# Attestation schemas — trust-api allowlist

`AttestationRegistry` is intentionally permissive: any `bytes32 schemaId`
is accepted. Trust-api is intentionally opinionated: only schemas in
this allowlist render as canonical typed rows. Unknown ids surface
as `{ schemaName: null, status: 'unknown_schema' }` so downstream
consumers do not mistake a permissive on-chain anchor for a vetted
claim.

This split — permissive contract, opinionated consumer — is the
deliberate trust boundary. The contract gives operators flexibility
(new schemas without contract upgrade); the consumer is where
rendering safety lives.

## Where the canonical IDs live in code

`apps/trust-api/src/sources/attestation-schemas.ts`:

```ts
export const CANONICAL_SCHEMA_NAMES = [
  'counsel.kyb.v1',
  'editorial.review.v1',
  'treasury.policy.v1',
  'token.suitability.v1',
  'stablecoin.reserves.v1',
] as const;

export const CANONICAL_SCHEMA_IDS = {
  /* keccak256(name) for each, computed at module load */
} as const;

export function resolveSchemaName(schemaId: Hex): CanonicalSchemaName | null { ... }
export function describeSchemaId(schemaId: Hex): SchemaRowDescriptor { ... }
```

Every trust-api route that surfaces attestation rows runs each row's
on-chain `schemaId` through `describeSchemaId()` before rendering.
The shape on the wire is `{ schemaId, schemaName, status }` where
`status` ∈ `'canonical'` (in the allowlist) or `'unknown_schema'`
(off the allowlist; render raw bytes only).

## Why the contract does not have an allowlist

Two reasons.

1. **Operator-issued schemas.** An ARC partner could define a new
   schema body (say `counsel.kyc.v1` for individual KYC alongside
   the existing entity-level `counsel.kyb.v1`) and start anchoring
   it on Arc testnet immediately, without ARC needing to upgrade the
   `AttestationRegistry` contract. The on-chain dataHash integrity
   story works for any schema — the registry just records "this
   signer anchored this hash for this subject at this expiry."
2. **Schema versioning has no on-chain churn cost.** When a schema
   evolves (e.g. `counsel.kyb.v1` → `counsel.kyb.v2`), the new
   schemaId is just `keccak256("counsel.kyb.v2")`. The contract
   accepts both, the trust-api allowlist adds the new one alongside
   the old, and there is no Solidity write needed.

The trade-off is that ATTESTER_ROLE holders could in principle
anchor any `bytes32` — including a fake `keccak256("counsel.kyb.v1.fake")`
that visually resembles a real schema id. That is why trust-api
rejects unknown ids: the contract is the integrity layer, the
consumer is the rendering layer.

## Promotion process

Before adding a new schema to this allowlist:

1. Ship the schema body in `packages/attestations/src/schemas/<name>-vN.ts`
   with its EIP-712 types object + bytes32 id.
2. Ship its validator in `packages/attestations/src/validate.ts`
   (range checks, cross-field invariants, enum guards). Body
   validators are the W8–W12 hardening item from the external
   review; they catch nonsense values before signing.
3. Counsel review for anything that claims regulatory mapping
   (DFSA / ADGM / CBUAE / similar). Schemas waiting on counsel are
   marked **counsel-review draft** in their source header until
   sign-off.
4. Add the canonical name to `CANONICAL_SCHEMA_NAMES` in
   `apps/trust-api/src/sources/attestation-schemas.ts`. The
   `CANONICAL_SCHEMA_IDS` map and the reverse lookup are computed
   automatically.
5. Redeploy trust-api so the new allowlist takes effect.

Until step 5, even a legitimately-signed attestation against the
new schema renders as `unknown_schema`. That is deliberate; the
trust-api is the rendering layer, and the rendering layer must
know the schema body shape to render it safely.

## Canonical IDs (as of this commit)

| Canonical name | Source file | Status |
|---|---|---|
| `counsel.kyb.v1` | `packages/attestations/src/schemas/counsel-kyb-v1.ts` | production |
| `editorial.review.v1` | `packages/attestations/src/schemas/editorial-review-v1.ts` | production |
| `treasury.policy.v1` | `packages/attestations/src/schemas/treasury-policy-v1.ts` | production |
| `token.suitability.v1` | `packages/attestations/src/schemas/token-suitability-v1.ts` | counsel-review draft (DFSA Crypto Token framework) |
| `stablecoin.reserves.v1` | `packages/attestations/src/schemas/stablecoin-reserves-v1.ts` | counsel-review draft (ADGM FRT regime) |

Bytes32 ids are computed deterministically at module load via
`keccak256(stringToBytes(name))`; the source-of-truth for each id is
the schema's `name` field, not a hand-coded hex string. Drift between
the allowlist and the schema files is a configuration bug.

## Cross-references

- `contracts/contracts/attestations/AttestationRegistry.sol` — the
  "schema-id posture" note documents this design from the contract
  side.
- `apps/trust-api/src/sources/attestation-schemas.ts` — the
  allowlist module + `describeSchemaId()`.
- `packages/attestations/src/schemas/*.ts` — the typed-data schemas
  and their canonical names.
- `packages/attestations/src/validate.ts` — body-shape validators
  (W8–W12.2 hardening item).
- `apps/trust-api/docs/security-review-w12.md` F-10 — cache poisoning
  posture; the W10 deep-tier response cache uses the canonical
  lookup to refuse to cache rows for unknown schemas.

## When to relax this allowlist

Never relax it; widen it. Adding new schemas via the promotion
process above is how the allowlist grows. Disabling it (rendering
unknown schemas as canonical) would defeat the trust boundary the
two-layer design relies on.

If you find yourself wanting to relax it, the right question is
whether your new schema should be in the allowlist — not whether the
allowlist should go away.
