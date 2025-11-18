# ArcMarket Subgraph

GraphQL API for querying ArcMarket NFT marketplace data.

## Overview

This subgraph indexes all marketplace activity including:
- NFT listings and sales
- Auctions and bids
- User profiles
- Collection statistics
- Fee distributions
- Daily marketplace metrics

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Update contract addresses:**

Edit `subgraph.yaml` and update the following:
- NFTMarketplace address
- FeeVault address
- ProfileRegistry address
- Start blocks for each contract

3. **Generate code:**
```bash
npm run codegen
```

4. **Build subgraph:**
```bash
npm run build
```

## Deployment

### Local Development (Graph Node)

```bash
npm run deploy:local
```

### The Graph Hosted Service

```bash
npm run deploy:hosted
```

### The Graph Studio

```bash
npm run deploy:studio
```

## Example Queries

### Get Marketplace Stats

```graphql
{
  marketplaceStats(id: "marketplace") {
    totalVolume
    totalSales
    activeListings
    activeAuctions
    totalUsers
    totalCollections
  }
}
```

### Get Active Listings

```graphql
{
  listings(where: { active: true }, first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    nft {
      tokenId
      tokenURI
      collection {
        name
        symbol
      }
    }
    price
    seller {
      address
      profile {
        metadataURI
      }
    }
    createdAt
  }
}
```

### Get Collection Statistics

```graphql
{
  collection(id: "0x...") {
    name
    symbol
    totalVolume
    totalSales
    floorPrice
    nfts(first: 10) {
      tokenId
      tokenURI
      owner {
        address
      }
    }
  }
}
```

### Get User Activity

```graphql
{
  user(id: "0x...") {
    address
    totalSpent
    totalEarned
    profile {
      metadataURI
    }
    ownedNFTs(first: 10) {
      tokenId
      tokenURI
      collection {
        name
      }
    }
    listings(where: { active: true }) {
      id
      price
      nft {
        tokenId
      }
    }
  }
}
```

### Get Recent Sales

```graphql
{
  sales(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    nft {
      tokenId
      tokenURI
      collection {
        name
      }
    }
    seller {
      address
    }
    buyer {
      address
    }
    price
    saleType
    createdAt
  }
}
```

### Get Daily Statistics

```graphql
{
  dailyStats(first: 30, orderBy: date, orderDirection: desc) {
    date
    volume
    sales
    newUsers
    activeUsers
    newListings
    newAuctions
  }
}
```

## Schema

See `schema.graphql` for the complete data schema.

## Event Handlers

### NFTMarketplace
- `handleListingCreated` - New listing created
- `handleListingUpdated` - Listing price updated
- `handleListingCancelled` - Listing cancelled
- `handlePurchased` - Item purchased
- `handleAuctionCreated` - New auction created
- `handleBidPlaced` - Bid placed on auction
- `handleAuctionSettled` - Auction settled
- `handleProtocolFeeUpdated` - Protocol fee updated
- `handleCollectionAllowed` - Collection allowlist updated

### FeeVault
- `handleDistributed` - Fees distributed
- `handleGlobalSplitsUpdated` - Platform fee splits updated
- `handleCollectionSplitsUpdated` - Collection royalty splits updated

### ProfileRegistry
- `handleProfileUpdated` - User profile updated

## Development

To modify the subgraph:

1. Update `schema.graphql` if changing entity structure
2. Update event handlers in `src/` directory
3. Run `npm run codegen` to regenerate TypeScript types
4. Run `npm run build` to compile
5. Deploy to your Graph node

## Notes

- Timestamps are stored as BigInt (Unix timestamps)
- Prices are stored in USDC base units (6 decimals)
- Addresses are stored as Bytes
- All monetary values use BigInt to avoid precision loss
