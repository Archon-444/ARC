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

## Smoke

```bash
ARC_PAYTO=0x... npm --workspace @arc/trust-api run smoke
```

The smoke script asserts:

1. `GET /v1/health` → 200, returns `status: "ok"`.
2. `GET /v1/passport/:address` → 200, returns the W3 placeholder.
3. `POST /v1/trust/read` without `X-PAYMENT` → 402 with a well-formed `accepts[0]` matching the configured network, asset, and `maxAmountRequired` of `10000` (i.e. $0.01 in USDC base units).

A real paid round-trip (signed EIP-3009 envelope, live facilitator settlement) is the W4 acceptance gate and lives in `test/paid.e2e.ts` once a funded test wallet is available.

## Architecture pointers

- `src/index.ts` — Express bootstrap.
- `src/config.ts` — env loading.
- `src/routes/{health,passport,trust}.ts` — route handlers.
- `src/sources/heuristic.ts` — V0 stub data source. Replace at W8 with `@arc/passport-sdk` reads and `@arc/attestations` lookups.
- Paywall: `@arc/x402-client/requirePayment`, configured per call via `buildRequirement(cfg, $0.01, resource)`.
