/**
 * Canonical schema-ID allowlist for trust-api consumers.
 *
 * `AttestationRegistry` is intentionally permissive — it accepts any
 * `bytes32 schemaId` because the design lets operators issue new
 * schemas without a contract upgrade. The trust-api is intentionally
 * OPINIONATED: only schema ids in this allowlist are rendered with
 * their typed name; unknown ids surface as `{ schemaName: null,
 * status: 'unknown_schema' }` so downstream consumers do not mistake
 * a permissive anchor for a vetted claim.
 *
 * Promotion process for a new schema:
 *   1. Ship the schema body in `packages/attestations/src/schemas/`.
 *   2. Ship its validator in `packages/attestations/src/validate.ts`.
 *   3. Counsel review (for the MENA-mapped pair and anything that
 *      claims regulatory mapping).
 *   4. Add the canonical name + keccak256(name) here.
 *   5. Redeploy trust-api.
 *
 * Until step 5, even a legitimately-signed attestation against a
 * not-yet-published schema renders as `unknown_schema`. That is
 * deliberate: rendering requires off-chain knowledge of the body
 * shape, and the trust-api is the place to enforce it.
 *
 * See `apps/trust-api/docs/attestation-schemas.md` for the rationale
 * and `contracts/contracts/attestations/AttestationRegistry.sol`
 * for the "schema-id posture" note documenting why the contract
 * itself does not maintain an allowlist.
 */

import { keccak256, stringToBytes, type Hex } from 'viem';

/**
 * Canonical schema names recognised by trust-api. Mirrors the
 * `@arc/attestations` `name` field on each schema.
 */
export const CANONICAL_SCHEMA_NAMES = [
  'counsel.kyb.v1',
  'editorial.review.v1',
  'treasury.policy.v1',
  'token.suitability.v1',
  'stablecoin.reserves.v1',
] as const;

export type CanonicalSchemaName = (typeof CANONICAL_SCHEMA_NAMES)[number];

/**
 * Canonical schema name → on-chain bytes32 id. Computed once at
 * module load via `keccak256(name)` so consumers can compare an
 * on-chain `schemaId` field against these values without re-hashing.
 *
 * The id derivation matches `@arc/attestations` schema construction
 * exactly: `id = keccak256(stringToBytes(name))`. Drift between this
 * map and the schema files is a configuration bug; it would mean
 * trust-api fails to recognise a legitimately-signed attestation
 * because the canonical bytes32 was wrong.
 */
export const CANONICAL_SCHEMA_IDS: { readonly [K in CanonicalSchemaName]: Hex } = (() => {
  const out = {} as { [K in CanonicalSchemaName]: Hex };
  for (const name of CANONICAL_SCHEMA_NAMES) {
    out[name] = keccak256(stringToBytes(name));
  }
  return out;
})();

/** Reverse map: on-chain `schemaId` → canonical name. */
const REVERSE = new Map<Hex, CanonicalSchemaName>();
for (const name of CANONICAL_SCHEMA_NAMES) {
  REVERSE.set(CANONICAL_SCHEMA_IDS[name], name);
}

/**
 * Resolve an on-chain `schemaId` to its canonical name, or `null`
 * if the id is not in the allowlist. Trust-api routes that surface
 * attestation rows MUST use this function, render `unknown_schema`
 * status for unknown ids, and never silently treat a `null`
 * resolution as a rendering-ready row.
 */
export function resolveSchemaName(schemaId: Hex): CanonicalSchemaName | null {
  return REVERSE.get(schemaId.toLowerCase() as Hex) ?? REVERSE.get(schemaId) ?? null;
}

/**
 * Compose a per-row schema descriptor for response payloads. Use
 * this to ensure the `{ schemaId, schemaName, status }` shape stays
 * consistent across every route that surfaces attestations.
 */
export interface SchemaRowDescriptor {
  schemaId: Hex;
  schemaName: CanonicalSchemaName | null;
  status: 'canonical' | 'unknown_schema';
}

export function describeSchemaId(schemaId: Hex): SchemaRowDescriptor {
  const name = resolveSchemaName(schemaId);
  return {
    schemaId,
    schemaName: name,
    status: name ? 'canonical' : 'unknown_schema',
  };
}
