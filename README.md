# ArcMarket - NFT Marketplace on Arc Blockchain

A full-stack NFT marketplace built on Circle's Arc blockchain, leveraging USDC as gas and native payment currency with instant sub-second finality.

## Version 0.4 - Production Ready

**Current Status:** 90% Complete towards world-class marketplace standards

All core phases completed. Ready for user acceptance testing and production deployment.

### Completed Features (November 2025)

- **Phase 1: Foundation** - Testing infrastructure, design system, component library
- **Phase 2: Critical Features** - Filtering, search, collection pages, NFT details
- **Phase 3: UX Enhancements** - Animations, WebSocket real-time, PWA, toast notifications
- **Phase 4: Performance & Polish** - Web Vitals, accessibility, SEO, bundle optimization
- **Security Audit** - Critical vulnerabilities identified and fixed

See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for detailed progress and [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for security findings.

## Features

### Smart Contracts
- **Fixed-Price Listings**: List NFTs for sale at a fixed USDC price
- **English Auctions**: Time-bound auctions with automatic bid refunds
- **USDC Payments**: All transactions denominated in USDC
- **Instant Finality**: Sub-second transaction confirmation
- **Transparent Royalties**: Automatic creator royalty distribution via FeeVault
- **User Profiles**: On-chain profile registry with off-chain metadata
- **Staking & Governance**: StakingRewards and SimpleGovernance contracts
- **Token Launcher**: ArcTokenFactory with bonding curve AMM

### Frontend
- **Advanced Filtering**: FilterPanel with trait filtering and rarity percentages
- **Search**: Typesense-powered instant search with Cmd+K command palette
- **Collection Pages**: Full collection browsing with metrics and virtual scrolling
- **NFT Detail Pages**: Media viewer, price history charts, activity feed
- **Animations**: Framer Motion with page transitions and micro-interactions
- **Real-time Updates**: WebSocket-powered activity feed with mock mode
- **PWA**: Service worker, offline page, install prompts
- **Dark Mode**: Theme toggle with system preference detection

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
├── backend/                # Express REST API (standalone, not yet integrated)
│   └── src/                # Routes, WebSocket server, auth
│
├── .github/workflows/      # CI/CD (ci.yml, e2e.yml, deploy.yml)
├── GAP_ANALYSIS.md         # Progress tracking
└── SECURITY_AUDIT.md       # Security findings
```

## Production Readiness

| Feature | Status | Notes |
|---------|--------|-------|
| Smart contracts | Production-ready | All contracts tested, quorum fix applied |
| Frontend UI | Production-ready | Full marketplace, collection, NFT detail pages |
| Circle SDK | Production-ready | Social login, wallet management, transactions |
| Subgraph | Partially ready | ArcTokenFactory address needs deployment update |
| Backend API | Not integrated | Express server exists but frontend uses GraphQL + Next.js API routes |
| Real-time feed | Polling (15s) | Not true WebSocket; backend WS exists but is disconnected |
| Rate limiting | Dev only | In-memory; needs Redis/Upstash for production |
| Token launcher | Contracts only | Smart contracts exist; frontend UI and subgraph indexing incomplete |

See [DAPPS_ALIGNMENT_REVIEW.md](./DAPPS_ALIGNMENT_REVIEW.md) for the full alignment audit.

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

### Unit Tests (112 tests)

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

### E2E Tests (37 tests)

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

### NFTMarketplace.sol

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
- Security headers (HSTS, X-Frame-Options, etc.)

## Roadmap

### Completed
- [x] Phase 1: Foundation (testing, design system)
- [x] Phase 2: Critical Features (filtering, search, collections)
- [x] Phase 3: UX Enhancements (animations, WebSocket, PWA)
- [x] Phase 4: Performance & Polish (Web Vitals, accessibility, SEO)
- [x] Security Audit

### Pre-Launch
- [ ] User acceptance testing
- [ ] Production deployment configuration
- [ ] Beta launch

### v0.5 - Advanced Features
- Lazy minting for creators
- Offer system for unlisted NFTs
- Bulk operations (batch listing/buying)
- Analytics dashboard

## Documentation

- [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) - Progress tracking and roadmap
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Security audit findings
- [e2e/README.md](./frontend/e2e/README.md) - E2E testing guide

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
