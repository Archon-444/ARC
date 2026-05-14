/**
 * Unit test for the AttestationRegistry event listener.
 *
 * Same shape as passport-listener.test.ts: stub `watchEvent`, capture
 * broadcasts, assert rooms + payload.
 */

import {
  startAttestationListener,
  type WatchEventCapable,
} from '../src/listeners/attestation';
import type { Address, Hex } from 'viem';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

const REGISTRY_ADDR = '0x6666666666666666666666666666666666666666' as Address;
const SUBJECT = '0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc' as Address;
const SIGNER = '0xDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd' as Address;
const ATTESTATION_ID =
  '0xAaAa11111111111111111111111111111111111111111111111111111111Bbbb' as Hex;
const SCHEMA_ID =
  '0x7777777777777777777777777777777777777777777777777777777777777777' as Hex;
const DATA_HASH =
  '0x8888888888888888888888888888888888888888888888888888888888888888' as Hex;

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
  message: { event?: string; id?: Hex; args?: Record<string, unknown> };
}

async function run(): Promise<void> {
  const { client, registrations } = makeStubClient();
  const captured: CapturedBroadcast[] = [];
  const broadcast = (room: string, message: unknown): void => {
    captured.push({ room, message: message as CapturedBroadcast['message'] });
  };

  startAttestationListener({
    client,
    address: REGISTRY_ADDR,
    broadcast,
  });

  assert(
    registrations.length === 2,
    `expected 2 watchEvent registrations, got ${registrations.length}`,
  );
  const byName = new Map(registrations.map((r) => [r.event.name, r] as const));
  assert(byName.has('Attested'), 'missing Attested registration');
  assert(byName.has('Revoked'), 'missing Revoked registration');

  // Attested → broadcasts to attestation:<id> AND attestation-subject:<subject>
  byName.get('Attested')!.onLogs([
    {
      args: {
        id: ATTESTATION_ID,
        subject: SUBJECT,
        schemaId: SCHEMA_ID,
        dataHash: DATA_HASH,
        expiry: 99999n,
        signer: SIGNER,
      },
      transactionHash: '0xtxattested' as Hex,
      blockNumber: 500n,
      logIndex: 0,
    },
  ]);

  const attested = captured.filter((c) => c.message.event === 'Attested');
  assert(attested.length === 2, `expected 2 Attested broadcasts, got ${attested.length}`);
  assert(
    attested.some((b) => b.room === `attestation:${ATTESTATION_ID.toLowerCase()}`),
    'Attested missing attestation:<id> room',
  );
  assert(
    attested.some((b) => b.room === `attestation-subject:${SUBJECT.toLowerCase()}`),
    'Attested missing attestation-subject:<addr> room',
  );
  const attestedPayload = attested[0]!.message;
  assert(attestedPayload.id === ATTESTATION_ID, 'id not on payload');
  assert(
    (attestedPayload.args as { expiry: string }).expiry === '99999',
    'bigint expiry not serialized as string',
  );
  assert(
    (attestedPayload.args as { schemaId: Hex }).schemaId === SCHEMA_ID,
    'schemaId missing',
  );

  // Revoked → only attestation:<id> when no resolver
  byName.get('Revoked')!.onLogs([
    {
      args: { id: ATTESTATION_ID, by: SIGNER },
      transactionHash: '0xtxrevoked' as Hex,
      blockNumber: 501n,
      logIndex: 0,
    },
  ]);
  const revoked = captured.filter((c) => c.message.event === 'Revoked');
  assert(revoked.length === 1, `expected 1 Revoked broadcast (no resolver), got ${revoked.length}`);
  assert(
    revoked[0]!.room === `attestation:${ATTESTATION_ID.toLowerCase()}`,
    'Revoked wrong room',
  );

  // resolveSubject path: Revoked with resolver also hits attestation-subject
  const { client: c2, registrations: r2 } = makeStubClient();
  const captured2: CapturedBroadcast[] = [];
  startAttestationListener({
    client: c2,
    address: REGISTRY_ADDR,
    broadcast: (room, msg) => {
      captured2.push({ room, message: msg as CapturedBroadcast['message'] });
    },
    resolveSubject: async (id) => (id === ATTESTATION_ID ? SUBJECT : null),
  });
  r2.find((r) => r.event.name === 'Revoked')!.onLogs([
    {
      args: { id: ATTESTATION_ID, by: SIGNER },
      transactionHash: '0xtx' as Hex,
      blockNumber: 600n,
      logIndex: 0,
    },
  ]);
  await new Promise((r) => setImmediate(r));
  const resolved = captured2.filter((c) => c.message.event === 'Revoked');
  assert(
    resolved.some((b) => b.room === `attestation:${ATTESTATION_ID.toLowerCase()}`),
    'Revoked+resolver missing attestation:<id> room',
  );
  assert(
    resolved.some((b) => b.room === `attestation-subject:${SUBJECT.toLowerCase()}`),
    'Revoked+resolver missing attestation-subject:<addr> room',
  );

  console.log('attestation-listener OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
