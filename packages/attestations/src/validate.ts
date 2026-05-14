/**
 * Body-shape validators for the five W9/W10 attestation schemas.
 *
 * The schemas encode several fields as `uint8` in EIP-712 (scoreBand,
 * the six `criteria` bands on the MENA-mapped pair, etc.), but viem's
 * typed-data signer happily signs values outside 0..100 — the
 * resulting envelope is cryptographically valid yet semantically
 * meaningless. Production signing through trust-api / the demo-mena
 * composer MUST validate before signing.
 *
 * Posture:
 *   - Validators return a discriminated-union ValidationResult<T>
 *     rather than throwing, so callers can render structured error
 *     states.
 *   - signAttestation() carries an optional `validator?` hook
 *     (see ./sign.ts) — when provided, validation runs before signing
 *     and throws AttestationValidationError on failure, preserving
 *     the `issues[]` array for the caller's error renderer.
 *   - Demo-mena pipes each body through its matching validator
 *     before composing the envelope.
 */

import type { Address } from 'viem';

import type { CounselKybBody } from './schemas/counsel-kyb-v1.js';
import type { EditorialReviewBody } from './schemas/editorial-review-v1.js';
import type { TreasuryPolicyBody } from './schemas/treasury-policy-v1.js';
import type {
  TokenSuitabilityBody,
  TokenSuitabilityOutcome,
} from './schemas/token-suitability-v1.js';
import type {
  StablecoinReservesBody,
  StablecoinReservesOutcome,
} from './schemas/stablecoin-reserves-v1.js';

export interface ValidationIssue {
  /** Dotted path to the offending field (e.g. "criteria.amlSanctions"). */
  path: string;
  /** Human-readable failure reason. */
  reason: string;
}

export type ValidationResult<T> =
  | { ok: true; body: T }
  | { ok: false; issues: ValidationIssue[] };

export class AttestationValidationError extends Error {
  constructor(
    public readonly schemaName: string,
    public readonly issues: ValidationIssue[]
  ) {
    super(
      `${schemaName}: validation failed with ${issues.length} issue(s): ` +
        issues.map((i) => `${i.path}: ${i.reason}`).join('; ')
    );
    this.name = 'AttestationValidationError';
  }
}

// ──────────────────────────────────────────────────────────────────────
//  Building blocks
// ──────────────────────────────────────────────────────────────────────

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const BYTES32_RE = /^0x[a-fA-F0-9]{64}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UINT256_MAX = (1n << 256n) - 1n;
const NOTES_MAX = 512;

function addOk<T extends object>(body: T): ValidationResult<T> {
  return { ok: true, body };
}

function checkAddress(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'string' || !ADDR_RE.test(value)) {
    issues.push({ path, reason: 'not a 0x-prefixed 40-hex address' });
  }
}

function checkBytes32(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'string' || !BYTES32_RE.test(value)) {
    issues.push({ path, reason: 'not a 0x-prefixed 32-byte (64-hex) value' });
  }
}

function checkIsoDate(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) {
    issues.push({ path, reason: 'not a YYYY-MM-DD ISO date' });
    return;
  }
  const d = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) {
    issues.push({ path, reason: 'not a parseable calendar date' });
  }
}

function dateOrder(
  issues: ValidationIssue[],
  earlierPath: string,
  earlier: unknown,
  laterPath: string,
  later: unknown
): void {
  if (typeof earlier !== 'string' || typeof later !== 'string') return;
  if (!ISO_DATE_RE.test(earlier) || !ISO_DATE_RE.test(later)) return;
  if (later <= earlier) {
    issues.push({ path: laterPath, reason: `must be strictly after ${earlierPath}` });
  }
}

function checkBand(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    issues.push({ path, reason: 'must be an integer' });
    return;
  }
  if (value < 0 || value > 100) {
    issues.push({ path, reason: 'out of range [0, 100]' });
  }
}

function checkEnum<E extends string>(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  allowed: readonly E[]
): void {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    issues.push({ path, reason: `must be one of: ${allowed.join(', ')}` });
  }
}

function checkNonEmpty(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'string' || value.length === 0) {
    issues.push({ path, reason: 'must be a non-empty string' });
  }
}

function checkNotes(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'string') {
    issues.push({ path, reason: 'must be a string' });
    return;
  }
  if (value.length > NOTES_MAX) {
    issues.push({ path, reason: `exceeds max length ${NOTES_MAX} (${value.length})` });
  }
}

function checkUint256(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'bigint') {
    issues.push({ path, reason: 'must be a bigint' });
    return;
  }
  if (value < 0n) {
    issues.push({ path, reason: 'must be non-negative' });
    return;
  }
  if (value > UINT256_MAX) {
    issues.push({ path, reason: 'exceeds uint256 max' });
  }
}

function checkUint8(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    issues.push({ path, reason: 'must be an integer' });
    return;
  }
  if (value < 0 || value > 255) {
    issues.push({ path, reason: 'out of range [0, 255]' });
  }
}

// ──────────────────────────────────────────────────────────────────────
//  Schema-specific validators
// ──────────────────────────────────────────────────────────────────────

const COUNSEL_KYB_OUTCOMES = [
  'counsel-led-kyb',
  'counsel-led-kyb-renewal',
  'self-attested-rejected',
] as const;

export function validateCounselKybBody(body: unknown): ValidationResult<CounselKybBody> {
  const issues: ValidationIssue[] = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, issues: [{ path: '', reason: 'body is not an object' }] };
  }
  const b = body as Partial<CounselKybBody>;

  checkAddress(issues, 'subject', b.subject);
  checkIsoDate(issues, 'reviewedAt', b.reviewedAt);
  checkIsoDate(issues, 'expiresAt', b.expiresAt);
  dateOrder(issues, 'reviewedAt', b.reviewedAt, 'expiresAt', b.expiresAt);
  checkEnum(issues, 'outcome', b.outcome, COUNSEL_KYB_OUTCOMES);
  checkNonEmpty(issues, 'jurisdiction', b.jurisdiction);
  checkAddress(issues, 'counsel', b.counsel);
  checkNonEmpty(issues, 'reportCid', b.reportCid);
  checkBytes32(issues, 'reportHash', b.reportHash);
  checkNotes(issues, 'notes', b.notes);

  return issues.length ? { ok: false, issues } : addOk(b as CounselKybBody);
}

const EDITORIAL_VERDICTS = ['low-risk', 'moderate-risk', 'elevated-risk', 'do-not-engage'] as const;

export function validateEditorialReviewBody(
  body: unknown
): ValidationResult<EditorialReviewBody> {
  const issues: ValidationIssue[] = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, issues: [{ path: '', reason: 'body is not an object' }] };
  }
  const b = body as Partial<EditorialReviewBody>;

  checkAddress(issues, 'subject', b.subject);
  checkIsoDate(issues, 'reviewedAt', b.reviewedAt);
  checkEnum(issues, 'verdict', b.verdict, EDITORIAL_VERDICTS);
  checkNonEmpty(issues, 'summary', b.summary);
  checkBand(issues, 'scoreBand', b.scoreBand);
  checkBand(issues, 'scoreV1Reference', b.scoreV1Reference);
  checkAddress(issues, 'editor', b.editor);
  checkNonEmpty(issues, 'commentaryCid', b.commentaryCid);
  checkBytes32(issues, 'commentaryHash', b.commentaryHash);
  checkNotes(issues, 'notes', b.notes);

  return issues.length ? { ok: false, issues } : addOk(b as EditorialReviewBody);
}

export function validateTreasuryPolicyBody(
  body: unknown
): ValidationResult<TreasuryPolicyBody> {
  const issues: ValidationIssue[] = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, issues: [{ path: '', reason: 'body is not an object' }] };
  }
  const b = body as Partial<TreasuryPolicyBody>;

  checkAddress(issues, 'subject', b.subject);
  checkIsoDate(issues, 'effectiveFrom', b.effectiveFrom);
  checkIsoDate(issues, 'effectiveUntil', b.effectiveUntil);
  dateOrder(issues, 'effectiveFrom', b.effectiveFrom, 'effectiveUntil', b.effectiveUntil);
  checkUint256(issues, 'perTxCeiling', b.perTxCeiling);
  checkUint256(issues, 'perDayCeiling', b.perDayCeiling);
  checkNonEmpty(issues, 'jurisdiction', b.jurisdiction);
  checkAddress(issues, 'principal', b.principal);
  checkNonEmpty(issues, 'policyCid', b.policyCid);
  checkBytes32(issues, 'policyHash', b.policyHash);
  checkNotes(issues, 'notes', b.notes);

  // Cross-field: per-tx ceiling cannot exceed per-day ceiling unless per-day is 0
  // (per-day 0 means "no ceiling" per the schema doc).
  if (
    typeof b.perTxCeiling === 'bigint' &&
    typeof b.perDayCeiling === 'bigint' &&
    b.perDayCeiling > 0n &&
    b.perTxCeiling > b.perDayCeiling
  ) {
    issues.push({
      path: 'perTxCeiling',
      reason: 'cannot exceed perDayCeiling (set perDayCeiling=0 for no ceiling)',
    });
  }

  return issues.length ? { ok: false, issues } : addOk(b as TreasuryPolicyBody);
}

const TOKEN_SUITABILITY_OUTCOMES: readonly TokenSuitabilityOutcome[] = [
  'suitable',
  'suitable-with-conditions',
  'not-suitable',
  'requires-further-review',
];

export function validateTokenSuitabilityBody(
  body: unknown
): ValidationResult<TokenSuitabilityBody> {
  const issues: ValidationIssue[] = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, issues: [{ path: '', reason: 'body is not an object' }] };
  }
  const b = body as Partial<TokenSuitabilityBody>;

  checkAddress(issues, 'subject', b.subject);
  checkAddress(issues, 'token', b.token);
  checkIsoDate(issues, 'reviewedAt', b.reviewedAt);
  checkIsoDate(issues, 'expiresAt', b.expiresAt);
  dateOrder(issues, 'reviewedAt', b.reviewedAt, 'expiresAt', b.expiresAt);
  checkEnum(issues, 'outcome', b.outcome, TOKEN_SUITABILITY_OUTCOMES);
  checkNonEmpty(issues, 'jurisdiction', b.jurisdiction);
  checkBand(issues, 'scoreBand', b.scoreBand);

  const c = (b.criteria ?? {}) as Partial<TokenSuitabilityBody['criteria']>;
  if (!b.criteria || typeof b.criteria !== 'object') {
    issues.push({ path: 'criteria', reason: 'must be an object' });
  } else {
    checkBand(issues, 'criteria.characteristics', c.characteristics);
    checkBand(issues, 'criteria.regulatoryStatus', c.regulatoryStatus);
    checkBand(issues, 'criteria.marketProfile', c.marketProfile);
    checkBand(issues, 'criteria.technology', c.technology);
    checkBand(issues, 'criteria.amlSanctions', c.amlSanctions);
    checkBand(issues, 'criteria.legislationImpact', c.legislationImpact);
  }

  checkAddress(issues, 'counsel', b.counsel);
  checkNonEmpty(issues, 'reportCid', b.reportCid);
  checkBytes32(issues, 'reportHash', b.reportHash);
  checkNotes(issues, 'notes', b.notes);

  return issues.length ? { ok: false, issues } : addOk(b as TokenSuitabilityBody);
}

const STABLECOIN_RESERVES_OUTCOMES: readonly StablecoinReservesOutcome[] = [
  'in-compliance',
  'in-compliance-with-findings',
  'out-of-compliance',
  'preliminary',
];

export function validateStablecoinReservesBody(
  body: unknown
): ValidationResult<StablecoinReservesBody> {
  const issues: ValidationIssue[] = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, issues: [{ path: '', reason: 'body is not an object' }] };
  }
  const b = body as Partial<StablecoinReservesBody>;

  checkAddress(issues, 'subject', b.subject);
  checkNonEmpty(issues, 'ticker', b.ticker);
  checkIsoDate(issues, 'asOf', b.asOf);
  checkIsoDate(issues, 'expiresAt', b.expiresAt);
  dateOrder(issues, 'asOf', b.asOf, 'expiresAt', b.expiresAt);
  checkEnum(issues, 'outcome', b.outcome, STABLECOIN_RESERVES_OUTCOMES);
  checkNonEmpty(issues, 'jurisdiction', b.jurisdiction);

  const c = (b.criteria ?? {}) as Partial<StablecoinReservesBody['criteria']>;
  if (!b.criteria || typeof b.criteria !== 'object') {
    issues.push({ path: 'criteria', reason: 'must be an object' });
  } else {
    checkBand(issues, 'criteria.reserveQuality', c.reserveQuality);
    checkBand(issues, 'criteria.audit', c.audit);
    checkBand(issues, 'criteria.governance', c.governance);
    checkBand(issues, 'criteria.disclosure', c.disclosure);
    checkBand(issues, 'criteria.prudential', c.prudential);
    checkBand(issues, 'criteria.redemption', c.redemption);
  }

  checkUint256(issues, 'reservesUsd', b.reservesUsd);
  checkUint256(issues, 'circulatingSupply', b.circulatingSupply);
  checkUint8(issues, 'circulatingSupplyDecimals', b.circulatingSupplyDecimals);
  checkAddress(issues, 'auditor', b.auditor);
  checkNonEmpty(issues, 'reportCid', b.reportCid);
  checkBytes32(issues, 'reportHash', b.reportHash);
  checkNotes(issues, 'notes', b.notes);

  return issues.length ? { ok: false, issues } : addOk(b as StablecoinReservesBody);
}

/** Re-export for type-level access without forcing consumers to dig into schema files. */
export type { Address };
