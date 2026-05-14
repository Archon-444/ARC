/**
 * ArcPassport event listener.
 *
 * Watches the 5 events emitted by the W8 ArcPassport contract on Arc
 * testnet and broadcasts each one into two WebSocket rooms:
 *
 *   passport:<passportId>     — keyed by the bigint passport id
 *   passport:<subject-lowercased> — keyed by the subject address
 *
 * The subject is taken from the event args when present
 * (`PassportMinted`); for events that only carry `passportId`, the
 * caller can pass `resolveSubject` to look it up. If `resolveSubject`
 * is not provided, only the by-id room is broadcast to.
 *
 * Env-gated boot: `startPassportListenerFromEnv` returns null unless
 * `ARC_RPC_URL` + `ARC_PASSPORT_ADDRESS` are set. CI + the unfunded
 * dev path stay no-op.
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

const PASSPORT_EVENTS = [
  parseAbiItem(
    'event PassportMinted(uint256 indexed passportId, address indexed subject, string metadataURI)',
  ),
  parseAbiItem(
    'event PassportMetadataUpdated(uint256 indexed passportId, string metadataURI)',
  ),
  parseAbiItem('event PassportRevoked(uint256 indexed passportId)'),
  parseAbiItem(
    'event CounselAttestationAttached(uint256 indexed passportId, bytes32 attestationId, address indexed counsel)',
  ),
  parseAbiItem(
    'event IdentityAdapterUpdated(address indexed previous, address indexed next)',
  ),
] as const;

export interface WatchEventCapable {
  watchEvent: PublicClient['watchEvent'];
}

export interface PassportListenerOptions {
  client: WatchEventCapable;
  address: Address;
  broadcast?: (room: string, message: unknown) => void;
  resolveSubject?: (passportId: bigint) => Promise<Address | null>;
}

export interface PassportListener {
  stop: () => void;
}

export function startPassportListener(opts: PassportListenerOptions): PassportListener {
  const sink = opts.broadcast ?? broadcastToRoom;
  const unwatches = PASSPORT_EVENTS.map((evt) =>
    opts.client.watchEvent({
      address: opts.address,
      event: evt as never,
      onLogs: async (logs: readonly unknown[]) => {
        for (const log of logs) {
          await emitOne(log as PassportLog, evt.name, sink, opts);
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

interface PassportLog {
  args: Record<string, unknown>;
  transactionHash: Hex;
  blockNumber: bigint;
  logIndex: number;
}

async function emitOne(
  log: PassportLog,
  eventName: string,
  sink: (room: string, message: unknown) => void,
  opts: PassportListenerOptions,
): Promise<void> {
  const args = log.args ?? {};
  const passportId = args.passportId as bigint | undefined;
  const subjectFromArgs = args.subject as Address | undefined;

  const payload = {
    kind: 'passport',
    event: eventName,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber?.toString(),
    logIndex: log.logIndex,
    passportId: passportId?.toString(),
    args: serializeArgs(args),
  };

  if (passportId !== undefined) {
    sink(`passport:${passportId.toString()}`, payload);
  }

  let subject = subjectFromArgs;
  if (!subject && passportId !== undefined && opts.resolveSubject) {
    subject = (await opts.resolveSubject(passportId)) ?? undefined;
  }
  if (subject) {
    sink(`passport:${subject.toLowerCase()}`, payload);
  }
}

function serializeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    out[k] = typeof v === 'bigint' ? v.toString() : v;
  }
  return out;
}

export function startPassportListenerFromEnv(): PassportListener | null {
  const rpcUrl = process.env.ARC_RPC_URL;
  const address = process.env.ARC_PASSPORT_ADDRESS as Address | undefined;
  if (!rpcUrl || !address) return null;
  const client = createPublicClient({ transport: http(rpcUrl) });
  console.log(`[indexer] passport listener watching ${address} via ${rpcUrl}`);
  return startPassportListener({ client, address });
}
