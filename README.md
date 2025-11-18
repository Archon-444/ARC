# ArcMarket - NFT Marketplace on Arc Blockchain

A full-stack NFT marketplace built on Circle's Arc blockchain, leveraging USDC as gas and native payment currency with instant sub-second finality.

## 🌟 Version 0.1 (MVP)

This is the initial MVP release focusing on core marketplace functionality with USDC-native payments and transparent royalty distribution.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Roadmap](#-roadmap)

## ✨ Features

### Core Marketplace (v0.1)
- ✅ **Fixed-Price Listings**: List NFTs for sale at a fixed USDC price
- ✅ **English Auctions**: Time-bound auctions with automatic bid refunds
- ✅ **USDC Payments**: All transactions denominated in USDC (Arc's native advantage)
- ✅ **Instant Finality**: Sub-second transaction confirmation
- ✅ **Transparent Royalties**: Automatic creator royalty distribution
- ✅ **Revenue Splits**: Configurable payment splits for creators and platform
- ✅ **User Profiles**: On-chain profile registry with off-chain metadata
- ✅ **Collection Management**: Support for any ERC-721 collection

### Coming in v0.2+
- ⏳ **Staking & Rewards**: Stake USDC to earn rewards and fee discounts
- ⏳ **DAO Governance**: Community voting on featured collections and fees
- ⏳ **Bulk Operations**: Batch listing and purchasing
- ⏳ **Advanced Filtering**: Search and filter by traits, rarity, price
- ⏳ **Activity Feed**: Real-time marketplace activity

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
npm test
```

### Frontend Tests (Coming Soon)

```bash
cd frontend
npm run test
```

## 🗺 Roadmap

### ✅ v0.1 (Current) - MVP
- Core marketplace (listings & auctions)
- USDC payments
- Royalty distribution
- User profiles
- Basic UI

### 🔄 v0.2 - Enhanced Features
- Full staking implementation with tiered rewards
- DAO governance for featured collections
- Bulk operations (batch list/buy)
- Advanced search and filtering
- Activity feed and notifications

### 🔮 v0.3 - Advanced
- Lazy minting for creators
- Offer system (make offers on unlisted NFTs)
- Collection verification system
- Analytics dashboard
- Mobile app (React Native)

## 📖 Documentation

### Smart Contract Documentation

See `contracts/README.md` for detailed contract documentation.

### Frontend Documentation

See `frontend/README.md` for frontend architecture and component docs.

### API Documentation

See `subgraph/README.md` for subgraph schema and query examples.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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
