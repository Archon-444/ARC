# MILESTONE — W5 / W6 / W7 consolidation

**Branch:** `claude/trust-layer-agents-sNcay`
**Range:** `f349785..64f3dfe` (11 commits past the W4 baseline)
**Date captured:** 2026-05-13 (UTC)
**Status:** in-tree gates green; deferrals documented below.

## Why this doc exists

Five W7 commits landed on top of the four W5 commits without an
intervening pause. W7 expanded scope (Streamable HTTP transport,
signing-payer mode, `use-arc-trust` skill, Fly artifacts, Bazaar
listing payload) faster than originally sequenced. W8 introduces
Solidity contracts — a longer-cycle surface than anything we've
shipped so far — so before opening that work we pause and create a
single legible record:

- What is actually on this branch.
- Which gates are green (with captured evidence).
- What is explicitly deferred (with reasons, not silence).

This is a documentation + evidence commit. No code in `apps/*` or
`packages/*` changed.

## In tree on this branch

### W5 — trust-api hardening (4 commits)

| Commit | Slice |
|---|---|
| `f9d14ff` | Normalize npm workspaces; drop W2/W3 symlink workarounds + ambient stubs. |
| `a74e581` | Fix the `X-Payment-Response` race condition. Sync settlement flow: verify → wrap `res.json` → handler → settle → respond. `settleTimeoutMs` (default 30s) + `quoteOnly: true` for placeholder routes. |
| `14a2018` | Trust-api production spine: `APIError`, request IDs, JSON one-line-per-request logger, per-IP global + per-paid-route rate limits, `/v1/trust/read/deep` 501 placeholder behind `quoteOnly`. |
| `fb07567` | MENA evidence schema drafts (`token.suitability.v1`, `stablecoin.reserves.v1`); `known-live-runs.md`; trust-api README refresh. Counsel-review draft markers throughout. |

### W6 — stdio MCP server (1 commit)

| Commit | Slice |
|---|---|
| `8a33b1c` | New workspace `apps/mcp-server/` with three tools (`arc_trust_read`, `arc_passport_get`, `arc_search`). Low-level `Server` + `setRequestHandler` so tools advertise plain JSON Schema. Programmatic Inspector test boots a stub trust-api, spawns the built server over stdio, asserts five invariants. Stub-quote posture: no wallet, surfaces 402 quote to the agent. |

### W7 — distribution surface (4 commits + docs)

| Commit | Slice |
|---|---|
| `b2ea299` | Streamable HTTP transport: new `src/transport-http.ts` wires `StreamableHTTPServerTransport` into Express with sessionful per-`Mcp-Session-Id` transports, `/health`, optional bearer auth. `MCP_TRANSPORT=http` selects it; stdio remains default. New `inspector-http.spec.ts` reruns the five invariants in-process. Test helpers extracted to `test/helpers/{stub-trust-api,assertions}.ts`. |
| `a9c99e5` | Signing-payer mode: `ARC_MCP_PAYER_PRIVATE_KEY` enables sign+retry on 402 via `@arc/x402-client.buildEvmExactTypedData` + viem. Tagged-union return surfaces `txHash` on success and `settleError` on settle failure. `@arc/x402-client` rebuilt to a CJS `dist/` so plain-node consumers (compiled mcp-server) can load it; trust-api still works via Node interop. New `inspector-paid.spec.ts` exercises both paid and settle-fail paths. |
| `db6701d` | `skills/use-arc-trust/` bundle: `SKILL.md` teaches the trust-read gate (composite ≥ 60 default; surface lowest factor on refusal; hard stop on `payment_required` or `isError`). `README.md` is install + operator guidance, intentionally not hardcoding installer commands. |
| `2d81b5e` | Deploy artifacts: `apps/mcp-server/{Dockerfile, .dockerignore, fly.toml, DEPLOY.md}`. Coinbase x402 Bazaar listing payload draft at `docs/bazaar-listing.md` (targets trust-api endpoints; mcp-server documented as recommended MCP client). `apps/mcp-server/README.md` rewritten for two transports + two postures. |
| `64f3dfe` | Docs refresh: `STRATEGIC_PIVOT.md` + top-level `README.md` reflect W7 landing; pointer updated to W8 next. |

## Verification evidence

Every gate command was captured to `MILESTONE/test-outputs/`. Each
file is reproducible via the regen block in
[`MILESTONE/test-outputs/README.md`](./MILESTONE/test-outputs/README.md).

| # | Gate | Captured log | Sentinel observed |
|---|---|---|---|
| 1 | `npm run type-check:trust-core` | [`01-type-check-trust-core.txt`](./MILESTONE/test-outputs/01-type-check-trust-core.txt) | exit 0; no `error TS` |
| 2 | `npm run type-check:x402-client` + `build:x402-client` | [`02-type-check-x402-client.txt`](./MILESTONE/test-outputs/02-type-check-x402-client.txt) | exit 0 (both passes); CJS dist emitted |
| 3 | `npm run type-check:trust-api` | [`03-type-check-trust-api.txt`](./MILESTONE/test-outputs/03-type-check-trust-api.txt) | exit 0; no `error TS` |
| 4 | `npm run type-check:mcp-server` + `build:mcp-server` | [`04-type-check-mcp-server.txt`](./MILESTONE/test-outputs/04-type-check-mcp-server.txt) | exit 0 (both passes); dist emitted |
| 5 | `npm --workspace @arc/trust-core test` | [`05-test-trust-core.txt`](./MILESTONE/test-outputs/05-test-trust-core.txt) | `Tests: 33 passed, 33 total` |
| 6 | `npm run smoke:trust-api` | [`06-smoke-trust-api.txt`](./MILESTONE/test-outputs/06-smoke-trust-api.txt) | `smoke OK` |
| 7 | `npm run smoke:trust-api:paid-mock` | [`07-smoke-trust-api-paid-mock.txt`](./MILESTONE/test-outputs/07-smoke-trust-api-paid-mock.txt) | `paid-mock OK` (paid · settle-fail · deep-quote · deep-501) |
| 8 | `npm run test:mcp-server` | [`08-test-mcp-server.txt`](./MILESTONE/test-outputs/08-test-mcp-server.txt) | `inspector OK` · `inspector-http OK` · `inspector-paid OK` |

### Inlined sentinels (last few lines from each log)

**05 — trust-core scoring suite:**
```
Test Suites: 1 passed, 1 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        1.282 s
Ran all test suites.
```

**06 — trust-api smoke (no-payment / quote shape):**
```
  POST /v1/trust/read without payment: 402
  POST /v1/trust/read/deep without payment (W5 placeholder): 402
smoke OK
```

**07 — trust-api paid-mock (verify + settle + failure + deep-quote-only):**
```
  [paid] 200 overallScore=6 settle.tx=0xdeadbeefdead…
  [settle-fail] 402 error="settlement failed: stub: settle rejected (insufficient gas)"
  [deep-quote] 402 maxAmountRequired=50000
  [deep-501] 501 no facilitator calls, no X-Payment-Response
paid-mock OK
```

**08 — mcp-server three inspector specs:**
```
inspector OK
inspector-http OK
inspector-paid OK
```

## What is NOT in this milestone (open deferrals)

| Item | Reason | Tracker |
|---|---|---|
| Live $0.01 Base USDC settlement (real on-chain tx hash) | No funded Base mainnet wallet wired into this dev environment for the milestone gate. `smoke:paid-mock` (W5) + structural paid inspector test (W7.2) stand in. Will be fired before W8 closes. | Deferral row in [`apps/trust-api/docs/known-live-runs.md`](./apps/trust-api/docs/known-live-runs.md) |
| `docker build -f apps/mcp-server/Dockerfile .` | No Docker daemon in this dev environment. Dockerfile + `.dockerignore` are in tree, syntactically reviewed, multi-stage. | `apps/mcp-server/DEPLOY.md` |
| `fly deploy` of the MCP server + post-deploy `/health` smoke | Operator-side: requires Fly app name, secrets (`ARC_TRUST_API_URL`), and DNS. | `apps/mcp-server/DEPLOY.md` |
| `ARC_MCP_PAYER_PRIVATE_KEY` funded on Base mainnet | Optional for the listing; required for the "click and run" Bazaar demo. Funding is an operator-side step. | `apps/mcp-server/README.md` posture table |
| Coinbase x402 Bazaar submission | Requires hosted URLs above. Listing payload is drafted and ready. | [`docs/bazaar-listing.md`](./docs/bazaar-listing.md) Status table |
| Counsel review of MENA schema drafts | Required before any institutional pitch. Drafts marked "counsel-review draft" throughout. | `apps/trust-api/src/schemas/` headers, `docs/mena-suitability-evidence.md` |

None of these block W8. They are operator + counsel surfaces; the
in-tree gates (above) are sufficient to validate the operational core
before contract work opens.

## What W8 unblocks

`ArcPassport.sol` + `ArcIdentityAdapter.sol` on Arc testnet, with
`packages/passport-sdk` for typed reads/writes and a `ProfileRegistry`
migration helper. Once W8 ships, `arc_passport_get` returns real
on-chain data instead of the trust-api placeholder, flowing through
the trust-api → mcp-server pipeline that this milestone proves works
end-to-end.

## Reproducibility

To regenerate the evidence from a clean checkout of this branch:

```bash
git checkout claude/trust-layer-agents-sNcay
npm install
mkdir -p MILESTONE/test-outputs

npm run type-check:trust-core   > MILESTONE/test-outputs/01-type-check-trust-core.txt   2>&1
npm run type-check:x402-client  > MILESTONE/test-outputs/02-type-check-x402-client.txt  2>&1
npm run type-check:trust-api    > MILESTONE/test-outputs/03-type-check-trust-api.txt    2>&1
npm run type-check:mcp-server   > MILESTONE/test-outputs/04-type-check-mcp-server.txt   2>&1

npm --workspace @arc/trust-core test  > MILESTONE/test-outputs/05-test-trust-core.txt           2>&1
npm run smoke:trust-api               > MILESTONE/test-outputs/06-smoke-trust-api.txt           2>&1
npm run smoke:trust-api:paid-mock     > MILESTONE/test-outputs/07-smoke-trust-api-paid-mock.txt 2>&1

npm run build:x402-client                 >> MILESTONE/test-outputs/02-type-check-x402-client.txt 2>&1
npm --workspace @arc/mcp-server run build >> MILESTONE/test-outputs/04-type-check-mcp-server.txt  2>&1
npm run test:mcp-server                   >  MILESTONE/test-outputs/08-test-mcp-server.txt       2>&1
```

All eight commands must exit 0 and each log must contain its sentinel
per the table above. If any command fails, fix the underlying issue in
a separate prior commit and re-run; this milestone re-captures fresh
logs after the fix.
