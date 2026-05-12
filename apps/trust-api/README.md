# @arc/trust-api

Pay-per-call trust-read API. Facilitator-backed x402 paywall on Base mainnet USDC, V1 scoring from `@arc/trust-core`.

## V0 status (W3)

- `GET  /v1/health` — uptime + service identity, free.
- `GET  /v1/passport/:address` — free placeholder. Returns live data starting W8 (`ArcPassport.sol` on Arc testnet).
- `POST /v1/trust/read` — paywalled at $0.01 via x402, returns `scoreV1` of the target address. **Data source is a deterministic stub** so the paywall + facilitator integration can be smoke-tested end-to-end; the real source plugs in W8-W10.

`POST /v1/trust/read/deep` ($0.05) ships in W10 with the Anthropic-generated editorial commentary (purpose-built prompt cache; not extracted from the existing Anthropic route in the frontend).

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

### `npm run smoke:paid-mock` — full wire protocol (W4 gate, no keys)

```bash
npm --workspace @arc/trust-api run smoke:paid-mock
```

Asserts the full paid round-trip against a stubbed facilitator:

1. 402 quote with the right `maxAmountRequired`.
2. EIP-712 typed-data is built correctly for `TransferWithAuthorization` on Base mainnet USDC.
3. `X-PAYMENT` header decodes; middleware calls `verify` exactly once.
4. Handler returns 200 with a `scoreV1` assessment.
5. `X-Payment-Response` header is attached after the handler finishes, with a base64-encoded `SettleResponse` containing `success: true` and the stub `transaction` hash.

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

## Architecture pointers

- `src/index.ts` — Express bootstrap.
- `src/config.ts` — env loading.
- `src/routes/{health,passport,trust}.ts` — route handlers.
- `src/sources/heuristic.ts` — V0 stub data source. Replace at W8 with `@arc/passport-sdk` reads and `@arc/attestations` lookups.
- Paywall: `@arc/x402-client/requirePayment`, configured per call via `buildRequirement(cfg, $0.01, resource)`.
