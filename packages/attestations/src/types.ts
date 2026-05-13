import type { Address, Hex } from 'viem';

/**
 * EIP-712 type definition shape. The keys are struct names; values
 * are the field tuples. viem accepts this shape directly in its
 * signTypedData / hashTypedData / verifyTypedData APIs.
 */
export type Eip712Types = Record<string, ReadonlyArray<{ name: string; type: string }>>;

/**
 * Schema descriptor — a canonical (typed-data shape, schemaId) pair.
 * The `id` is the bytes32 used on-chain by `AttestationRegistry.attest`
 * and `ArcPassport.attachCounselAttestation`. Computed once at module
 * load via `keccak256(name)` so off-chain code can pass it directly
 * without re-hashing.
 */
export interface AttestationSchema<TBody = unknown> {
  /** Canonical schema name. Used in the EIP-712 primaryType. */
  name: string;
  /** Schema version. Embedded in `name` already; surfaced separately for diagnostics. */
  version: string;
  /** Bytes32 id used by AttestationRegistry.schemaId. Derived as keccak256(name). */
  id: Hex;
  /** EIP-712 types record. Matches `name` as the primary struct. */
  types: Eip712Types;
  /** Phantom typing for the body shape; not used at runtime. */
  __body?: TBody;
}

/**
 * The EIP-712 domain ARC uses across all attestation schemas. Bound
 * to the deployed AttestationRegistry by the consumer at sign time.
 */
export interface AttestationDomain {
  name: 'ARC AttestationRegistry';
  version: '1';
  /** Chain id of the deployed registry — Arc testnet = 5042002. */
  chainId: number;
  /** Verifying contract = AttestationRegistry deployment address. */
  verifyingContract: Address;
}

/** Convenience constructor that fills the constant fields. */
export function makeAttestationDomain(opts: {
  chainId: number;
  verifyingContract: Address;
}): AttestationDomain {
  return {
    name: 'ARC AttestationRegistry',
    version: '1',
    chainId: opts.chainId,
    verifyingContract: opts.verifyingContract,
  };
}
