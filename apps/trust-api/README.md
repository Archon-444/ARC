# @arc/trust-api

Pay-per-call trust-read API. Facilitator-backed x402 paywall on Base mainnet USDC, V1 scoring from `@arc/trust-core`.

## V0 status (W3)

- `GET  /v1/health` — uptime + service identity, free.
- `GET  /v1/passport/:address` — free placeholder. Returns live data starting W8 (`ArcPassport.sol` on Arc testnet).
- `POST /v1/trust/read` — paywalled at $0.01 via x402, returns `scoreV1` of the target address. **Data source is a deterministic stub** so the paywall + facilitator integration can be smoke-tested end-to-end; the real source plugs in W8-W10.
- `POST /v1/trust/read/deep` — W5 placeholder. Without `X-PAYMENT` returns the 402 quote at $0.05 (50000 base units) so clients can bind to the price now. With `X-PAYMENT` the middleware skips verify+settle entirely (`quoteOnly: true`) and the handler returns 501 with `{ error, etaWeek: 10, notice }`. No money moves until W10 editorial commentary lands.

The Anthropic-generated editorial commentary behind the deep tier ships in W10 with a purpose-built prompt cache (not extracted from the existing Anthropic route in the frontend).

## Settlement

| | |
|---|---|
| Scheme | `exact` |
| Network | `base-mainnet` (chain id `8453`) |
| Asset | USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals) |
| Facilitator | `https://x402.org/facilitator` (Coinbase-operated, no API key needed for Base mainnet free tier) |
| Tier | `$0.01` per call = `maxAmountRequired: "10000"` base units |

No custom EIP-3009 verification / submission in V0 — the facilitator owns that. Switch to a CDP-keyed or self-hosted facilitator by setting `ARC_X402_FACILITATOR_URL` and `ARC_X402_FACILITATOR_API_KEY`.

## Environment

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3030` | HTTP port |
| `ARC_PAYTO` | _(required for paid routes)_ | Recipient address for USDC settlement on Base |
| `ARC_X402_FACILITATOR_URL` | `https://x402.org/facilitator` | Override for CDP or self-hosted facilitator |
| `ARC_X402_FACILITATOR_API_KEY` | _(unset)_ | Bearer token for non-public facilitators |
| `ARC_X402_NETWORK` | `base-mainnet` | Set for testnet experiments |
| `ARC_X402_ASSET` | Base mainnet USDC | Override if settling in a different ERC-20 |

## Run

```bash
# install workspace deps from repo root once (registry blocker permitting)
npm install

# from repo root
npm --workspace @arc/trust-api run dev
```

## Smoke (3 levels)

### `npm run smoke` — quote-side only (W3 gate)

```bash
ARC_PAYTO=0x... npm --workspace @arc/trust-api run smoke
```

Asserts:

1. `GET /v1/health` → 200, returns `status: "ok"`.
2. `GET /v1/passport/:address` → 200, returns the W3 placeholder.
3. `POST /v1/trust/read` without `X-PAYMENT` → 402 with a well-formed `accepts[0]` matching the configured network, asset, and `maxAmountRequired` of `10000` (i.e. $0.01 in USDC base units).

### `npm run smoke:paid-mock` — full wire protocol (W5, three scenarios)

```bash
npm --workspace @arc/trust-api run smoke:paid-mock
```

Asserts the full paid round-trip against a stubbed facilitator across three scenarios:

**(A) Success path** — verify + settle return OK:

1. 402 quote with the right `maxAmountRequired`.
2. EIP-712 typed-data is built correctly for `TransferWithAuthorization` on Base mainnet USDC.
3. `X-PAYMENT` decodes; middleware calls `verify` exactly once.
4. Handler returns 200 with a `scoreV1` assessment.
5. `facilitator.settle()` is called **synchronously inside the response lifecycle** (no `res.on('finish')` race). `X-Payment-Response` is attached on the same flush as the 200 body, base64-encoding a `SettleResponse` with `success: true` and the stub `transaction` hash.

**(B) Settle-failure path** — `facilitator.settle()` rejects:

1. The middleware drops the handler's 200 body.
2. The response becomes 402 with `{ x402Version: 1, error: "settlement failed: ...", accepts: [...] }`.
3. `X-Payment-Response` still flows, carrying `{ success: false, errorReason }` so the client can retry with a fresh nonce.

**(C) `quoteOnly` placeholder path** — the deep-tier route:

1. `POST /v1/trust/read/deep` without `X-PAYMENT` returns the 402 quote with `maxAmountRequired: "50000"` ($0.05).
2. With `X-PAYMENT` the middleware skips verify and settle entirely (`facilitator.verifyCalls` and `settleCalls` unchanged) and the handler returns 501.
3. No `X-Payment-Response` header is emitted. No money moves.

No keys, no network, no spending. This is what CI runs by default.

### `npm run smoke:paid-live` — real USDC on Base mainnet (W4 acceptance gate)

```bash
RUN_LIVE=1 \
  ARC_TEST_PRIVATE_KEY=0x... \
  ARC_PAYTO=0x... \
  ARC_TRUST_API_URL=https://trust.example.com \
  npm --workspace @arc/trust-api run smoke:paid-live
```

Without `RUN_LIVE=1` the script exits 0 with a notice; with it, it signs a real EIP-3009 `transferWithAuthorization` for USDC on Base mainnet via viem, sends `X-PAYMENT` to the running trust-api, and asserts the live facilitator returns a real `transaction` hash in `X-Payment-Response`.

Cost per run: **$0.01 USDC + gas**. Each run uses a fresh random nonce.

## Known live runs

The W4 acceptance gate ("real USDC settles on Base mainnet via the live facilitator") is captured in [`docs/known-live-runs.md`](docs/known-live-runs.md). Each entry pins a `(date, payer, payTo, amount, tx hash, commit)` tuple so we can prove a real round-trip from a funded host. Add a row each time `smoke:paid-live` settles.

## Architecture pointers

- `src/index.ts` — Express bootstrap. Wiring order: request-id → helmet → cors → globalLimiter → body → compression → logger → routes → 404 → errorHandler.
- `src/config.ts` — env loading.
- `src/errors.ts` + `src/middleware/error.ts` — `APIError` shape ported from `backend/`, JSON error response with `requestId`.
- `src/middleware/request-id.ts` — `x-request-id` echo / UUID generate.
- `src/middleware/logger.ts` — structured one-line-per-request JSON access log, includes `payer` when the paywall has verified.
- `src/middleware/rate-limit.ts` — global per-IP limiter on `/v1/*` (defaults `RATE_LIMIT_WINDOW_MS=60_000`, `RATE_LIMIT_MAX=120`) plus a paid-route limiter keyed off `req.x402.payer ?? ip` (defaults `PAID_RATE_LIMIT_WINDOW_MS=60_000`, `PAID_RATE_LIMIT_MAX=30`).
- `src/routes/{health,passport,trust,trust-deep}.ts` — route handlers. `trust-deep` is the W5 `quoteOnly: true` placeholder; see [`docs/known-live-runs.md`](docs/known-live-runs.md) for live-settlement evidence on the $0.01 tier.
- `src/sources/heuristic.ts` — V0 stub data source. Replace at W8 with `@arc/passport-sdk` reads and `@arc/attestations` lookups.
- Paywall: `@arc/x402-client/requirePayment` — synchronous settle (verify → wrap `res.json` → handler → settle → respond) with a configurable `settleTimeoutMs` (default 30s) and a `quoteOnly` placeholder mode. JSON responses only; streaming/SSE/file downloads are out of scope for W5.

## Known deployments

| Environment | URL | First deploy | Operator notes |
|---|---|---|---|
| _pending W16_ | `https://arc-trust-api.fly.dev` (placeholder) | _pending_ | First Fly deploy. After `fly deploy --config apps/trust-api/fly.toml`, overwrite the `_pending_` cells with the actual URL and UTC date. Capture `curl <url>/v1/health` returning 200 + the 402 quote shape against `/v1/trust/read` in the operator notes column. |

How to add a row:

1. Run the Fly deploy per [`DEPLOY.md`](./DEPLOY.md).
2. Smoke: `curl https://<host>/v1/health` → 200; `curl -i -X POST https://<host>/v1/trust/read -H 'content-type: application/json' -d '{"target":"0x0000000000000000000000000000000000000001"}'` → 402 with the expected `accepts[]` quote.
3. Overwrite the row above with the live URL + UTC date + any operator notes (Arc-RPC configured? Anthropic key? load-test p99?).
4. Cross-reference: pin the URL in the root [`README.md`](../../README.md) "Status" section + capture the first live $0.01 settlement in [`docs/known-live-runs.md`](./docs/known-live-runs.md).
