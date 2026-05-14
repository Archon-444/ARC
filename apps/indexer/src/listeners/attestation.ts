/**
 * AttestationRegistry event listener.
 *
 * Watches the 2 events emitted by the W9 AttestationRegistry contract
 * and broadcasts each one into two rooms:
 *
 *   attestation:<id>          — keyed by the bytes32 attestation id
 *   attestation-subject:<subject-lowercased>
 *
 * Same env-gated boot pattern as the passport listener.
 */

import {
  createPublicClient,
  http,
  parseAbiItem,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { broadcastToRoom } from '../websocket';

const ATTESTATION_EVENTS = [
  parseAbiItem(
    'event Attested(bytes32 indexed id, address indexed subject, bytes32 indexed schemaId, bytes32 dataHash, uint64 expiry, address signer)',
  ),
  parseAbiItem('event Revoked(bytes32 indexed id, address indexed by)'),
] as const;

export interface WatchEventCapable {
  watchEvent: PublicClient['watchEvent'];
}

export interface AttestationListenerOptions {
  client: WatchEventCapable;
  address: Address;
  broadcast?: (room: string, message: unknown) => void;
  /** Resolve attestation id -> subject for Revoked events (which carry only `id`). */
  resolveSubject?: (id: Hex) => Promise<Address | null>;
}

export interface AttestationListener {
  stop: () => void;
}

export function startAttestationListener(
  opts: AttestationListenerOptions,
): AttestationListener {
  const sink = opts.broadcast ?? broadcastToRoom;
  const unwatches = ATTESTATION_EVENTS.map((evt) =>
    opts.client.watchEvent({
      address: opts.address,
      event: evt as never,
      onLogs: async (logs: readonly unknown[]) => {
        for (const log of logs) {
          await emitOne(log as AttestationLog, evt.name, sink, opts);
        }
      },
    } as never),
  );
  return {
    stop: () => {
      for (const u of unwatches) u();
    },
  };
}

interface AttestationLog {
  args: Record<string, unknown>;
  transactionHash: Hex;
  blockNumber: bigint;
  logIndex: number;
}

async function emitOne(
  log: AttestationLog,
  eventName: string,
  sink: (room: string, message: unknown) => void,
  opts: AttestationListenerOptions,
): Promise<void> {
  const args = log.args ?? {};
  const id = args.id as Hex | undefined;
  const subjectFromArgs = args.subject as Address | undefined;

  const payload = {
    kind: 'attestation',
    event: eventName,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber?.toString(),
    logIndex: log.logIndex,
    id,
    args: serializeArgs(args),
  };

  if (id) {
    sink(`attestation:${id.toLowerCase()}`, payload);
  }

  let subject = subjectFromArgs;
  if (!subject && id && opts.resolveSubject) {
    subject = (await opts.resolveSubject(id)) ?? undefined;
  }
  if (subject) {
    sink(`attestation-subject:${subject.toLowerCase()}`, payload);
  }
}

function serializeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    out[k] = typeof v === 'bigint' ? v.toString() : v;
  }
  return out;
}

export function startAttestationListenerFromEnv(): AttestationListener | null {
  const rpcUrl = process.env.ARC_RPC_URL;
  const address = process.env.ARC_ATTESTATION_REGISTRY_ADDRESS as Address | undefined;
  if (!rpcUrl || !address) return null;
  const client = createPublicClient({ transport: http(rpcUrl) });
  console.log(`[indexer] attestation listener watching ${address} via ${rpcUrl}`);
  return startAttestationListener({ client, address });
}
