# Deployed-Baseline Alignment Note

## Summary
Local `main` was 160 commits behind `origin/main`. The repo has been aligned so that implementation work uses the same codebase as the deployed preview.

## What was done
- **Fast-forward:** `git pull origin main --ff-only` (after moving aside `subgraph/package-lock.json` which was untracked and would have been overwritten).
- **Source of truth:** `origin/main` (commit `942c9aa` at alignment time). The deployed ARC UI (Explore, Launchpad, Studio, Stats, Rewards, connected homepage) comes from this branch.

## Relevant shell surfaces (post-alignment)
- `frontend/src/app/layout.tsx` – root layout, providers, shell wrapper
- `frontend/src/components/Navbar.tsx` – primary nav, mobile nav, wallet/profile
- `frontend/src/app/page.tsx` – homepage (uses `HomeContent`)
- `frontend/src/components/home/HomeContent.tsx` – homepage content
- `frontend/src/components/Footer.tsx` – footer
- Routes: `/`, `/explore`, `/launch`, `/studio`, `/stats`, `/rewards`, `/token/[address]`, `/profile`, `/settings`, etc.

## Prerequisite for redesign
Any UI/UX overhaul must start from this baseline so we do not redesign the older ArcMarket shell. No further baseline alignment is required unless `origin/main` moves again.
