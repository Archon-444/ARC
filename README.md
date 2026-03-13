# ARC — NFT Marketplace + Token Launchpad on Arc Blockchain

A full-stack marketplace and **token launcher** on Circle's Arc blockchain: USDC for gas and payments, sub-second finality, and a launcher-first loop (launch → token page → discovery).

## Version 0.4 — Core + Token Launcher

**Current Status:** Core marketplace and token launcher flows implemented. Security remediation and production infra in progress.

### Completed

- **Marketplace**: Listings, auctions, collections, NFT detail pages, search, filtering
- **Token launcher**: Short launch flow (name, ticker, image, socials; bonding curve behind “Advanced”), success → Open token market / Copy address / Share link / Launch another
- **Token page**: Market-first layout — identity, price, graduation progress, recent trades, one buy CTA; copy contract/share and socials in hero; Connected routes, Distribution, Community in collapsible Details
- **Token discovery**: First-class in Explore (New, Trending, Recent activity, Nearing graduation, Graduated) with launcher-native cards; Home “Explore tokens” CTA
- **Realtime**: Backend token WebSocket room (`token:<address>`), `GET /v1/activity/token/:address`, `POST /v1/activity/token/broadcast`; frontend `useTokenActivity` and `subscribeToToken`
- **Trust layer**: Footer Legal & company; compliance line; trust in footer/collapsible, not in main loop

See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for progress and [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for security findings.

## Features

### Smart Contracts
- **Fixed-Price Listings**: List NFTs for sale at a fixed USDC price
- **English Auctions**: Time-bound auctions with automatic bid refunds
- **USDC Payments**: All transactions denominated in USDC
- **Instant Finality**: Sub-second transaction confirmation
- **Transparent Royalties**: Automatic creator royalty distribution via FeeVault
- **User Profiles**: On-chain profile registry with off-chain metadata
- **Staking & Governance**: StakingRewards and SimpleGovernance contracts
- **Token Launcher**: ArcTokenFactory + ArcBondingCurveAMM (bonding curve per token; graduation, staking, creator reserve)

### Frontend
- **Token launcher**: Launch page (compact form, live preview, advanced bonding curve), token market page (price, graduation, trades, buy/sell), discovery (New / Trending / Recent / Nearing graduation / Graduated)
- **Marketplace**: Advanced filtering, Typesense search, collection and NFT detail pages, media viewer, price history, activity feed
- **Real-time**: WebSocket for NFT/collection activity; token activity via `subscribeToToken` and `useTokenActivity`
- **PWA**: Service worker, offline page, install prompts
- **Dark mode**: Theme toggle with system preference detection

### Quality & Testing
- **Unit Tests**: 160 frontend tests (Jest + React Testing Library), 1,354 contract tests
- **E2E Tests**: Playwright with 198 test cases across 7 specs
- **Accessibility**: Skip links, LiveRegion, keyboard navigation, ARIA utilities
- **Performance**: Core Web Vitals monitoring, bundle analysis
- **SEO**: Sitemap, robots.txt, JSON-LD structured data

## Architecture

```
ArcMarket/
├── contracts/              # Smart contracts (Solidity 0.8.24)
│   ├── contracts/
│   │   ├── ArcMarketplace.sol      # Core marketplace logic
│   │   ├── FeeVault.sol            # Royalty & fee distribution
│   │   ├── ProfileRegistry.sol     # User profiles
│   │   ├── StakingRewards.sol      # Staking rewards
│   │   ├── SimpleGovernance.sol    # DAO governance
│   │   ├── ArcTokenFactory.sol     # Token launcher
│   │   ├── ArcBondingCurveAMM.sol  # Bonding curve AMM
│   │   └── archive/                # Deprecated v0.1 contracts
│   └── test/                       # Contract tests (1,354 cases)
│
├── frontend/               # Next.js 16 + TypeScript + Tailwind v4
│   ├── src/
│   │   ├── app/            # App router pages + 15 API routes
│   │   ├── components/     # React components (ui, nft, navigation)
│   │   ├── hooks/          # Custom React hooks (marketplace, token, staking)
│   │   ├── lib/            # Utilities (wagmi, animations, accessibility)
│   │   └── services/       # API and WebSocket services
│   ├── e2e/                # Playwright E2E tests (198 cases)
│   └── public/             # Static assets, PWA manifest, service worker
│
├── subgraph/               # The Graph subgraph for indexing
│   ├── schema.graphql      # GraphQL schema
│   ├── subgraph.yaml       # Data source config
│   └── src/                # AssemblyScript event handlers
│
├── backend/                # Express REST API + WebSocket
│   ├── src/                # Routes (activity, NFT, offers, …), websocket (token + NFT rooms)
│   ├── TOKEN_ACTIVITY_BROADCAST.md   # How to push token trade/graduation events
│   └── README.md           # API and WebSocket docs
│
├── subgraph/               # The Graph indexing (marketplace + token launcher)
│   ├── DEPLOY.md           # Set ArcTokenFactory address before deploy
│   ├── SUBGRAPH_DEPLOYMENT.md
│   └── schema.graphql     # LaunchedToken, TokenTrade, TokenGraduation, …
│
├── .github/workflows/      # CI/CD
├── GAP_ANALYSIS.md         # Progress tracking
└── SECURITY_AUDIT.md       # Security findings
```

## Production Readiness

| Feature | Status | Notes |
|---------|--------|-------|
| Smart contracts | Production-ready | Marketplace + ArcTokenFactory/AMM tested |
| Frontend UI | Production-ready | Marketplace + token launch, token page, explore tokens |
| Circle SDK | Production-ready | Social login, wallet management, transactions |
| Subgraph | Partially ready | Set ArcTokenFactory address in `subgraph.yaml` before deploy; see [subgraph/DEPLOY.md](./subgraph/DEPLOY.md) |
| Backend API | Standalone | Express + WebSocket; token activity: `GET /v1/activity/token/:address`, `POST /v1/activity/token/broadcast`; frontend also uses GraphQL + Next.js API routes |
| Real-time | Partial | WebSocket token room + `useTokenActivity`; set `NEXT_PUBLIC_WS_URL` for live token updates |
| Token launcher | Implemented | Launch flow, token page, discovery (New/Trending/Recent/Nearing/Graduated), LauncherTokenCard; indexer can call broadcast for live feed |

See [DAPPS_ALIGNMENT_REVIEW.md](./DAPPS_ALIGNMENT_REVIEW.md) for the full alignment audit.

### Frontend shell

Shell and design-system documentation lives in `frontend/docs/`: [REGRESSION_CHECKLIST.md](./frontend/docs/REGRESSION_CHECKLIST.md) (mobile nav and shell checks), [DESIGN_TOKENS.md](./frontend/docs/DESIGN_TOKENS.md) (design tokens and Tailwind usage), [BASELINE_ALIGNMENT.md](./frontend/docs/BASELINE_ALIGNMENT.md) (baseline alignment).

## Getting Started

### Prerequisites

- Node.js 20+ and npm 9+
- Git
- Wallet with Arc testnet funds (for contract deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/Archon-444/ARC.git
cd ARC

# Install contract dependencies
cd contracts && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Configuration

Create `frontend/.env.local` from the example:

```env
# Circle SDK
NEXT_PUBLIC_CIRCLE_ENVIRONMENT=testnet
NEXT_PUBLIC_CIRCLE_APP_ID_TESTNET=your_app_id
CIRCLE_API_KEY_TESTNET=your_api_key

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network

# Contract Addresses
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_FEE_VAULT_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=0x...   # For token launcher; also set in subgraph (see subgraph/DEPLOY.md)

# Optional: backend + WebSocket (token activity realtime)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws

# Auth
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

### Development

```bash
# Start frontend dev server
cd frontend
npm run dev

# Run unit tests
npm test

# Run E2E tests (requires playwright browsers)
npx playwright install
npm run test:e2e

# Build for production
npm run build

# Analyze bundle
npm run analyze
```

## Testing

### Unit Tests (160 tests)

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

### E2E Tests (198 test cases)

```bash
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # See browser
npm run test:e2e:report     # View HTML report
```

Test coverage:
- Button, Modal, Badge, EmptyState components
- NFTCard, NFTGrid, NFTCardSkeleton
- Homepage, navigation, search, explore pages
- Accessibility, PWA, SEO features

## Smart Contracts

### ArcMarketplace.sol

```solidity
// Listings
function listItem(address collection, uint256 tokenId, uint256 price) external
function buyItem(address collection, uint256 tokenId) external
function cancelListing(address collection, uint256 tokenId) external

// Auctions
function createAuction(...) external
function placeBid(address collection, uint256 tokenId, uint256 bidAmount) external
function settleAuction(address collection, uint256 tokenId) external
```

### FeeVault.sol

```solidity
function setCollectionSplits(address collection, CollectionSplit[] calldata splits) external
function setGlobalSplits(GlobalSplit[] calldata splits) external
function distribute(address collection, uint256 tokenId, uint256 amount) external
```

## Security

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for the full security audit report.

**Key Security Features:**
- ReentrancyGuard on all state-changing contract functions
- Session validation on API endpoints
- IDOR protection on token refresh
- No sensitive data exposure in error responses
- Security headers (HSTS, X-Frame-Options, CSP, etc.)

## Roadmap

### Completed
- [x] Phase 1: Foundation (testing, design system)
- [x] Phase 2: Critical Features (filtering, search, collections)
- [x] Phase 3: UX Enhancements (animations, WebSocket, PWA)
- [x] Phase 4: Performance & Polish (Web Vitals, accessibility, SEO)
- [x] Security Audit

### Pre-Launch
- [ ] Security remediation (IDOR fixes, rate limiting)
- [ ] Infrastructure setup (Redis, PostgreSQL, monitoring)
- [ ] WebSocket integration completion
- [ ] User acceptance testing
- [ ] Production deployment configuration
- [ ] Beta launch

### v0.5 - Advanced Features
- Lazy minting for creators
- Offer system for unlisted NFTs
- Bulk operations (batch listing/buying)
- Analytics dashboard

## Documentation

- [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) — Progress tracking and roadmap
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) — Security audit findings
- [CLAUDE.md](./CLAUDE.md) — Project context and conventions (for AI and contributors)
- [subgraph/DEPLOY.md](./subgraph/DEPLOY.md) — Set ArcTokenFactory address before subgraph deploy
- [backend/TOKEN_ACTIVITY_BROADCAST.md](./backend/TOKEN_ACTIVITY_BROADCAST.md) — Push token trade/graduation events to WebSocket
- [frontend/e2e/README.md](./frontend/e2e/README.md) — E2E testing guide

## Contributing

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/ARC.git

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run lint
npm run type-check
npm test

# Submit pull request
```

## License

MIT License - see LICENSE file for details.

## Links

- **Circle Arc Blockchain**: https://www.circle.com/en/circle-arc
- **Documentation**: Coming Soon
- **Discord**: Coming Soon

---

**Built for the Arc ecosystem**
