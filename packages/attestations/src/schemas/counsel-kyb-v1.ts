import { keccak256, stringToBytes, type Address } from 'viem';
import type { AttestationSchema } from '../types.js';

/**
 * counsel.kyb.v1 — counsel-led KYB attestation.
 *
 * Issued by a regulated counsel (DIFC / ADGM / equivalent) attesting
 * to a subject's KYB outcome. Body fields are designed to map onto
 * what an institutional counterparty's compliance team needs to see
 * without exposing PII on-chain.
 *
 * The on-chain dataHash is the EIP-712 digest of CounselKyb. The full
 * body lives in IPFS/S3, fetched by trust-api consumers and verified
 * against the on-chain dataHash + signer.
 */

export interface CounselKybBody {
  /** EVM address of the entity being KYBed. */
  subject: Address;
  /** ISO date of when counsel completed the review (YYYY-MM-DD). */
  reviewedAt: string;
  /** ISO date of expiry; counsel reviews lapse. */
  expiresAt: string;
  /** "counsel-led-kyb" | "self-attested-rejected" | "counsel-led-kyb-renewal". */
  outcome: string;
  /** Counsel's jurisdiction code: e.g. "DIFC", "ADGM", "DMCC". */
  jurisdiction: string;
  /**
   * EVM address of the counsel signer. Distinct from the on-chain
   * msg.sender so a counsel firm can use a hot signing wallet while
   * the firm identity is established by the bodyAddress.
   */
  counsel: Address;
  /** IPFS CID pointing to the full counsel report (encrypted at rest). */
  reportCid: string;
  /**
   * keccak256 of the canonical JSON of the counsel report stored in
   * IPFS. Lets downstream code verify the cid resolves to the exact
   * bytes the signer attested to.
   */
  reportHash: `0x${string}`;
  /**
   * Free-text notes (e.g. "subject is a DFSA-licensed VASP";
   * "out-of-scope for retail consumer products"). Max 512 chars
   * enforced by off-chain validation (the contract does not see
   * this field).
   */
  notes: string;
}

const NAME = 'counsel.kyb.v1';

export const counselKybV1: AttestationSchema<CounselKybBody> = {
  name: NAME,
  version: '1',
  id: keccak256(stringToBytes(NAME)),
  types: {
    [NAME]: [
      { name: 'subject', type: 'address' },
      { name: 'reviewedAt', type: 'string' },
      { name: 'expiresAt', type: 'string' },
      { name: 'outcome', type: 'string' },
      { name: 'jurisdiction', type: 'string' },
      { name: 'counsel', type: 'address' },
      { name: 'reportCid', type: 'string' },
      { name: 'reportHash', type: 'bytes32' },
      { name: 'notes', type: 'string' },
    ],
  },
};
