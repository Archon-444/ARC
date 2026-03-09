#!/usr/bin/env bash
#
# Create Phase 1 — Platform Unification GitHub issues for ARC.
#
# Prerequisites:
#   1. gh CLI installed and authenticated (gh auth login)
#   2. Run from the repo root: ./scripts/create-phase1-issues.sh
#
# The script creates labels if missing, files 9 issues in dependency order,
# then updates the umbrella epic with child-issue references.
#
set -euo pipefail

REPO="Archon-444/ARC"

echo "==> Creating labels (idempotent)..."
gh label create epic          --color 7057ff --description "Umbrella tracking issue"              --repo "$REPO" --force 2>/dev/null || true
gh label create phase-1       --color 0e8a16 --description "Phase 1 — Platform Unification"       --repo "$REPO" --force 2>/dev/null || true
gh label create refactor      --color fbca04 --description "Code refactor / extraction"           --repo "$REPO" --force 2>/dev/null || true
gh label create integration   --color 1d76db --description "API / service-layer integration"      --repo "$REPO" --force 2>/dev/null || true
gh label create claude-suitable --color c5def5 --description "Scoped for autonomous Claude work"  --repo "$REPO" --force 2>/dev/null || true
gh label create documentation --color 0075ca --description "Documentation updates"                --repo "$REPO" --force 2>/dev/null || true

# ── Helper ───────────────────────────────────────────────────────────────
create_issue() {
  local title="$1"
  local labels="$2"
  local body="$3"
  local url
  url=$(gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --label "$labels" \
    --body "$body")
  local num
  num=$(echo "$url" | grep -oE '[0-9]+$')
  echo "  #${num} — ${title}"
  echo "$num"
}

# ── Issue 1: Umbrella Epic ───────────────────────────────────────────────
echo ""
echo "==> Filing issues..."

EPIC_NUM=$(create_issue \
  "[Epic] Phase 1 — Platform Unification" \
  "epic,phase-1" \
  "$(cat <<'BODY'
## Phase 1 — Platform Unification

Umbrella epic tracking all Phase 1 work from [MASTER_REFACTOR_PLAN.md](../MASTER_REFACTOR_PLAN.md).

### Objective

Normalize the app shell, eliminate route-level inline sprawl, connect the orphaned service layer, and establish enforceable conventions — so that every subsequent phase lands on stable, consistent infrastructure.

### Workstream
Architecture (Lane A — Platform / Core Frontend)

### Exit Criteria
- [ ] All child issues closed
- [ ] No critical route contains inline component definitions
- [ ] App shell uses extracted `RootProviders`, per-route `error.tsx` and `loading.tsx`
- [ ] Service layer conventions documented and enforced
- [ ] All data access flows through hooks → services (no direct `fetch()` in components)

### Child Issues
> _Updated automatically after all issues are filed._

### Dependencies
None — this is the foundation phase.

### Key Files
- `MASTER_REFACTOR_PLAN.md` — roadmap
- `frontend/src/components/profile/` — reference architecture
- `frontend/src/hooks/useProfileGateway.ts` — reference hook pattern
- `frontend/src/lib/profile.ts` — reference pure-module pattern
BODY
)")

# ── Issue 2: App Shell ───────────────────────────────────────────────────
I2=$(create_issue \
  "[Refactor] Extract RootProviders + add per-route error/loading boundaries" \
  "refactor,phase-1,claude-suitable" \
  "$(cat <<'BODY'
## Refactor Slice

### Domain
App shell

### Problem
- `layout.tsx` has 7 deeply nested providers making the root layout hard to read and modify.
- No route has its own `error.tsx` — a runtime error in any route crashes the entire app.
- No route has its own `loading.tsx` — route transitions show no skeleton/loading UI.

### Plan
1. Extract all providers into `frontend/src/providers/RootProviders.tsx`.
2. Replace inline nesting in `layout.tsx` with `<RootProviders>{children}</RootProviders>`.
3. Add `error.tsx` (using `ErrorDisplay` from shared UI) to: `/explore`, `/launch`, `/stats`, `/rewards`, `/studio`, `/token/[address]`, `/nft/[collection]/[tokenId]`.
4. Add `loading.tsx` (using `Skeleton` from shared UI) to the same routes with domain-appropriate skeleton layouts.

### Files to Create
- `frontend/src/providers/RootProviders.tsx`
- `frontend/src/app/explore/error.tsx` + `loading.tsx`
- `frontend/src/app/launch/error.tsx` + `loading.tsx`
- `frontend/src/app/stats/error.tsx` + `loading.tsx`
- `frontend/src/app/rewards/error.tsx` + `loading.tsx`
- `frontend/src/app/studio/error.tsx` + `loading.tsx`

### Files to Modify
- `frontend/src/app/layout.tsx`

### Pattern Reference
Profile refactor (commit `05461e2`) — thin route, extracted domain logic.

### Verification
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Each route renders its own error boundary on throw
- [ ] Each route shows skeleton UI during loading

### Claude-suitable
Yes
BODY
)")

# ── Issue 3: Explore Route ───────────────────────────────────────────────
I3=$(create_issue \
  "[Refactor] Extract explore/page.tsx — domain components + useExploreFilters" \
  "refactor,phase-1,claude-suitable" \
  "$(cat <<'BODY'
## Refactor Slice

### Domain
Explore

### Problem
`explore/page.tsx` is **645 lines** with:
- 3 inline components (`ModePill`, `ShortcutCard`, `GuideRow`)
- 8 `useState` hooks + complex debounce/filter logic mixed into the page
- No separation between data-fetching, filtering logic, and presentation

### Plan
1. Extract inline components to `frontend/src/components/explore/`.
2. Create `useExploreFilters` hook for filter/debounce state management.
3. Create `frontend/src/lib/explore.ts` for types and pure helpers.
4. Create `ExploreContent.tsx` orchestrator component.
5. Reduce `explore/page.tsx` to a thin route (~10-20 lines).

### Files to Create
- `frontend/src/components/explore/ModePill.tsx`
- `frontend/src/components/explore/ShortcutCard.tsx`
- `frontend/src/components/explore/GuideRow.tsx`
- `frontend/src/components/explore/ExploreContent.tsx`
- `frontend/src/hooks/useExploreFilters.ts`
- `frontend/src/lib/explore.ts`

### Files to Modify
- `frontend/src/app/explore/page.tsx` (reduce to thin route)

### Pattern Reference
Profile refactor (commit `05461e2`)

### Verification
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Explore page renders identically before/after

### Claude-suitable
Yes
BODY
)")

# ── Issue 4: Home Route ──────────────────────────────────────────────────
I4=$(create_issue \
  "[Refactor] Extract home page.tsx — domain components + useHomeData" \
  "refactor,phase-1,claude-suitable" \
  "$(cat <<'BODY'
## Refactor Slice

### Domain
Home

### Problem
Root `page.tsx` is **650 lines** with:
- 4 inline components (`PulseCard`, `FeedMetric`, `FeaturePanel`, `ReadinessRow`)
- Complex `cards`/`feedCards`/`liveTape` computation logic
- Same component names as `rewards/page.tsx` — indicates shared extraction opportunity

### Plan
1. Extract inline components to `frontend/src/components/home/`.
2. Create `useHomeData` hook for data aggregation.
3. Create `frontend/src/lib/home.ts` for types and pure helpers.
4. Create `HomeContent.tsx` orchestrator component.
5. Reduce `page.tsx` to thin route.

**Important:** `PulseCard`, `FeedMetric`, `FeaturePanel`, `ReadinessRow` also exist in `rewards/page.tsx`. Before implementing, determine whether these should become shared components in `components/ui/` or remain domain-specific with separate implementations. Document the decision in the PR description.

### Files to Create
- `frontend/src/components/home/PulseCard.tsx`
- `frontend/src/components/home/FeedMetric.tsx`
- `frontend/src/components/home/FeaturePanel.tsx`
- `frontend/src/components/home/ReadinessRow.tsx`
- `frontend/src/components/home/HomeContent.tsx`
- `frontend/src/hooks/useHomeData.ts`
- `frontend/src/lib/home.ts`

### Files to Modify
- `frontend/src/app/page.tsx` (reduce to thin route)

### Pattern Reference
Profile refactor (commit `05461e2`)

### Verification
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Home page renders identically before/after

### Claude-suitable
Yes
BODY
)")

# ── Issue 5: Rewards Route ───────────────────────────────────────────────
I5=$(create_issue \
  "[Refactor] Extract rewards/page.tsx — buildRewardSnapshot to lib + domain components" \
  "refactor,phase-1,claude-suitable" \
  "$(cat <<'BODY'
## Refactor Slice

### Domain
Rewards

### Problem
`rewards/page.tsx` is **685 lines** with:
- 4 inline components (same names as home: `PulseCard`, `FeedMetric`, `FeaturePanel`, `ReadinessRow`)
- `buildRewardSnapshot` — a 63-line pure function that should be unit-testable but is buried in the page file

### Plan
1. Extract `buildRewardSnapshot` to `frontend/src/lib/rewards.ts` with unit tests.
2. Extract inline components to `frontend/src/components/rewards/` (or use shared components from Issue #4 resolution).
3. Create `useRewardsData` hook.
4. Create `RewardsContent.tsx` orchestrator.
5. Reduce `rewards/page.tsx` to thin route.

### Files to Create
- `frontend/src/lib/rewards.ts` (buildRewardSnapshot + types)
- `frontend/src/components/rewards/RewardsContent.tsx`
- `frontend/src/hooks/useRewardsData.ts`
- `frontend/src/__tests__/lib/rewards.test.ts`
- Domain components (depends on shared-component decision from Issue #4)

### Files to Modify
- `frontend/src/app/rewards/page.tsx` (reduce to thin route)

### Dependencies
- Blocked by Issue #4 (shared component decision for PulseCard/FeedMetric/FeaturePanel/ReadinessRow)

### Pattern Reference
Profile refactor (commit `05461e2`). Also reference `frontend/src/lib/risk-scoring.ts` for pure-function extraction with tests (33 unit tests).

### Verification
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (including new `rewards.test.ts`)
- [ ] `npm run build` succeeds
- [ ] Rewards page renders identically before/after

### Claude-suitable
Yes
BODY
)")

# ── Issue 6: Stats Route ─────────────────────────────────────────────────
I6=$(create_issue \
  "[Refactor] Extract stats/page.tsx — 5 inline card components" \
  "refactor,phase-1,claude-suitable" \
  "$(cat <<'BODY'
## Refactor Slice

### Domain
Stats

### Problem
`stats/page.tsx` is **637 lines** with:
- 5 inline components (`StatCard`, `InsightCard`, `RouteCard`, `ActionReadCard`, `MiniSignal`)
- `shortenAddress` utility duplicated (also exists elsewhere in the codebase)
- Mixed data-fetching and presentation logic

### Plan
1. Extract inline components to `frontend/src/components/stats/`.
2. Create `useStatsMetrics` hook for data aggregation.
3. Create `frontend/src/lib/stats.ts` for types, helpers, `shortenAddress`.
4. Create `StatsContent.tsx` orchestrator.
5. Reduce `stats/page.tsx` to thin route.

### Files to Create
- `frontend/src/components/stats/StatCard.tsx`
- `frontend/src/components/stats/InsightCard.tsx`
- `frontend/src/components/stats/RouteCard.tsx`
- `frontend/src/components/stats/ActionReadCard.tsx`
- `frontend/src/components/stats/MiniSignal.tsx`
- `frontend/src/components/stats/StatsContent.tsx`
- `frontend/src/hooks/useStatsMetrics.ts`
- `frontend/src/lib/stats.ts`

### Files to Modify
- `frontend/src/app/stats/page.tsx` (reduce to thin route)

### Pattern Reference
Profile refactor (commit `05461e2`)

### Verification
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Stats page renders identically before/after

### Claude-suitable
Yes
BODY
)")

# ── Issue 7: REST Service Layer ──────────────────────────────────────────
I7=$(create_issue \
  "[Integration] Connect services/api.ts to React hooks layer" \
  "integration,phase-1" \
  "$(cat <<'BODY'
## Integration Task

### Integration Target
REST API (`frontend/src/services/api.ts`)

### Current State
**Complete but orphaned.** `services/api.ts` contains a well-structured REST client with 6 modules:
- `SearchAPI` — autocomplete
- `AnalyticsAPI` — volume, sales distribution, holder stats, top sales
- `PriceHistoryAPI` — NFT price history
- `ActivityAPI` — activity events with filters
- `OffersAPI` — create, list, accept, cancel offers
- `UserAPI` — user profiles

Features: exponential backoff retry (3 retries), centralized error handling, pagination, bearer token auth.

**Problem:** No React hooks consume this client. Hooks like `useActivityFeed` use direct `fetch()` calls instead, duplicating error handling and retry logic.

### Target State
1. Create React Query wrapper hooks that consume each `services/api.ts` module.
2. Replace direct `fetch()` calls in `useActivityFeed.ts` with `api.activity.*` methods.
3. Standardize cache keys, stale times, and error handling across all hooks.
4. All REST access flows: Component → Hook → services/api.ts → Backend.

### Fallback Behavior
Hooks return `{ data, isLoading, error, refetch }` via React Query. Service layer already handles retries with exponential backoff. On failure: loading skeleton → error display with retry button → empty state.

### Files to Create
- `frontend/src/hooks/useAnalytics.ts` — React Query wrapper for `api.analytics.*`
- `frontend/src/hooks/usePriceHistory.ts` — React Query wrapper for `api.priceHistory.*`
- `frontend/src/hooks/useOffers.ts` — React Query wrapper for `api.offers.*`

### Files to Modify
- `frontend/src/hooks/useActivityFeed.ts` — replace direct `fetch()` with `api.activity.*`
- `frontend/src/hooks/useBackendAPI.ts` — expand to use `services/api.ts`

### Test Coverage Required
- [ ] Unit tests for each hook's return shape (loading, success, error states)
- [ ] Integration test for retry behavior
- [ ] Verify no remaining direct `fetch()` calls to backend API endpoints

### Requires Human Review
Yes — API contract decisions, cache key strategy, stale time policy.
BODY
)")

# ── Issue 8: GraphQL Hook Wrappers ───────────────────────────────────────
I8=$(create_issue \
  "[Integration] Create React hook wrappers for graphql-client.ts queries" \
  "integration,phase-1" \
  "$(cat <<'BODY'
## Integration Task

### Integration Target
Subgraph / GraphQL (`frontend/src/lib/graphql-client.ts`)

### Current State
`graphql-client.ts` exports 10+ query functions with built-in retry logic:
- `fetchListings`, `fetchAuctions` (Marketplace)
- `fetchNFTDetails`, `fetchUserActivity` (NFT/User)
- `fetchLaunchedTokens`, `fetchTokenDetail`, `fetchTokenTrades` (Token Launcher)
- `fetchTokenTradeMetrics`, `fetchCreatorWithdrawals` (Risk scoring)
- `fetchMarketplaceStats`, `fetchTokenLauncherStats`

**Problem:** No React hook wrappers exist. Pages call these raw async functions directly (e.g., `fetchMarketplaceStats()` in `stats/page.tsx`), managing their own loading/error state inconsistently.

### Target State
1. Create React Query hook wrappers for each exported query function.
2. Standardize cache keys (e.g., `['listings', collectionId, filters]`).
3. Configure appropriate stale times per query type (e.g., stats: 60s, listings: 30s).
4. Pages consume hooks, never raw `fetchGraphQL()` calls.

### Fallback Behavior
Loading skeletons → error display with retry → empty state. All three states handled consistently via React Query's `{ data, isLoading, error }`.

### Files to Create
- `frontend/src/hooks/useGraphQL.ts` — React Query wrappers for all `graphql-client.ts` exports

### Files to Modify
- Pages/components that currently call graphql-client functions directly (explore, stats, home, collections)

### Test Coverage Required
- [ ] Unit tests for hook return shapes
- [ ] Verify cache key uniqueness across queries
- [ ] Verify stale time configuration per domain

### Requires Human Review
Yes — cache key strategy, stale time policy, query invalidation patterns.
BODY
)")

# ── Issue 9: Service Layer Conventions ───────────────────────────────────
I9=$(create_issue \
  "[Refactor] Document and enforce service layer conventions" \
  "refactor,phase-1,documentation,claude-suitable" \
  "$(cat <<'BODY'
## Refactor Slice

### Domain
Architecture / conventions

### Problem
No documented convention for data access. Three known violations of service-layer separation:
1. `useActivityFeed.ts` — direct `fetch('/api/activity?...')` instead of `api.activity.*`
2. `useBuyNFT.ts` — direct `fetch('/api/circle/transaction')` (Circle SDK exception — may be acceptable)
3. `MediaViewer.tsx` — direct `fetch(src)` for media validation (low-level, not API-related)

### Plan
1. Add "## Service Layer Conventions" section to `CLAUDE.md` documenting:
   - All REST access goes through `services/api.ts`
   - All subgraph access goes through `lib/graphql-client.ts`
   - All WebSocket access goes through `services/websocket.ts`
   - React components access data through hooks only
   - No direct `fetch()` in components/pages (document exceptions like Circle SDK)
2. Audit the 3 known direct-fetch violations and either fix or document as exceptions.
3. (Optional) Add an ESLint rule to warn on `fetch(` in component/page files.

### Files to Modify
- `CLAUDE.md` — add conventions section

### Pattern Reference
The profile refactor established the canonical data flow: `ProfilePage → useProfileGateway → lib/profile.ts`.

### Verification
- [ ] `CLAUDE.md` contains "Service Layer Conventions" section
- [ ] Conventions are clear, specific, and reference actual file paths
- [ ] Known violations are documented with rationale for exceptions
- [ ] `npm run lint` passes

### Claude-suitable
Yes
BODY
)")

# ── Update Epic with Child References ────────────────────────────────────
echo ""
echo "==> Updating umbrella epic with child issue references..."

CHILD_BODY="$(cat <<BODY
## Phase 1 — Platform Unification

Umbrella epic tracking all Phase 1 work from [MASTER_REFACTOR_PLAN.md](../MASTER_REFACTOR_PLAN.md).

### Objective

Normalize the app shell, eliminate route-level inline sprawl, connect the orphaned service layer, and establish enforceable conventions — so that every subsequent phase lands on stable, consistent infrastructure.

### Workstream
Architecture (Lane A — Platform / Core Frontend)

### Exit Criteria
- [ ] All child issues closed
- [ ] No critical route contains inline component definitions
- [ ] App shell uses extracted \`RootProviders\`, per-route \`error.tsx\` and \`loading.tsx\`
- [ ] Service layer conventions documented and enforced
- [ ] All data access flows through hooks → services (no direct \`fetch()\` in components)

### Child Issues

**App Shell**
- [ ] #${I2} — Extract RootProviders + add per-route error/loading boundaries

**Route Refactors**
- [ ] #${I3} — Extract explore/page.tsx
- [ ] #${I4} — Extract home page.tsx
- [ ] #${I5} — Extract rewards/page.tsx (blocked by #${I4})
- [ ] #${I6} — Extract stats/page.tsx

**Service Layer**
- [ ] #${I7} — Connect services/api.ts to React hooks
- [ ] #${I8} — Create React hook wrappers for graphql-client.ts
- [ ] #${I9} — Document and enforce service layer conventions

### Dependencies
None — this is the foundation phase.

### Key Files
- \`MASTER_REFACTOR_PLAN.md\` — roadmap
- \`frontend/src/components/profile/\` — reference architecture
- \`frontend/src/hooks/useProfileGateway.ts\` — reference hook pattern
- \`frontend/src/lib/profile.ts\` — reference pure-module pattern
BODY
)"

gh issue edit "$EPIC_NUM" --repo "$REPO" --body "$CHILD_BODY"

echo ""
echo "==> Done! Filed 9 issues:"
echo "  Epic:           #${EPIC_NUM}"
echo "  App Shell:      #${I2}"
echo "  Explore:        #${I3}"
echo "  Home:           #${I4}"
echo "  Rewards:        #${I5}"
echo "  Stats:          #${I6}"
echo "  REST Service:   #${I7}"
echo "  GraphQL Hooks:  #${I8}"
echo "  Conventions:    #${I9}"
echo ""
echo "View all: gh issue list --repo ${REPO} --label phase-1"
