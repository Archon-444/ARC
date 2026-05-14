/**
 * Unit test for the ArcPassport event listener.
 *
 * A stub `watchEvent` implementation records the (address, event)
 * pairs it's asked to watch and exposes a `fire` hook to deliver
 * synthetic logs. We boot the listener, fire one log per event type,
 * and assert the broadcast sink receives the right payload on the
 * right rooms.
 */

import {
  startPassportListener,
  type WatchEventCapable,
} from '../src/listeners/passport';
import type { Address, Hex } from 'viem';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

const PASSPORT_ADDR = '0x5555555555555555555555555555555555555555' as Address;
const SUBJECT = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa' as Address;
const COUNSEL = '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb' as Address;
const ATTESTATION_ID =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as Hex;

interface WatchRegistration {
  event: { name: string };
  onLogs: (logs: unknown[]) => void;
}

function makeStubClient(): { client: WatchEventCapable; registrations: WatchRegistration[] } {
  const registrations: WatchRegistration[] = [];
  const client = {
    watchEvent(opts: { event: { name: string }; onLogs: (logs: unknown[]) => void }) {
      registrations.push({ event: opts.event, onLogs: opts.onLogs });
      return () => {};
    },
  } as unknown as WatchEventCapable;
  return { client, registrations };
}

interface CapturedBroadcast {
  room: string;
  message: { event?: string; passportId?: string; args?: Record<string, unknown> };
}

function makeBroadcastSink(): {
  fn: (room: string, message: unknown) => void;
  captured: CapturedBroadcast[];
} {
  const captured: CapturedBroadcast[] = [];
  return {
    fn: (room: string, message: unknown) => {
      captured.push({ room, message: message as CapturedBroadcast['message'] });
    },
    captured,
  };
}

async function run(): Promise<void> {
  const { client, registrations } = makeStubClient();
  const sink = makeBroadcastSink();

  startPassportListener({
    client,
    address: PASSPORT_ADDR,
    broadcast: sink.fn,
  });

  assert(registrations.length === 5, `expected 5 watchEvent registrations, got ${registrations.length}`);
  const byName = new Map(registrations.map((r) => [r.event.name, r] as const));
  for (const name of [
    'PassportMinted',
    'PassportMetadataUpdated',
    'PassportRevoked',
    'CounselAttestationAttached',
    'IdentityAdapterUpdated',
  ]) {
    assert(byName.has(name), `missing registration for ${name}`);
  }

  // PassportMinted → broadcasts to passport:<id> AND passport:<subject-lower>
  byName.get('PassportMinted')!.onLogs([
    {
      args: { passportId: 7n, subject: SUBJECT, metadataURI: 'ipfs://meta' },
      transactionHash: '0xtxminted' as Hex,
      blockNumber: 100n,
      logIndex: 0,
    },
  ]);

  const mintedBroadcasts = sink.captured.filter((c) => c.message.event === 'PassportMinted');
  assert(mintedBroadcasts.length === 2, `expected 2 broadcasts for mint, got ${mintedBroadcasts.length}`);
  assert(
    mintedBroadcasts.some((b) => b.room === 'passport:7'),
    'mint missing passport:<id> room',
  );
  assert(
    mintedBroadcasts.some((b) => b.room === `passport:${SUBJECT.toLowerCase()}`),
    'mint missing passport:<subject> room',
  );
  const mintPayload = mintedBroadcasts[0]!.message;
  assert(mintPayload.passportId === '7', 'passportId not serialized as string');
  assert(
    (mintPayload.args as { metadataURI: string }).metadataURI === 'ipfs://meta',
    'metadataURI not in args',
  );

  // PassportRevoked → only passport:<id> when no resolver is set
  byName.get('PassportRevoked')!.onLogs([
    {
      args: { passportId: 7n },
      transactionHash: '0xtxrevoked' as Hex,
      blockNumber: 101n,
      logIndex: 0,
    },
  ]);
  const revoked = sink.captured.filter((c) => c.message.event === 'PassportRevoked');
  assert(revoked.length === 1, `expected 1 broadcast for revoke (no resolver), got ${revoked.length}`);
  assert(revoked[0]!.room === 'passport:7', 'revoke wrong room');

  // CounselAttestationAttached → emits on passport:<id> only (no subject in args)
  byName.get('CounselAttestationAttached')!.onLogs([
    {
      args: { passportId: 7n, attestationId: ATTESTATION_ID, counsel: COUNSEL },
      transactionHash: '0xtxattach' as Hex,
      blockNumber: 102n,
      logIndex: 0,
    },
  ]);
  const attached = sink.captured.filter((c) => c.message.event === 'CounselAttestationAttached');
  assert(attached.length === 1, `expected 1 attach broadcast, got ${attached.length}`);
  assert(
    (attached[0]!.message.args as { attestationId: string }).attestationId === ATTESTATION_ID,
    'attestation id missing from args',
  );

  // IdentityAdapterUpdated → no passportId field, no subject; emits nothing room-wise
  // (still calls watchEvent; the listener tolerates it cleanly)
  byName.get('IdentityAdapterUpdated')!.onLogs([
    {
      args: { previous: COUNSEL, next: SUBJECT },
      transactionHash: '0xtxadapter' as Hex,
      blockNumber: 103n,
      logIndex: 0,
    },
  ]);
  const adapter = sink.captured.filter((c) => c.message.event === 'IdentityAdapterUpdated');
  assert(adapter.length === 0, `IdentityAdapterUpdated has no passportId/subject; expected 0 broadcasts, got ${adapter.length}`);

  // resolveSubject path: PassportRevoked when resolver is provided
  const { client: client2, registrations: regs2 } = makeStubClient();
  const sink2 = makeBroadcastSink();
  startPassportListener({
    client: client2,
    address: PASSPORT_ADDR,
    broadcast: sink2.fn,
    resolveSubject: async (id) => (id === 9n ? SUBJECT : null),
  });
  const revokedReg = regs2.find((r) => r.event.name === 'PassportRevoked')!;
  revokedReg.onLogs([
    { args: { passportId: 9n }, transactionHash: '0xtx' as Hex, blockNumber: 200n, logIndex: 0 },
  ]);
  // Async resolveSubject means we wait one microtask before asserting
  await new Promise((r) => setImmediate(r));
  const resolved = sink2.captured.filter((c) => c.message.event === 'PassportRevoked');
  assert(
    resolved.some((b) => b.room === 'passport:9'),
    'revoked with resolver missing passport:<id> room',
  );
  assert(
    resolved.some((b) => b.room === `passport:${SUBJECT.toLowerCase()}`),
    'revoked with resolver missing passport:<subject> room',
  );

  console.log('passport-listener OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
