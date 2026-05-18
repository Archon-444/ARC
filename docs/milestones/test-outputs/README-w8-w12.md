# `docs/milestones/test-outputs/` — W5–W7 + W8–W12 evidence

Captured stdout/stderr from every consolidation milestone gate. Files
01–08 belong to the W5–W7 milestone (commit `1eae565`); files 09–20
belong to the W8–W12 milestone.

The numbering is continuous so that a single sorted `ls` of this
directory walks the timeline of the branch in order.

## Sentinels — W5–W7 (01–08)

See [`README.md`](./README.md) from the W5–W7 milestone if you need
the original sentinel table for files 01–08. They are intentionally
unmodified in this commit.

## Sentinels — W8–W12 (09–20)

| File | Gate | Sentinel observed |
|---|---|---|
| `09-check-passport-contracts.txt` | `npm run check-passport-contracts` | `passport/ArcIdentityAdapter.sol:ArcIdentityAdapter bytecode=4015B` · `passport/ArcPassport.sol:ArcPassport bytecode=5091B` · `check-passport OK` |
| `10-type-check-passport-sdk.txt` | `type-check:passport-sdk` + `build:passport-sdk` | exit 0; no `error TS`; build segment appended emits `dist/*.{js,d.ts}` |
| `11-test-passport-sdk.txt` | `test:passport-sdk` | `passport-sdk OK` after 8 stubbed-RPC specs |
| `12-check-trust-contracts.txt` | `check-trust-contracts` | `check-contracts OK` across passport (4015B + 5091B) · reputation (2865B) · attestations (4016B) · validation (3960B) |
| `13-type-check-attestations.txt` | `type-check:attestations` + `build:attestations` | exit 0; no `error TS`; build segment appended emits `dist/schemas/*.{js,d.ts}` for all 5 schemas |
| `14-test-attestations.txt` | `test:attestations` | `attestations OK` after 5 round-trip groups (counsel.kyb.v1 · editorial.review.v1 · treasury.policy.v1 · token.suitability.v1 · stablecoin.reserves.v1) |
| `15-smoke-trust-api-paid-mock.txt` | `smoke:trust-api:paid-mock` | `paid-mock OK`; `[deep-paid]` shows `200 verdict=do-not-engage source=stub`; `[deep-cache-hit]` shows `200 cache.hit=true generatedAt preserved` |
| `16-type-check-web.txt` | `type-check:web` | W11 trust-surface files (`app/{trust,passport,agents,docs,legacy}`, `lib/trust-surface.ts`, `middleware.ts`, `components/Footer.tsx`) have zero TS errors. **Exit code 2 is tolerated**: pre-existing unrelated errors persist in `hooks/useRealTimeActivity.ts`, `hooks/useTokenFactory.ts`, `lib/auth-middleware.ts`, `lib/performance.ts`, `lib/rarity/calculator.ts`, `lib/wallet-signature.ts`. None were introduced or touched by W8–W12; cleanup belongs to the deferred W11 codemod / a future hygiene pass. |
| `17-demo-mena-envelope.json` | `demo:mena --out` | `kind: "arc.evidence.mena.v1"` · `summary.attestationCount: 5` · `summary.allVerified: true` · schemas: counsel.kyb.v1, editorial.review.v1, treasury.policy.v1, token.suitability.v1, stablecoin.reserves.v1 |
| `18-demo-mena-summary.txt` | one-line summary node script | `demo-mena OK schemas=counsel.kyb.v1,editorial.review.v1,treasury.policy.v1,token.suitability.v1,stablecoin.reserves.v1` |
| `19-smoke-load.json` | `smoke:load` 10s × 10rps | `overall_slo_ok: true`; per-route p99 within p95-budget×1.5 |
| `20-smoke-load-stdout.txt` | `smoke:load` stdout | `[smoke-load] OK: all routes within SLO.` |

## Regenerating the W8–W12 evidence

From a clean tree:

```bash
git checkout claude/trust-layer-agents-sNcay
npm install
mkdir -p docs/milestones/test-outputs

npm run check-passport-contracts                          > docs/milestones/test-outputs/09-check-passport-contracts.txt  2>&1
npm run type-check:passport-sdk                           > docs/milestones/test-outputs/10-type-check-passport-sdk.txt   2>&1
npm run build:passport-sdk                               >> docs/milestones/test-outputs/10-type-check-passport-sdk.txt   2>&1
npm run test:passport-sdk                                 > docs/milestones/test-outputs/11-test-passport-sdk.txt         2>&1

npm run check-trust-contracts                             > docs/milestones/test-outputs/12-check-trust-contracts.txt     2>&1
npm run type-check:attestations                           > docs/milestones/test-outputs/13-type-check-attestations.txt   2>&1
npm run build:attestations                               >> docs/milestones/test-outputs/13-type-check-attestations.txt   2>&1
npm run test:attestations                                 > docs/milestones/test-outputs/14-test-attestations.txt         2>&1

npm run smoke:trust-api:paid-mock                         > docs/milestones/test-outputs/15-smoke-trust-api-paid-mock.txt 2>&1
npm run type-check:web                                    > docs/milestones/test-outputs/16-type-check-web.txt            2>&1

npm --workspace @arc/attestations run demo:mena -- --out  /home/user/ARC/docs/milestones/test-outputs/17-demo-mena-envelope.json
node -e 'const e=require("/home/user/ARC/docs/milestones/test-outputs/17-demo-mena-envelope.json"); if(!e.summary.allVerified) throw new Error("envelope verification failed"); console.log("demo-mena OK schemas=" + e.summary.schemasIncluded.join(","))' \
                                                          > docs/milestones/test-outputs/18-demo-mena-summary.txt         2>&1
ARC_LOAD_DURATION=10 ARC_LOAD_OUT=/home/user/ARC/docs/milestones/test-outputs/19-smoke-load.json \
  npm --workspace @arc/trust-api run smoke:load           > docs/milestones/test-outputs/20-smoke-load-stdout.txt         2>&1
```

All 12 gates must exit 0 (or, for 16, must show no W11-file errors —
see the milestone doc for the explicit pre-existing-error list) and
each log must contain its sentinel per the table above.
