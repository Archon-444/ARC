# ARC — NFT Marketplace + Token Launchpad

## Project Structure

Monorepo with four packages:

- `apps/web/` — Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- `backend/` — Express REST API + WebSocket (token + NFT activity rooms)
- `contracts/` — Solidity 0.8.24 smart contracts (Hardhat): marketplace, ArcTokenFactory, ArcBondingCurveAMM
- `subgraph/` — The Graph indexing (marketplace + token launcher: LaunchedToken, TokenTrade, TokenGraduation)

## Quick Start

```bash
cd apps/web
npm install
cp .env.example .env.local   # fill in API keys
npm run dev                   # http://localhost:3000
```

## Frontend Commands

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm test              # Jest unit tests
npm run type-check    # TypeScript type checking
npm run build         # Production build
npm run dev           # Dev server
```

## Shared UI Library

All shared components live in `apps/web/src/components/ui/` with barrel exports in `index.ts`.

Available: Button (5 variants, 3 sizes), Card, Badge (9 variants), Input, StatCard, LoadingSpinner, ErrorDisplay, EmptyState, Skeleton, Modal, Toast, Pagination, Tabs.

Always use shared components instead of raw HTML elements for consistency.

## AI Integration

- `@anthropic-ai/sdk` for AI-powered token page generation
- Route: `apps/web/src/app/api/ai/generate-token-page/route.ts`
- Hook: `apps/web/src/hooks/useGenerateTokenPage.ts`
- Risk scoring: `apps/web/src/lib/risk-scoring.ts` (pure functions, 33 unit tests)

## Testing

- Unit tests: `npm test` (Jest + Testing Library)
- E2E tests: `npx playwright test` (Playwright)
- Visual regression: `npx playwright test visual-regression --project=chromium`

## Service Layer Conventions

All data access follows a layered architecture. Components never call `fetch()` directly.

### Data Flow

```
React Component → Hook → Service/Lib → External Source
```

### Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **REST API** | `apps/web/src/services/api.ts` | All calls to the Express backend (`NEXT_PUBLIC_BACKEND_URL`) |
| **GraphQL** | `apps/web/src/lib/graphql-client.ts` | All calls to The Graph subgraph (`NEXT_PUBLIC_GRAPHQL_ENDPOINT`): listings, auctions, **fetchLaunchedTokens**, fetchTokenDetail, fetchTokenTrades |
| **WebSocket** | `apps/web/src/services/websocket.ts` | Real-time: NFT/collection activity, offers, user notifications, **subscribeToToken(tokenAddress)** for token trade/graduation |
| **React Query hooks** | `apps/web/src/hooks/useSubgraphQueries.ts` | Cached GraphQL: **useLaunchedTokensQuery**, useListingsQuery, useTokenDetailQuery, etc. |
| **Token activity** | `apps/web/src/hooks/useTokenActivity.ts` | Token page + discovery: fetch `/api/activity/token/:address`, subscribe to token room, invalidate launched tokens on events |
| **REST hooks** | `apps/web/src/hooks/useAnalytics.ts`, `useOffers.ts`, `usePriceHistory.ts` | Cached wrappers for REST API modules |

### Rules

1. **No direct `fetch()` in components or pages** — use hooks that wrap service modules
2. **REST access** → import `api` from `@/services/api`, wrap in React Query hook
3. **Subgraph access** → import query functions from `@/lib/graphql-client`, wrap in React Query hook
4. **WebSocket access** → import hooks from `@/services/websocket` (`useActivityFeed`, `useOfferNotifications`, **subscribeToToken** for token activity)
5. **Token activity (launcher)** → `useTokenActivity(tokenAddress)` from `@/hooks/useTokenActivity` (REST + WebSocket; used on token page and invalidates discovery)
6. **Blockchain reads/writes** → use wagmi hooks (`useReadContract`, `useWriteContract`); token config/AMM: `useTokenConfig`, `useTokenAMM`, `useRecentTrades` from `@/hooks/useTokenFactory` and `@/hooks/useTokenAMM`

### Documented Exceptions

- `useBuyNFT.ts` — uses direct `fetch('/api/circle/transaction')` because Circle SDK requires a specific challenge/execution flow that doesn't fit the generic service pattern
- `MediaViewer.tsx` — uses direct `fetch(src)` for media blob validation (not an API call)

### Reference Architecture

The profile domain demonstrates the canonical pattern:

- **Route:** `apps/web/src/app/profile/[address]/page.tsx` (thin, ~10 lines)
- **Components:** `apps/web/src/components/profile/` (domain UI)
- **Hook:** `apps/web/src/hooks/useProfileGateway.ts` (data orchestration)
- **Lib:** `apps/web/src/lib/profile.ts` (pure helpers, types)

## Key Conventions

- Path alias: `@/` maps to `apps/web/src/`
- Design tokens: use `primary-*`, `accent-*`, `error-*` instead of raw Tailwind colors
- Mobile-first: use `sm:`, `md:`, `lg:` breakpoints
- Web3: wagmi + viem + RainbowKit for wallet connection

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

## Token launcher flow

- **Launch**: `apps/web/src/app/launch/page.tsx` — short form (name, ticker, image, description, socials); bonding curve behind “Advanced”; success → Open token market, Copy address, Share link, Launch another.
- **Token page**: `apps/web/src/app/token/[address]/page.tsx` — market-first: identity, price, graduation, recent trades, one buy CTA; copy contract/share and socials in hero; Connected routes, Distribution, Community in collapsible Details. Uses `useTokenActivity(routeAddress)` for live subscription.
- **Discovery**: `apps/web/src/components/explore/ExploreContent.tsx` — Tokens tab with sections New, Trending, Recent activity, Nearing graduation, Graduated; `LauncherTokenCard` / `LauncherTokenGrid` from subgraph data (no per-card chain reads). Home links to `/explore?tab=tokens` (“Explore tokens”).
- **Backend**: `GET /v1/activity/token/:address` (recent activity), `POST /v1/activity/token/broadcast` (push event to token room). See `backend/TOKEN_ACTIVITY_BROADCAST.md`.
- **Subgraph**: Set ArcTokenFactory address before deploy; see `subgraph/DEPLOY.md`.
