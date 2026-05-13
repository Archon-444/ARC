/**
 * Round-trip tests for @arc/attestations.
 *
 * For each of the three W9 schemas:
 *   1. Build a representative body.
 *   2. signAttestation() with a viem LocalAccount.
 *   3. Compute dataHash + signature.
 *   4. verifyAttestation() against the original body + expected signer
 *      -> ok=true, recovered signer matches.
 *   5. Tamper with the body -> dataHash changes; verify returns
 *      signer-mismatch (the signature recovers a different address
 *      against the mutated typed data).
 *   6. Verify against a wrong expectedSigner -> ok=false reason
 *      'signer-mismatch'.
 *
 * Plus structural checks:
 *   - schemaId === keccak256(stringToBytes(name)) for all three.
 *   - makeAttestationDomain returns the canonical name/version
 *     constants the contract pairs with.
 */

import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, stringToBytes, type Address, type Hex } from 'viem';

import {
  counselKybV1,
  editorialReviewV1,
  treasuryPolicyV1,
  makeAttestationDomain,
  signAttestation,
  verifyAttestation,
  type CounselKybBody,
  type EditorialReviewBody,
  type TreasuryPolicyBody,
  type AttestationSchema,
} from '../src/index.js';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}
function assertEq<T>(actual: T, expected: T, msg: string): void {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const COUNSEL_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const COUNSEL_ADDR = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Address;

const EDITOR_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const EDITOR_ADDR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as Address;

const TREASURY_PK = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const TREASURY_ADDR = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as Address;

const SUBJECT = '0x1234567890abcdef1234567890abcdef12345678' as Address;
const ATTESTATION_REGISTRY = '0x2222222222222222222222222222222222222222' as Address;

const domain = makeAttestationDomain({
  chainId: 5042002,
  verifyingContract: ATTESTATION_REGISTRY,
});

function counselBody(): CounselKybBody {
  return {
    subject: SUBJECT,
    reviewedAt: '2026-01-12',
    expiresAt: '2027-01-12',
    outcome: 'counsel-led-kyb',
    jurisdiction: 'DIFC',
    counsel: COUNSEL_ADDR,
    reportCid: 'bafybeicid-counsel-report',
    reportHash: keccak256(stringToBytes('counsel-report-bytes')) as `0x${string}`,
    notes: 'Subject is a DFSA-licensed VASP; treasury-only scope.',
  };
}

function editorialBody(): EditorialReviewBody {
  return {
    subject: SUBJECT,
    reviewedAt: '2026-05-13',
    verdict: 'low-risk',
    summary: 'Address is a known institutional treasury wallet; deep tier verdict low-risk.',
    scoreBand: 82,
    scoreV1Reference: 78,
    editor: EDITOR_ADDR,
    commentaryCid: 'bafybeicid-editorial',
    commentaryHash: keccak256(stringToBytes('editorial-commentary')) as `0x${string}`,
    notes: 'Reviewed against W10 deep-tier criteria.',
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
    principal: TREASURY_ADDR,
    policyCid: 'bafybeicid-policy',
    policyHash: keccak256(stringToBytes('policy-bytes')) as `0x${string}`,
    notes: 'Approved at the May 2026 treasury committee.',
  };
}

interface RoundTripCase<TBody> {
  label: string;
  schema: AttestationSchema<TBody>;
  pk: Hex;
  expectedSigner: Address;
  body: TBody;
  tamper: (b: TBody) => TBody;
}

async function runRoundTrip<TBody>(c: RoundTripCase<TBody>): Promise<void> {
  const account = privateKeyToAccount(c.pk);

  // 1. schemaId === keccak256(name)
  const expectedId = keccak256(stringToBytes(c.schema.name));
  assertEq(c.schema.id, expectedId, `${c.label}: schemaId derivation`);

  // 2. Sign happy path.
  const signed = await signAttestation({
    schema: c.schema,
    domain,
    body: c.body,
    signer: account,
  });
  assert(signed.dataHash.startsWith('0x'), `${c.label}: dataHash hex`);
  assert(signed.signature.startsWith('0x'), `${c.label}: signature hex`);
  assertEq(
    signed.signer.toLowerCase(),
    c.expectedSigner.toLowerCase(),
    `${c.label}: signer field matches expected`
  );

  // 3. Verify happy path.
  const ok = await verifyAttestation({
    schema: c.schema,
    domain,
    body: c.body,
    signature: signed.signature,
    expectedSigner: c.expectedSigner,
  });
  assert(ok.ok, `${c.label}: verify happy path ok=true`);
  assertEq(ok.dataHash, signed.dataHash, `${c.label}: recomputed dataHash matches signed dataHash`);

  // 4. Tampered body -> dataHash diverges, verify fails.
  const tampered = c.tamper(c.body);
  const bad = await verifyAttestation({
    schema: c.schema,
    domain,
    body: tampered,
    signature: signed.signature,
    expectedSigner: c.expectedSigner,
  });
  assert(!bad.ok, `${c.label}: tampered body verify fails`);
  assert(bad.dataHash !== signed.dataHash, `${c.label}: tampered dataHash differs`);
  assertEq(bad.reason, 'signer-mismatch', `${c.label}: tamper reason is signer-mismatch`);

  // 5. Wrong expected signer.
  const wrong = await verifyAttestation({
    schema: c.schema,
    domain,
    body: c.body,
    signature: signed.signature,
    expectedSigner: '0x0000000000000000000000000000000000000abc' as Address,
  });
  assert(!wrong.ok, `${c.label}: wrong expectedSigner -> ok=false`);
  assertEq(wrong.reason, 'signer-mismatch', `${c.label}: wrong-signer reason`);

  console.log(`  [${c.label}] sign + verify + tamper-detect + wrong-signer-detect OK`);
}

async function testStructure(): Promise<void> {
  const d = makeAttestationDomain({
    chainId: 5042002,
    verifyingContract: ATTESTATION_REGISTRY,
  });
  assertEq(d.name, 'ARC AttestationRegistry', 'domain.name constant');
  assertEq(d.version, '1', 'domain.version constant');
  assertEq(d.chainId, 5042002, 'domain.chainId');
  assertEq(d.verifyingContract, ATTESTATION_REGISTRY, 'domain.verifyingContract');
  console.log('  [domain] constants match the AttestationRegistry EIP-712 domain shape');
}

async function main(): Promise<void> {
  await testStructure();

  await runRoundTrip<CounselKybBody>({
    label: 'counsel.kyb.v1',
    schema: counselKybV1,
    pk: COUNSEL_PK,
    expectedSigner: COUNSEL_ADDR,
    body: counselBody(),
    tamper: (b) => ({ ...b, outcome: 'counsel-led-kyb-renewal' }),
  });

  await runRoundTrip<EditorialReviewBody>({
    label: 'editorial.review.v1',
    schema: editorialReviewV1,
    pk: EDITOR_PK,
    expectedSigner: EDITOR_ADDR,
    body: editorialBody(),
    tamper: (b) => ({ ...b, scoreBand: 1 }),
  });

  await runRoundTrip<TreasuryPolicyBody>({
    label: 'treasury.policy.v1',
    schema: treasuryPolicyV1,
    pk: TREASURY_PK,
    expectedSigner: TREASURY_ADDR,
    body: treasuryBody(),
    tamper: (b) => ({ ...b, perDayCeiling: 1n }),
  });

  console.log('attestations OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
