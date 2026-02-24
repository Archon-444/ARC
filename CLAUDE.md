# ARC — NFT Marketplace + Token Launchpad

## Project Structure

Monorepo with four packages:

- `frontend/` — Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- `backend/` — Express REST API with Prisma ORM (not currently integrated with frontend)
- `contracts/` — Solidity 0.8.24 smart contracts (Hardhat)
- `subgraph/` — The Graph indexing

## Quick Start

```bash
cd frontend
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

All shared components live in `frontend/src/components/ui/` with barrel exports in `index.ts`.

Available: Button (5 variants, 3 sizes), Card, Badge (9 variants), Input, StatCard, LoadingSpinner, ErrorDisplay, EmptyState, Skeleton, Modal, Toast, Pagination, Tabs.

Always use shared components instead of raw HTML elements for consistency.

## AI Integration

- `@anthropic-ai/sdk` for AI-powered token page generation
- Route: `frontend/src/app/api/ai/generate-token-page/route.ts`
- Hook: `frontend/src/hooks/useGenerateTokenPage.ts`
- Risk scoring: `frontend/src/lib/risk-scoring.ts` (pure functions, 33 unit tests)

## Testing

- Unit tests: `npm test` (Jest + Testing Library)
- E2E tests: `npx playwright test` (Playwright)
- Visual regression: `npx playwright test visual-regression --project=chromium`

## Key Conventions

- Path alias: `@/` maps to `frontend/src/`
- Design tokens: use `primary-*`, `accent-*`, `error-*` instead of raw Tailwind colors
- Mobile-first: use `sm:`, `md:`, `lg:` breakpoints
- Web3: wagmi + viem + RainbowKit for wallet connection
