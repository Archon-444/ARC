/**
 * Body-validator tests for @arc/attestations.
 *
 * For each of the five schemas: happy-path body passes; a targeted
 * tampered/out-of-range body fails with the documented `path` +
 * `reason`. Also verifies that signAttestation throws
 * AttestationValidationError when a validator is supplied and the
 * body is bad, but skips validation entirely when no validator is
 * supplied (preserving the W9 round-trip test's call shape).
 */

import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, stringToBytes, type Address } from 'viem';

import {
  counselKybV1,
  editorialReviewV1,
  treasuryPolicyV1,
  tokenSuitabilityV1,
  stablecoinReservesV1,
  makeAttestationDomain,
  signAttestation,
  validateCounselKybBody,
  validateEditorialReviewBody,
  validateTreasuryPolicyBody,
  validateTokenSuitabilityBody,
  validateStablecoinReservesBody,
  AttestationValidationError,
  type CounselKybBody,
  type EditorialReviewBody,
  type TreasuryPolicyBody,
  type TokenSuitabilityBody,
  type StablecoinReservesBody,
} from '../src/index.js';

// ──────────────────────────────────────────────────────────────────────
//  Bench helpers
// ──────────────────────────────────────────────────────────────────────

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}
function assertHasIssue(
  res: { ok: boolean; issues?: Array<{ path: string; reason: string }> },
  path: string,
  reasonFragment: string,
  msg: string
): void {
  assert(!res.ok, `${msg}: expected validation failure but got ok`);
  const hit = (res.issues ?? []).find(
    (i) => i.path === path && i.reason.includes(reasonFragment)
  );
  if (!hit) {
    throw new Error(
      `${msg}: expected issue path=${path}, reason~"${reasonFragment}"; got ` +
        JSON.stringify(res.issues)
    );
  }
}

const SUBJECT = '0x1234567890abcdef1234567890abcdef12345678' as Address;
const TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const STABLECOIN = '0x4444444444444444444444444444444444444444' as Address;
const COUNSEL = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Address;
const EDITOR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as Address;
const TREASURY = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as Address;
const AUDITOR = '0x90F79bf6EB2c4f870365E785982E1f101E93b906' as Address;
const ANVIL_KEY0 = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

function counselBody(): CounselKybBody {
  return {
    subject: SUBJECT,
    reviewedAt: '2026-01-12',
    expiresAt: '2027-01-12',
    outcome: 'counsel-led-kyb',
    jurisdiction: 'DIFC',
    counsel: COUNSEL,
    reportCid: 'bafybeicid-counsel',
    reportHash: keccak256(stringToBytes('counsel-report')) as `0x${string}`,
    notes: 'Treasury-only scope.',
  };
}
function editorialBody(): EditorialReviewBody {
  return {
    subject: SUBJECT,
    reviewedAt: '2026-05-13',
    verdict: 'low-risk',
    summary: 'Editorial verdict.',
    scoreBand: 82,
    scoreV1Reference: 78,
    editor: EDITOR,
    commentaryCid: 'bafybeicid-editorial',
    commentaryHash: keccak256(stringToBytes('editorial')) as `0x${string}`,
    notes: 'Reviewed.',
  };
}
function treasuryBody(): TreasuryPolicyBody {
  return {
    subject: SUBJECT,
    effectiveFrom: '2026-04-01',
    effectiveUntil: '2026-12-31',
    perTxCeiling: 10_000_000_000n,
    perDayCeiling: 100_000_000_000n,
    jurisdiction: 'ADGM',
    principal: TREASURY,
    policyCid: 'bafybeicid-policy',
    policyHash: keccak256(stringToBytes('policy')) as `0x${string}`,
    notes: 'Approved.',
  };
}
function tokenSuitabilityBody(): TokenSuitabilityBody {
  return {
    subject: SUBJECT,
    token: TOKEN,
    reviewedAt: '2026-01-12',
    expiresAt: '2027-01-12',
    outcome: 'suitable-with-conditions',
    jurisdiction: 'DIFC',
    scoreBand: 72,
    criteria: {
      characteristics: 80,
      regulatoryStatus: 65,
      marketProfile: 78,
      technology: 85,
      amlSanctions: 60,
      legislationImpact: 70,
    },
    counsel: COUNSEL,
    reportCid: 'bafybeicid-suitability',
    reportHash: keccak256(stringToBytes('suitability')) as `0x${string}`,
    notes: 'Suitable for institutional treasury custody.',
  };
}
function stablecoinReservesBody(): StablecoinReservesBody {
  return {
    subject: STABLECOIN,
    ticker: 'USDU',
    asOf: '2026-04-30',
    expiresAt: '2026-07-31',
    outcome: 'in-compliance',
    jurisdiction: 'ADGM',
    criteria: {
      reserveQuality: 95,
      audit: 90,
      governance: 85,
      disclosure: 88,
      prudential: 92,
      redemption: 80,
    },
    reservesUsd: 1_050_000_000_000n,
    circulatingSupply: 1_000_000_000_000n,
    circulatingSupplyDecimals: 6,
    auditor: AUDITOR,
    reportCid: 'bafybeicid-reserves',
    reportHash: keccak256(stringToBytes('reserves')) as `0x${string}`,
    notes: 'Audit.',
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // counsel.kyb.v1 ─────────────────────────────────────────────────────
  let r1 = validateCounselKybBody(counselBody());
  assert(r1.ok, 'counsel.kyb.v1 happy path');
  console.log('  [counsel.kyb.v1] happy path OK');

  r1 = validateCounselKybBody({ ...counselBody(), subject: '0xZZ' });
  assertHasIssue(r1, 'subject', '40-hex', 'counsel.kyb.v1 invalid subject');

  r1 = validateCounselKybBody({
    ...counselBody(),
    reviewedAt: '2027-01-13',
    expiresAt: '2027-01-12',
  });
  assertHasIssue(
    r1,
    'expiresAt',
    'after',
    'counsel.kyb.v1 expiresAt must be after reviewedAt'
  );

  r1 = validateCounselKybBody({ ...counselBody(), outcome: 'unknown-outcome' });
  assertHasIssue(r1, 'outcome', 'must be one of', 'counsel.kyb.v1 outcome enum');

  r1 = validateCounselKybBody({ ...counselBody(), notes: 'x'.repeat(513) });
  assertHasIssue(r1, 'notes', 'max length', 'counsel.kyb.v1 notes too long');
  console.log('  [counsel.kyb.v1] 4 failure paths OK');

  // editorial.review.v1 ────────────────────────────────────────────────
  let r2 = validateEditorialReviewBody(editorialBody());
  assert(r2.ok, 'editorial.review.v1 happy path');

  r2 = validateEditorialReviewBody({ ...editorialBody(), verdict: 'maybe-ok' });
  assertHasIssue(r2, 'verdict', 'must be one of', 'editorial.review.v1 verdict enum');

  r2 = validateEditorialReviewBody({ ...editorialBody(), scoreBand: 150 });
  assertHasIssue(r2, 'scoreBand', 'out of range', 'editorial.review.v1 scoreBand range');

  r2 = validateEditorialReviewBody({ ...editorialBody(), scoreV1Reference: -1 });
  assertHasIssue(
    r2,
    'scoreV1Reference',
    'out of range',
    'editorial.review.v1 scoreV1Reference range'
  );
  console.log('  [editorial.review.v1] happy + 3 failure paths OK');

  // treasury.policy.v1 ─────────────────────────────────────────────────
  let r3 = validateTreasuryPolicyBody(treasuryBody());
  assert(r3.ok, 'treasury.policy.v1 happy path');

  r3 = validateTreasuryPolicyBody({
    ...treasuryBody(),
    perTxCeiling: 1_000_000_000_000n, // > perDayCeiling
  });
  assertHasIssue(
    r3,
    'perTxCeiling',
    'cannot exceed perDayCeiling',
    'treasury.policy.v1 perTx > perDay'
  );

  r3 = validateTreasuryPolicyBody({
    ...treasuryBody(),
    perTxCeiling: -1n,
  });
  assertHasIssue(r3, 'perTxCeiling', 'non-negative', 'treasury.policy.v1 negative bigint');

  r3 = validateTreasuryPolicyBody({
    ...treasuryBody(),
    perDayCeiling: 0n, // 0 = no ceiling; perTxCeiling should be allowed any value
    perTxCeiling: 999_999_999_999n,
  });
  assert(r3.ok, 'treasury.policy.v1 perDay=0 (no ceiling) allows any perTx');
  console.log('  [treasury.policy.v1] happy + 2 failure + 1 sentinel-zero OK');

  // token.suitability.v1 ───────────────────────────────────────────────
  let r4 = validateTokenSuitabilityBody(tokenSuitabilityBody());
  assert(r4.ok, 'token.suitability.v1 happy path');

  r4 = validateTokenSuitabilityBody({
    ...tokenSuitabilityBody(),
    criteria: { ...tokenSuitabilityBody().criteria, amlSanctions: 200 },
  });
  assertHasIssue(
    r4,
    'criteria.amlSanctions',
    'out of range',
    'token.suitability.v1 nested band out of range'
  );

  r4 = validateTokenSuitabilityBody({ ...tokenSuitabilityBody(), token: '0xZZ' });
  assertHasIssue(r4, 'token', '40-hex', 'token.suitability.v1 token address');

  r4 = validateTokenSuitabilityBody({
    ...tokenSuitabilityBody(),
    outcome: 'fine-i-guess',
  });
  assertHasIssue(r4, 'outcome', 'must be one of', 'token.suitability.v1 outcome enum');
  console.log('  [token.suitability.v1] happy + 3 failure paths (including nested) OK');

  // stablecoin.reserves.v1 ─────────────────────────────────────────────
  let r5 = validateStablecoinReservesBody(stablecoinReservesBody());
  assert(r5.ok, 'stablecoin.reserves.v1 happy path');

  r5 = validateStablecoinReservesBody({
    ...stablecoinReservesBody(),
    expiresAt: '2026-04-29', // before asOf
  });
  assertHasIssue(
    r5,
    'expiresAt',
    'after',
    'stablecoin.reserves.v1 expiresAt must be after asOf'
  );

  r5 = validateStablecoinReservesBody({
    ...stablecoinReservesBody(),
    reservesUsd: -1n,
  });
  assertHasIssue(r5, 'reservesUsd', 'non-negative', 'stablecoin.reserves.v1 negative reserves');

  r5 = validateStablecoinReservesBody({
    ...stablecoinReservesBody(),
    circulatingSupplyDecimals: 300,
  });
  assertHasIssue(
    r5,
    'circulatingSupplyDecimals',
    'out of range',
    'stablecoin.reserves.v1 decimals out of uint8'
  );
  console.log('  [stablecoin.reserves.v1] happy + 3 failure paths OK');

  // signAttestation wiring ─────────────────────────────────────────────
  const account = privateKeyToAccount(ANVIL_KEY0);
  const domain = makeAttestationDomain({
    chainId: 5042002,
    verifyingContract: '0x0000000000000000000000000000000000000001' as Address,
  });

  // Without validator: bad body signs cleanly (W9 invariant).
  const bad = { ...tokenSuitabilityBody(), scoreBand: 200 };
  const signedAnyway = await signAttestation({
    schema: tokenSuitabilityV1,
    domain,
    body: bad,
    signer: account,
  });
  assert(signedAnyway.signature.startsWith('0x'), 'no-validator path still signs');
  console.log('  [signAttestation no-validator] signs even when scoreBand=200');

  // With validator: same bad body throws AttestationValidationError.
  let threw = false;
  try {
    await signAttestation({
      schema: tokenSuitabilityV1,
      domain,
      body: bad,
      signer: account,
      validator: validateTokenSuitabilityBody,
    });
  } catch (err) {
    if (err instanceof AttestationValidationError) {
      threw = true;
      assert(
        err.schemaName === 'token.suitability.v1',
        'AttestationValidationError carries schemaName'
      );
      assert(err.issues.length > 0, 'AttestationValidationError carries issues array');
      assert(
        err.issues.some((i) => i.path === 'scoreBand' && i.reason.includes('out of range')),
        'AttestationValidationError surfaces the specific issue'
      );
    }
  }
  assert(threw, '[signAttestation validator] throws on bad body');
  console.log(
    '  [signAttestation validator] throws AttestationValidationError with structured issues[]'
  );

  console.log('validate OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
