import { GraphQLClient } from 'graphql-request';

/**
 * GraphQL Endpoint Configuration
 *
 * Priority order:
 * 1. NEXT_PUBLIC_GRAPHQL_ENDPOINT (from .env)
 * 2. NEXT_PUBLIC_SUBGRAPH_URL (legacy support)
 * 3. Local development endpoint
 */
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'http://localhost:8000/subgraphs/name/arcmarket';

// Log endpoint in development
if (process.env.NODE_ENV === 'development') {
  console.log('[GraphQL] Using endpoint:', GRAPHQL_ENDPOINT);
}

export const graphQLClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Execute a GraphQL query with error handling and retry logic
 */
export async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, any>,
  retries = 2
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= retries; i++) {
    try {
      const data = await graphQLClient.request<T>(query, variables);
      return data;
    } catch (error: any) {
      lastError = error;
      console.error(`GraphQL request error (attempt ${i + 1}/${retries + 1}):`, error);

      // Don't retry if it's a client error (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError;
}

// ============================================
// Marketplace Queries
// ============================================

/**
 * Fetch active listings
 */
export async function fetchListings(params: {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}) {
  const query = `
    query GetListings($first: Int!, $skip: Int!, $orderBy: String, $orderDirection: String) {
      listings(
        first: $first
        skip: $skip
        orderBy: $orderBy
        orderDirection: $orderDirection
        where: { status: ACTIVE }
      ) {
        id
        collection
        tokenId
        seller
        price
        createdAt
        status
        nft {
          name
          image
          tokenId
          collection {
            id
            name
            floorPrice
            volumeTraded
          }
        }
      }
    }
  `;

  const variables = {
    first: params.first || 20,
    skip: params.skip || 0,
    orderBy: params.orderBy || 'createdAt',
    orderDirection: params.orderDirection || 'desc',
  };

  try {
    const data = await fetchGraphQL<{ listings: any[] }>(query, variables);
    return data.listings;
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    return [];
  }
}

/**
 * Fetch active auctions
 */
export async function fetchAuctions(params: {
  first?: number;
  skip?: number;
}) {
  const query = `
    query GetAuctions($first: Int!, $skip: Int!) {
      auctions(
        first: $first
        skip: $skip
        orderBy: endTime
        orderDirection: asc
        where: { status: ACTIVE }
      ) {
        id
        collection
        tokenId
        seller
        highestBid
        highestBidder
        startTime
        endTime
        minBid
        status
        nft {
          name
          image
          tokenId
          collection {
            id
            name
          }
        }
      }
    }
  `;

  const variables = {
    first: params.first || 20,
    skip: params.skip || 0,
  };

  try {
    const data = await fetchGraphQL<{ auctions: any[] }>(query, variables);
    return data.auctions;
  } catch (error) {
    console.error('Failed to fetch auctions:', error);
    return [];
  }
}

/**
 * Fetch marketplace statistics
 */
export async function fetchMarketplaceStats() {
  const query = `
    query GetMarketplaceStats {
      dailySnapshot(id: "latest") {
        id
        totalVolume
        dailyVolume
        totalSales
        dailySales
        activeListings
        activeAuctions
        uniqueBuyers
        uniqueSellers
        timestamp
      }
    }
  `;

  try {
    const data = await fetchGraphQL<{ dailySnapshot: any }>(query);
    return data.dailySnapshot;
  } catch (error) {
    console.error('Failed to fetch marketplace stats:', error);
    return null;
  }
}

/**
 * Fetch NFT details
 */
export async function fetchNFTDetails(collection: string, tokenId: string) {
  const query = `
    query GetNFTDetails($id: String!) {
      nft(id: $id) {
        id
        tokenId
        name
        description
        image
        owner
        collection {
          id
          name
          symbol
          totalSupply
          floorPrice
          volumeTraded
        }
        listings(where: { status: ACTIVE }, first: 1) {
          id
          price
          seller
          createdAt
        }
        auctions(where: { status: ACTIVE }, first: 1) {
          id
          highestBid
          highestBidder
          endTime
        }
        sales(first: 10, orderBy: timestamp, orderDirection: desc) {
          id
          price
          buyer
          seller
          timestamp
        }
      }
    }
  `;

  const id = `${collection.toLowerCase()}-${tokenId}`;

  try {
    const data = await fetchGraphQL<{ nft: any }>(query, { id });
    return data.nft;
  } catch (error) {
    console.error('Failed to fetch NFT details:', error);
    return null;
  }
}

/**
 * Fetch user activity (listings, bids, sales)
 */
export async function fetchUserActivity(address: string) {
  const query = `
    query GetUserActivity($address: String!) {
      user(id: $address) {
        id
        listings(first: 20, orderBy: createdAt, orderDirection: desc) {
          id
          collection
          tokenId
          price
          status
          createdAt
          nft {
            name
            image
          }
        }
        bids(first: 20, orderBy: timestamp, orderDirection: desc) {
          id
          amount
          timestamp
          auction {
            id
            collection
            tokenId
            nft {
              name
              image
            }
          }
        }
        purchases(first: 20, orderBy: timestamp, orderDirection: desc) {
          id
          price
          timestamp
          nft {
            name
            image
            collection {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchGraphQL<{ user: any }>(query, { address: address.toLowerCase() });
    return data.user;
  } catch (error) {
    console.error('Failed to fetch user activity:', error);
    return null;
  }
}
