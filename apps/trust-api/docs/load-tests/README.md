# trust-api load tests

This directory holds captured `smoke:load` reports. The W12 plan's
acceptance gate was *"load-test trust-api at 10rps"* — the structured
JSON reports here are the evidence.

## How to regenerate

From a clean tree:

```sh
npm --workspace @arc/trust-api run smoke:load
# or, with overrides:
ARC_LOAD_DURATION=30 ARC_LOAD_RATE=10 \
  ARC_LOAD_OUT=apps/trust-api/docs/load-tests/$(date -u +%Y%m%d).json \
  npm --workspace @arc/trust-api run smoke:load
```

The script (`apps/trust-api/scripts/smoke-load.ts`) boots `createApp()`
in-process on an ephemeral port, raises the W5 per-IP rate-limit window
+ max so the test measures handler latency (the limiter is still
present in the running app; the test is the only caller benefiting
from the higher ceiling), then fires `autocannon` at `overallRate: 10`
for `ARC_LOAD_DURATION` seconds against each of the three documented
routes:

| Route | Expected status | SLO (p95-ish, max non-`expectStatus` resp.) |
|---|---|---|
| `GET /v1/health` | 200 | p95 < 50ms, 0 errors |
| `GET /v1/passport/<addr>` | 200 | p95 < 100ms, 0 errors |
| `POST /v1/trust/read` (no payment) | 402 | p95 < 200ms, 0 errors |

> `autocannon` reports p50 / p97.5 / p99 / p99.9 — not p95 directly.
> The script's `latency_ms.p95` field reads p97.5 as the closest
> conservative proxy.

## W12 baseline (captured 2026-05-14)

[`w12-baseline.json`](./w12-baseline.json) — 10rps × 10s per route on
the dev environment. All three routes within SLO:

| Route | rps | p50 | p95~ | p99 | errors | SLO |
|---|---|---|---|---|---|---|
| `/v1/health` | 10.0 | 2ms | 17ms | 20ms | 0 | OK |
| `/v1/passport/<addr>` | 10.0 | 2ms | 9ms | 11ms | 0 | OK |
| `POST /v1/trust/read` (402) | 10.3 | 2ms | 29ms | 31ms | 0 | OK |

Read the JSON for the full breakdown including status-code
distribution per route. The 402 path runs the full W5 middleware chain
(request-id → helmet → cors → rate-limit → body → compression →
logger → paywall verify → handler) minus the facilitator round-trip;
the 30ms p99 is the rough wall-clock cost of that chain when the
quote is being formed.

## What this DOES validate

- The Express handler stack itself does not have a hidden quadratic
  or accidental sync-IO at moderate rps.
- The W5 sync-settle middleware behaves correctly under sustained
  load on the no-payment quote path (every request returns the same
  402 quote shape; zero error rate).
- The W5 structured JSON logger does not stall under sustained
  request churn (otherwise we would see p99 spikes).

## What this does NOT validate

- **Facilitator under load.** The paid path's settlement adds an
  outbound HTTPS call to the public x402 facilitator; load-testing
  that is a different concern (and goes through the real facilitator,
  not against a stub). The right place to test that is at the
  facilitator boundary, against a Coinbase staging environment or
  a controlled mock — not the trust-api handler.
- **The W10 editorial deep tier (`POST /v1/trust/read/deep`).** That
  route's latency is dominated by Haiku 4.5 inference plus prompt-cache
  hit/miss. The right way to measure it is with `ARC_ANTHROPIC_API_KEY`
  set against a small fixed cohort of targets so the response cache
  can be observed warming. The smoke-load script does not include it
  by default; load-testing inference is a W12.5 / W13 hardening
  concern.
- **Production rate-limit ceiling.** The test raises the W5 limiter
  to effectively unlimited for the bench server. The production rate
  limiter (per-IP 120/min global + per-payer 30/min paid) is what
  gates real traffic; sizing those ceilings is an operational tuning
  job once real agent traffic exists.

## Re-running the baseline

A fresh baseline is worth capturing when:

- The middleware chain in `apps/trust-api/src/index.ts` gains or
  loses a layer.
- A new dependency lands in `package.json` (Helmet, compression,
  rate-limit) that touches every request.
- Node major version changes.
- After hardening passes (e.g. the W12.3 security review).
