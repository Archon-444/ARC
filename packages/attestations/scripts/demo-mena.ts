/**
 * MENA design-partner evidence object composer (W12 acceptance gate).
 *
 * Composes the four attestations a MENA institutional counterparty
 * (DIFC / ADGM / DMCC-supervised firm; CBUAE-registered stablecoin
 * issuer) typically wants to see before transacting:
 *
 *   1. ArcPassport identity record (placeholder until W8 contracts are
 *      deployed on Arc testnet; the field shape matches what
 *      @arc/passport-sdk returns once the trust-api is reconfigured).
 *   2. counsel.kyb.v1     — counsel-led KYB outcome.
 *   3. token.suitability.v1 — DFSA Crypto Token framework-mapped
 *      per-token assessment.
 *   4. stablecoin.reserves.v1 — ADGM FRT regime-mapped reserves
 *      attestation. Skipped when the subject is not a stablecoin.
 *
 * For each attestation the script signs with a distinct viem
 * LocalAccount (counsel / treasury / auditor), re-runs
 * verifyAttestation() against the body + expected signer, and emits
 * the composed envelope to stdout. The envelope is exactly the JSON
 * a design-partner hands to their compliance team — it is the
 * shippable W12 artifact.
 *
 * No keys, no real network — everything is local signing + local
 * verification with deterministic test keys (anvil keys 0/1/2). The
 * resulting envelope has the same wire shape a production composition
 * would have.
 *
 * Run:
 *   npm --workspace @arc/attestations run demo:mena
 *   # or, with a custom subject + token:
 *   ARC_DEMO_SUBJECT=0x...20 ARC_DEMO_TOKEN=0x...20 \
 *     npm --workspace @arc/attestations run demo:mena
 *
 * To write the envelope to a file instead of stdout:
 *   npm --workspace @arc/attestations run demo:mena -- --out evidence.json
 */

import { writeFileSync } from 'fs';
import { keccak256, stringToBytes, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import {
  counselKybV1,
  editorialReviewV1,
  treasuryPolicyV1,
  tokenSuitabilityV1,
  stablecoinReservesV1,
  makeAttestationDomain,
  signAttestation,
  verifyAttestation,
  type AttestationDomain,
  type AttestationSchema,
  type SignedAttestation,
} from '../src/index.js';

// ────────────────────────────────────────────────────────────────────
//  Deterministic signers (anvil keys 0..3). Never funded on mainnet.
// ────────────────────────────────────────────────────────────────────

const COUNSEL_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const EDITOR_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const TREASURY_PK = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const AUDITOR_PK = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';

// Default subject + token (overridable via env).
const DEFAULT_SUBJECT = '0x1234567890abcdef1234567890abcdef12345678' as Address;
const DEFAULT_TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address; // USDC on Base
const DEFAULT_STABLECOIN = '0x4444444444444444444444444444444444444444' as Address;

const ATTESTATION_REGISTRY =
  (process.env.ARC_DEMO_REGISTRY as Address | undefined) ??
  ('0x0000000000000000000000000000000000000001' as Address);

interface DemoOptions {
  subject: Address;
  token: Address;
  stablecoin: Address | null; // null -> skip stablecoin.reserves.v1
  out: string | null;
}

function parseOptions(): DemoOptions {
  const out = process.argv.includes('--out')
    ? (process.argv[process.argv.indexOf('--out') + 1] ?? null)
    : null;
  const subject = (process.env.ARC_DEMO_SUBJECT as Address | undefined) ?? DEFAULT_SUBJECT;
  const token = (process.env.ARC_DEMO_TOKEN as Address | undefined) ?? DEFAULT_TOKEN;
  const stablecoinRaw = process.env.ARC_DEMO_STABLECOIN;
  const stablecoin =
    stablecoinRaw === 'none' ? null : (stablecoinRaw as Address | undefined) ?? DEFAULT_STABLECOIN;
  return { subject, token, stablecoin, out };
}

// ────────────────────────────────────────────────────────────────────
//  Body builders
// ────────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoPlusYear(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function counselKybBody(subject: Address, counsel: Address) {
  return {
    subject,
    reviewedAt: todayIso(),
    expiresAt: isoPlusYear(),
    outcome: 'counsel-led-kyb',
    jurisdiction: 'DIFC',
    counsel,
    reportCid: 'bafybeicid-counsel-report-demo',
    reportHash: keccak256(stringToBytes('counsel-report-bytes')) as `0x${string}`,
    notes: 'Subject is a DFSA-licensed VASP; treasury-only scope.',
  };
}

function editorialReviewBody(subject: Address, editor: Address) {
  return {
    subject,
    reviewedAt: todayIso(),
    verdict: 'low-risk',
    summary:
      'Editorial review: subject address is a known institutional treasury wallet; deep-tier verdict low-risk.',
    scoreBand: 82,
    scoreV1Reference: 78,
    editor,
    commentaryCid: 'bafybeicid-editorial-demo',
    commentaryHash: keccak256(stringToBytes('editorial-commentary')) as `0x${string}`,
    notes: 'Reviewed against W10 deep-tier criteria.',
  };
}

function treasuryPolicyBody(subject: Address, principal: Address) {
  return {
    subject,
    effectiveFrom: todayIso(),
    effectiveUntil: isoPlusYear(),
    perTxCeiling: 10_000_000_000n, // $10k USDC base units
    perDayCeiling: 100_000_000_000n, // $100k USDC base units
    jurisdiction: 'ADGM',
    principal,
    policyCid: 'bafybeicid-policy-demo',
    policyHash: keccak256(stringToBytes('policy-bytes')) as `0x${string}`,
    notes: 'Approved at the most recent treasury committee.',
  };
}

function tokenSuitabilityBody(subject: Address, token: Address, counsel: Address) {
  return {
    subject,
    token,
    reviewedAt: todayIso(),
    expiresAt: isoPlusYear(),
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
    counsel,
    reportCid: 'bafybeicid-token-suitability-demo',
    reportHash: keccak256(stringToBytes('token-suitability-report')) as `0x${string}`,
    notes: 'Suitable for institutional treasury custody; retail distribution out of scope.',
  };
}

function stablecoinReservesBody(stablecoin: Address, auditor: Address) {
  return {
    subject: stablecoin,
    ticker: 'USDU',
    asOf: todayIso(),
    expiresAt: isoPlusYear(),
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
    auditor,
    reportCid: 'bafybeicid-reserves-demo',
    reportHash: keccak256(stringToBytes('reserves-report')) as `0x${string}`,
    notes: 'Q1 audit; reserves exceed circulating supply ($1.05B vs $1.00B).',
  };
}

// ────────────────────────────────────────────────────────────────────
//  Pipeline
// ────────────────────────────────────────────────────────────────────

interface ComposedAttestation {
  schemaName: string;
  schemaId: `0x${string}`;
  signed: SignedAttestation<unknown>;
  verification: {
    ok: boolean;
    recoveredSigner: string;
    expectedSigner: string;
  };
}

async function compose<TBody>(
  schema: AttestationSchema<TBody>,
  domain: AttestationDomain,
  body: TBody,
  pk: `0x${string}`,
  expectedSigner: Address
): Promise<ComposedAttestation> {
  const account = privateKeyToAccount(pk);
  const signed = await signAttestation({ schema, domain, body, signer: account });
  const verification = await verifyAttestation({
    schema,
    domain,
    body,
    signature: signed.signature,
    expectedSigner,
  });
  if (!verification.ok) {
    throw new Error(
      `compose: ${schema.name} verification failed (reason=${verification.reason}, recovered=${verification.recoveredSigner})`
    );
  }
  return {
    schemaName: schema.name,
    schemaId: schema.id,
    signed: signed as SignedAttestation<unknown>,
    verification: {
      ok: verification.ok,
      recoveredSigner: verification.recoveredSigner,
      expectedSigner,
    },
  };
}

interface PassportPlaceholder {
  subject: Address;
  passportId: string | null;
  metadataURI: string | null;
  revoked: boolean;
  counselAttestation: `0x${string}` | null;
  source: 'placeholder' | 'on-chain';
  notice: string;
}

function passportPlaceholder(subject: Address): PassportPlaceholder {
  return {
    subject,
    passportId: null,
    metadataURI: null,
    revoked: false,
    counselAttestation: null,
    source: 'placeholder',
    notice:
      'ArcPassport is in tree at contracts/contracts/passport/ but not yet deployed to Arc testnet. ' +
      'Once deployed, this field carries the typed result from @arc/passport-sdk.getPassportBySubject().',
  };
}

async function main(): Promise<void> {
  const opts = parseOptions();
  const domain = makeAttestationDomain({
    chainId: 5042002, // Arc testnet
    verifyingContract: ATTESTATION_REGISTRY,
  });

  const counsel = privateKeyToAccount(COUNSEL_PK).address;
  const editor = privateKeyToAccount(EDITOR_PK).address;
  const treasury = privateKeyToAccount(TREASURY_PK).address;
  const auditor = privateKeyToAccount(AUDITOR_PK).address;

  // 1. Passport — placeholder.
  const passport = passportPlaceholder(opts.subject);

  // 2-5. Attestations.
  const attestations: ComposedAttestation[] = [];

  attestations.push(
    await compose(counselKybV1, domain, counselKybBody(opts.subject, counsel), COUNSEL_PK, counsel)
  );
  attestations.push(
    await compose(
      editorialReviewV1,
      domain,
      editorialReviewBody(opts.subject, editor),
      EDITOR_PK,
      editor
    )
  );
  attestations.push(
    await compose(
      treasuryPolicyV1,
      domain,
      treasuryPolicyBody(opts.subject, treasury),
      TREASURY_PK,
      treasury
    )
  );
  attestations.push(
    await compose(
      tokenSuitabilityV1,
      domain,
      tokenSuitabilityBody(opts.subject, opts.token, counsel),
      COUNSEL_PK,
      counsel
    )
  );
  if (opts.stablecoin) {
    attestations.push(
      await compose(
        stablecoinReservesV1,
        domain,
        stablecoinReservesBody(opts.stablecoin, auditor),
        AUDITOR_PK,
        auditor
      )
    );
  }

  const envelope = {
    kind: 'arc.evidence.mena.v1',
    composedAt: new Date().toISOString(),
    domain,
    subject: opts.subject,
    token: opts.token,
    stablecoin: opts.stablecoin,
    passport,
    attestations: attestations.map((a) => ({
      schemaName: a.schemaName,
      schemaId: a.schemaId,
      signed: jsonifyBigints(a.signed),
      verification: a.verification,
    })),
    summary: {
      attestationCount: attestations.length,
      allVerified: attestations.every((a) => a.verification.ok),
      schemasIncluded: attestations.map((a) => a.schemaName),
      passportOnChain: passport.source === 'on-chain',
    },
  };

  const serialized = JSON.stringify(envelope, null, 2);

  if (opts.out) {
    writeFileSync(opts.out, serialized + '\n');
    console.log(`Wrote MENA evidence envelope to ${opts.out}`);
    console.log(`  schemas: ${envelope.summary.schemasIncluded.join(', ')}`);
    console.log(`  all verified: ${envelope.summary.allVerified}`);
  } else {
    console.log(serialized);
  }
}

/** JSON.stringify can't serialise bigints; convert recursively to strings. */
function jsonifyBigints(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(jsonifyBigints);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = jsonifyBigints(v);
    }
    return out;
  }
  return value;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
