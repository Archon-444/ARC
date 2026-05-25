/**
 * W16.3 synthetic-violation lint fixture.
 *
 * This file's SOLE purpose is to trigger the `no-restricted-imports`
 * boundary rule in apps/web/eslint.config.mjs by importing from
 * `legacy-primitives/`. It is NEVER imported by production code.
 *
 * The `lint:boundary-fixture` root script runs eslint against this
 * file and asserts a non-zero exit code. CI runs the same assertion
 * in the lint job. If this file ever lints CLEAN, the boundary rule
 * has stopped firing — the eslint config has drifted from intent and
 * the trust-layer / legacy-primitives quarantine is unenforced.
 *
 * The import path below targets the legacy quarantine directory.
 * eslint's `no-restricted-imports` rule matches the import path
 * string, not module resolution, so the rule fires regardless of
 * whether the referenced module is resolvable on disk.
 *
 * This file sits at `apps/web/__lint_fixture__/` (outside `src/`)
 * specifically so the regular `npm run lint:web` command — which
 * runs `eslint src/` — does NOT pick it up. The fixture is only
 * targeted explicitly by `lint:boundary-fixture`.
 *
 * See:
 *   - docs/ci-boundary-rule.md (runbook)
 *   - STRATEGIC_PIVOT.md (why the boundary exists)
 *   - legacy-primitives/README.md (what's quarantined)
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - synthetic; the eslint rule fires before TS resolution
import { Quarantined } from '../../../legacy-primitives/contracts/ArcMarketplace';

export { Quarantined };
