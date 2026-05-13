import { keccak256, stringToBytes, type Address } from 'viem';
import type { AttestationSchema } from '../types.js';

/**
 * stablecoin.reserves.v1 — ADGM FRT regime-mapped reserves
 *                          attestation.
 *
 * Issued by an independent auditor or reserve manager attesting to
 * the reserve composition of a stablecoin (typically a Foreign
 * Payment Token registered with CBUAE, e.g. USDU). Pairs with
 * `token.suitability.v1` when an institutional counterparty needs
 * both "the token is suitable" and "its reserves are real and well-
 * governed."
 *
 * Maps to ADGM's Fiat-Referenced Token framework criteria:
 *   - reserve composition + audit attestation
 *   - governance / control structure
 *   - disclosure cadence
 *   - prudential capital position
 *   - redemption rights + practical redemption flow
 *
 * COUNSEL-REVIEW DRAFT — same posture as token.suitability.v1. The
 * field set captures the shape; the canonical "supporting evidence"
 * cid rules and the exact `governanceModel` enum will be locked by
 * counsel before W12. Do not market signed `stablecoin.reserves.v1`
 * attestations as ADGM-recognized evidence until that review lands.
 */

export type StablecoinReservesOutcome =
  | 'in-compliance'
  | 'in-compliance-with-findings'
  | 'out-of-compliance'
  | 'preliminary';

export interface StablecoinReservesBody {
  /** EVM address of the stablecoin contract being attested about. */
  subject: Address;
  /** Human-readable ticker (e.g. "USDU"). */
  ticker: string;
  /** As-of date for the reserve snapshot (YYYY-MM-DD). */
  asOf: string;
  /** ISO date of the next required reassessment. */
  expiresAt: string;
  /** Outcome of the audit. */
  outcome: StablecoinReservesOutcome;
  /** Jurisdiction code: typically "ADGM" for FRT-mapped reviews. */
  jurisdiction: string;
  /**
   * Reserve composition + governance criteria. 0..100 bands per
   * criterion, summarising auditor judgement on top of the
   * underlying numerical breakdown that lives in the report.
   */
  criteria: {
    reserveQuality: number;       // tier-1 cash vs. T-bills vs. riskier instruments
    audit: number;                // independence + frequency + scope
    governance: number;           // control structure, segregation of duties
    disclosure: number;           // cadence + completeness of public disclosures
    prudential: number;           // capital buffer vs. circulating supply
    redemption: number;           // legal + operational redemption rights
  };
  /** Total reserves backing the stablecoin, in USDC base units (6 decimals). */
  reservesUsd: bigint;
  /** Circulating supply at as-of date, base units (use the stablecoin's own decimals). */
  circulatingSupply: bigint;
  /** Number of decimals on the subject stablecoin (for circulatingSupply scaling). */
  circulatingSupplyDecimals: number;
  /** EVM address of the auditor / reserve manager signer. */
  auditor: Address;
  /** IPFS CID of the full audit report. */
  reportCid: string;
  /** keccak256 of canonical JSON of the report. */
  reportHash: `0x${string}`;
  /** Free-text notes (max 512 chars off-chain enforcement). */
  notes: string;
}

const NAME = 'stablecoin.reserves.v1';

export const stablecoinReservesV1: AttestationSchema<StablecoinReservesBody> = {
  name: NAME,
  version: '1',
  id: keccak256(stringToBytes(NAME)),
  types: {
    [NAME]: [
      { name: 'subject', type: 'address' },
      { name: 'ticker', type: 'string' },
      { name: 'asOf', type: 'string' },
      { name: 'expiresAt', type: 'string' },
      { name: 'outcome', type: 'string' },
      { name: 'jurisdiction', type: 'string' },
      { name: 'criteria', type: 'StablecoinReservesCriteria' },
      { name: 'reservesUsd', type: 'uint256' },
      { name: 'circulatingSupply', type: 'uint256' },
      { name: 'circulatingSupplyDecimals', type: 'uint8' },
      { name: 'auditor', type: 'address' },
      { name: 'reportCid', type: 'string' },
      { name: 'reportHash', type: 'bytes32' },
      { name: 'notes', type: 'string' },
    ],
    StablecoinReservesCriteria: [
      { name: 'reserveQuality', type: 'uint8' },
      { name: 'audit', type: 'uint8' },
      { name: 'governance', type: 'uint8' },
      { name: 'disclosure', type: 'uint8' },
      { name: 'prudential', type: 'uint8' },
      { name: 'redemption', type: 'uint8' },
    ],
  },
};
