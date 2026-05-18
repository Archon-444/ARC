# Archived documentation

Historical docs preserved for context. **None of these are
maintained** — they represent the state of the project at a point in
time. For current status see [`STRATEGIC_PIVOT.md`](../../STRATEGIC_PIVOT.md),
[`CLAUDE.md`](../../CLAUDE.md), and [`docs/PHASE_A_RUNBOOK.md`](../PHASE_A_RUNBOOK.md).

## Structure

| Directory | Contents |
|---|---|
| `pre-pivot/` | Pre-pivot top-level docs (`ACCESSIBILITY.md`, `TESTING.md`, `TESTING_GUIDE.md`, `DEPLOYMENT_GUIDE.md`, `OAUTH_SETUP.md`, `DAPPS_ALIGNMENT_REVIEW.md`, `MASTER_REFACTOR_PLAN.md`, `SECURITY_AUDIT.md` v0.4, `docker-compose.yml` Typesense config, the Phase 1 issue-creation script). All describe the pre-pivot NFT-marketplace / token-launchpad product. Replaced by the trust-layer surface (`STRATEGIC_PIVOT.md`) and per-app DEPLOY.md docs. |
| `phase-status/` | Per-phase implementation status reports (Phases 1–4) and snapshot summaries — pre-pivot. |
| `remediation/` | Earlier remediation plans and reports — folded into the archived `SECURITY_AUDIT.md`. |
| `gap-analysis/` | Gap-analysis docs, feature maps, integration guides — superseded by the strategic-pivot plan. |
| `audits/` | Independent Web3 feature reviews and UX recommendations — pre-pivot. |
| `deployment/` | Earlier deployment guides — see `docs/PHASE_A_RUNBOOK.md` + the per-app `DEPLOY.md` for current. |
| `circle/` | Older Circle Wallets integration writeups — Circle is still core (App Kit), but these specific writeups are stale. |
| `misc/` | `plan.md` (UI update plan), `ARC_SDK_INTEGRATION.md` (documents a deleted client), `BASELINE_ALIGNMENT.md`, `UX_AUDIT_SHELL_AND_HOMEPAGE.md`. |

## What replaced each archived doc

| Archived | Replacement |
|---|---|
| `pre-pivot/SECURITY_AUDIT.md` (v0.4 — NFT marketplace) | [`apps/trust-api/docs/security-review-w12.md`](../../apps/trust-api/docs/security-review-w12.md) (13-finding trust-layer self-review, 0 OPEN) |
| `pre-pivot/DEPLOYMENT_GUIDE.md` (full-stack marketplace deploy) | [`docs/PHASE_A_RUNBOOK.md`](../PHASE_A_RUNBOOK.md) + [`apps/trust-api/DEPLOY.md`](../../apps/trust-api/DEPLOY.md) + [`apps/mcp-server/DEPLOY.md`](../../apps/mcp-server/DEPLOY.md) |
| `pre-pivot/TESTING.md` + `TESTING_GUIDE.md` | Per-workspace `test` scripts; see `CONTRIBUTING.md` § Testing Guidelines |
| `pre-pivot/DAPPS_ALIGNMENT_REVIEW.md` (pre-pivot code-vs-docs audit) | This very layout — STRATEGIC_PIVOT + per-workspace READMEs are the alignment |
| `pre-pivot/MASTER_REFACTOR_PLAN.md` (pre-pivot operating model) | [`STRATEGIC_PIVOT.md`](../../STRATEGIC_PIVOT.md) + `/root/.claude/plans/arc-strategic-synthesis-shimmying-cook.md` |
| `pre-pivot/OAUTH_SETUP.md` (Circle OAuth setup for the marketplace flow) | Not replaced — trust layer doesn't need this surface. Circle App Kit wiring is documented in the apps/web README + Circle's own docs. |
| `pre-pivot/ACCESSIBILITY.md` (marketplace a11y) | Not replaced — trust surface is the only consumer-facing route family now; a11y is enforced ad-hoc through the shared UI library. |
| `pre-pivot/docker-compose.yml` (Typesense for marketplace search) | Not replaced — search isn't a trust-layer concern. |
