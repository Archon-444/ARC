# ArcMarket Subgraph Deployment Guide

This guide explains how to deploy the ArcMarket subgraph to index blockchain data for the NFT marketplace.

## Prerequisites

1. **The Graph CLI** installed globally:
   ```bash
   npm install -g @graphprotocol/graph-cli
   ```

2. **Contract Addresses**: Deployed contract addresses on Arc network
   - NFTMarketplace
   - FeeVault
   - ProfileRegistry

3. **Start Block Numbers**: Block numbers where contracts were deployed

4. **The Graph Account**:
   - Create account at [The Graph Studio](https://thegraph.com/studio/)
   - Or set up local Graph Node for development

## Configuration

### 1. Update Contract Addresses

Edit `subgraph.yaml` and replace placeholder addresses with your deployed contracts:

```yaml
dataSources:
  - kind: ethereum
    name: NFTMarketplace
    network: arc-testnet
    source:
      address: "0xYOUR_MARKETPLACE_ADDRESS"  # Replace this
      startBlock: 1234567                     # Replace with deployment block
```

Do the same for `FeeVault` and `ProfileRegistry` data sources.

### 2. Update Network Configuration

For **Arc Testnet**:
- Network name: `arc-testnet` (already configured)
- Chain ID: 5042002
- RPC URL: https://rpc.testnet.arc.network

For **Arc Mainnet** (when ready):
- Network name: `arc`
- Chain ID: 999999
- Update all `network: arc-testnet` to `network: arc`

## Deployment Options

### Option 1: The Graph Studio (Recommended for Production)

1. **Create Subgraph** in The Graph Studio:
   ```bash
   graph auth --studio <DEPLOY_KEY>
   ```

2. **Initialize Subgraph**:
   ```bash
   graph init --studio arcmarket
   ```

3. **Deploy**:
   ```bash
   npm run deploy:studio
   ```

   Or manually:
   ```bash
   npm run update-config
   npm run codegen
   npm run build
   graph deploy --studio arcmarket
   ```

### Option 2: Local Graph Node (For Development)

1. **Start Graph Node**:
   ```bash
   cd ../
   docker-compose up -d
   ```

2. **Deploy Locally**:
   ```bash
   npm run deploy:local
   ```

   This will:
   - Create the subgraph
   - Deploy to local node at http://localhost:8020
   - Use local IPFS at http://localhost:5001

3. **Access GraphQL Playground**:
   - GraphQL endpoint: http://localhost:8000/subgraphs/name/arcmarket/arcmarket
   - GraphiQL UI: http://localhost:8000/subgraphs/name/arcmarket/arcmarket/graphql

### Option 3: Hosted Service (Legacy)

1. **Authenticate**:
   ```bash
   graph auth --product hosted-service <ACCESS_TOKEN>
   ```

2. **Deploy**:
   ```bash
   npm run deploy:hosted
   ```

## Verification

After deployment, verify the subgraph is working:

1. **Check Sync Status**:
   - In The Graph Studio dashboard
   - Or query the GraphQL endpoint

2. **Test Query**:
   ```graphql
   query {
     listings(first: 5, orderBy: createdAt, orderDirection: desc) {
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
     _meta {
       block {
         number
       }
     }
   }
   ```

3. **Check Indexing Progress**:
   ```graphql
   query {
     _meta {
       hasIndexingErrors
       block {
         number
         timestamp
       }
     }
   }
   ```

## Frontend Integration

After successful deployment, update your frontend GraphQL endpoint:

1. **Development (.env.local)**:
   ```bash
   NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:8000/subgraphs/name/arcmarket/arcmarket
   ```

2. **Production (.env.production)**:
   ```bash
   NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.studio.thegraph.com/query/<SUBGRAPH_ID>/arcmarket/v0.1.0
   ```

3. **Update Frontend Config**:
   ```typescript
   // frontend/src/lib/graphql-client.ts
   const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
     'http://localhost:8000/subgraphs/name/arcmarket/arcmarket';
   ```

## Updating the Subgraph

When you need to update the subgraph (e.g., add new events, fix bugs):

1. **Make Changes**:
   - Update `schema.graphql` for data model changes
   - Update `subgraph.yaml` for new event handlers
   - Update mapping files in `src/` for logic changes

2. **Test Locally**:
   ```bash
   npm run codegen
   npm run build
   npm run deploy:local
   ```

3. **Deploy Update**:
   ```bash
   graph deploy --studio arcmarket --version-label v0.2.0
   ```

## Troubleshooting

### Build Errors

- **"Cannot find module"**: Run `npm run codegen` to generate types
- **ABI errors**: Ensure contract artifacts are up to date in `artifacts/`
- **AssemblyScript errors**: Check mapping code in `src/` files

### Deployment Issues

- **Authentication failed**: Re-run `graph auth` with correct key
- **Network not found**: Ensure Arc network is configured in The Graph
- **Start block too low**: Update `startBlock` to actual deployment block

### Indexing Errors

- **Event handler fails**: Check event signatures match contract
- **Entity not found**: Verify entity relationships in `schema.graphql`
- **RPC errors**: Check Arc RPC endpoint is accessible

### Performance Issues

- **Slow queries**: Add proper indexes in `schema.graphql`
- **High memory**: Optimize mappings, avoid loading too many entities
- **Sync lag**: Consider using a dedicated Archive node

## Monitoring

### Health Checks

```graphql
query {
  _meta {
    hasIndexingErrors
    deployment
    block {
      number
      hash
      timestamp
    }
  }
}
```

### Query Performance

Use The Graph Studio's analytics to monitor:
- Query response times
- Query volume
- Error rates
- Indexing status

## Best Practices

1. **Version Control**: Tag each deployment with semantic version
2. **Testing**: Always test on local node before production
3. **Monitoring**: Set up alerts for indexing errors
4. **Backups**: Keep ABIs and deployment configs in version control
5. **Documentation**: Update this guide when making changes

## Arc Network-Specific Notes

- **USDC Native**: Arc uses USDC (6 decimals) as gas token
- **Fast Finality**: 100-350ms block times
- **EVM Compatible**: Standard Ethereum tooling works
- **Testnet**: Free testnet USDC from faucet

## Support

- The Graph Docs: https://thegraph.com/docs/
- Arc Network Docs: https://docs.arc.network/
- ArcMarket Issues: https://github.com/your-org/arcmarket/issues

## Next Steps

After successful deployment:
1. ✅ Verify subgraph is syncing
2. ✅ Test GraphQL queries
3. ✅ Update frontend endpoint
4. ✅ Test end-to-end flow
5. ✅ Monitor for 24h
6. ✅ Set up alerts

## Deployment Checklist

- [ ] Contracts deployed to Arc network
- [ ] Contract addresses updated in `subgraph.yaml`
- [ ] Start blocks updated
- [ ] Network configured (testnet or mainnet)
- [ ] ABIs are current
- [ ] Code generated (`npm run codegen`)
- [ ] Build successful (`npm run build`)
- [ ] Deployed to The Graph Studio
- [ ] GraphQL endpoint accessible
- [ ] Test queries working
- [ ] Frontend updated with new endpoint
- [ ] End-to-end testing complete
- [ ] Monitoring set up
