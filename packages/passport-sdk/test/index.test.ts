/**
 * Unit tests for @arc/passport-sdk. Stubs viem's PublicClient and
 * WalletClient to verify the SDK wires ABI calls correctly. Real
 * RPC integration is exercised in W8.4 (deploy script) and from
 * the trust-api passport route once the contract is deployed on
 * Arc testnet.
 *
 * No live network calls. Runs via `npm --workspace @arc/passport-sdk test`.
 */

import {
  ArcPassportClient,
  ARC_PASSPORT_ABI,
  ARC_TESTNET,
  type PassportRecord,
} from '../src/index.js';
import type { Address, Hex } from 'viem';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

function assertEq<T>(actual: T, expected: T, msg: string): void {
  const a = JSON.stringify(actual, (_k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v));
  const e = JSON.stringify(expected, (_k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v));
  if (a !== e) throw new Error(`${msg}: expected ${e}, got ${a}`);
}

const PASSPORT_ADDR = '0x1111111111111111111111111111111111111111' as Address;
const SUBJECT_ADDR = '0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd' as Address;
const ZERO_BYTES32 = ('0x' + '00'.repeat(32)) as Hex;

interface StubReadCall {
  address: string;
  functionName: string;
  args?: unknown[];
}

class StubPublicClient {
  calls: StubReadCall[] = [];
  responses = new Map<string, unknown>();

  /** Pre-stage a return value for `functionName(args)`. */
  on(functionName: string, args: unknown[], value: unknown): void {
    this.responses.set(`${functionName}:${JSON.stringify(args, bigintReplacer)}`, value);
  }

  async readContract(args: { address: string; functionName: string; args?: unknown[] }) {
    this.calls.push({ address: args.address, functionName: args.functionName, args: args.args });
    const key = `${args.functionName}:${JSON.stringify(args.args ?? [], bigintReplacer)}`;
    if (!this.responses.has(key)) {
      throw new Error(`stub: no canned response for ${key}`);
    }
    return this.responses.get(key);
  }
}

class StubWalletClient {
  account = { address: SUBJECT_ADDR };
  chain = ARC_TESTNET;
  lastWrite: any = null;

  async writeContract(args: any): Promise<Hex> {
    this.lastWrite = args;
    return ('0x' + 'aa'.repeat(32)) as Hex;
  }
}

function bigintReplacer(_k: string, v: unknown): unknown {
  return typeof v === 'bigint' ? `${v}n` : v;
}

// ──────────────────────────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────────────────────────

async function testAbiShape(): Promise<void> {
  const fns = ARC_PASSPORT_ABI.filter((e) => e.type === 'function').map((e) => (e as any).name);
  assert(fns.includes('getPassport'), 'abi has getPassport');
  assert(fns.includes('resolveBySubject'), 'abi has resolveBySubject');
  assert(fns.includes('mintSelf'), 'abi has mintSelf');
  assert(fns.includes('updateMetadata'), 'abi has updateMetadata');
  assert(fns.includes('revoke'), 'abi has revoke');
  assert(fns.includes('identityAdapter'), 'abi has identityAdapter');

  const events = ARC_PASSPORT_ABI.filter((e) => e.type === 'event').map((e) => (e as any).name);
  assert(events.includes('PassportMinted'), 'abi has PassportMinted event');
  assert(events.includes('PassportRevoked'), 'abi has PassportRevoked event');
  assert(events.includes('CounselAttestationAttached'), 'abi has CounselAttestationAttached event');
  assert(events.includes('IdentityAdapterUpdated'), 'abi has IdentityAdapterUpdated event');

  console.log('  [abi] all required functions + events present');
}

async function testChainDef(): Promise<void> {
  assertEq(ARC_TESTNET.id, 5042002, 'arc testnet chain id');
  assertEq(ARC_TESTNET.nativeCurrency.symbol, 'USDC', 'native currency = USDC');
  console.log('  [chain] arc testnet id=5042002 native=USDC');
}

async function testGetPassportBySubjectExisting(): Promise<void> {
  const pub = new StubPublicClient();
  pub.on('resolveBySubject', [SUBJECT_ADDR], 42n);
  pub.on('getPassport', [42n], [SUBJECT_ADDR, 'ipfs://test', false, ZERO_BYTES32]);

  const client = new ArcPassportClient({ address: PASSPORT_ADDR, publicClient: pub as any });
  const record = await client.getPassportBySubject(SUBJECT_ADDR);
  assert(record !== null, 'record exists');
  const r = record as PassportRecord;
  assertEq(r.passportId, 42n, 'passportId');
  assertEq(r.subject, SUBJECT_ADDR, 'subject');
  assertEq(r.metadataURI, 'ipfs://test', 'metadataURI');
  assertEq(r.revoked, false, 'revoked');
  assertEq(r.counselAttestation, ZERO_BYTES32, 'counselAttestation');

  // Two RPC calls: resolveBySubject + getPassport.
  assertEq(pub.calls.length, 2, 'two RPC calls');
  assertEq(pub.calls[0].functionName, 'resolveBySubject', 'first call');
  assertEq(pub.calls[1].functionName, 'getPassport', 'second call');
  console.log('  [getPassportBySubject existing] passportId=42 subject=ok');
}

async function testGetPassportBySubjectMissing(): Promise<void> {
  const pub = new StubPublicClient();
  pub.on('resolveBySubject', [SUBJECT_ADDR], 0n);

  const client = new ArcPassportClient({ address: PASSPORT_ADDR, publicClient: pub as any });
  const record = await client.getPassportBySubject(SUBJECT_ADDR);
  assertEq(record, null, 'no record');
  assertEq(pub.calls.length, 1, 'single RPC call (short-circuited)');
  console.log('  [getPassportBySubject missing] short-circuits after resolve=0');
}

async function testGetPassportUnknownId(): Promise<void> {
  const pub = new StubPublicClient();
  pub.on(
    'getPassport',
    [99n],
    ['0x0000000000000000000000000000000000000000', '', false, ZERO_BYTES32]
  );
  const client = new ArcPassportClient({ address: PASSPORT_ADDR, publicClient: pub as any });
  const record = await client.getPassport(99n);
  assertEq(record, null, 'unknown id returns null');
  console.log('  [getPassport unknown] returns null when subject=0x0');
}

async function testGetIdentityAdapter(): Promise<void> {
  const pub = new StubPublicClient();
  const adapter = '0x2222222222222222222222222222222222222222';
  pub.on('identityAdapter', [], adapter);
  const client = new ArcPassportClient({ address: PASSPORT_ADDR, publicClient: pub as any });
  const got = await client.getIdentityAdapter();
  assertEq(got, adapter, 'adapter address');
  console.log('  [getIdentityAdapter] passes through');
}

async function testMintSelf(): Promise<void> {
  const pub = new StubPublicClient();
  const wallet = new StubWalletClient();
  const client = new ArcPassportClient({
    address: PASSPORT_ADDR,
    publicClient: pub as any,
    walletClient: wallet as any,
  });
  const hash = await client.mintSelf('ipfs://newuri');
  assert(hash.startsWith('0x'), 'returns tx hash');
  assertEq(wallet.lastWrite.functionName, 'mintSelf', 'wallet saw mintSelf');
  assertEq(wallet.lastWrite.args, ['ipfs://newuri'], 'args');
  assertEq(wallet.lastWrite.address, PASSPORT_ADDR, 'address');
  console.log('  [mintSelf] writes mintSelf(uri) to passport address');
}

async function testWriteWithoutWalletRejects(): Promise<void> {
  const pub = new StubPublicClient();
  const client = new ArcPassportClient({ address: PASSPORT_ADDR, publicClient: pub as any });
  let caught = false;
  try {
    await client.mintSelf('ipfs://x');
  } catch (e) {
    caught = (e as Error).message.includes('walletClient required');
  }
  assert(caught, 'mintSelf without walletClient throws helpful error');
  console.log('  [no-wallet] mintSelf rejects with clear message');
}

async function main(): Promise<void> {
  await testAbiShape();
  await testChainDef();
  await testGetPassportBySubjectExisting();
  await testGetPassportBySubjectMissing();
  await testGetPassportUnknownId();
  await testGetIdentityAdapter();
  await testMintSelf();
  await testWriteWithoutWalletRejects();
  console.log('passport-sdk OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
