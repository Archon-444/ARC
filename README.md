# ArcMarket - NFT Marketplace on Arc Blockchain

A full-stack NFT marketplace built on Circle's Arc blockchain, leveraging USDC as gas and native payment currency with instant sub-second finality.

## 🌟 Version 0.2 (In Development)

**Current Status:** 35% Complete towards world-class marketplace standards

This release focuses on building production-ready infrastructure with enhanced design system, comprehensive testing, and accessibility compliance.

### Recent Updates (November 2025)

- ✅ Enhanced image optimization (AVIF/WebP support)
- ✅ Comprehensive design system with CSS tokens
- ✅ Jest testing framework setup
- ✅ Skeleton and EmptyState components
- ✅ Complete documentation (Gap Analysis, Testing, Accessibility, Contributing)

See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for detailed progress and roadmap.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)

## ✨ Features

### Core Marketplace (v0.2)

#### Smart Contracts ✅
- ✅ **Fixed-Price Listings**: List NFTs for sale at a fixed USDC price
- ✅ **English Auctions**: Time-bound auctions with automatic bid refunds
- ✅ **USDC Payments**: All transactions denominated in USDC (Arc's native advantage)
- ✅ **Instant Finality**: Sub-second transaction confirmation
- ✅ **Transparent Royalties**: Automatic creator royalty distribution
- ✅ **Revenue Splits**: Configurable payment splits for creators and platform
- ✅ **User Profiles**: On-chain profile registry with off-chain metadata
- ✅ **Collection Management**: Support for any ERC-721 collection
- ✅ **Staking System**: ArcStaking.sol for rewards
- ✅ **Governance**: ArcGovernance.sol for DAO voting

#### Frontend (In Progress) ⚠️
- ✅ **Design System**: Comprehensive design tokens and component library
- ✅ **Image Optimization**: AVIF/WebP support for all NFT images
- ✅ **Component Library**: Reusable UI components (Skeleton, EmptyState, etc.)
- ✅ **Wallet Integration**: RainbowKit + Circle SDK
- ⏳ **Advanced Filtering**: Trait filtering with rarity percentages
- ⏳ **Search**: Algolia-powered instant search
- ⏳ **Collection Pages**: Full collection browsing with metrics
- ⏳ **NFT Detail Pages**: Complete item view with history
- ⏳ **Mobile PWA**: Progressive Web App with offline support

#### Quality & Accessibility ✅
- ✅ **Testing Framework**: Jest + React Testing Library
- ✅ **Component Tests**: Automated testing for UI components
- ✅ **Accessibility**: WCAG 2.1 AA compliance (in progress)
- ✅ **Documentation**: Comprehensive guides and API docs
- ⏳ **E2E Testing**: Playwright for critical user flows
- ⏳ **Performance**: Core Web Vitals optimization

### Coming in v0.3+
- ⏳ **Lazy Minting**: Gasless NFT creation
- ⏳ **Offer System**: Make offers on unlisted NFTs
- ⏳ **Bulk Operations**: Batch listing and purchasing
- ⏳ **Real-time Updates**: WebSocket-powered activity feed
- ⏳ **Analytics Dashboard**: Portfolio tracking and insights

## 🏗 Architecture

```
ArcMarket/
├── contracts/          # Smart contracts (Solidity 0.8.24)
│   ├── contracts/
│   │   ├── NFTMarketplace.sol      # Core marketplace logic
│   │   ├── FeeVault.sol            # Royalty & fee distribution
│   │   ├── ProfileRegistry.sol     # User profiles
│   │   ├── MockUSDC.sol            # Test USDC token
│   │   ├── StakingRewards.sol      # Stub for v0.2+
│   │   └── SimpleGovernance.sol    # Stub for v0.2+
│   ├── scripts/
│   │   └── deploy.js               # Deployment script
│   └── test/                       # Contract tests
│
├── frontend/           # Next.js + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/                    # Next.js 14 app router
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom React hooks
│   │   └── lib/                    # Web3 config & utilities
│   └── public/                     # Static assets
│
└── subgraph/          # TheGraph indexer (TODO)
    ├── schema.graphql
    └── src/mappings/
```

## 📝 Smart Contracts

### NFTMarketplace.sol
The core marketplace contract handling all listing, auction, and purchase logic.

**Key Functions:**
```solidity
// Listings
function listItem(address collection, uint256 tokenId, uint256 price) external
function updateListingPrice(address collection, uint256 tokenId, uint256 newPrice) external
function cancelListing(address collection, uint256 tokenId) external
function buyItem(address collection, uint256 tokenId) external

// Auctions
function createAuction(address collection, uint256 tokenId, uint256 reservePrice, uint64 startTime, uint64 endTime) external
function placeBid(address collection, uint256 tokenId, uint256 bidAmount) external
function settleAuction(address collection, uint256 tokenId) external
```

**Features:**
- USDC-only payments
- Integration with FeeVault for automated splits
- Collection allowlist (optional)
- Gas-optimized with custom errors
- Reentrancy protection

### FeeVault.sol
Centralized fee and royalty distributor.

**Key Functions:**
```solidity
function setCollectionSplits(address collection, CollectionSplit[] calldata splits) external
function setGlobalSplits(GlobalSplit[] calldata splits) external
function distribute(address collection, uint256 tokenId, uint256 amount) external
```

**Features:**
- Collection-specific royalty splits
- Global platform fee splits
- Configurable split ratios (basis points)
- Automatic distribution on sales

### ProfileRegistry.sol
Minimal on-chain user profile registry.

**Key Functions:**
```solidity
function setProfile(string calldata metadataURI) external
function getProfile(address user) external view returns (Profile memory)
```

**Features:**
- User-controlled profiles
- Off-chain metadata (IPFS/Arweave)
- Minimal gas footprint
- No admin controls needed

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Wallet with Arc testnet funds

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Archon-444/ARC.git
cd ARC
```

2. **Install contract dependencies:**
```bash
cd contracts
npm install
```

3. **Install frontend dependencies:**
```bash
cd ../frontend
npm install
```

### Configuration

1. **Set up environment variables:**

For contracts (create `contracts/.env`):
```env
PRIVATE_KEY=your_private_key_here
ARC_TESTNET_RPC_URL=https://rpc.arc.testnet.circle.com
ARC_MAINNET_RPC_URL=https://rpc.arc.circle.com
```

2. **Update chain configuration:**

Edit `contracts/hardhat.config.js` to set correct Arc chain IDs and RPC URLs.

## 💻 Development

### Compile Contracts

```bash
cd contracts
npm run compile
```

### Run Tests

```bash
npm test
```

### Start Local Development

1. **Start Hardhat node:**
```bash
npx hardhat node
```

2. **Deploy contracts:**
```bash
npm run deploy:local
```

3. **Start frontend:**
```bash
cd ../frontend
npm run dev
```

Visit `http://localhost:3000`

## 🚢 Deployment

### Deploy to Arc Testnet

1. **Deploy contracts:**
```bash
cd contracts
npm run deploy:arc-testnet
```

2. **Copy contract addresses:**
```bash
# Contract addresses will be saved to deployment.json
# and .env.deployed template will be created
cp .env.deployed ../frontend/.env.local
```

3. **Update frontend environment:**
Edit `frontend/.env.local` with your configuration.

4. **Build and deploy frontend:**
```bash
cd frontend
npm run build
# Deploy to your hosting provider (Vercel, Netlify, etc.)
```

### Deploy to Arc Mainnet

⚠️ **Important:** Test thoroughly on testnet first!

```bash
cd contracts
npm run deploy:arc-mainnet
```

## 🧪 Testing

### Contract Tests

```bash
cd contracts
npm test                    # Run all tests
npm run coverage            # Run with coverage report
REPORT_GAS=true npm test    # Run with gas reporting
```

### Frontend Tests

```bash
cd frontend
npm test                    # Run all tests once
npm run test:watch          # Run in watch mode (recommended)
npm run test:coverage       # Run with coverage report
```

### Testing Documentation

For comprehensive testing guidelines, see [TESTING.md](./TESTING.md).

**Coverage Goals:**
- Unit tests: 80%+ coverage
- Integration tests: Critical user flows
- E2E tests: Coming soon (Playwright)

**Current Coverage:**
- Contracts: ~75% (good)
- Frontend: ~50% (improving)

## 🗺 Roadmap

### ✅ v0.1 (Completed) - MVP
- ✅ Core marketplace contracts
- ✅ USDC payment integration
- ✅ Royalty distribution
- ✅ User profile registry
- ✅ Basic UI structure

### 🔄 v0.2 (Current - 35% Complete) - Foundation
**Timeline:** 12 weeks to production-ready

#### Phase 1: Foundation Fixes (3 weeks)
- ✅ Enhanced image optimization
- ✅ Design system with CSS tokens
- ✅ Testing infrastructure (Jest)
- ✅ Component library (Skeleton, EmptyState)
- ⏳ Collection page implementation
- ⏳ Search functionality (Algolia)

#### Phase 2: Critical Features (4 weeks)
- ⏳ NFT detail pages
- ⏳ Advanced filtering (traits, price)
- ⏳ Animation system (Framer Motion)
- ⏳ Real-time activity feed (WebSocket)

#### Phase 3: UX Enhancements (3 weeks)
- ⏳ Mobile PWA setup
- ⏳ Performance optimization
- ⏳ Accessibility compliance (WCAG 2.1 AA)

#### Phase 4: Launch Preparation (2 weeks)
- ⏳ User testing & feedback
- ⏳ Security audit
- ⏳ Beta launch

### 🔮 v0.3 - Advanced Features
- Lazy minting for creators
- Offer system (make offers on unlisted NFTs)
- Bulk operations (batch listing/buying)
- Collection verification system
- Analytics dashboard
- Mobile app (React Native)

See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for detailed progress tracking.

## 📖 Documentation

### Core Documentation

- **[GAP_ANALYSIS.md](./GAP_ANALYSIS.md)** - Current status vs. world-class standards, roadmap
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development guidelines and workflow
- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** - Accessibility standards and guidelines

### Component Documentation

- **[contracts/README.md](./contracts/README.md)** - Smart contract documentation
- **Frontend Components** - See JSDoc comments in component files
- **API Reference** - See `subgraph/README.md` for GraphQL schema

### Quick Links

- **Design System** - See `frontend/src/app/globals.css` for design tokens
- **Component Library** - See `frontend/src/components/ui/`
- **Type Definitions** - See `frontend/src/types/`

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) guide for:

- Code style guidelines
- Development workflow
- Testing requirements
- Pull request process

### Quick Start for Contributors

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/ARC.git

# 2. Install dependencies
cd ARC
cd contracts && npm install
cd ../frontend && npm install

# 3. Create a feature branch
git checkout -b feature/your-feature

# 4. Make changes and test
npm run lint
npm run type-check
npm test

# 5. Submit a pull request
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Website:** Coming Soon
- **Documentation:** Coming Soon
- **Discord:** Coming Soon
- **Twitter:** Coming Soon

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Always test thoroughly on testnet before deploying to mainnet.

## 🙏 Acknowledgments

- Circle for the Arc blockchain
- OpenZeppelin for secure smart contract libraries
- The Ethereum and Web3 community

---

**Built with ❤️ for the Arc ecosystem**
