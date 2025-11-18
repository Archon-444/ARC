# ArcMarket Contract Deployment Guide

## Current Status

✅ **Completed**:
- Home page mock data → Real GraphQL queries
- Social login mocks → Real NextAuth.js OAuth
- Smart contracts written and ready
- Deployment script (`contracts/scripts/deploy-arc.js`) ready
- Hardhat configured for Arc testnet

❌ **Blocked - Requires User Action**:
- Contract deployment needs:
  1. **Private key** for deployment wallet
  2. **USDC balance** in deployment wallet (for gas)
  3. **USDC contract address** on Arc testnet

---

## Prerequisites for Deployment

### 1. Create Deployment Wallet

```bash
# Option A: Use existing wallet
# Export private key from MetaMask or other wallet

# Option B: Generate new wallet with Hardhat
cd contracts
npx hardhat node  # Shows test accounts with private keys
```

**IMPORTANT**:
- Never share or commit your private key
- Use a dedicated deployment wallet (not your main wallet)
- Back up private key securely

### 2. Get USDC for Gas

Arc blockchain uses **USDC as the native gas token** (6 decimals, NOT ETH!).

1. Visit [Circle Faucet](https://faucet.circle.com)
2. Connect your deployment wallet
3. Request testnet USDC
4. Wait for transaction confirmation

**How much USDC needed**:
- Estimated gas for full deployment: ~0.5-1 USDC
- Get at least **2 USDC** to be safe

### 3. Get USDC Contract Address

The official USDC contract address on Arc testnet is needed for the marketplace to work.

**Where to find it**:
1. [Circle's Arc Documentation](https://developers.circle.com/circle-mint/docs/testnet)
2. [Arc Faucet Documentation](https://faucet.circle.com) (check docs section)
3. Arc testnet explorer: [https://testnet.arcscan.app](https://testnet.arcscan.app)
4. Contact Circle support if not documented

**Expected format**: `0x1234...abcd` (42-character Ethereum address)

---

## Deployment Steps

### Step 1: Configure Environment

Create `contracts/.env` file:

```bash
cd contracts
cp .env.example .env
```

Edit `.env` with your values:

```env
# Deployment wallet private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_64_character_private_key_here

# Arc testnet RPC (already correct)
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

# USDC contract address on Arc testnet
USDC_ADDRESS_TESTNET=0x...actual_usdc_address_here
```

### Step 2: Verify Setup

Check wallet balance:

```bash
cd contracts
npx hardhat run scripts/check-balance.js --network arc-testnet
```

Expected output:
```
✅ Wallet: 0x1234...abcd
✅ USDC Balance: 2.000000 USDC
✅ USDC Contract: 0x...
✅ Ready to deploy!
```

### Step 3: Deploy Contracts

```bash
cd contracts
npm run deploy:arc-testnet
```

This will deploy:
1. **FeeVault** - Revenue distribution system
2. **NFTMarketplace** - Core marketplace logic
3. **ProfileRegistry** - User profiles
4. **StakingRewards** - USDC staking system
5. **SimpleGovernance** - DAO voting

**Deployment time**: ~2-5 minutes

**Gas cost**: ~0.5-1 USDC total

### Step 4: Verify Deployment

The script automatically:
- ✅ Saves deployment info to `contracts/deployments/`
- ✅ Updates `frontend/.env.local` with contract addresses
- ✅ Outputs deployment summary

Check deployment success:

```bash
cat contracts/deployments/arc-testnet-latest.json
```

Should see:
```json
{
  "version": "0.2.0",
  "network": "arc-testnet",
  "chainId": 5042002,
  "contracts": {
    "USDC": "0x...",
    "FeeVault": "0x...",
    "NFTMarketplace": "0x...",
    "ProfileRegistry": "0x...",
    "StakingRewards": "0x...",
    "SimpleGovernance": "0x..."
  }
}
```

### Step 5: Update Subgraph

After deployment, update the subgraph configuration:

```bash
cd subgraph

# Edit subgraph.yaml with deployed addresses
nano subgraph.yaml

# Update these fields:
# - startBlock: <deployment_block>
# - address: <marketplace_address>
```

Example:
```yaml
dataSources:
  - kind: ethereum
    name: NFTMarketplace
    network: arc-testnet
    source:
      address: "0x1234...abcd"  # From deployment
      abi: NFTMarketplace
      startBlock: 1234567        # From deployment
```

### Step 6: Deploy Subgraph

```bash
cd subgraph
npm run codegen
npm run build
npm run deploy
```

See `SUBGRAPH_DEPLOYMENT.md` for detailed instructions.

### Step 7: Test Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` and verify:
- ✅ Connect wallet works
- ✅ Contract addresses loaded
- ✅ Marketplace displays correctly
- ✅ Can browse listings

---

## Troubleshooting

### "No USDC for gas" Error

**Cause**: Deployment wallet has no USDC

**Fix**:
1. Visit https://faucet.circle.com
2. Connect deployment wallet
3. Request USDC
4. Wait for confirmation
5. Retry deployment

### "USDC_ADDRESS_TESTNET not set" Error

**Cause**: Missing USDC contract address in `.env`

**Fix**:
1. Find official USDC address from Circle docs
2. Add to `contracts/.env`:
   ```env
   USDC_ADDRESS_TESTNET=0x...actual_address
   ```
3. Retry deployment

### "No contract found at USDC address" Error

**Cause**: Wrong USDC address or network mismatch

**Fix**:
1. Verify USDC address on Arc testnet explorer
2. Check you're deploying to correct network
3. Ensure `.env` has correct RPC URL

### "Insufficient funds" Error

**Cause**: Not enough USDC for gas

**Fix**:
1. Check wallet balance: `npx hardhat run scripts/check-balance.js`
2. Get more USDC from faucet
3. Retry deployment

### Deployment Hangs

**Cause**: Network connectivity or RPC issues

**Fix**:
1. Check internet connection
2. Verify RPC URL: `https://rpc.testnet.arc.network`
3. Try alternative RPC provider
4. Wait 5 minutes and retry

---

## Post-Deployment

### 1. Verify on Block Explorer

Visit each contract on [ArcScan](https://testnet.arcscan.app):

```
https://testnet.arcscan.app/address/<contract_address>
```

Verify:
- ✅ Contract source code
- ✅ Constructor arguments
- ✅ Contract creator matches your wallet

### 2. Test Contract Interactions

Create test NFT:
```bash
cd contracts
npx hardhat run scripts/test-create-nft.js --network arc-testnet
```

Create test listing:
```bash
npx hardhat run scripts/test-create-listing.js --network arc-testnet
```

### 3. Monitor Gas Usage

Check total deployment cost:
```bash
cat contracts/deployments/arc-testnet-latest.json | grep gasUsed
```

### 4. Backup Deployment Info

```bash
# Copy to safe location
cp contracts/deployments/arc-testnet-latest.json ~/arc-deployment-backup.json
cp frontend/.env.local ~/arc-frontend-env-backup.txt
```

---

## Production Deployment (Arc Mainnet)

When Arc mainnet is live:

### 1. Update Configuration

```env
# contracts/.env
ARC_MAINNET_RPC_URL=https://rpc.arc.network
USDC_ADDRESS_MAINNET=<official_mainnet_usdc>
```

### 2. Fund Mainnet Wallet

- **Use REAL USDC** (not testnet)
- Need ~2-5 USDC for gas
- Double-check wallet address
- Send from trusted exchange/wallet

### 3. Deploy to Mainnet

```bash
npm run deploy:arc-mainnet
```

**⚠️ CRITICAL WARNINGS**:
- Test EVERYTHING on testnet first
- Use a dedicated mainnet deployment wallet
- Verify all addresses before deployment
- Have 2-3x more USDC than estimated gas
- Consider using a multisig for deployment wallet
- Get code audited before mainnet deployment

### 4. Verify Mainnet Contracts

```bash
npm run verify:arc-mainnet
```

### 5. Transfer Ownership

After deployment, transfer contract ownership to multisig:

```javascript
// In Hardhat console
const marketplace = await ethers.getContractAt("NFTMarketplace", "<address>");
await marketplace.transferOwnership("<multisig_address>");
```

---

## Security Checklist

Before mainnet deployment:

- [ ] Smart contracts audited by professional firm
- [ ] All tests passing (unit + integration)
- [ ] Testnet deployed and tested for 1+ week
- [ ] Emergency pause mechanisms tested
- [ ] Multisig setup for admin operations
- [ ] Deployment wallet secured (hardware wallet recommended)
- [ ] Private keys backed up securely (offline)
- [ ] Team members trained on emergency procedures
- [ ] Monitoring and alerting systems in place
- [ ] Bug bounty program considered

---

## Resources

- [Circle Arc Documentation](https://developers.circle.com/circle-mint/docs/arc)
- [Arc Testnet Faucet](https://faucet.circle.com)
- [Arc Block Explorer](https://testnet.arcscan.app)
- [Hardhat Documentation](https://hardhat.org/hardhat-runner/docs)
- [The Graph Documentation](https://thegraph.com/docs)

---

## Need Help?

1. Check deployment logs in `contracts/deployments/`
2. Review Hardhat console output
3. Check Arc testnet status: https://status.arc.network
4. Contact Circle support: https://support.circle.com

---

## Summary

**What You Need Right Now**:
1. Private key for deployment wallet
2. 2+ USDC in that wallet (from faucet)
3. Official USDC contract address on Arc testnet

**Once You Have These**:
```bash
cd contracts
cp .env.example .env
# Edit .env with your values
npm run deploy:arc-testnet
```

**Estimated Time**: 5-10 minutes
**Estimated Cost**: 0.5-1 USDC gas fees

Good luck with your deployment! 🚀
