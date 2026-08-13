# MASTER_REFACTOR_PLAN

## North Star

ARC should become a category-leading web3 product platform, not a collection of individually impressive screens. The long-run goal is a system that is visually distinctive, architecturally consistent, operationally reliable, deeply observable, easy to extend, and measurably better than incumbent marketplaces and launch products across speed, clarity, mobile ergonomics, trust, and creator conversion.

This plan converts ARC's existing planning documents, remediation work, and recent profile refactor into one authoritative execution framework. It is intended to guide Claude, engineering leads, product, and design through a multi-phase refactor and hardening effort with quality as the primary constraint.

---

## Why This Exists

The repository already contains substantial planning and status material:

- `GAP_ANALYSIS.md`
- `REMEDIATION_PLAN.md`
- `DAPPS_ALIGNMENT_REVIEW.md`
- `plan.md`
- `PHASE_1_STATUS.md`
- `PHASE_2_1_STATUS.md`
- `PHASE_2_2_STATUS.md`
- `PHASE_2_3_STATUS.md`
- `PHASE_3_STATUS.md`
- `PHASE_4_STATUS.md`
- `IMPLEMENTATION_STATUS.md`
- `FEATURE_MAP.md`

These documents remain useful as historical context and gap analysis, but they do not provide a single forward-looking operating model for refactoring, integration, ownership, and quality gates.

This document is that operating model.

---

## Reference Architecture

The profile refactor established the canonical architectural pattern ARC should follow across the frontend:

- Thin route files.
- Extracted domain components.
- Domain hooks for stateful orchestration.
- Pure helper modules for types and functions.
- Explicit UI state models.
- Scenario-based e2e coverage instead of smoke-test-only verification.

Reference implementation:

- `frontend/src/components/profile/`
- `frontend/src/hooks/useProfileGateway.ts`
- `frontend/src/lib/profile.ts`
- Commit `05461e2` (`refactor(profile): extract shared components, add gateway hook, expand e2e coverage`)

This pattern should be treated as the default for all new frontend work and as the migration target for legacy page-level implementations.

---

## Architectural Standards

### 1. Route Files Must Be Thin

Route files should primarily:

- Load params.
- Call domain hooks or server-side data loaders.
- Compose domain components.
- Export metadata where appropriate.

Route files should not contain:

- Large inline helper components.
- Repeated UI state branching blocks.
- Embedded formatting utilities.
- Complex business logic.
- Duplicated action lists or state machines.

### 2. Domain Components Over Page Sprawl

Each major domain should own its own component surface:

- `components/profile/`
- `components/marketplace/`
- `components/collection/`
- `components/nft/`
- `components/navigation/`
- `components/launch/` (to be expanded)
- `components/analytics/`

Guidelines:

- Orchestrators compose subcomponents.
- Presentational components stay small and testable.
- Shared behavior should be centralized, not reimplemented.
- Component props should reflect domain state, not incidental page wiring.

### 3. Hooks Own Stateful Orchestration

Use hooks for:

- Wallet connection state.
- Transaction orchestration.
- Filter/sort/search state.
- Realtime subscriptions.
- Form lifecycle and validation state.
- Progressive fetch and pagination state.

Hook guidelines:

- Hooks should return explicit state models.
- Derived booleans should be exposed when they improve readability.
- Hooks should avoid direct rendering concerns.
- Hooks should separate fetch state, domain state, and action methods.

### 4. Pure Modules Belong in `lib/` or `types/`

Use pure modules for:

- Types.
- Formatters.
- Helpers.
- UI-state predicates.
- Stateless transforms.
- Event mapping.

Rules:

- No React imports in pure helper modules.
- No DOM access in pure helper modules.
- Functions should be deterministic and unit-testable.

### 5. Services Own External Access

Service layer entry points:

- `frontend/src/services/api.ts`
- `frontend/src/services/websocket.ts`

Extend the service layer for:

- REST access.
- GraphQL queries and mutations.
- WebSocket subscriptions.
- Contract-adjacent transport helpers.
- Caching and retry policy.
- Analytics and instrumentation adapters.

Rules:

- Pages and presentational components should not call fetch directly unless intentionally server-side.
- Contract interaction helpers should follow a shared transaction state model.
- External access should be mockable for tests.

### 6. Explicit UI States Are Mandatory

Every page and major interactive surface must account for:

- Loading.
- Empty.
- Error.
- Success/ready.

Where relevant, add domain-specific states such as:

- Disconnected.
- Switching.
- Pending approval.
- Pending confirmation.
- Realtime syncing.
- Partial data.

### 7. Tests Must Match Product Complexity

Baseline expectations:

- Unit coverage for pure helpers and transforms.
- Component coverage for stateful UI branches where practical.
- e2e coverage for critical flows.
- Manual QA checklist for high-risk cross-domain work.

Smoke tests alone are not sufficient for mature domains.

---

## Phase Roadmap

## Phase 1 — Platform Unification

### Objective

Standardize ARC's architecture, shell, shared state patterns, monitoring baseline, accessibility foundations, and design tokens so future product work compounds instead of diverging.

### Epics

#### Epic 1.1 — App Shell Standardization

Deliverables:

- Unified root layout composition.
- Shared providers with consistent ordering.
- Error boundary integration.
- Toast and command palette integration.
- Bottom navigation and global shell normalization.
- Page metadata and SEO integration standards.

Exit criteria:

- Core app shell is composed once at the root.
- Global UX primitives are no longer wired ad hoc per page.
- Error handling and navigation behavior are consistent.

#### Epic 1.2 — Routing and Domain Extraction

Deliverables:

- Thin-route standard documented and enforced.
- High-sprawl route files prioritized for extraction.
- Domain directories normalized across frontend.
- Shared action panels and state cards moved into domain components.

Exit criteria:

- No critical route contains large inline component definitions.
- New route work follows the profile pattern by default.

#### Epic 1.3 — Service Layer and Data Access Standards

Deliverables:

- Unified service layer conventions.
- Query/mutation/subscription patterns documented.
- Retry and fallback behavior standards.
- Shared error and loading wrappers.

Exit criteria:

- Search, analytics, activity, and other data domains have clear service entry points.
- Components do not embed ad hoc remote-access logic.

#### Epic 1.4 — Design System Consolidation

Deliverables:

- Design tokens from `plan.md` codified.
- Shared card, badge, button, modal, panel, and skeleton patterns.
- Motion and hover conventions.
- Status color system.
- Responsive spacing and radii standards.

Exit criteria:

- New surfaces no longer invent one-off interaction patterns.
- Dark mode and glass styles are coherent across domains.

#### Epic 1.5 — Accessibility and Performance Baseline

Deliverables:

- Shared focus management on modals.
- Skip links and keyboard navigation standards.
- Performance monitoring initialization.
- Basic Lighthouse budgets.
- Error reporting integration plan.

Exit criteria:

- Accessibility primitives are globally integrated.
- Performance and error monitoring are baseline platform capabilities.

---

## Phase 2 — Core Marketplace Hardening

### Objective

Replace placeholder and partially wired marketplace features with real integrations, live correctness, and production-grade UX behavior.

### Epics

#### Epic 2.1 — Search and Discovery Integration

Deliverables:

- Live search API integration for command palette and search inputs.
- Search analytics tracking.
- Unified result models for collections, NFTs, and users.
- Better fallback and no-result states.

Exit criteria:

- Search surfaces use live data rather than placeholder/static patterns.
- Search interactions are measurable.

#### Epic 2.2 — Analytics and Price History Integration

Deliverables:

- Historical price data API.
- Analytics API integration for collection dashboards.
- Price history charts with live data.
- Analytics tab wiring in collection pages.

Exit criteria:

- Price-history and analytics tabs are no longer placeholder experiences.
- Data latency and empty states are explicit.

#### Epic 2.3 — Realtime Activity and WebSocket Layer

Deliverables:

- WebSocket subscription model for marketplace activity.
- Real-time activity feed support.
- Live listing and sale updates where appropriate.
- Retry, reconnect, and degraded-state handling.

Exit criteria:

- Activity views can update without refresh.
- Realtime failure modes are visible and graceful.

#### Epic 2.4 — Offer and Transaction Hardening

Deliverables:

- Offer submission integration.
- Offer acceptance and decline flows.
- Approval checks and approval requests.
- Shared transaction progress states.
- Error recovery and retry behavior.

Exit criteria:

- Offer flow is fully functional end to end.
- Approval/submit/confirm states are reusable across flows.

#### Epic 2.5 — Existing Component Integration

Deliverables:

- `OptimizedImage` used in live card/detail surfaces.
- `VirtualizedNFTGrid` used for large collections.
- `SearchInput` integrated into Navbar and collection workflows.
- `AnalyticsDashboard`, `OfferTable`, `PriceHistoryChart`, and `ActivityTable` wired into their host pages.

Exit criteria:

- "Built but unused" components are either integrated or intentionally retired.

---

## Phase 3 — Launch + Trading Loop

### Objective

Turn ARC's launch and trading capabilities into a complete product loop: launch, discover, trade, monitor progress, and graduate without broken seams.

### Epics

#### Epic 3.1 — Token Launcher UX

Deliverables:

- `/launch` wizard.
- Metadata capture and validation.
- Wallet/network guards.
- Draft persistence.
- Confirmation and transaction progress.

Exit criteria:

- A connected wallet can complete token launch without contract-level manual interaction.

#### Epic 3.2 — Token Detail and Trade Surface

Deliverables:

- Token detail page shell.
- Price, market cap, liquidity, and curve state presentation.
- Buy/sell panel.
- Slippage and fee preview.
- Trade transaction states.
- Recent trades feed.

Exit criteria:

- Every launched token has a live, public, tradable destination page.

#### Epic 3.3 — Graduation Lifecycle

Deliverables:

- Progress-to-graduation indicator.
- Transition state handling.
- Post-graduation market destination.
- Routing continuity between curve and post-curve phases.

Exit criteria:

- Users can understand lifecycle phase at a glance.
- No dead-end or broken-route state exists at graduation.

#### Epic 3.4 — Launch Telemetry and Funnel Measurement

Deliverables:

- Launch lifecycle event schema.
- First-buy conversion metrics.
- Curve completion metrics.
- Trader and creator cohort reporting.

Exit criteria:

- Launch-to-trade loop is measurable and optimizable.

---

## Phase 4 — Creator / Seller Dominance

### Objective

Make ARC a superior destination for listing, selling, collection management, and creator identity.

### Epics

#### Epic 4.1 — High-Conversion Listing Flow

Deliverables:

- Simplified listing flow.
- Fees, royalties, and proceeds preview.
- Better price and duration UX.
- Mobile-friendly listing completion.

Exit criteria:

- Sellers can list quickly with minimal confusion.

#### Epic 4.2 — Offers and Bulk Actions

Deliverables:

- Offers on unlisted assets.
- Bulk listing.
- Bulk cancellation.
- Portfolio-level seller actions.

Exit criteria:

- Power sellers are not blocked by item-by-item workflow friction.

#### Epic 4.3 — Collection Manager

Deliverables:

- Collection edit surfaces.
- Payout wallet and royalty controls.
- Accepted currency controls where architecture allows.
- Metadata and media management UX.

Exit criteria:

- Collection operations no longer require low-level manual intervention.

#### Epic 4.4 — Creator Identity and Social Proof

Deliverables:

- Creator pages.
- Social links and prior launches.
- Performance stats.
- Activity feeds and social proof modules.
- Lightweight comments/replies where appropriate.

Exit criteria:

- Creator trust and repeat engagement are product-level advantages.

#### Epic 4.5 — Mobile Trading and Selling UX

Deliverables:

- Sticky mobile trade controls.
- One-hand listing and trading ergonomics.
- Better retry and wallet reconnect UX.

Exit criteria:

- High-intent marketplace actions are viable on mobile without frustration.

---

## Workstreams

## Workstream 1 — Architecture

### Scope

- Route decomposition.
- Domain extraction.
- State-model standardization.
- Hook and helper-module patterns.
- Service-boundary discipline.

### Key files / directories

- `frontend/src/app/`
- `frontend/src/components/profile/`
- `frontend/src/hooks/useProfileGateway.ts`
- `frontend/src/lib/profile.ts`
- `frontend/src/components/ui/`

### Dependencies

- Design System.
- Data service conventions.
- Quality gate enforcement.

---

## Workstream 2 — Design System

### Scope

- Tokens and color system.
- Shared surfaces and interactions.
- Motion, hover, focus, and status patterns.
- Skeletons, empty states, and CTA hierarchy.

### Key files / directories

- `plan.md`
- `frontend/tailwind.config.js`
- `frontend/src/app/globals.css`
- `frontend/src/components/ui/`
- `frontend/src/components/layout/`
- `frontend/src/components/navigation/`

### Dependencies

- Architecture standards.
- Product loop requirements.
- Accessibility and performance constraints.

---

## Workstream 3 — Data & Realtime

### Scope

- REST and GraphQL access.
- Subgraph-backed reads.
- Search API.
- Analytics API.
- Price history API.
- WebSocket subscriptions.
- Caching and retry behavior.

### Key files / directories

- `frontend/src/services/api.ts`
- `frontend/src/services/websocket.ts`
- `frontend/src/lib/graphql-client.ts`
- `subgraph/`
- `backend/`

### Dependencies

- Infrastructure readiness.
- Observability.
- Page integration by domain teams.

---

## Workstream 4 — Blockchain Flows

### Scope

- Wallet guards.
- Approval flow.
- Submit / confirm / fail state machine.
- Offer flow.
- Listing flow.
- Launch flow.
- Trade execution UX.

### Key files / directories

- `contracts/`
- `frontend/src/hooks/`
- `frontend/src/components/marketplace/`
- `frontend/src/components/launch/` (expand)
- `frontend/src/components/ui/Toast.tsx`

### Dependencies

- Service layer.
- Wallet infrastructure.
- Reusable transaction-state conventions.

---

## Workstream 5 — Product Loops

### Scope

- Launch-to-trade.
- Own-to-sell.
- Discovery-to-conversion.
- Creator retention.
- Mobile trading/selling.

### Key files / directories

- `frontend/src/app/launch/`
- `frontend/src/app/profile/`
- `frontend/src/app/explore/`
- `frontend/src/components/marketplace/`
- `frontend/src/components/collection/`
- `frontend/src/components/nft/`

### Dependencies

- Architecture stability.
- Live integrations.
- UX consistency.
- Analytics instrumentation.

---

## Lane Model

## Lane A — Platform / Core Frontend

Owns:

- App shell.
- Route standards.
- Shared providers.
- UI-state patterns.
- Component extraction.
- Cross-domain frontend conventions.

Best suited for Claude:

- Bounded route refactors.
- Component extraction.
- Hook extraction.
- Helper-module creation.
- Test-suite expansion.

Human lead required for:

- New frontend architecture standards.
- Breaking refactor sequencing.
- Cross-domain dependency decisions.

---

## Lane B — Data / Backend Integration

Owns:

- API contracts.
- Search integration.
- Analytics and chart data.
- Realtime transport.
- Subgraph data readiness.

Best suited for Claude:

- Client wiring after API contracts are defined.
- Data adapters.
- Type scaffolding.
- Integration tests.

Human lead required for:

- API design.
- Schema decisions.
- Data consistency guarantees.
- Infrastructure tradeoffs.

---

## Lane C — Blockchain / Transaction Flows

Owns:

- Offers.
- Approvals.
- Listings.
- Launch execution.
- Curve trading.
- Graduation flow.

Best suited for Claude:

- UI transaction states.
- Shared transaction reducer patterns.
- Contract-hook wrappers with clear specs.
- Test scaffolding.

Human lead required for:

- Contract interaction correctness.
- Funds safety.
- Network assumptions.
- Security-sensitive flows.

---

## Lane D — UX Conversion

Owns:

- Listing UX.
- Seller conversion.
- Creator surfaces.
- Mobile trading ergonomics.
- CTA clarity and funnel polish.

Best suited for Claude:

- UI consistency refactors.
- Copy alignment.
- State-card creation.
- Responsive cleanup.

Human lead required for:

- Final UX judgment.
- Information architecture.
- Conversion-priority tradeoffs.

---

## Lane E — Quality / Observability

Owns:

- e2e coverage.
- Visual regression strategy.
- Accessibility audits.
- Performance budgets.
- Sentry / monitoring.
- Release criteria.

Best suited for Claude:

- Test creation.
- QA checklists.
- Instrumentation wiring with clear specs.
- Audit follow-up fixes.

Human lead required for:

- Release signoff.
- Severity thresholds.
- Monitoring policy.
- Incident response process.

---

## Claude vs Human Boundaries

### Claude is appropriate for:

- Well-bounded refactor slices.
- Clear file-creation and file-modification tasks.
- Pattern-based migrations.
- Test expansion.
- Documentation generation.
- Boilerplate-heavy service or component wiring.

### Human-led review is mandatory for:

- Security-sensitive blockchain flows.
- New architectural patterns.
- Major state-model changes affecting multiple domains.
- API/schema contracts.
- Performance tradeoffs with product implications.
- UX decisions that materially affect conversion.

### Rule of thumb

Claude implements within standards. Humans define the standards, approve exceptions, and own high-risk decisions.

---

## Quality Gates

These are permanent and non-negotiable.

### Gate 1 — No Inline Helper Sprawl

- No large helper components embedded in route files.
- No repeated page-local versions of reusable state cards, action panels, or summary blocks.

### Gate 2 — No Silent Placeholder UX

- No placeholder tabs, charts, or panels may ship without a tracked follow-up issue.
- Any partial integration must include explicit fallback or "coming soon" behavior.

### Gate 3 — Shared Accessibility Primitives

- All modals must use shared focus management.
- Keyboard behavior must be consistent.
- Focus visibility and announcement behavior must follow shared utilities.

### Gate 4 — Four-State Page Requirement

Every page must define:

- Loading.
- Empty.
- Error.
- Success/ready.

Domain-specific states are required when relevant.

### Gate 5 — e2e Coverage on Critical Paths

- Critical user flows require scenario-based e2e coverage.
- Refactors should expand coverage rather than merely preserve minimal smoke tests.

### Gate 6 — Monitoring Is Baseline, Not Polish

- Error reporting.
- Performance monitoring.
- User-impact analytics.
- Critical transaction instrumentation.

These are launch prerequisites for mature flows.

### Gate 7 — Verification Checklist Required

Every substantial change should verify, as applicable:

- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run build`
- Domain-specific manual QA

---

## 90-Day Sprint Plan

## Days 1–30 — Platform Unification

Primary goals:

- Standardize root app shell.
- Enforce thin-route patterns.
- Normalize design tokens and shared states.
- Integrate accessibility and monitoring primitives.
- Audit route files for inline sprawl.
- Define service-layer conventions.

Expected deliverables:

- Root layout cleanup.
- Modal/focus normalization.
- Shared loading/empty/error conventions.
- App-wide architecture guide applied to top-priority routes.
- Initial performance and error reporting baseline.

Success signal:

- The app feels more internally consistent before any major new feature ships.

## Days 31–60 — Marketplace Hardening

Primary goals:

- Replace placeholder data integrations.
- Wire search, analytics, price history, and activity.
- Finish offer-chain integration and approval flow.
- Integrate advanced but currently underused components.

Expected deliverables:

- Live search.
- Live analytics and charts.
- Realtime activity support.
- Functional offer flow.
- Production-grade transaction states.

Success signal:

- Core marketplace surfaces are live, measurable, and trustworthy rather than partially simulated.

## Days 61–90 — Launch + Seller Advantage

Primary goals:

- Ship the launch wizard and token trade shell.
- Implement curve lifecycle and graduation states.
- Begin seller conversion overhaul.
- Start creator identity and social proof surfaces.

Expected deliverables:

- `/launch` UX.
- Token detail/trading screen.
- Graduation lifecycle handling.
- Simplified listing UX foundation.
- Seller/creator roadmap slice started on stable architecture.

Success signal:

- ARC begins to differentiate through complete product loops, not just improved architecture.

---

## Key Files Reference

## Reference Pattern Files

Use these as living examples of the preferred structure:

- `frontend/src/components/profile/`
- `frontend/src/hooks/useProfileGateway.ts`
- `frontend/src/lib/profile.ts`

## Service Layer Starting Points

Use and extend these instead of creating parallel access layers:

- `frontend/src/services/api.ts`
- `frontend/src/services/websocket.ts`

## Existing Planning / Gap Context

These remain important background documents:

- `GAP_ANALYSIS.md`
- `REMEDIATION_PLAN.md`
- `DAPPS_ALIGNMENT_REVIEW.md`
- `FEATURE_MAP.md`
- `IMPLEMENTATION_STATUS.md`
- `plan.md`

## Priority Areas to Audit for Refactor Pattern Adoption

- `frontend/src/app/`
- `frontend/src/components/marketplace/`
- `frontend/src/components/collection/`
- `frontend/src/components/nft/`
- `frontend/src/components/navigation/`
- `frontend/src/components/layout/`
- `frontend/src/hooks/`
- `frontend/src/lib/`

---

## Supersedes

For forward planning, this document supersedes the piecemeal phase-by-phase tracking approach used in:

- `GAP_ANALYSIS.md`
- `PHASE_1_STATUS.md`
- `PHASE_2_1_STATUS.md`
- `PHASE_2_2_STATUS.md`
- `PHASE_2_3_STATUS.md`
- `PHASE_3_STATUS.md`
- `PHASE_4_STATUS.md`

Those files should still be preserved as historical records, audit trails, and implementation context, but this file is now the single authoritative roadmap for future refactor and integration planning.

---

## Operating Instructions

1. Before starting any epic, create or update GitHub issues using the templates in `.github/ISSUE_TEMPLATE/`.
2. For refactor work, scope tasks as bounded slices with explicit file lists, pattern references, and verification steps.
3. For integration work, define current state, target state, fallback behavior, and test coverage before coding begins.
4. Prefer additive migrations and reference implementations over broad rewrites without checkpoints.
5. Use completed refactors to raise the standard for the next domain.

---

## Definition of Success

ARC is "top dog" when:

- The codebase is fast to extend without regressions.
- The product feels coherent across every route and device class.
- Critical user flows are live, observable, and resilient.
- Marketplace, launch, and seller loops are complete and measurable.
- Quality is enforced by system, not heroics.

That is the purpose of this plan.
