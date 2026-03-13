# Token activity broadcast

To make the launcher feel live, token trade and graduation events should be pushed to the WebSocket so the frontend can update in real time.

## How it works

- **WebSocket room**: Clients subscribe to `token:<address>` (e.g. via path `/ws/activity/token/0x...` or `subscribe` message with `room: "token:0x..."`).
- **Backend**: `broadcastTokenActivity(tokenAddress, event)` in `src/websocket/index.ts` sends a `token_activity` message to all clients in that room.
- **Internal API**: `POST /v1/activity/token/broadcast` accepts a JSON body and broadcasts it.

## Wiring events

Call the broadcast when you have a new token event (e.g. from a subgraph sync or chain listener):

1. **From a cron / indexer** (same host or allowed origin):
   ```bash
   curl -X POST http://localhost:3001/v1/activity/token/broadcast \
     -H "Content-Type: application/json" \
     -d '{"tokenAddress":"0x...","type":"buy","from":"0x...","to":"0x...","amount":"100","txHash":"0x..."}'
   ```

2. **From Node** (e.g. in a worker that polls subgraph or listens to chain):
   ```ts
   import { broadcastTokenActivity } from './websocket';
   broadcastTokenActivity(tokenAddress, { type: 'buy', from, to, amount, txHash, timestamp: Date.now() });
   ```

3. **From the same server**: Import `broadcastTokenActivity` from `../websocket` and call it when you process a new trade or graduation (e.g. in a route that fetches from subgraph and then broadcasts).

## Event shape

The frontend expects `data` with at least:

- `type`: `'buy' | 'sell' | 'graduation'`
- `tokenAddress`: string (optional; room is already token-specific)
- `from`, `to`, `amount`, `timestamp`, `txHash`: optional, for display

Any extra fields are passed through to the client.
