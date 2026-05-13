import { keccak256, stringToBytes, type Address } from 'viem';
import type { AttestationSchema } from '../types.js';

/**
 * editorial.review.v1 — ARC editorial trust review.
 *
 * Issued by an ARC editorial signer summarizing the deep-tier trust
 * read commentary. Distinct from the v1 heuristic scoreV1 (which is
 * computed deterministically and not attested); this captures
 * editorial judgment on top of that — typically referenced by the
 * $0.05 trust-api deep tier when it ships.
 */

export interface EditorialReviewBody {
  subject: Address;
  reviewedAt: string;          // YYYY-MM-DD
  /** Editor's overall verdict: e.g. "low-risk", "elevated-risk", "do-not-engage". */
  verdict: string;
  /**
   * Editor's commentary digest. The full commentary is stored in
   * IPFS (cid + hash below); this is a 1-2 sentence summary that
   * fits in the attestation row for quick display.
   */
  summary: string;
  /** Composite score the editor associates with the verdict, [0, 100]. */
  scoreBand: number;
  /**
   * Reference scoreV1 composite this review was based on. Lets
   * consumers reconcile editor verdicts with the deterministic
   * heuristic. 0..100; 0 = unscored.
   */
  scoreV1Reference: number;
  /** EVM address of the editor signer. */
  editor: Address;
  /** IPFS CID of the full commentary body. */
  commentaryCid: string;
  /** keccak256 of canonical JSON of the commentary. */
  commentaryHash: `0x${string}`;
  /** Free-text notes (max 512 chars off-chain enforcement). */
  notes: string;
}

const NAME = 'editorial.review.v1';

export const editorialReviewV1: AttestationSchema<EditorialReviewBody> = {
  name: NAME,
  version: '1',
  id: keccak256(stringToBytes(NAME)),
  types: {
    [NAME]: [
      { name: 'subject', type: 'address' },
      { name: 'reviewedAt', type: 'string' },
      { name: 'verdict', type: 'string' },
      { name: 'summary', type: 'string' },
      { name: 'scoreBand', type: 'uint8' },
      { name: 'scoreV1Reference', type: 'uint8' },
      { name: 'editor', type: 'address' },
      { name: 'commentaryCid', type: 'string' },
      { name: 'commentaryHash', type: 'bytes32' },
      { name: 'notes', type: 'string' },
    ],
  },
};
