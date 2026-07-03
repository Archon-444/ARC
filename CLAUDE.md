# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ARC — NFT Marketplace + Token Launchpad

Full-stack marketplace and token launcher on Circle's Arc blockchain: USDC for gas and payments, launcher-first loop (launch → token page → discovery).

## Project Structure

Monorepo with four packages (no workspace tooling — `cd` into each package and use its own npm scripts):

- `frontend/` — Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, wagmi/viem/RainbowKit, Circle SDKs
- `backend/` — Express REST API (`/v1/*`) + WebSocket rooms (NFT, collection, user, `token:<address>`); Prisma + Redis + Typesense
- `contracts/` — Solidity 0.8.24 (Hardhat): ArcMarketplace, FeeVault, ProfileRegistry, StakingRewards, SimpleGovernance, ArcTokenFactory, ArcBondingCurveAMM; experimental Diamond pattern in `diamonds/` + `facets/`; deprecated v0.1 contracts in `contracts/archive/`
- `subgraph/` — The Graph indexing (marketplace + token launcher: LaunchedToken, TokenTrade, TokenGraduation)

## Commands

### Frontend (`cd frontend`)

```bash
npm install
cp .env.example .env.local        # fill in API keys
npm run dev                       # http://localhost:3000
npm run lint                      # ESLint (src/); lint:fix to auto-fix
npm run type-check                # tsc --noEmit
npm test                          # Jest unit tests
npm test -- path/to/file.test.ts  # single test file
npm test -- -t "test name"        # single test by name
npm run test:coverage             # Jest with coverage
npm run build                     # Production build (next build --webpack)
npx playwright test               # E2E tests (frontend/e2e/)
npx playwright test e2e/explore.spec.ts                     # single E2E spec
npx playwright test visual-regression --project=chromium    # visual regression
```

### Backend (`cd backend`)

```bash
npm run dev          # ts-node-dev on src/server.ts (default port 3001)
npm test             # Jest
npm run lint
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev
npm run db:seed
```

### Contracts (`cd contracts`)

```bash
npm run compile                                  # hardhat compile
npm test                                         # hardhat test
npx hardhat test test/ArcTokenFactory.test.js    # single test file
npm run test:coverage                            # solidity-coverage
npm run node:local                               # local hardhat node
npm run deploy:arc-testnet                       # scripts/deploy-arc.js --network arcTestnet
```

### Subgraph (`cd subgraph`)

```bash
npm run update-config   # scripts/update-config.js (writes addresses into subgraph.yaml)
npm run codegen && npm run build
npm run deploy:studio   # graph deploy --studio arcmarket
```

Set the ArcTokenFactory address before deploying — see `subgraph/DEPLOY.md`.

CI (`.github/workflows/ci.yml`) runs lint + type-check, contract tests + coverage, frontend tests, build, and `npm audit` — keep all of these green.

## Shared UI Library

All shared components live in `frontend/src/components/ui/` with barrel exports in `index.ts`.

Available: Button (5 variants, 3 sizes), Card, Badge (9 variants), Input, StatCard, LoadingSpinner, ErrorDisplay, EmptyState, Skeleton, Modal, Toast, Pagination, Tabs, plus accessibility helpers (FocusTrap, LiveRegion, SkipLink, VisuallyHidden) and media (OptimizedImage, LazyImage).

Always use shared components instead of raw HTML elements for consistency.

## AI Integration

- `@anthropic-ai/sdk` for AI-powered token page generation
- Route: `frontend/src/app/api/ai/generate-token-page/route.ts`
- Hook: `frontend/src/hooks/useGenerateTokenPage.ts`
- Risk scoring: `frontend/src/lib/risk-scoring.ts` (pure functions with unit tests); surfaced via `useTokenRisk` and `RiskBadge`

## Service Layer Conventions

All data access follows a layered architecture. Components never call `fetch()` directly.

### Data Flow

```
React Component → Hook → Service/Lib → External Source
```

### Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **REST API** | `frontend/src/services/api.ts` | All calls to the Express backend (`NEXT_PUBLIC_BACKEND_URL`, default `http://localhost:3001`, paths under `/v1/*`) |
| **GraphQL** | `frontend/src/lib/graphql-client.ts` | All calls to The Graph subgraph (`NEXT_PUBLIC_GRAPHQL_ENDPOINT`): listings, auctions, **fetchLaunchedTokens**, fetchTokenDetail, fetchTokenTrades, fetchCreatorTokens, fetchTokenLauncherStats |
| **WebSocket** | `frontend/src/services/websocket.ts` | Real-time NFT/collection/user rooms: `useActivityFeed`, `useOfferNotifications`, `useUserNotifications` |
| **React Query hooks** | `frontend/src/hooks/useSubgraphQueries.ts` | Cached GraphQL: **useLaunchedTokensQuery**, useListingsQuery, useTokenDetailQuery, useTokenTradesQuery, useTokenLauncherStatsQuery, etc. |
| **REST hooks** | `frontend/src/hooks/useAnalytics.ts`, `useOffers.ts`, `usePriceHistory.ts` | Cached wrappers for REST API modules |
| **Blockchain** | `frontend/src/hooks/useTokenFactory.ts`, `useTokenAMM.ts`, `useMarketplace.ts` | wagmi reads/writes: `useTokenConfig`, `useTokenAMM`, `useCreateToken`, `useBuyTokens`/`useSellTokens`, `useRecentTrades`, `useCurrentPrice`, `useGraduationProgress` |

### Rules

1. **No direct `fetch()` in components or pages** — use hooks that wrap service modules
2. **REST access** → import `api` from `@/services/api`, wrap in React Query hook
3. **Subgraph access** → import query functions from `@/lib/graphql-client`, wrap in React Query hook
4. **WebSocket access** → import hooks from `@/services/websocket`
5. **Blockchain reads/writes** → use wagmi hooks (`useReadContract`, `useWriteContract`); token config/AMM go through `@/hooks/useTokenFactory` and `@/hooks/useTokenAMM`

### Documented Exceptions

- `useBuyNFT.ts` — uses direct `fetch('/api/circle/transaction')` because Circle SDK requires a specific challenge/execution flow that doesn't fit the generic service pattern
- `MediaViewer.tsx` — uses direct `fetch(src)` for media blob validation (not an API call)

### Reference Architecture

The profile domain demonstrates the canonical pattern:

- **Route:** `frontend/src/app/profile/[address]/page.tsx` (thin, ~10 lines)
- **Components:** `frontend/src/components/profile/` (domain UI)
- **Hook:** `frontend/src/hooks/useProfileGateway.ts` (data orchestration)
- **Lib:** `frontend/src/lib/profile.ts` (pure helpers, types)

## Key Conventions

- Path alias: `@/` maps to `frontend/src/` (in both tsconfig and Jest)
- Design tokens: use `primary-*`, `accent-*`, `error-*` instead of raw Tailwind colors
- Mobile-first: use `sm:`, `md:`, `lg:` breakpoints
- Web3: wagmi + viem + RainbowKit for wallet connection; Circle SDKs (App Kit, user/developer-controlled wallets) for social login and USDC flows

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

Next.js API routes live in `frontend/src/app/api/` (activity, ai, auth, circle, cron, nft-metadata, price-history, rarity, token, wallet).

## Token Launcher Flow

- **Launch**: `frontend/src/app/launch/page.tsx` — short form (name, ticker, image, description, socials); bonding curve behind "Advanced"; uses `useCreateToken` from `useTokenFactory`; success → Open token market, Copy address, Share link, Launch another.
- **Token page**: `frontend/src/app/token/[address]/page.tsx` — market-first: identity, price, graduation, recent trades, buy/sell panels. Resolves the route address against the factory, then reads on-chain via `useTokenConfig`, `useCurrentPrice`, `useGraduationProgress`, `useCalculateBuyReturn`/`useCalculateSellReturn`, `useRecentTrades`. Domain components in `frontend/src/components/token/` (BuyTokenPanel, SellTokenPanel, GraduationBanner, LauncherTokenCard, RiskBadge).
- **Discovery**: `frontend/src/components/explore/ExploreContent.tsx` — Tokens tab (`/explore?tab=tokens`) with sections New, Trending, Recent activity, Nearing graduation, Graduated; renders `LauncherTokenGrid` from `@/components/token/LauncherTokenCard` using subgraph data (`useLaunchedTokensQuery`), falling back to on-chain `useAllTokens` when the subgraph is empty. No per-card chain reads.
- **Backend**: `GET /v1/activity/token/:address` (recent activity), `POST /v1/activity/token/broadcast` (pushes to the `token:<address>` WebSocket room via `broadcastTokenActivity`). See `backend/TOKEN_ACTIVITY_BROADCAST.md`. Note: the frontend does not currently consume the token room — token pages rely on chain reads + subgraph.
- **Contracts**: `ArcTokenFactory.sol` (creation fee, per-token config) + `ArcBondingCurveAMM.sol` (bonding curve per token; graduation, staking, creator reserve).

## Backend Notes

- Routes in `backend/src/routes/` (activity, analytics, collection, nft, offer, search, user), all mounted under `/v1`
- WebSocket rooms in `backend/src/websocket/index.ts`: `nft`, `collection`, `user`, and `token:<address>`
- Prisma schema in `backend/prisma/`; Typesense config in `backend/typesense/`; `docker-compose.yml` at repo root runs Typesense for local search

## Other Documentation

- `README.md` — feature overview and production-readiness status
- `SECURITY_AUDIT.md` / `SECURITY_FIXES.md` — security findings and remediation
- `backend/README.md` and `backend/api-spec.yaml` — API and WebSocket docs
- `subgraph/DEPLOY.md` — subgraph deployment (factory address required)
- `TESTING.md` / `TESTING_GUIDE.md` — testing strategy
