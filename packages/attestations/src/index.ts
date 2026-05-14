/**
 * @arc/attestations
 *
 * EIP-712 attestation schemas + sign/verify helpers for ARC's
 * AttestationRegistry. W9 ships three schemas:
 *
 *   - counsel.kyb.v1       (counsel-led KYB outcome)
 *   - editorial.review.v1  (ARC editorial verdict)
 *   - treasury.policy.v1   (treasury policy of record)
 *
 * MENA-mapped schemas land in W10:
 *   - token.suitability.v1   (DFSA Crypto Token framework)
 *   - stablecoin.reserves.v1 (ADGM FRT regime)
 *
 * Usage:
 *
 *   import {
 *     counselKybV1,
 *     makeAttestationDomain,
 *     signAttestation,
 *     verifyAttestation,
 *   } from '@arc/attestations';
 *   import { privateKeyToAccount } from 'viem/accounts';
 *
 *   const domain = makeAttestationDomain({
 *     chainId: 5042002,                            // Arc testnet
 *     verifyingContract: ATTESTATION_REGISTRY,
 *   });
 *
 *   const signed = await signAttestation({
 *     schema: counselKybV1,
 *     domain,
 *     body: { subject, reviewedAt, ... },
 *     signer: privateKeyToAccount(COUNSEL_PK),
 *   });
 *
 *   // Anchor on-chain:
 *   //   registry.attest(body.subject, signed.schemaId, signed.dataHash, expiry)
 *
 *   // Downstream verify:
 *   const result = await verifyAttestation({
 *     schema: counselKybV1,
 *     domain,
 *     body: bodyFromIpfs,
 *     signature: signed.signature,
 *     expectedSigner: onchain.signer,
 *   });
 *   if (!result.ok) {
 *     // signer mismatch or bad signature; refuse to render
 *   }
 *   if (result.dataHash !== onchain.dataHash) {
 *     // body in IPFS has been swapped since on-chain anchoring
 *   }
 */

export * from './types.js';
export * from './sign.js';
export * from './verify.js';
export * from './validate.js';

export { counselKybV1 } from './schemas/counsel-kyb-v1.js';
export type { CounselKybBody } from './schemas/counsel-kyb-v1.js';

export { editorialReviewV1 } from './schemas/editorial-review-v1.js';
export type { EditorialReviewBody } from './schemas/editorial-review-v1.js';

export { treasuryPolicyV1 } from './schemas/treasury-policy-v1.js';
export type { TreasuryPolicyBody } from './schemas/treasury-policy-v1.js';

export { tokenSuitabilityV1 } from './schemas/token-suitability-v1.js';
export type {
  TokenSuitabilityBody,
  TokenSuitabilityOutcome,
} from './schemas/token-suitability-v1.js';

export { stablecoinReservesV1 } from './schemas/stablecoin-reserves-v1.js';
export type {
  StablecoinReservesBody,
  StablecoinReservesOutcome,
} from './schemas/stablecoin-reserves-v1.js';
