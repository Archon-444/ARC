# ARC — Trust Layer for Circle-Native Agent Commerce

> **Pivot in flight.** The repo's pre-pivot positioning was "NFT
> marketplace + token launchpad." Strategic pivot (`STRATEGIC_PIVOT.md`)
> moved ARC to the independent trust, identity, and editorial-verification
> layer for Circle-native agent commerce. The legacy contracts +
> consumer surface remain in-tree as preserved primitives; new feature
> work targets the trust layer. The token-launcher / marketplace flow
> documentation below is kept verbatim for archaeology, but **none of
> it is in active feature work** — adding to it requires explicit user
> direction.

## Project Structure

Monorepo, npm workspaces. Top-level layout (post-W14):

- `apps/web/` — Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript. Trust surface (`/trust/[target]`, `/passport/[address]`, `/agents`, `/docs`) + 308 middleware that redirects the eight legacy marketplace prefixes to `/legacy`. (W14: renamed from `frontend/`.)
- `apps/trust-api/` — Express + facilitator-backed x402 paywall on Base mainnet USDC. Routes: `POST /v1/trust/read` ($0.01), `POST /v1/trust/read/deep` ($0.05 editorial), `GET /v1/passport/:address` (free), `GET /v1/attestations/:subject` (free).
- `apps/mcp-server/` — MCP server (stdio + Streamable HTTP). Tools: `arc_trust_read`, `arc_search`, `arc_passport_get`. Optional signing-payer via `ARC_MCP_PAYER_PRIVATE_KEY`.
- `apps/indexer/` — Express + WebSocket skeleton (W14: renamed from `backend/`, route-pruned to drop the seven marketplace routes). Future: ArcPassport + AttestationRegistry event listeners on Arc testnet.
- `packages/trust-core/` — scoring engine + cache helpers (extracted from `apps/web/src/lib/risk-scoring.ts`).
- `packages/x402-client/` — facilitator-backed x402 client (CJS dist for plain-node consumers).
- `packages/passport-sdk/` — TS client for ArcPassport over viem.
- `packages/attestation-reader/` — read-only viem client for AttestationRegistry.
- `packages/attestations/` — EIP-712 schemas + sign/verify/validate helpers. Five schemas: `counsel.kyb.v1`, `editorial.review.v1`, `treasury.policy.v1`, `token.suitability.v1` (DFSA-mapped), `stablecoin.reserves.v1` (ADGM FRT-mapped).
- `contracts/` — Solidity 0.8.24 (Hardhat). `contracts/contracts/{passport,reputation,attestations,validation}/` only. The 11 legacy `.sol` files live under `legacy-primitives/`.
- `legacy-primitives/` — quarantined pre-pivot contracts (11) + Hardhat tests (5) + deploy scripts (2). Not active feature work. ESLint `no-restricted-imports` rule blocks imports from `apps/*` or `packages/*`.
- `subgraph/` — The Graph indexing for the launched-token + marketplace surfaces (legacy; frozen).
- `skills/use-arc-trust/` — Claude Skill bundle for the trust-read gate.

## Quick Start

```bash
# Repo root
npm install                       # workspaces install
npm run dev:web                   # apps/web (Next.js)
npm run dev:trust-api             # apps/trust-api on :3030
npm run dev:mcp-server            # apps/mcp-server (stdio)
npm --workspace @arc/mcp-server run dev:http  # Streamable HTTP on :8080
```

## Frontend Commands (apps/web)

```bash
npm run lint:web          # ESLint
npm run type-check:web    # TypeScript
npm run test:web          # Jest unit tests
npm run build:web         # Production build
npm run dev:web           # Dev server
```

## Trust-layer Commands

```bash
# Smoke tests
npm run smoke:trust-api                # health + 402 quote shape
npm run smoke:trust-api:paid-mock      # paid round-trip vs mock facilitator

# Tests
npm run test:trust-core                # 33-case scoring suite
npm run test:passport-sdk              # 8 SDK unit tests (stubbed RPC)
npm run test:attestation-reader        # 6 read-client unit tests (stubbed RPC)
npm run test:attestations              # 5 schemas × sign + verify + tamper
npm run test:mcp-server                # 3 inspector specs (stdio + http + paid)

# Contracts (offline solc-js)
npm run check-trust-contracts          # compile passport / reputation / attestations / validation

# Marquee
npm --workspace @arc/attestations run demo:mena    # compose + verify MENA evidence
npm --workspace @arc/trust-api run smoke:load      # autocannon 10rps, SLO-gated
```

## Shared UI Library

All shared components live in `apps/web/src/components/ui/` with barrel exports in `index.ts`.

Available: Button (5 variants, 3 sizes), Card, Badge (9 variants), Input, StatCard, LoadingSpinner, ErrorDisplay, EmptyState, Skeleton, Modal, Toast, Pagination, Tabs.

Always use shared components instead of raw HTML elements for consistency.

## AI Integration

- `@anthropic-ai/sdk` — Anthropic API access (Haiku 4.5 with prompt caching for the editorial deep tier).
- Editorial deep tier (W10): `apps/trust-api/src/editorial/` — settles $0.05, returns commentary with 5KB cached system prompt + structured JSON output + per-target response cache (default 1h TTL). Deterministic stub when `ARC_ANTHROPIC_API_KEY` is unset.
- Legacy token-page generator (pre-pivot, not active feature work): `apps/web/src/app/api/ai/generate-token-page/route.ts`.
- Risk scoring: `packages/trust-core/src/scoring/v1-heuristic.ts` (extracted from the pre-pivot `apps/web/src/lib/risk-scoring.ts`; 33 unit tests preserved).

## Testing

- Unit tests: `npm test` (Jest + Testing Library)
- E2E tests: `npx playwright test` (Playwright) — runs from `apps/web/`
- Visual regression: `npx playwright test visual-regression --project=chromium`

## Service Layer Conventions (apps/web)

All data access follows a layered architecture. Components never call `fetch()` directly.

### Data Flow

```
React Component → Hook → Service/Lib → External Source
```

### Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Trust API** | `apps/web/src/lib/trust-surface.ts` | Calls to `@arc/trust-api` (passport, attestations, 402 quotes). Free endpoints + 402-quote shape for paid endpoints. |
| **REST API (legacy)** | `apps/web/src/services/api.ts` | Calls to the pre-pivot Express backend (now `apps/indexer/`). Marketplace routes are dropped; the surviving consumers live behind the 308 redirect. |
| **GraphQL** | `apps/web/src/lib/graphql-client.ts` | The Graph subgraph (`NEXT_PUBLIC_GRAPHQL_ENDPOINT`) — legacy marketplace + launched-token feeds (frozen). |
| **WebSocket** | `apps/web/src/services/websocket.ts` | Real-time (legacy); the new indexer will broadcast `passport:<addr>` and `attestation:<id>` rooms. |
| **React Query hooks** | `apps/web/src/hooks/useSubgraphQueries.ts` | Cached GraphQL (legacy). |
| **Token activity (legacy)** | `apps/web/src/hooks/useTokenActivity.ts` | Pre-pivot token-page subscription; lives behind the 308 redirect. |
| **REST hooks (legacy)** | `apps/web/src/hooks/useAnalytics.ts`, `useOffers.ts`, `usePriceHistory.ts` | Cached wrappers (legacy). |

### Rules

1. **No direct `fetch()` in components or pages** — use hooks that wrap service modules.
2. **Trust-API access** → import helpers from `@/lib/trust-surface`, wrap in React Query / RSC.
3. **Subgraph access (legacy)** → import query functions from `@/lib/graphql-client`.
4. **WebSocket access (legacy)** → import hooks from `@/services/websocket`.
5. **Blockchain reads/writes** → wagmi (`useReadContract`, `useWriteContract`) for legacy marketplace surfaces; viem (via `@arc/passport-sdk` / `@arc/attestation-reader`) for trust-layer reads.

### Documented Exceptions

- `useBuyNFT.ts` — uses direct `fetch('/api/circle/transaction')` because Circle SDK requires a specific challenge/execution flow that doesn't fit the generic service pattern. (Legacy.)
- `MediaViewer.tsx` — uses direct `fetch(src)` for media blob validation (not an API call).

### Reference Architecture

The profile domain demonstrates the canonical thin-route pattern:

- **Route:** `apps/web/src/app/profile/[address]/page.tsx` (thin, ~10 lines)
- **Components:** `apps/web/src/components/profile/` (domain UI)
- **Hook:** `apps/web/src/hooks/useProfileGateway.ts` (data orchestration)
- **Lib:** `apps/web/src/lib/profile.ts` (pure helpers, types)

The new trust surface (W11) follows the same pattern: `apps/web/src/app/{trust,passport,agents,docs}/` + `apps/web/src/lib/trust-surface.ts`.

## Key Conventions

- Path alias: `@/` maps to `apps/web/src/`
- Design tokens: use `primary-*`, `accent-*`, `error-*` instead of raw Tailwind colors
- Mobile-first: use `sm:`, `md:`, `lg:` breakpoints
- Web3: wagmi + viem + RainbowKit for wallet connection; Circle App Kit for the Circle wallet flow

## Route Architecture

Every route should follow the thin-route pattern:

```
app/[domain]/page.tsx          → thin wrapper (< 20 lines)
components/[domain]/           → domain-specific components
hooks/use[Domain]*.ts          → data fetching + state
lib/[domain].ts                → pure types, constants, helpers
```

Routes must include:
- `error.tsx` — per-route error boundary using `ErrorPage` from shared UI
- `loading.tsx` — skeleton loading state using `Skeleton` from shared UI

## Token launcher flow (LEGACY — frozen, 308-redirected to `/legacy`)

Preserved here for archaeology; not active feature work. The eight legacy URLs (`/cart`, `/collection*`, `/explore`, `/launch`, `/nft`, `/rewards`, `/token`) all 308 to `/legacy` via `apps/web/src/middleware.ts`. The contracts remain deployed on Arc testnet as preserved primitives (`legacy-primitives/contracts/`).

- **Launch**: `apps/web/src/app/launch/page.tsx` — short form (name, ticker, image, description, socials); bonding curve behind "Advanced".
- **Token page**: `apps/web/src/app/token/[address]/page.tsx` — market-first.
- **Discovery**: `apps/web/src/components/explore/ExploreContent.tsx` — Tokens tab.
- **Indexer**: token-activity routes were dropped in W14. The `apps/indexer/` skeleton no longer mounts marketplace endpoints.
- **Subgraph**: legacy `ArcTokenFactory` address; see `subgraph/DEPLOY.md`.
