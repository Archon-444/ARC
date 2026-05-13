import { keccak256, stringToBytes, type Address } from 'viem';
import type { AttestationSchema } from '../types.js';

/**
 * treasury.policy.v1 — institutional treasury-policy attestation.
 *
 * Issued by a treasury function (CFO / corporate treasury / fund
 * admin) attesting to the policy under which `subject` may
 * autonomously transact. Designed for the MENA institutional vertical
 * where a regulated entity needs to publish "this agent may move up
 * to N USDC per day to addresses on the approved list."
 *
 * On-chain: only the digest is anchored. The approved-counterparty
 * list, signatures of multiple treasury principals, and any internal
 * controls reference numbers stay in IPFS/S3.
 */

export interface TreasuryPolicyBody {
  /** EVM address of the agent / wallet the policy applies to. */
  subject: Address;
  effectiveFrom: string;       // YYYY-MM-DD
  effectiveUntil: string;      // YYYY-MM-DD
  /**
   * Per-tx ceiling in USDC base units (6 decimals). 0 = no ceiling
   * (use carefully; intended for read-only "policy-of-record"
   * attestations where the operational ceiling is enforced by the
   * agent's wallet runtime, not by the attestation).
   */
  perTxCeiling: bigint;
  /** Per-day ceiling, USDC base units. 0 = no ceiling. */
  perDayCeiling: bigint;
  /** Jurisdiction code under which the policy was approved. */
  jurisdiction: string;
  /**
   * EVM address of the treasury principal who signed. The body in
   * IPFS may carry multiple co-signer signatures; this field is the
   * lead signer.
   */
  principal: Address;
  /** IPFS CID of the full policy document. */
  policyCid: string;
  /** keccak256 of canonical JSON of the policy. */
  policyHash: `0x${string}`;
  /** Free-text notes (max 512 chars off-chain enforcement). */
  notes: string;
}

const NAME = 'treasury.policy.v1';

export const treasuryPolicyV1: AttestationSchema<TreasuryPolicyBody> = {
  name: NAME,
  version: '1',
  id: keccak256(stringToBytes(NAME)),
  types: {
    [NAME]: [
      { name: 'subject', type: 'address' },
      { name: 'effectiveFrom', type: 'string' },
      { name: 'effectiveUntil', type: 'string' },
      { name: 'perTxCeiling', type: 'uint256' },
      { name: 'perDayCeiling', type: 'uint256' },
      { name: 'jurisdiction', type: 'string' },
      { name: 'principal', type: 'address' },
      { name: 'policyCid', type: 'string' },
      { name: 'policyHash', type: 'bytes32' },
      { name: 'notes', type: 'string' },
    ],
  },
};
