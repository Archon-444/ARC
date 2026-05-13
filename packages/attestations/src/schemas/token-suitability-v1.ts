import { keccak256, stringToBytes, type Address } from 'viem';
import type { AttestationSchema } from '../types.js';

/**
 * token.suitability.v1 — DFSA Crypto Token framework-mapped
 *                        suitability attestation.
 *
 * Issued by counsel attesting that a specific token has been
 * assessed against DFSA's Crypto Token framework (effective Jan 12,
 * 2026). Pairs with `counsel.kyb.v1` for the entity-level review;
 * this one is per-token.
 *
 * Field shape mirrors the criteria the framework requires firms to
 * document:
 *   - token characteristics (supply, utility, governance)
 *   - regulatory status in other jurisdictions
 *   - market size + trading history
 *   - underlying technology
 *   - AML / sanctions exposure
 *   - whether use could impair DFSA-administered legislation
 *
 * COUNSEL-REVIEW DRAFT — the field set captures the shape; the
 * exact wording of each enum value and the canonical "supporting
 * evidence" CID rules will be locked by counsel before W12's
 * design-partner evidence object ships. Do not market signed
 * `token.suitability.v1` attestations as DFSA-recognized evidence
 * until that review lands.
 */

/** Outcome of the suitability review. */
export type TokenSuitabilityOutcome =
  | 'suitable'
  | 'suitable-with-conditions'
  | 'not-suitable'
  | 'requires-further-review';

export interface TokenSuitabilityBody {
  /** EVM address of the entity that proposes to deal in the token. */
  subject: Address;
  /** EVM address of the token contract being assessed. */
  token: Address;
  /** ISO date of the suitability review. */
  reviewedAt: string;
  /** ISO date of expiry; DFSA expects ongoing reassessment. */
  expiresAt: string;
  /** Outcome of the review. */
  outcome: TokenSuitabilityOutcome;
  /** Counsel's jurisdiction code: typically "DIFC" for DFSA-mapped reviews. */
  jurisdiction: string;
  /**
   * Score band 0..100 summarising the criteria below. Off-chain
   * consumers can render this as a UI badge without fetching the
   * report.
   */
  scoreBand: number;
  /**
   * DFSA Crypto Token framework criteria, captured as 0..100 bands.
   * Each band is the counsel's judgment for the criterion, NOT a
   * literal regulatory score. Keep these stable across signers so
   * aggregation works.
   */
  criteria: {
    characteristics: number;     // supply / utility / governance shape
    regulatoryStatus: number;    // status in other jurisdictions
    marketProfile: number;       // size + history + liquidity
    technology: number;          // contracts, audits, settlement guarantees
    amlSanctions: number;        // exposure to sanctions / mixers / illicit flows
    legislationImpact: number;   // could use impair DFSA-administered law?
  };
  /** EVM address of the counsel signer. */
  counsel: Address;
  /** IPFS CID of the full suitability report. */
  reportCid: string;
  /** keccak256 of canonical JSON of the report. */
  reportHash: `0x${string}`;
  /** Free-text notes (max 512 chars off-chain enforcement). */
  notes: string;
}

const NAME = 'token.suitability.v1';

export const tokenSuitabilityV1: AttestationSchema<TokenSuitabilityBody> = {
  name: NAME,
  version: '1',
  id: keccak256(stringToBytes(NAME)),
  types: {
    [NAME]: [
      { name: 'subject', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'reviewedAt', type: 'string' },
      { name: 'expiresAt', type: 'string' },
      { name: 'outcome', type: 'string' },
      { name: 'jurisdiction', type: 'string' },
      { name: 'scoreBand', type: 'uint8' },
      { name: 'criteria', type: 'TokenSuitabilityCriteria' },
      { name: 'counsel', type: 'address' },
      { name: 'reportCid', type: 'string' },
      { name: 'reportHash', type: 'bytes32' },
      { name: 'notes', type: 'string' },
    ],
    TokenSuitabilityCriteria: [
      { name: 'characteristics', type: 'uint8' },
      { name: 'regulatoryStatus', type: 'uint8' },
      { name: 'marketProfile', type: 'uint8' },
      { name: 'technology', type: 'uint8' },
      { name: 'amlSanctions', type: 'uint8' },
      { name: 'legislationImpact', type: 'uint8' },
    ],
  },
};
