# Known live x402 settlements

This file is the operational ledger of real Base mainnet USDC settlements
through the public x402 facilitator against `apps/trust-api`. It exists
because the W4 acceptance gate is **"a real cent moves on Base mainnet
via the live facilitator and returns a tx hash in `X-Payment-Response`,"**
and we want a single human-readable artifact that proves it.

## How to add a row

1. From a funded host (a wallet with ≥ $0.01 USDC + Base mainnet gas):

   ```bash
   RUN_LIVE=1 \
     ARC_TEST_PRIVATE_KEY=0x... \
     ARC_PAYTO=0x... \
     ARC_TRUST_API_URL=https://trust.example.com \
     npm --workspace @arc/trust-api run smoke:paid-live
   ```

2. The script signs an EIP-3009 `transferWithAuthorization` for $0.01
   USDC, sends it to the running `trust-api`, waits for the response,
   and prints the decoded `X-Payment-Response` payload — including the
   on-chain `transaction` hash returned by the facilitator's `/settle`.

3. Add a row below with the date (UTC), the network, the payer address,
   the `payTo` recipient, the amount, the transaction hash, the
   `trust-api` commit SHA the run targeted, and any operational notes
   (latency observed, retries, anomalies).

The script never logs the private key; this file never contains keys.
**Do not paste raw `X-PAYMENT` envelopes here** — they encode the
signed authorization that, replayed against a non-revoked nonce on a
different facilitator, would settle again.

## Ledger

| Date (UTC) | Network | Payer | Pay-to | Amount | Tx hash | trust-api commit | Notes |
|---|---|---|---|---|---|---|---|
| 2026-05-13 | base-mainnet | _deferred_ | _deferred_ | `$0.01` | _deferred_ | `64f3dfe` (W7 docs tip) | **Deferred for the W5–W7 milestone gate.** No funded Base mainnet wallet wired into the dev environment for this milestone. `smoke:paid-mock` (W5) + structural paid inspector test (W7.2) stand in as the verification surface; live `smoke:paid-live` will be fired before W8 closes. See [`docs/milestones/W5_W7.md`](../../../docs/milestones/W5_W7.md). |
| _pending_ | base-mainnet | `0x…` | `0x…` | `$0.01` | `0x…` | `14a2018` (W5 spine) | First post-W5 live run; capture latency p50/p95. Will replace the deferral row above. |

## Status

- **W4 gate** — open. Plan calls for at least one row to be added
  before W6 (`apps/mcp-server`) starts. The plan also explicitly
  allows deferring the live run with a documented reason (so this is
  the gate, not a blocker); the row is the preferred outcome.
- **W5–W7 milestone** — deferral row appended on 2026-05-13. The
  in-tree gates captured in
  [`docs/milestones/test-outputs/`](../../../docs/milestones/test-outputs/) stand
  in for the live tx until a funded host is available.
- **W12 hardening** — once we have ≥ 10 live runs, fold p50/p95 latency
  and any settle-failure incidents into the W12 load-test report.
