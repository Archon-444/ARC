# CI boundary rule — legacy-primitives quarantine

> Runbook for the W11.3 / W16.3 eslint `no-restricted-imports` boundary rule that enforces the `legacy-primitives/` quarantine.

## What the rule does

`apps/web/eslint.config.mjs` carries a `no-restricted-imports` rule with the pattern `**/legacy-primitives/**` (and the bare `legacy-primitives/**` shorthand). Any import path containing those patterns triggers an eslint error and fails the lint job — and therefore CI.

This is the discipline mechanism for "stop building marketplace UI." Without it, the boundary between the trust layer and the frozen pre-pivot surface is a vibe, not enforceable. With it, a PR that imports a legacy contract or component into `apps/*` or `packages/*` cannot land.

## What the fixture does

`apps/web/__lint_fixture__/should-fail.ts` is a single file whose only purpose is to import from `legacy-primitives/` so the rule has something to fire on. It is **deliberately a synthetic violation**: it lives outside `apps/web/src/` so the regular `npm run lint:web` command does not pick it up, and it is only targeted explicitly by the boundary-rule check.

The `lint:boundary-fixture` root script runs:

```sh
cd apps/web && ! npx eslint __lint_fixture__/should-fail.ts
```

The leading `!` inverts the exit code. eslint exits non-zero when the rule fires (correct behaviour); the script flips that to a zero exit so the npm command reads as "success." If the rule does **not** fire, eslint exits zero, the `!` flips it to one, and the script fails — which is exactly the signal we want.

## When CI runs it

`.github/workflows/ci.yml` runs `npm run lint:boundary-fixture` as a step in the `lint` job, immediately after the regular `npm run lint`. CI fails if:

- the fixture stops triggering the rule (rule drift), OR
- the fixture file is deleted (the script can't find it).

Either failure mode means the trust-layer / legacy-primitives quarantine is no longer enforced and the operator should investigate before merging anything else.

## Debugging "fixture passes when it should fail"

The most common cause is a flat-vs-legacy eslint config drift. `apps/web` uses `eslint.config.mjs` (flat config). The root `.eslintrc.json` (legacy format) is **ignored** by eslint when a flat config is present in or above the linted directory. So the rule MUST live in `apps/web/eslint.config.mjs` to apply to `apps/web/`.

If `lint:boundary-fixture` exits zero (script failure) when it should exit non-zero:

1. **Open `apps/web/eslint.config.mjs`** and confirm the `no-restricted-imports` rule is still in the `rules` block. If it's missing, restore it from the W16.3 commit (`32b8de0` or its successor).
2. **Run `npx eslint __lint_fixture__/should-fail.ts` directly** from `apps/web/` and inspect the output. eslint should emit one error citing the `legacy-primitives` pattern. If it doesn't, the rule is gone or misconfigured.
3. **Check eslint version**. Flat config behaviour changed between major versions. The repo pins eslint 8.x as of W16; a future upgrade to 9.x will require revalidating this rule + the fixture.
4. **Check the fixture's import path**. The path is `../../../legacy-primitives/contracts/ArcMarketplace`. eslint's `no-restricted-imports` rule matches the path string literally, regardless of whether the referenced module resolves. If the fixture's path no longer contains `legacy-primitives/`, the rule won't fire.

## When to extend the rule

The current rule covers `apps/web` only because that's the only workspace whose lint config is reached by CI today. If/when other workspaces (`apps/trust-api`, `apps/mcp-server`, `apps/indexer`, `packages/*`) start running their own lint in CI, the rule should be added to their eslint configs too — copy the `no-restricted-imports` block from `apps/web/eslint.config.mjs` into the target workspace's config. The fixture file approach (one synthetic-violation file per workspace, targeted by a per-workspace `lint:boundary-fixture` script) scales the same way.

For now, `apps/web` is the only consumer-facing surface that could plausibly try to import from `legacy-primitives/`, so the single-workspace enforcement is the right surface to protect.

## What this rule deliberately does NOT do

- It does NOT prevent imports from `legacy-primitives/` *within* `legacy-primitives/` (the legacy code can still cross-import itself — the rule only fires when the consuming file is in `apps/web` or wherever else the config is wired).
- It does NOT prevent shipping legacy contracts via a re-exporting `@arc/*` package. The boundary is on the import path string; if a future adapter package legitimately exposes a legacy primitive through an `@arc/*` alias, the rule does not fire. That's by design — the adapter pattern is the supported way to surface a frozen primitive (see `legacy-primitives/README.md`).
- It does NOT enforce anything at runtime. This is a build-time / CI check only.

## Cross-references

- [`apps/web/eslint.config.mjs`](../apps/web/eslint.config.mjs) — where the rule lives.
- [`apps/web/__lint_fixture__/should-fail.ts`](../apps/web/__lint_fixture__/should-fail.ts) — the synthetic-violation fixture.
- [`package.json`](../package.json) — `lint:boundary-fixture` script.
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — CI step that runs the assertion.
- [`legacy-primitives/README.md`](../legacy-primitives/README.md) — what's quarantined and why.
- [`STRATEGIC_PIVOT.md`](../STRATEGIC_PIVOT.md) — full pivot rationale.
