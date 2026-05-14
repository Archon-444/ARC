# MILESTONE — W8 / W9 / W10 / W11 / W12 consolidation + hardening

**Branch:** `claude/trust-layer-agents-sNcay`
**Range:** `1eae565..HEAD` — 21 commits past the W5–W7 milestone tip
**Date captured:** 2026-05-14 (UTC)
**Status:** in-tree gates green; deferrals documented; hardening items land in commits 2–5 of this milestone.

## Why this doc exists

External review of the pushed branch flagged that five W slices (W8 Passport, W9 Reputation + AttestationRegistry + first schemas, W10 MENA schemas + Validation hook + editorial deep tier, W11 public trust surface + legacy redirect, W12 MENA evidence object + load test + security review) shipped without a captured milestone gate. The W5–W7 milestone (`1eae565`) was the last consolidation; everything since then is documented in `STRATEGIC_PIVOT.md` but not evidenced.

This milestone closes that gap retroactively and lands four hardening items the review identified:

1. **Schema body validators** in `@arc/attestations` — close the "verifiable signature over nonsense" gap (production signing through the trust-api must validate ranges before signing).
2. **Adapter-swap operational runbook** for `ArcPassport.setIdentityAdapter()` — the contract supports it and tests prove it, but the operator-side procedure was not documented.
3. **Registry-permissive / trust-api-opinionated** posture — `AttestationRegistry` accepts any `bytes32 schemaId` by design; consumers must maintain a canonical allowlist. Documented + code-shipped.
4. **`@arc/attestations` `package.json` description sync** — stale wording said MENA schemas land "in W10"; they shipped.

This is a documentation + evidence + hardening commit set. The five product weeks (W8–W12) are already in tree; nothing about the product changes here.

## In tree on this branch

### W8 — `ArcPassport` + `ArcIdentityAdapter` + `@arc/passport-sdk`

| Commit | Slice |
|---|---|
| `7e031e7` | `IERC8004Identity.sol` interface + `ArcIdentityAdapter.sol` (4015B) + 18-spec Hardhat suite + offline `check-passport.js` |
| `e3bc9b3` | `ArcPassport.sol` (5091B) — soulbound passport, counsel attestation hook, swap-without-state-migration adapter pointer + 26-spec integration suite |
| `9c19b5c` | `@arc/passport-sdk` TS workspace — viem-typed reads/writes + ARC_TESTNET chain export + 8-spec stubbed-RPC test |
| `84ccf5e` | Atomic deploy script + ProfileRegistry migration helper + `contracts/docs/PASSPORT.md` runbook |
| `84178fc` | Docs refresh |

### W9 — Reputation + AttestationRegistry + first schemas

| Commit | Slice |
|---|---|
| `44ae190` | `IERC8004Reputation.sol` + `ArcReputationAdapter.sol` (2865B) — single-signer feedback, deterministic id, per-subject pagination + 20-spec Hardhat suite + generalized `check-contracts.js` |
| `270f4cf` | `AttestationRegistry.sol` (4016B) — EIP-712 dataHash anchoring, revocable, per-(subject, schemaId) index + 24-spec Hardhat suite |
| `93b53ff` | `@arc/attestations` workspace — counsel.kyb.v1, editorial.review.v1, treasury.policy.v1 schemas + `signAttestation` + `verifyAttestation` + 4 round-trip groups |
| `ff3bbb1` | Docs refresh |

### W10 — MENA schemas + Validation hook + editorial deep tier

| Commit | Slice |
|---|---|
| `7da0159` | `token.suitability.v1` (DFSA-mapped) + `stablecoin.reserves.v1` (ADGM FRT-mapped) schemas with nested-struct tamper-detection round-trip |
| `70b905a` | `IERC8004Validation.sol` + `ArcValidationAdapter.sol` (3960B) — narrow single-signer validations, `isValid` independent of `outcome`, revocable |
| `397f1ab` | Editorial deep tier live: `POST /v1/trust/read/deep` settles $0.05, Haiku 4.5 commentary with prompt caching, TTL response cache, deterministic stub fallback |
| `709caa2` | Docs refresh |

### W11 — Public trust surface + legacy quarantine

| Commit | Slice |
|---|---|
| `929e993` | `/trust/[target]`, `/passport/[address]`, `/agents`, `/docs` routes + `lib/trust-surface.ts` discriminated-union helpers |
| `3f8abb9` | `middleware.ts` 308 redirect for 8 legacy prefixes + `/legacy` explainer + footer rewrite |
| `4697b44` | `.eslintrc.json` armed `no-restricted-imports` rule + `docs/w11-followups.md` (scoped deferral of the mass file move) |
| `4a068dc` | Docs refresh |

### W12 — MENA evidence object + load test + security review

| Commit | Slice |
|---|---|
| `93d9627` | `packages/attestations/scripts/demo-mena.ts` + `docs/demo-mena.md` — composes the 5-schema `arc.evidence.mena.v1` envelope |
| `3906d3f` | `apps/trust-api/scripts/smoke-load.ts` + `docs/load-tests/w12-baseline.json` — autocannon at 10rps, SLO-gated |
| `400d52e` | `apps/trust-api/docs/security-review-w12.md` — 13 findings (10 MITIGATED + 2 ACCEPT-WITH-DOCS + 1 OPERATOR RESPONSIBILITY + 0 OPEN) |
| `82b112a` | Docs refresh — 90-day plan complete |

## Verification evidence

Every gate captured to `MILESTONE/test-outputs/` (continuous numbering 09–20). Sentinels per file in [`MILESTONE/test-outputs/README-w8-w12.md`](./MILESTONE/test-outputs/README-w8-w12.md).

| # | Gate | Captured log | Sentinel observed |
|---|---|---|---|
| 9 | `npm run check-passport-contracts` | [`09-check-passport-contracts.txt`](./MILESTONE/test-outputs/09-check-passport-contracts.txt) | `check-passport OK` · adapter 4015B · passport 5091B |
| 10 | `type-check + build:passport-sdk` | [`10-type-check-passport-sdk.txt`](./MILESTONE/test-outputs/10-type-check-passport-sdk.txt) | exit 0; dist emitted |
| 11 | `test:passport-sdk` | [`11-test-passport-sdk.txt`](./MILESTONE/test-outputs/11-test-passport-sdk.txt) | `passport-sdk OK` (8 specs) |
| 12 | `npm run check-trust-contracts` | [`12-check-trust-contracts.txt`](./MILESTONE/test-outputs/12-check-trust-contracts.txt) | `check-contracts OK` across 4 groups (passport 4015+5091 · reputation 2865 · attestations 4016 · validation 3960) |
| 13 | `type-check + build:attestations` | [`13-type-check-attestations.txt`](./MILESTONE/test-outputs/13-type-check-attestations.txt) | exit 0; 5 schemas emitted to dist |
| 14 | `test:attestations` | [`14-test-attestations.txt`](./MILESTONE/test-outputs/14-test-attestations.txt) | `attestations OK` after 5 round-trip groups |
| 15 | `smoke:trust-api:paid-mock` | [`15-smoke-trust-api-paid-mock.txt`](./MILESTONE/test-outputs/15-smoke-trust-api-paid-mock.txt) | `paid-mock OK` with `[deep-paid]` + `[deep-cache-hit]` |
| 16 | `type-check:web` (W11 surface filter) | [`16-type-check-web.txt`](./MILESTONE/test-outputs/16-type-check-web.txt) | **Zero TS errors in W11 trust-surface files.** Exit code 2 from pre-existing unrelated errors in `hooks/useRealTimeActivity.ts`, `hooks/useTokenFactory.ts`, `lib/auth-middleware.ts`, `lib/performance.ts`, `lib/rarity/calculator.ts`, `lib/wallet-signature.ts` — none introduced or touched by W8–W12. Cleanup belongs to the deferred W11 codemod. |
| 17 | `demo:mena --out` | [`17-demo-mena-envelope.json`](./MILESTONE/test-outputs/17-demo-mena-envelope.json) | `kind: "arc.evidence.mena.v1"` · 5 schemas · `summary.allVerified: true` |
| 18 | envelope summary script | [`18-demo-mena-summary.txt`](./MILESTONE/test-outputs/18-demo-mena-summary.txt) | `demo-mena OK schemas=counsel.kyb.v1,editorial.review.v1,treasury.policy.v1,token.suitability.v1,stablecoin.reserves.v1` |
| 19 | `smoke:load` 10s × 10rps | [`19-smoke-load.json`](./MILESTONE/test-outputs/19-smoke-load.json) | `overall_slo_ok: true`; per-route p99 within budget |
| 20 | `smoke:load` stdout | [`20-smoke-load-stdout.txt`](./MILESTONE/test-outputs/20-smoke-load-stdout.txt) | `[smoke-load] OK: all routes within SLO.` |

### Inlined sentinels (last few lines from each)

**12 — trust-contracts compile across 4 groups:**
```
[passport]    ArcIdentityAdapter 4015B · ArcPassport 5091B
[reputation]  ArcReputationAdapter 2865B
[attestations] AttestationRegistry 4016B
[validation]  ArcValidationAdapter 3960B
check-contracts OK
```

**14 — attestations round-trip across 5 schemas:**
```
[counsel.kyb.v1]      sign + verify + tamper-detect + wrong-signer-detect OK
[editorial.review.v1] sign + verify + tamper-detect + wrong-signer-detect OK
[treasury.policy.v1]  sign + verify + tamper-detect + wrong-signer-detect OK
[token.suitability.v1] sign + verify + tamper-detect + wrong-signer-detect OK
[stablecoin.reserves.v1] sign + verify + tamper-detect + wrong-signer-detect OK
attestations OK
```

**15 — paid-mock with deep-paid + deep-cache-hit:**
```
[deep-paid]      200 verdict=do-not-engage source=stub
[deep-cache-hit] 200 cache.hit=true generatedAt preserved
paid-mock OK
```

**19/20 — load test summary:**
```
overall_slo_ok=true
  health:           rps=10.0 p50=2ms p95~=19ms p99=22ms errors=0
  passport:         rps=10.0 p50=2ms p95~= 9ms p99= 9ms errors=0
  trust-read-quote: rps=10.1 p50=3ms p95~=20ms p99=22ms errors=0
[smoke-load] OK: all routes within SLO.
```

## Hardening items (commits 2–5 of this milestone)

| Commit | Item | Source file(s) |
|---|---|---|
| 2 | Schema body validators (5 of them) + `signAttestation` `validator?` plumbing + tests + demo-mena pre-sign validation | `packages/attestations/src/validate.ts`, `src/sign.ts`, `src/index.ts`, `test/validate.test.ts`, `scripts/demo-mena.ts` |
| 3 | Adapter-swap operational runbook | `contracts/docs/ADAPTER_SWAP_RUNBOOK.md` |
| 4 | Registry-permissive / trust-api-opinionated docs + canonical schema-id allowlist module | `contracts/contracts/attestations/AttestationRegistry.sol` (header note), `apps/trust-api/src/sources/attestation-schemas.ts`, `apps/trust-api/docs/attestation-schemas.md` |
| 5 | `@arc/attestations` package.json description sync | `packages/attestations/package.json` |

Each hardening commit re-runs and re-captures only the gates it can plausibly affect (commit 2 re-captures 13 + 14; the rest are docs-only and do not re-capture).

## What is NOT in this milestone (open deferrals)

| Item | Reason | Tracker |
|---|---|---|
| Live $0.01 Base USDC settlement tx | No funded Base mainnet wallet wired into the dev environment | `apps/trust-api/docs/known-live-runs.md` |
| `docker build` from a Docker-capable host | No Docker daemon | `apps/mcp-server/DEPLOY.md` |
| `fly deploy` of the MCP server + post-deploy `/health` smoke | Operator-side | `apps/mcp-server/DEPLOY.md` |
| `ARC_MCP_PAYER_PRIVATE_KEY` + `ARC_ANTHROPIC_API_KEY` funded | Operator-side | `apps/mcp-server/README.md`, `apps/trust-api/src/config.ts` |
| Coinbase x402 Bazaar submission | Requires hosted URLs | `docs/bazaar-listing.md` |
| Full Hardhat test suite (109 specs across 4 groups) | Requires internet to fetch solc 0.8.24 | `contracts/docs/PASSPORT.md` |
| Arc testnet deploy of Passport / Reputation / Attestation / Validation adapters | Operator-side; runbook lives at `contracts/docs/PASSPORT.md` + the new `ADAPTER_SWAP_RUNBOOK.md` | — |
| Trust-api reconfigure to consume deployed Passport via `@arc/passport-sdk` + `@arc/attestations` | Forward-pointing scope in the plan; lands in the next session | Plan file W8–W12 milestone § Workstream 6 |
| W11 codemod (`frontend` → `apps/web`, `backend` → `apps/indexer`, marketplace pages → `legacy-primitives/`) | Highest-blast-radius change in the 90-day plan; risk-tolerance-bound | `docs/w11-followups.md` |
| Counsel review of W9/W10 attestation schemas (`counsel.kyb.v1`, `token.suitability.v1`, `stablecoin.reserves.v1`) | Counsel-side | Source files marked "counsel-review draft" |
| Third-party security audit | Post-90-day hardening | `apps/trust-api/docs/security-review-w12.md` closing section |

None of these block the next slice (trust-api → real reads), which depends only on operator-side Arc testnet deploys.

## What the next slice unblocks

This milestone closes with the trust-api still serving the placeholder passport body. The next slice (separate session, separate commits) wires trust-api to consume real on-chain state through `@arc/passport-sdk` + a thin AttestationRegistry reader. Scope is in the plan file under the "W8–W12 milestone § Workstream 6 — Forward-pointing scope" section.

Specifically: new workspace `@arc/attestation-reader`, new `apps/trust-api/src/sources/passport.ts`, repointed `apps/trust-api/src/routes/passport.ts`, new `apps/trust-api/src/routes/attestations.ts`, four new env vars (`ARC_PASSPORT_ADDRESS`, `ARC_ATTESTATION_REGISTRY_ADDRESS`, `ARC_RPC_URL`, `ARC_IPFS_GATEWAY`). Acceptance gate: with env vars set against deployed contracts the route returns real data; with them unset the route falls back to placeholder.

## Reproducibility

The full regeneration recipe lives in [`MILESTONE/test-outputs/README-w8-w12.md`](./MILESTONE/test-outputs/README-w8-w12.md). All 12 commands must exit 0 (or, for #16, exhibit zero W11-file errors per the documented tolerance) and each log must contain its sentinel.
