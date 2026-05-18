# ArcMarket Testing Guide

Comprehensive testing guide for ArcMarket NFT Marketplace on Arc blockchain.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Contract Testing](#contract-testing)
- [Subgraph Testing](#subgraph-testing)
- [Frontend Testing](#frontend-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)

## Environment Setup

### Test Networks

**Arc Testnet**:
- Chain ID: 5042002
- RPC: https://rpc.testnet.arc.network
- Explorer: https://testnet.arcscan.app
- Faucet: Get test USDC from Arc faucet

**Local Development**:
- Hardhat Network (for unit tests)
- Local Graph Node (for subgraph tests)
- Next.js dev server (for frontend tests)

### Required Tools

```bash
# Install dependencies
npm install --global @graphprotocol/graph-cli
npm install --global hardhat

# Install project dependencies
cd contracts && npm install
cd ../frontend && npm install
cd ../subgraph && npm install
```

## Contract Testing

### Unit Tests

Run comprehensive contract unit tests:

```bash
cd contracts
npm test
```

Test specific contract:
```bash
npx hardhat test test/NFTMarketplace.test.js
npx hardhat test test/FeeVault.test.js
npx hardhat test test/ProfileRegistry.test.js
```

### Coverage

Generate test coverage report:

```bash
npm run coverage
```

Coverage goals:
- Line coverage: > 95%
- Branch coverage: > 90%
- Function coverage: 100%

### Gas Optimization Tests

```bash
npm run test:gas
```

Check gas usage for:
- Listing creation: < 150,000 gas
- NFT purchase: < 200,000 gas
- Auction creation: < 180,000 gas
- Bid placement: < 120,000 gas

### Integration Tests

Test contract interactions:

```bash
npm run test:integration
```

Scenarios:
- Create listing → Purchase NFT
- Create auction → Place bids → Settle auction
- Update fees → Verify fee distribution
- Register profile → Update profile

### Deployment Tests

Test deployment on Arc testnet:

```bash
npm run deploy:arc:test
```

Verify deployed contracts:

```bash
npm run verify:arc
```

## Subgraph Testing

### Local Graph Node

1. **Start Graph Node**:
   ```bash
   docker-compose up -d
   ```

2. **Deploy Subgraph**:
   ```bash
   cd subgraph
   npm run deploy:local
   ```

3. **Access GraphiQL**:
   ```
   http://localhost:8000/subgraphs/name/arcmarket/graphql
   ```

### Test Queries

**Query Listings**:
```graphql
query {
  listings(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    seller
    price
    status
    nft {
      tokenId
      collection {
        name
      }
    }
  }
}
```

**Query Auctions**:
```graphql
query {
  auctions(first: 10, where: { status: ACTIVE }) {
    id
    seller
    minBid
    highestBid
    endTime
    nft {
      tokenId
    }
  }
}
```

**Query User Activity**:
```graphql
query {
  user(id: "0x...") {
    address
    totalPurchases
    totalSales
    listings {
      id
      price
    }
    bids {
      id
      amount
    }
  }
}
```

### Event Indexing Tests

1. **Deploy Contracts** to testnet
2. **Trigger Events**:
   - Create listing
   - Purchase NFT
   - Create auction
   - Place bid
3. **Verify Indexing**:
   ```graphql
   query {
     _meta {
       block {
         number
       }
       hasIndexingErrors
     }
   }
   ```

### Subgraph Validation

Check for common issues:

```bash
# Validate schema
npm run validate:schema

# Check for indexing errors
npm run check:indexing

# Test mappings
npm run test:mappings
```

## Frontend Testing

### Development Server

```bash
cd frontend
npm run dev
```

Access: http://localhost:3000

### Unit Tests

Test React components and hooks:

```bash
npm test
```

Test specific components:
```bash
npm test -- NFTCard
npm test -- BuyModal
npm test -- useCircleWallet
```

### Component Testing

Test UI components in isolation:

```bash
npm run test:watch
```

Coverage:
- Components: > 80%
- Hooks: > 90%
- Utilities: 100%

### E2E Tests (Cypress/Playwright)

```bash
npm run test:e2e
```

Test flows:
- Browse NFTs
- Connect wallet
- Buy NFT
- Create listing
- Place bid on auction
- Cancel listing

### Visual Regression Tests

```bash
npm run test:visual
```

Check UI consistency across:
- Browsers (Chrome, Firefox, Safari)
- Devices (Desktop, Tablet, Mobile)
- Themes (Light, Dark)

### Accessibility Tests

```bash
npm run test:a11y
```

WCAG 2.1 Level AA compliance:
- Keyboard navigation
- Screen reader support
- Color contrast
- ARIA labels

## End-to-End Testing

### Complete User Flows

#### Flow 1: Buy NFT

1. Connect wallet (MetaMask or Circle)
2. Browse marketplace
3. View NFT details
4. Approve USDC
5. Purchase NFT
6. Verify ownership

**Expected Results**:
- ✅ NFT transferred to buyer
- ✅ USDC transferred to seller
- ✅ Fees sent to FeeVault
- ✅ Listing removed
- ✅ Subgraph updated

#### Flow 2: Create and Sell Listing

1. Connect wallet
2. Navigate to owned NFT
3. Create listing with price
4. Approve NFT
5. Confirm listing
6. Wait for buyer
7. Verify payment received

#### Flow 3: Auction Flow

1. Create auction with minimum bid and duration
2. User A places bid
3. User B places higher bid (refunds User A)
4. Wait for auction end
5. Settle auction
6. Verify NFT transfer and payment

#### Flow 4: Circle Wallet Integration

1. Create Circle wallet
2. Fund with USDC
3. Buy NFT using Circle wallet
4. Verify biometric authentication
5. Confirm transaction
6. Check wallet balance

### Multi-User Testing

Test concurrent operations:

```bash
# Terminal 1: User A
npm run test:user:a

# Terminal 2: User B
npm run test:user:b

# Terminal 3: User C (auction)
npm run test:user:c
```

Scenarios:
- Multiple bids on same auction
- Same NFT listed by different sellers
- Concurrent purchases
- Fee distribution to multiple recipients

## Performance Testing

### Load Testing

Test with increasing load:

```bash
npm run test:load
```

Metrics:
- Page load time: < 3s
- GraphQL query time: < 500ms
- Transaction confirmation: < 5s (Arc fast finality)

### Stress Testing

Maximum concurrent users:

```bash
npm run test:stress -- --users 1000
```

Targets:
- 1,000 concurrent users
- 10,000 NFTs indexed
- 100 auctions active simultaneously
- 50 bids per second

### Transaction Throughput

Test Arc blockchain TPS:

```bash
npm run test:throughput
```

Arc targets:
- 3,000-10,000 TPS
- 100-350ms block time
- < 1s finality

## Security Testing

### Smart Contract Security

**Static Analysis**:
```bash
npm run security:slither
npm run security:mythril
```

**Formal Verification**:
```bash
npm run verify:formal
```

Check for:
- Reentrancy vulnerabilities
- Integer overflow/underflow
- Access control issues
- Front-running risks

### Frontend Security

**Dependency Audit**:
```bash
npm audit
npm run audit:fix
```

**XSS Prevention**:
- Test input sanitization
- Verify CSP headers
- Check for DOM XSS

**Wallet Security**:
- Test signature verification
- Check transaction replay protection
- Verify nonce management

### Infrastructure Security

**API Security**:
- Rate limiting tests
- Auth token validation
- CORS policy verification

**GraphQL Security**:
- Query depth limiting
- Complexity analysis
- Rate limiting

## Continuous Integration

### GitHub Actions

Automated tests on every PR:

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  contracts:
    - npm run test
    - npm run coverage
  frontend:
    - npm run test
    - npm run test:e2e
  subgraph:
    - npm run build
    - npm run test:mappings
```

### Pre-Deployment Checklist

Before mainnet deployment:

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Security audit complete
- [ ] Gas optimization verified
- [ ] Testnet deployment successful
- [ ] Subgraph syncing correctly
- [ ] Frontend working on testnet
- [ ] Documentation updated
- [ ] Monitoring set up

## Testing Environments

### Local Development

```bash
# Start all services
docker-compose up -d
npm run dev
```

Services:
- Hardhat Network: http://localhost:8545
- Graph Node: http://localhost:8020
- Frontend: http://localhost:3000
- GraphiQL: http://localhost:8000

### Arc Testnet

```env
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.studio.thegraph.com/...
```

### Production (Arc Mainnet)

```env
NEXT_PUBLIC_CHAIN_ID=999999
NEXT_PUBLIC_RPC_URL=https://rpc.arc.network
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://gateway.thegraph.com/...
```

## Debugging

### Contract Debugging

**Hardhat Console**:
```bash
npx hardhat console --network arcTestnet
```

**Event Logs**:
```javascript
const tx = await marketplace.createListing(...);
const receipt = await tx.wait();
console.log('Events:', receipt.events);
```

### Subgraph Debugging

**Indexing Logs**:
```bash
docker logs graph-node -f
```

**Query Errors**:
```graphql
query {
  _meta {
    hasIndexingErrors
  }
}
```

### Frontend Debugging

**React DevTools**: Browser extension
**Redux DevTools**: State management
**Network Tab**: GraphQL requests
**Console Logs**: Debug info

## Monitoring

### Health Checks

**Contracts**:
```bash
npm run health:contracts
```

**Subgraph**:
```graphql
query { _meta { block { number } } }
```

**Frontend**:
```bash
curl http://localhost:3000/api/health
```

### Alerts

Set up alerts for:
- Contract deployment failures
- Subgraph indexing errors
- Frontend build failures
- High error rates
- Slow query times

## Support

- **Contracts**: Check Hardhat docs
- **Subgraph**: The Graph Discord
- **Arc Network**: Arc support
- **Circle Wallets**: Circle docs

## Next Steps

After testing:
1. Deploy to Arc testnet
2. Run full test suite
3. Fix any issues
4. Deploy subgraph
5. Deploy frontend to Vercel
6. Monitor for 48h
7. Deploy to mainnet

---

**Remember**: Never skip testing. The blockchain is permanent!
