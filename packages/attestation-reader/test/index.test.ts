/**
 * Stubbed-RPC unit tests for @arc/attestation-reader. Mirrors the
 * shape of @arc/passport-sdk's test suite: a StubPublicClient
 * records call signatures + returns canned responses, the reader
 * is exercised against it, and assertions check both wire shape
 * and convenience-method composition.
 *
 * No live network. Real RPC integration is exercised by trust-api
 * once a deployed AttestationRegistry address lands in the env.
 */

import {
  ArcAttestationReader,
  ATTESTATION_REGISTRY_ABI,
  ARC_TESTNET,
  type AttestationRecord,
} from '../src/index.js';
import type { Address, Hex } from 'viem';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}
function assertEq<T>(actual: T, expected: T, msg: string): void {
  const a = JSON.stringify(actual, (_k, v) => (typeof v === 'bigint' ? `${v}n` : v));
  const e = JSON.stringify(expected, (_k, v) => (typeof v === 'bigint' ? `${v}n` : v));
  if (a !== e) throw new Error(`${msg}: expected ${e}, got ${a}`);
}

const REGISTRY = '0x1111111111111111111111111111111111111111' as Address;
const SUBJECT = '0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd' as Address;
const COUNSEL_SCHEMA = '0xa11ce0000000000000000000000000000000000000000000000000counsel0' as Hex;
const ID1 = '0xb11b1111111111111111111111111111111111111111111111111111111111aa' as Hex;
const ID2 = '0xb22b2222222222222222222222222222222222222222222222222222222222bb' as Hex;
const ID_MISSING = '0xdeaddead0000000000000000000000000000000000000000000000000000dead' as Hex;
const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as Address;
const ZERO_BYTES32 = ('0x' + '00'.repeat(32)) as Hex;

interface RecordedCall {
  functionName: string;
  args: unknown[];
}

class StubPublicClient {
  calls: RecordedCall[] = [];
  responses = new Map<string, unknown>();

  on(functionName: string, args: unknown[], value: unknown): void {
    this.responses.set(`${functionName}:${JSON.stringify(args, bigintReplacer)}`, value);
  }

  async readContract(opts: { address: string; functionName: string; args?: unknown[] }) {
    const args = opts.args ?? [];
    this.calls.push({ functionName: opts.functionName, args });
    const key = `${opts.functionName}:${JSON.stringify(args, bigintReplacer)}`;
    if (!this.responses.has(key)) {
      throw new Error(`stub: no canned response for ${key}`);
    }
    return this.responses.get(key);
  }
}

function bigintReplacer(_k: string, v: unknown): unknown {
  return typeof v === 'bigint' ? `${v}n` : v;
}

function tuple(overrides: Partial<{
  subject: Address; schemaId: Hex; dataHash: Hex; expiry: bigint;
  createdAt: bigint; signer: Address; revoked: boolean;
}> = {}) {
  return {
    subject: overrides.subject ?? SUBJECT,
    schemaId: overrides.schemaId ?? COUNSEL_SCHEMA,
    dataHash: overrides.dataHash ?? (('0x' + '11'.repeat(32)) as Hex),
    expiry: overrides.expiry ?? 0n,
    createdAt: overrides.createdAt ?? 1_700_000_000n,
    signer: overrides.signer ?? ('0xc0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0' as Address),
    revoked: overrides.revoked ?? false,
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────────────────────────────

async function testAbiAndChain(): Promise<void> {
  const fns = ATTESTATION_REGISTRY_ABI.filter((e) => e.type === 'function').map(
    (e) => (e as { name: string }).name
  );
  for (const name of ['getAttestation', 'isValid', 'attestationCount', 'attestationAt']) {
    assert(fns.includes(name), `abi has function ${name}`);
  }
  const events = ATTESTATION_REGISTRY_ABI.filter((e) => e.type === 'event').map(
    (e) => (e as { name: string }).name
  );
  for (const ev of ['Attested', 'Revoked']) {
    assert(events.includes(ev), `abi has event ${ev}`);
  }
  assertEq(ARC_TESTNET.id, 5042002, 'ARC_TESTNET chain id');
  assertEq(ARC_TESTNET.nativeCurrency.symbol, 'USDC', 'ARC_TESTNET native = USDC');
  console.log('  [abi+chain] surface present; chain id 5042002 USDC');
}

async function testGetAttestationExisting(): Promise<void> {
  const pub = new StubPublicClient();
  pub.on('getAttestation', [ID1], tuple({ revoked: false }));

  const reader = new ArcAttestationReader({ address: REGISTRY, publicClient: pub as any });
  const rec = await reader.getAttestation(ID1);

  assert(rec !== null, 'record exists');
  const r = rec as AttestationRecord;
  assertEq(r.id, ID1, 'id echoed back');
  assertEq(r.subject, SUBJECT, 'subject');
  assertEq(r.schemaId, COUNSEL_SCHEMA, 'schemaId');
  assertEq(r.revoked, false, 'not revoked');
  console.log('  [getAttestation existing] returns full record with id echo');
}

async function testGetAttestationUnknown(): Promise<void> {
  const pub = new StubPublicClient();
  // Contract returns zero-valued tuple for unknown id.
  pub.on('getAttestation', [ID_MISSING], {
    subject: ZERO_ADDR,
    schemaId: ZERO_BYTES32,
    dataHash: ZERO_BYTES32,
    expiry: 0n,
    createdAt: 0n,
    signer: ZERO_ADDR,
    revoked: false,
  });
  const reader = new ArcAttestationReader({ address: REGISTRY, publicClient: pub as any });
  const rec = await reader.getAttestation(ID_MISSING);
  assertEq(rec, null, 'unknown id returns null (not zero-valued record)');
  console.log('  [getAttestation unknown] short-circuits to null on subject=0x0');
}

async function testIsValid(): Promise<void> {
  const pub = new StubPublicClient();
  pub.on('isValid', [ID1], true);
  pub.on('isValid', [ID2], false);
  const reader = new ArcAttestationReader({ address: REGISTRY, publicClient: pub as any });
  assertEq(await reader.isValid(ID1), true, 'isValid true passes through');
  assertEq(await reader.isValid(ID2), false, 'isValid false passes through');
  console.log('  [isValid] pass-through');
}

async function testListAttestationIdsEmpty(): Promise<void> {
  const pub = new StubPublicClient();
  pub.on('attestationCount', [SUBJECT, COUNSEL_SCHEMA], 0n);
  const reader = new ArcAttestationReader({ address: REGISTRY, publicClient: pub as any });
  const ids = await reader.listAttestationIds(SUBJECT, COUNSEL_SCHEMA);
  assertEq(ids.length, 0, 'empty list when count=0');
  assertEq(pub.calls.length, 1, 'short-circuits on count=0 (1 RPC call, no attestationAt)');
  console.log('  [listAttestationIds empty] count=0 short-circuits with 1 RPC call');
}

async function testListAttestationIdsAndCurrent(): Promise<void> {
  const pub = new StubPublicClient();
  pub.on('attestationCount', [SUBJECT, COUNSEL_SCHEMA], 2n);
  pub.on('attestationAt', [SUBJECT, COUNSEL_SCHEMA, 0n], ID1);
  pub.on('attestationAt', [SUBJECT, COUNSEL_SCHEMA, 1n], ID2);
  pub.on('getAttestation', [ID1], tuple({ revoked: false }));
  pub.on('getAttestation', [ID2], tuple({ revoked: true }));

  const reader = new ArcAttestationReader({ address: REGISTRY, publicClient: pub as any });
  const ids = await reader.listAttestationIds(SUBJECT, COUNSEL_SCHEMA);
  assertEq(ids, [ID1, ID2], 'lists both ids in order');

  const current = await reader.listCurrentAttestations(SUBJECT, COUNSEL_SCHEMA);
  assertEq(current.length, 1, 'filters out revoked');
  assertEq(current[0]!.id, ID1, 'remaining record is the non-revoked one');
  console.log('  [listCurrentAttestations] revoked records filtered out');
}

async function main(): Promise<void> {
  await testAbiAndChain();
  await testGetAttestationExisting();
  await testGetAttestationUnknown();
  await testIsValid();
  await testListAttestationIdsEmpty();
  await testListAttestationIdsAndCurrent();
  console.log('attestation-reader OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
