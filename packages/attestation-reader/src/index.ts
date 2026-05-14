/**
 * @arc/attestation-reader
 *
 * Read-only client for AttestationRegistry on Arc testnet. Mirrors
 * @arc/passport-sdk's shape so trust-api / indexers consume a
 * single typed surface instead of re-deriving the contract ABI per
 * caller.
 *
 * Usage (server-side):
 *
 *   import { createPublicClient, http } from 'viem';
 *   import { ArcAttestationReader, ARC_TESTNET } from '@arc/attestation-reader';
 *
 *   const publicClient = createPublicClient({
 *     chain: ARC_TESTNET,
 *     transport: http(),
 *   });
 *   const reader = new ArcAttestationReader({
 *     address: ATTESTATION_REGISTRY_ADDRESS,
 *     publicClient,
 *   });
 *
 *   const ids = await reader.listAttestationIds(subject, schemaId);
 *   const records = await Promise.all(ids.map((id) => reader.getAttestation(id)));
 *   const usable = records.filter((r) => r && r.revoked === false);
 *
 * No write paths. Production attestation creation goes through
 * @arc/attestations (sign + validate) + the operator's signer
 * wallet directly against the contract.
 */

import type { Address, Hex, PublicClient } from 'viem';
import { defineChain } from 'viem';

import { ATTESTATION_REGISTRY_ABI } from './abi.js';

export { ATTESTATION_REGISTRY_ABI } from './abi.js';

/** Arc testnet chain definition. Mirrors @arc/passport-sdk. */
export const ARC_TESTNET = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

export interface ArcAttestationReaderOptions {
  /** Deployed AttestationRegistry address. */
  address: Address;
  /** viem PublicClient. Required. */
  publicClient: PublicClient;
}

/**
 * Decoded on-chain attestation record. Shape mirrors the contract's
 * `Attestation` struct (subject, schemaId, dataHash, expiry,
 * createdAt, signer, revoked) plus the `id` the caller used to fetch
 * it -- useful when downstream code passes the record around.
 */
export interface AttestationRecord {
  id: Hex;
  subject: Address;
  schemaId: Hex;
  dataHash: Hex;
  expiry: bigint;
  createdAt: bigint;
  signer: Address;
  revoked: boolean;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export class ArcAttestationReader {
  private readonly address: Address;
  private readonly publicClient: PublicClient;

  constructor(opts: ArcAttestationReaderOptions) {
    this.address = opts.address;
    this.publicClient = opts.publicClient;
  }

  /**
   * Read an attestation by id. Returns null when the id has never
   * been issued (subject === 0x0). A revoked record still resolves;
   * check the `revoked` flag (or use `isValid()` for the composite
   * "renderable right now" check).
   */
  async getAttestation(id: Hex): Promise<AttestationRecord | null> {
    const tuple = (await this.publicClient.readContract({
      address: this.address,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'getAttestation',
      args: [id],
    })) as {
      subject: Address;
      schemaId: Hex;
      dataHash: Hex;
      expiry: bigint;
      createdAt: bigint;
      signer: Address;
      revoked: boolean;
    };
    if (tuple.subject === ZERO_ADDRESS) return null;
    return {
      id,
      subject: tuple.subject,
      schemaId: tuple.schemaId,
      dataHash: tuple.dataHash,
      expiry: tuple.expiry,
      createdAt: tuple.createdAt,
      signer: tuple.signer,
      revoked: tuple.revoked,
    };
  }

  /**
   * Composite "renderable right now" check. True only if the record
   * exists, has not been revoked, and (expiry == 0 OR expiry >
   * block.timestamp). Matches the contract's `isValid()` semantics.
   */
  async isValid(id: Hex): Promise<boolean> {
    return (await this.publicClient.readContract({
      address: this.address,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'isValid',
      args: [id],
    })) as boolean;
  }

  /** Number of attestations indexed for `(subject, schemaId)`. */
  async attestationCount(subject: Address, schemaId: Hex): Promise<bigint> {
    return (await this.publicClient.readContract({
      address: this.address,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'attestationCount',
      args: [subject, schemaId],
    })) as bigint;
  }

  /**
   * Read the i-th attestation id for `(subject, schemaId)`. Reverts
   * on out-of-bounds; callers should compare `index` to
   * `attestationCount(subject, schemaId)` first.
   */
  async attestationAt(subject: Address, schemaId: Hex, index: bigint): Promise<Hex> {
    return (await this.publicClient.readContract({
      address: this.address,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'attestationAt',
      args: [subject, schemaId, index],
    })) as Hex;
  }

  /**
   * Convenience: walk `attestationCount` + `attestationAt` to get the
   * full list of attestation ids for `(subject, schemaId)`. Returns
   * an empty array when no entries exist. One RPC call for count plus
   * N parallel calls for the ids; trust-api wraps this with its own
   * `Promise.all(reader.getAttestation(...))` to materialise records.
   */
  async listAttestationIds(subject: Address, schemaId: Hex): Promise<Hex[]> {
    const count = await this.attestationCount(subject, schemaId);
    if (count === 0n) return [];
    const indices: bigint[] = [];
    for (let i = 0n; i < count; i++) indices.push(i);
    return Promise.all(indices.map((i) => this.attestationAt(subject, schemaId, i)));
  }

  /**
   * Convenience: list + fetch + filter to non-revoked records. Useful
   * shape for trust-api's per-schema rendering: most consumers want
   * "current attestations" not "every record ever anchored." A caller
   * who needs revoked history filters server-side.
   */
  async listCurrentAttestations(
    subject: Address,
    schemaId: Hex
  ): Promise<AttestationRecord[]> {
    const ids = await this.listAttestationIds(subject, schemaId);
    if (ids.length === 0) return [];
    const records = await Promise.all(ids.map((id) => this.getAttestation(id)));
    return records.filter((r): r is AttestationRecord => r !== null && !r.revoked);
  }
}
