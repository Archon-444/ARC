# ArcMarket Deployment Guide

## Complete step-by-step guide to deploy ArcMarket on Circle Arc Blockchain

---

## 📋 Prerequisites

### 1. Arc Blockchain Specifications

- **Chain ID (Testnet):** `5042002`
- **RPC URL:** `https://rpc.testnet.arc.network`
- **WebSocket:** `wss://rpc.testnet.arc.network`
- **Block Explorer:** `https://testnet.arcscan.app`
- **Native Gas Token:** USDC (6 decimals, NOT ETH!)
- **Finality:** 100-350ms (deterministic)
- **TPS:** 3,000-10,000

### 2. Required Accounts & Keys

- [ ] **Wallet Private Key** - For deploying contracts
- [ ] **Circle Developer Account** - https://console.circle.com/
- [ ] **The Graph Studio Account** - https://thegraph.com/studio/
- [ ] **WalletConnect Project ID** - https://cloud.walletconnect.com/

### 3. Get Arc Testnet USDC

Visit the Arc faucet to get USDC for gas:
```bash
# Faucet URL
https://faucet.circle.com

# You'll need USDC for:
# - Contract deployment gas fees
# - Testing transactions
```

⚠️ **CRITICAL:** Arc uses USDC (6 decimals) as the native gas token, NOT ETH!

---

## 🚀 Phase 1: Smart Contracts Deployment

### Step 1: Setup Environment

```bash
cd contracts

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

Required `.env` values:
```bash
# Your deployer wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Arc Testnet RPC
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

# Arc Testnet USDC contract address
# Get this from Circle documentation or faucet
USDC_ADDRESS_TESTNET=0x...

# Optional: Circle Developer credentials (for wallet integration later)
CIRCLE_API_KEY=your_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 15 Solidity files successfully
```

### Step 4: Run Tests (Optional but Recommended)

```bash
npm test
```

### Step 5: Deploy to Arc Testnet

```bash
npm run deploy:arc
```

The deployment script will:
1. ✅ Verify your USDC balance for gas
2. ✅ Deploy all 6 contracts (FeeVault, NFTMarketplace, ProfileRegistry, StakingRewards, SimpleGovernance)
3. ✅ Configure initial settings
4. ✅ Save deployment info to `deployments/arcTestnet-latest.json`
5. ✅ Generate frontend `.env.local` automatically

Expected output:
```
🚀 Deploying ArcMarket v0.2 to Arc Blockchain...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Network: arcTestnet
Chain ID: 5042002
Deployer address: 0x...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 USDC balance (for gas): 100.0 USDC

📄 [1/5] Deploying FeeVault...
✅ FeeVault deployed to: 0x...

📄 [2/5] Deploying NFTMarketplace...
✅ NFTMarketplace deployed to: 0x...

...

✅ ArcMarket v0.2 Deployment Complete!
```

### Step 6: Verify Deployment

Check your contracts on ArcScan:
```bash
# Visit the marketplace contract
https://testnet.arcscan.app/address/YOUR_MARKETPLACE_ADDRESS
```

### Step 7: (Optional) Verify Contracts

```bash
# If ArcScan supports verification
npm run verify:arc-testnet
```

---

## 📊 Phase 2: Subgraph Deployment

### Step 1: Check The Graph Support for Arc

⚠️ **IMPORTANT:** As of now, The Graph may not officially support Arc blockchain. Options:

1. **Wait for official Arc support** - Check with The Graph team
2. **Contact Circle** - Ask about recommended indexing solutions
3. **Self-host The Graph Node** - Run your own Graph node
4. **Use alternative indexers** - Goldsky, Alchemy Subgraphs, etc.

### Step 2: Update Subgraph Configuration

```bash
cd subgraph

# Automatically updates subgraph.yaml with deployed addresses
npm run update-config
```

This will:
- Read `contracts/deployments/arcTestnet-latest.json`
- Update contract addresses in `subgraph.yaml`
- Set correct start blocks

### Step 3: Generate TypeScript Types

```bash
npm run codegen
```

### Step 4: Build Subgraph

```bash
npm run build
```

### Step 5: Deploy to The Graph Studio

```bash
# Authenticate with The Graph Studio
graph auth --studio YOUR_DEPLOY_KEY

# Deploy
npm run deploy:studio
```

**If Arc is not supported yet:**
```bash
# Contact The Graph Discord or support
# Or explore alternative options like:
# - Self-hosted Graph Node
# - Goldsky (https://goldsky.com/)
# - Alchemy Subgraphs
```

---

## 🎨 Phase 3: Frontend Setup

### Step 1: Check Auto-Generated Environment

The deployment script already created `frontend/.env.local` for you!

```bash
cd frontend
cat .env.local
```

You should see:
```bash
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
# ... etc
```

### Step 2: Add Missing Environment Variables

Edit `frontend/.env.local` and add:

```bash
# Circle Wallet (from https://console.circle.com/)
NEXT_PUBLIC_CIRCLE_APP_ID=your_app_id

# WalletConnect (from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Subgraph URL (after subgraph deployment)
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/arcmarket/v0.1.0

# Circle Backend API Keys (keep these secret, don't commit!)
CIRCLE_API_KEY=your_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 - you should see ArcMarket!

### Step 5: Test Core Features

- [ ] Connect wallet (MetaMask, etc.)
- [ ] Check if Arc Testnet (5042002) is detected
- [ ] View your USDC balance
- [ ] Browse marketplace (once subgraph is deployed)

---

## 🔐 Phase 4: Circle Wallet Integration

### Step 1: Get Circle Developer Credentials

1. Sign up at https://console.circle.com/
2. Create a new app
3. Get your:
   - App ID
   - API Key
   - Entity Secret

### Step 2: Update Environment Variables

Already done in Phase 3, Step 2!

### Step 3: Test Circle Wallet Features

The frontend already has Circle Wallet SDK integrated. Test:

- [ ] Social login (Google/Facebook/Apple)
- [ ] Create Circle User-Controlled Wallet
- [ ] Sign transactions with Circle wallet
- [ ] USDC payments via Circle

---

## ✅ Phase 5: Production Readiness Checklist

### Security
- [ ] Remove all test/mock code
- [ ] Audit smart contracts (OpenZeppelin, Trail of Bits, etc.)
- [ ] Set up multi-sig wallet for admin functions
- [ ] Configure proper access controls
- [ ] Enable rate limiting on APIs

### Testing
- [ ] Run full test suite: `cd contracts && npm test`
- [ ] Test all marketplace functions (list, buy, auction, bid)
- [ ] Load test frontend
- [ ] Test wallet integrations (MetaMask, WalletConnect, Circle)
- [ ] Test on multiple browsers/devices

### Monitoring
- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Configure analytics (Google Analytics, Mixpanel)
- [ ] Monitor contract events
- [ ] Set up uptime monitoring
- [ ] Create admin dashboard

### Documentation
- [ ] User guides
- [ ] Developer documentation
- [ ] API documentation
- [ ] Smart contract documentation (NatSpec)

### Infrastructure
- [ ] Set up CI/CD pipeline
- [ ] Configure staging environment
- [ ] Database backups (if applicable)
- [ ] DDoS protection
- [ ] CDN for static assets

---

## 🔧 Troubleshooting

### Issue: "No USDC for gas"

**Solution:**
```bash
# Get USDC from Arc faucet
https://faucet.circle.com
```

### Issue: "Chain ID mismatch"

**Solution:**
- Make sure you're on Arc Testnet (5042002)
- Add Arc network to MetaMask manually:
  - Network Name: Arc Testnet
  - RPC URL: https://rpc.testnet.arc.network
  - Chain ID: 5042002
  - Currency Symbol: USDC
  - Block Explorer: https://testnet.arcscan.app

### Issue: "The Graph doesn't support Arc"

**Solutions:**
1. **Self-host The Graph Node:**
   ```bash
   # Follow The Graph docs to run your own node
   # Point it to Arc RPC URL
   ```

2. **Use Goldsky:**
   ```bash
   # Sign up at https://goldsky.com/
   # They may support Arc or custom chains
   ```

3. **Direct RPC queries:**
   ```typescript
   // Fallback: Query blockchain directly without subgraph
   // Less efficient but works
   ```

### Issue: "Circle SDK not working"

**Solutions:**
- Check your Circle App ID in `.env.local`
- Verify API keys are correct
- Check Circle developer console for error logs
- Make sure you're using the latest SDK version

---

## 📚 Additional Resources

- **Arc Documentation:** https://docs.arc.network/
- **Circle Developers:** https://developers.circle.com/
- **The Graph Docs:** https://thegraph.com/docs/
- **ArcScan Explorer:** https://testnet.arcscan.app
- **Arc Faucet:** https://faucet.circle.com

---

## 🎉 Next Steps After Deployment

1. **Test thoroughly** on testnet
2. **Get audit** for smart contracts
3. **Deploy to Arc Mainnet** (when available)
4. **Launch marketing campaign**
5. **Onboard NFT collections**
6. **Build community** (Discord, Twitter, etc.)

---

## 📝 Deployment Checklist

Use this checklist to track your deployment progress:

### Contracts
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Contracts compiled
- [ ] Tests passing
- [ ] Deployed to Arc Testnet
- [ ] Contracts verified on ArcScan
- [ ] Deployment JSON saved

### Subgraph
- [ ] Subgraph config updated
- [ ] TypeScript types generated
- [ ] Subgraph built successfully
- [ ] Deployed to The Graph (or alternative)
- [ ] Subgraph syncing correctly
- [ ] GraphQL queries working

### Frontend
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Development server running
- [ ] Wallet connection working
- [ ] Arc network detected
- [ ] Marketplace data loading
- [ ] Circle Wallet integrated
- [ ] Production build tested

### Production
- [ ] Security audit completed
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Staging environment tested
- [ ] Production deployment plan ready

---

**Need help?** Open an issue on GitHub or contact the team!
