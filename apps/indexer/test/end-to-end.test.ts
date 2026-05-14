/**
 * End-to-end test: boot the full WS server, connect a client,
 * subscribe to a passport room, trigger the listener with a synthetic
 * log, assert the client receives the broadcast message over the WS.
 *
 * Exercises the contract between the listener (default broadcast sink
 * = broadcastToRoom) and the WebSocket room infrastructure without
 * any real RPC.
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { Address, Hex } from 'viem';
import { setupWebSocket } from '../src/websocket';
import {
  startPassportListener,
  type WatchEventCapable,
} from '../src/listeners/passport';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

const PASSPORT_ADDR = '0x5555555555555555555555555555555555555555' as Address;
const SUBJECT = '0xEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe' as Address;

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

async function run(): Promise<void> {
  // Boot HTTP + WS server on an ephemeral port. Note: the listener
  // calls `broadcastToRoom` which is a module-level singleton; setting
  // it up here uses the same singleton as the listener uses by default.
  const server = http.createServer();
  const wss = new WebSocketServer({ server, path: '/ws' });
  setupWebSocket(wss);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('no server address');
  const port = addr.port;

  // Connect a client and subscribe to passport:7
  const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const received: unknown[] = [];
  client.on('message', (data) => {
    received.push(JSON.parse(data.toString()));
  });

  await new Promise<void>((resolve, reject) => {
    client.once('open', () => resolve());
    client.once('error', reject);
  });

  // Wait for welcome message ("connected") then subscribe
  await new Promise((r) => setTimeout(r, 30));
  client.send(JSON.stringify({ type: 'subscribe', room: 'passport:7' }));
  await new Promise((r) => setTimeout(r, 30));

  // Boot listener with stub watchEvent, no `broadcast` override → uses
  // the default broadcastToRoom from src/websocket.
  const { client: rpcClient, registrations } = makeStubClient();
  startPassportListener({ client: rpcClient, address: PASSPORT_ADDR });
  const mintedReg = registrations.find((r) => r.event.name === 'PassportMinted')!;
  mintedReg.onLogs([
    {
      args: { passportId: 7n, subject: SUBJECT, metadataURI: 'ipfs://e2e' },
      transactionHash: '0xtxe2e' as Hex,
      blockNumber: 999n,
      logIndex: 0,
    },
  ]);

  // Give the broadcast → ws.send cycle a tick.
  await new Promise((r) => setTimeout(r, 80));

  const events = received.filter(
    (m): m is { type: string; event?: string; room?: string; passportId?: string } =>
      typeof m === 'object' &&
      m !== null &&
      (m as { event?: string }).event === 'PassportMinted',
  );
  assert(events.length === 1, `expected 1 PassportMinted on client, got ${events.length}`);
  const msg = events[0]!;
  assert(msg.room === 'passport:7', `wrong room on client message: ${msg.room}`);
  assert(msg.passportId === '7', 'passportId not serialized');

  client.close();
  await new Promise((r) => setTimeout(r, 20));
  wss.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));

  console.log('end-to-end OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
