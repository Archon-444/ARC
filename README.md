# ArcMarket - Full-Stack NFT Marketplace on Arc Blockchain

A comprehensive NFT marketplace built on Circle's Arc blockchain, featuring USDC-native payments, staking rewards, and DAO governance.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Smart Contracts](#smart-contracts)
- [Frontend](#frontend)
- [Backend](#backend)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Contributing](#contributing)

## Features

### Core Marketplace
- ✅ **NFT Marketplace** - Browse, buy, and sell NFTs with fixed-price listings
- ✅ **Auction System** - Time-bound auctions with automatic settlement
- ✅ **Batch Operations** - List and buy multiple NFTs in single transactions
- ✅ **USDC Payments** - All transactions in USDC (predictable, instant settlement)
- ✅ **Instant Finality** - Sub-second transaction finality on Arc blockchain

### Creator Economy
- ✅ **EIP-2981 Royalties** - Automatic royalty payments on secondary sales
- ✅ **Multi-Creator Splits** - Revenue sharing among multiple creators
- ✅ **Creator Verification** - Verified creator badges
- ✅ **FeeVault** - Sophisticated fee and royalty distribution system
- ✅ **Creator Dashboard** - Track earnings and manage collections

### Community & Governance
- ✅ **User Profiles** - On-chain profile registry with social features
- ✅ **Follow System** - Follow creators and collections
- ✅ **DAO Governance** - Community voting on platform decisions
- ✅ **Featured Collections** - Governance-curated collections
- ✅ **Treasury Management** - Transparent fund allocation

### Staking & Rewards
- ✅ **USDC Staking** - Stake USDC to earn platform rewards
- ✅ **Tiered Membership** - Bronze, Silver, Gold, Platinum tiers
- ✅ **Fee Discounts** - Reduced marketplace fees for stakers (10-50% off)
- ✅ **Leaderboard** - Top stakers tracking
- ✅ **Reward Distribution** - Automated monthly rewards

## Architecture

```
ArcMarket/
├── contracts/          # Smart contracts (Solidity)
│   ├── contracts/
│   │   ├── ArcMarketNFT.sol          # ERC721 with royalties
│   │   ├── ArcMarketplace.sol        # Listings & auctions
│   │   ├── ArcStaking.sol            # Staking & rewards
│   │   ├── ArcGovernance.sol         # DAO governance
│   │   ├── FeeVault.sol              # Fee distribution
│   │   ├── ProfileRegistry.sol       # User profiles
│   │   └── MockUSDC.sol              # Test token
│   ├── test/                         # Contract tests
│   ├── scripts/                      # Deployment scripts
│   └── hardhat.config.js             # Hardhat configuration
│
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/                     # Next.js app router
│   │   ├── components/              # React components
│   │   ├── lib/                     # Utilities & configs
│   │   └── hooks/                   # Custom React hooks
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
└── backend/           # Node.js backend (optional)
    ├── src/
    │   ├── indexer/                 # NFT metadata indexer
    │   ├── api/                     # REST API endpoints
    │   └── database/                # MongoDB schemas
    └── package.json
```

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ArcMarket.git
cd ArcMarket
```

### 2. Install Dependencies

#### Smart Contracts
```bash
cd contracts
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

#### Backend (Optional)
```bash
cd backend
npm install
```

### 3. Environment Setup

Create `.env` files in each directory:

#### contracts/.env
```env
PRIVATE_KEY=your_private_key_here
ARC_TESTNET_RPC_URL=https://rpc.arc.testnet.circle.com
ARC_MAINNET_RPC_URL=https://rpc.arc.circle.com
ETHERSCAN_API_KEY=your_api_key_for_verification
```

#### frontend/.env.local
```env
NEXT_PUBLIC_CHAIN_ID=1234
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_NFT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_STAKING_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x...
NEXT_PUBLIC_FEEVAULT_ADDRESS=0x...
NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Smart Contracts

### Contract Overview

#### 1. ArcMarketNFT (contracts/contracts/ArcMarketNFT.sol:1)
- ERC721 NFT contract with built-in royalty support (EIP-2981)
- Multi-creator revenue splits
- Batch minting capabilities
- Creator verification system

**Key Functions:**
```solidity
mint(address to, string uri, address royaltyReceiver, uint96 royaltyFee)
batchMint(address to, string[] uris, address royaltyReceiver, uint96 royaltyFee)
mintWithSplit(address to, string uri, Creator[] creators)
verifyCreator(address creator)
```

#### 2. ArcMarketplace (contracts/contracts/ArcMarketplace.sol:1)
- Fixed-price listings and time-bound auctions
- USDC-only payments
- Automatic royalty distribution via FeeVault
- Batch operations support

**Key Functions:**
```solidity
createListing(address nftContract, uint256 tokenId, uint256 price)
buyListing(uint256 listingId)
createAuction(address nftContract, uint256 tokenId, uint256 reservePrice, uint256 duration)
placeBid(uint256 auctionId, uint256 bidAmount)
```

#### 3. ArcStaking (contracts/contracts/ArcStaking.sol:1)
- USDC staking with tiered rewards
- Four membership tiers (Bronze/Silver/Gold/Platinum)
- Fee discounts for marketplace transactions
- Leaderboard system

**Tier Requirements:**
- Bronze: 100 USDC (10% fee discount)
- Silver: 500 USDC (20% fee discount)
- Gold: 2,000 USDC (35% fee discount)
- Platinum: 10,000 USDC (50% fee discount)

**Key Functions:**
```solidity
stake(uint256 amount)
unstake(uint256 amount)
claimReward()
getStakeInfo(address user)
```

#### 4. ArcGovernance (contracts/contracts/ArcGovernance.sol:1)
- DAO governance for platform decisions
- Proposal creation and voting
- Featured/curated collection management
- Treasury allocation

**Key Functions:**
```solidity
createProposal(ProposalType type, string title, string description, bytes data)
vote(uint256 proposalId, bool support)
finalizeProposal(uint256 proposalId)
executeProposal(uint256 proposalId)
```

#### 5. FeeVault (contracts/contracts/FeeVault.sol:1)
- Centralized fee and royalty distribution
- Configurable platform fee splits
- Per-collection royalty management

**Key Functions:**
```solidity
setGlobalSplits(Split[] splits)
setCollectionSplits(address collection, Split[] splits)
distribute(address collection, uint256 tokenId, address seller, uint256 amount, ...)
```

#### 6. ProfileRegistry (contracts/contracts/ProfileRegistry.sol:1)
- On-chain user profile metadata
- Follow/follower system
- Social statistics tracking

**Key Functions:**
```solidity
setProfile(string metadataURI)
follow(address user)
getSocialStats(address user)
```

### Compile Contracts

```bash
cd contracts
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy Contracts

#### Local Deployment (Hardhat Network)
```bash
npx hardhat node
npm run deploy:local
```

#### Arc Testnet
```bash
npm run deploy:arc-testnet
```

#### Arc Mainnet
```bash
npm run deploy:arc-mainnet
```

After deployment, contract addresses will be saved to `contracts/deployment.json`.

## Frontend

### Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Web3:** Wagmi v2 + Viem
- **Wallet:** RainbowKit
- **State:** React Query (TanStack Query)

### Run Development Server

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

### Key Features

#### Pages
- `/` - Homepage with featured NFTs
- `/explore` - Browse all NFTs
- `/collections/:address` - Collection detail page
- `/nft/:collection/:tokenId` - NFT detail page
- `/profile/:address` - User profile
- `/staking` - Staking dashboard
- `/governance` - DAO governance
- `/studio` - Creator studio

#### Components
- `Navbar` - Navigation with wallet connection
- `NFTCard` - NFT display card
- `ListingForm` - Create new listing
- `StakingDashboard` - Staking interface
- `GovernanceProposal` - Proposal voting UI

## Backend (Optional)

The backend provides:
- NFT metadata indexing
- Off-chain data caching
- API endpoints for frontend
- Search functionality

### Run Backend

```bash
cd backend
npm run dev
```

### API Endpoints

```
GET /api/nfts                    # List all NFTs
GET /api/nfts/:id                # Get NFT details
GET /api/collections             # List collections
GET /api/collections/:address    # Collection details
GET /api/users/:address          # User profile
GET /api/activity                # Recent activity feed
```

## Testing

### Smart Contract Tests

```bash
cd contracts
npm test

# With coverage
npm run coverage
```

### Frontend Tests (Coming Soon)

```bash
cd frontend
npm test
```

## Deployment

### Smart Contracts

1. **Configure Network:**
   - Update `hardhat.config.js` with Arc chain IDs and RPC URLs
   - Add your private key to `.env`

2. **Deploy:**
```bash
npm run deploy:arc-testnet
```

3. **Verify Contracts:**
```bash
npx hardhat verify --network arcTestnet DEPLOYED_CONTRACT_ADDRESS
```

### Frontend

1. **Update Environment Variables:**
   - Add deployed contract addresses to `.env.local`

2. **Build:**
```bash
npm run build
```

3. **Deploy to Vercel/Netlify:**
```bash
# Connect repository to Vercel/Netlify
# Add environment variables in platform dashboard
# Deploy
```

### Backend

Deploy to your preferred hosting service (Heroku, AWS, DigitalOcean, etc.)

## Environment Variables

### Required Variables

#### Frontend
```env
NEXT_PUBLIC_CHAIN_ID                    # Arc chain ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID    # WalletConnect project ID
NEXT_PUBLIC_USDC_ADDRESS                # USDC token address
NEXT_PUBLIC_NFT_ADDRESS                 # ArcMarketNFT address
NEXT_PUBLIC_MARKETPLACE_ADDRESS         # ArcMarketplace address
NEXT_PUBLIC_STAKING_ADDRESS             # ArcStaking address
NEXT_PUBLIC_GOVERNANCE_ADDRESS          # ArcGovernance address
NEXT_PUBLIC_FEEVAULT_ADDRESS            # FeeVault address
NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS    # ProfileRegistry address
```

#### Contracts
```env
PRIVATE_KEY                             # Deployment wallet private key
ARC_TESTNET_RPC_URL                     # Arc testnet RPC
ARC_MAINNET_RPC_URL                     # Arc mainnet RPC
```

## Usage

### For Users

#### 1. Connect Wallet
- Click "Connect Wallet" in the navigation bar
- Select your wallet (MetaMask, WalletConnect, etc.)
- Approve connection to Arc network

#### 2. Browse NFTs
- Visit the Explore page
- Filter by collection, price, or recent listings
- Click on an NFT to view details

#### 3. Buy an NFT
- On the NFT detail page, click "Buy Now"
- Approve USDC spending (one-time per contract)
- Confirm purchase transaction
- NFT transfers to your wallet instantly

#### 4. List an NFT
- Go to your profile
- Select an NFT you own
- Click "List for Sale"
- Set price in USDC
- Approve NFT transfer to marketplace
- Confirm listing transaction

#### 5. Stake USDC
- Visit the Staking page
- Enter amount to stake
- Approve USDC spending
- Confirm stake transaction
- Start earning rewards and fee discounts

#### 6. Participate in Governance
- Visit the Governance page
- Browse active proposals
- Cast your vote (voting power = staked USDC)
- Track proposal outcomes

### For Creators

#### 1. Mint NFTs
- Go to Creator Studio
- Upload artwork and metadata
- Set royalty percentage (0-10%)
- Configure multi-creator splits (optional)
- Mint NFT(s)

#### 2. Manage Royalties
- Set collection-wide royalty splits
- Add multiple creators with custom percentages
- Update recipient addresses

#### 3. Track Earnings
- View earnings dashboard
- See royalty payments from secondary sales
- Export transaction history

## Arc Blockchain Advantages

### 1. USDC-Native Payments
- No volatile gas tokens
- Predictable transaction costs
- Familiar stablecoin for users

### 2. Instant Finality
- Sub-second block times
- No need to wait for multiple confirmations
- Immediate NFT ownership transfer

### 3. Built-in FX Engine
- Support for multiple stablecoins (USDC, EURC)
- Seamless currency conversion
- Global accessibility

### 4. Low Fees
- Minimal transaction costs
- Makes microtransactions viable
- Better for creators and collectors

## Security Considerations

- ✅ ReentrancyGuard on all state-changing functions
- ✅ Access control (Ownable) for admin functions
- ✅ Input validation and require statements
- ✅ Safe math operations (Solidity 0.8+)
- ✅ EIP-2981 royalty standard
- ✅ Audited OpenZeppelin contracts

### Recommendations
- Always use a hardware wallet for large transactions
- Verify contract addresses before interacting
- Start with small test transactions
- Review all transaction details before signing

## Troubleshooting

### Common Issues

**Contract deployment fails:**
- Check that you have sufficient ETH/ARC for gas
- Verify RPC URL is correct
- Ensure private key has proper permissions

**Frontend can't connect to wallet:**
- Check that MetaMask is installed
- Verify you're on the correct network
- Clear browser cache and reload

**Transactions fail:**
- Check USDC balance and allowance
- Verify NFT approval for marketplace
- Ensure sufficient gas

## Roadmap

### Phase 1 (Current)
- ✅ Core marketplace functionality
- ✅ Staking and rewards
- ✅ Basic governance

### Phase 2 (Q1 2025)
- [ ] Advanced search and filters
- [ ] Collection analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Email notifications

### Phase 3 (Q2 2025)
- [ ] NFT bundling (buy multiple NFTs together)
- [ ] Offer system (make offers below listing price)
- [ ] NFT loans and rentals
- [ ] Cross-chain bridge integration

### Phase 4 (Q3 2025)
- [ ] Launchpad for new collections
- [ ] Virtual galleries and exhibitions
- [ ] Social features (comments, likes, shares)
- [ ] Creator verification process

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Add comments for complex logic

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Documentation:** [docs.arcmarket.io](https://docs.arcmarket.io)
- **Discord:** [discord.gg/arcmarket](https://discord.gg/arcmarket)
- **Twitter:** [@ArcMarket](https://twitter.com/ArcMarket)
- **Email:** support@arcmarket.io

## Acknowledgments

- Built on [Circle's Arc Blockchain](https://www.circle.com/en/arc)
- Powered by [OpenZeppelin](https://openzeppelin.com/) contracts
- UI inspired by [OpenSea](https://opensea.io/)
- Web3 infrastructure by [Wagmi](https://wagmi.sh/) and [Viem](https://viem.sh/)

---

**Built with ❤️ for the Arc blockchain community**
