import { gql } from 'graphql-request';

export const GET_MARKETPLACE_STATS = gql`
  query GetMarketplaceStats {
    marketplaceStats(id: "marketplace") {
      totalVolume
      totalSales
      activeListings
      activeAuctions
      totalUsers
      totalCollections
      protocolFeeBps
      updatedAt
    }
  }
`;

export const GET_ACTIVE_LISTINGS = gql`
  query GetActiveListings($first: Int = 20, $skip: Int = 0) {
    listings(
      where: { active: true }
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      price
      createdAt
      nft {
        id
        tokenId
        tokenURI
        collection {
          id
          name
          symbol
          address
        }
        owner {
          id
          address
        }
      }
      seller {
        id
        address
        profile {
          metadataURI
        }
      }
    }
  }
`;

export const GET_ACTIVE_AUCTIONS = gql`
  query GetActiveAuctions($first: Int = 20, $skip: Int = 0) {
    auctions(
      where: { settled: false }
      first: $first
      skip: $skip
      orderBy: endTime
      orderDirection: asc
    ) {
      id
      reservePrice
      startTime
      endTime
      highestBid
      createdAt
      highestBidder {
        id
        address
      }
      nft {
        id
        tokenId
        tokenURI
        collection {
          id
          name
          symbol
          address
        }
      }
      seller {
        id
        address
        profile {
          metadataURI
        }
      }
    }
  }
`;

export const GET_RECENT_SALES = gql`
  query GetRecentSales($first: Int = 20, $skip: Int = 0) {
    sales(
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      price
      saleType
      createdAt
      txHash
      nft {
        id
        tokenId
        tokenURI
        collection {
          id
          name
          symbol
          address
        }
      }
      seller {
        id
        address
      }
      buyer {
        id
        address
      }
    }
  }
`;

export const GET_COLLECTION = gql`
  query GetCollection($id: ID!) {
    collection(id: $id) {
      id
      address
      name
      symbol
      totalVolume
      totalSales
      floorPrice
      createdAt
      updatedAt
      nfts(first: 100, orderBy: tokenId, orderDirection: asc) {
        id
        tokenId
        tokenURI
        owner {
          id
          address
        }
        listing {
          id
          price
          active
        }
        auction {
          id
          reservePrice
          highestBid
          endTime
          settled
        }
      }
    }
  }
`;

export const GET_NFT = gql`
  query GetNFT($id: ID!) {
    nft(id: $id) {
      id
      tokenId
      tokenURI
      createdAt
      updatedAt
      collection {
        id
        address
        name
        symbol
      }
      creator {
        id
        address
        profile {
          metadataURI
        }
      }
      owner {
        id
        address
        profile {
          metadataURI
        }
      }
      listing {
        id
        price
        active
        createdAt
        seller {
          id
          address
        }
      }
      auction {
        id
        reservePrice
        startTime
        endTime
        highestBid
        highestBidder {
          id
          address
        }
        settled
        bids {
          id
          amount
          bidder {
            id
            address
          }
          createdAt
        }
      }
      sales {
        id
        price
        saleType
        createdAt
        seller {
          id
          address
        }
        buyer {
          id
          address
        }
      }
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      address
      totalSpent
      totalEarned
      createdAt
      updatedAt
      profile {
        id
        metadataURI
      }
      ownedNFTs(first: 100) {
        id
        tokenId
        tokenURI
        collection {
          id
          name
          symbol
          address
        }
        listing {
          id
          price
          active
        }
      }
      createdNFTs(first: 100) {
        id
        tokenId
        tokenURI
        collection {
          id
          name
          symbol
        }
      }
      listings(where: { active: true }) {
        id
        price
        nft {
          id
          tokenId
          tokenURI
        }
      }
      purchases(first: 20, orderBy: createdAt, orderDirection: desc) {
        id
        price
        createdAt
        nft {
          id
          tokenId
          tokenURI
          collection {
            name
          }
        }
      }
      sales(first: 20, orderBy: createdAt, orderDirection: desc) {
        id
        price
        createdAt
        nft {
          id
          tokenId
          tokenURI
          collection {
            name
          }
        }
      }
    }
  }
`;

export const GET_COLLECTIONS = gql`
  query GetCollections($first: Int = 20, $skip: Int = 0, $orderBy: String = "totalVolume") {
    collections(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: desc
    ) {
      id
      address
      name
      symbol
      totalVolume
      totalSales
      floorPrice
      createdAt
    }
  }
`;

export const GET_DAILY_STATS = gql`
  query GetDailyStats($first: Int = 30) {
    dailyStats(
      first: $first
      orderBy: date
      orderDirection: desc
    ) {
      id
      date
      volume
      sales
      newUsers
      activeUsers
      newListings
      newAuctions
    }
  }
`;

export const SEARCH_NFTS = gql`
  query SearchNFTs($searchTerm: String!) {
    nfts(
      where: {
        or: [
          { tokenURI_contains_nocase: $searchTerm }
        ]
      }
      first: 20
    ) {
      id
      tokenId
      tokenURI
      collection {
        id
        name
        symbol
        address
      }
      owner {
        id
        address
      }
      listing {
        id
        price
        active
      }
    }
  }
`;
