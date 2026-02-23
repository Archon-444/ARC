import { NextRequest, NextResponse } from 'next/server';
import algoliasearch from 'algoliasearch';
import { fetchGraphQL } from '@/lib/graphql-client';

const COLLECTIONS_QUERY = `
  query SyncCollections($first: Int!, $skip: Int!) {
    collections(first: $first, skip: $skip, orderBy: totalVolume, orderDirection: desc) {
      id
      name
      symbol
      floorPrice
      totalVolume
      totalSales
    }
  }
`;

const NFTS_QUERY = `
  query SyncNFTs($first: Int!, $skip: Int!) {
    nfts(first: $first, skip: $skip, orderBy: updatedAt, orderDirection: desc) {
      id
      tokenId
      tokenURI
      creator
      owner { id }
      collection {
        id
        name
      }
      listing {
        price
        active
      }
    }
  }
`;

const USERS_QUERY = `
  query SyncUsers($first: Int!, $skip: Int!) {
    users(first: $first, skip: $skip, orderBy: totalSpent, orderDirection: desc) {
      id
      address
      profile {
        metadataURI
      }
      totalSpent
      totalEarned
    }
  }
`;

const TOKENS_QUERY = `
  query SyncTokens($first: Int!, $skip: Int!) {
    launchedTokens(first: $first, skip: $skip, orderBy: totalVolume, orderDirection: desc) {
      id
      name
      symbol
      totalSupply
      totalVolume
      totalTrades
      isGraduated
      creator
    }
  }
`;

/**
 * POST /api/search/sync
 *
 * Fetches data from the subgraph and pushes it to Algolia indexes.
 * Protected by CRON_SECRET for use as a cron job or manual trigger.
 */
export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appId = process.env.ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
  if (!appId || !adminKey) {
    return NextResponse.json(
      { error: 'Algolia admin credentials not configured (ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY)' },
      { status: 503 }
    );
  }

  const client = algoliasearch(appId, adminKey);

  try {
    const results: Record<string, { synced: number; errors: number }> = {};

    // Sync collections
    results.collections = await syncIndex(
      client, 'collections', COLLECTIONS_QUERY, 'collections',
      (item: any) => ({
        objectID: item.id,
        name: item.name,
        symbol: item.symbol,
        floor_price: item.floorPrice,
        total_volume: item.totalVolume,
        total_sales: item.totalSales,
      })
    );

    // Sync NFTs
    results.nfts = await syncIndex(
      client, 'nfts', NFTS_QUERY, 'nfts',
      (item: any) => ({
        objectID: item.id,
        name: `#${item.tokenId}`,
        token_id: item.tokenId,
        collection_address: item.collection?.id,
        collection_name: item.collection?.name,
        owner_address: item.owner?.id,
        price: item.listing?.active ? item.listing.price : undefined,
        status: item.listing?.active ? 'listed' : 'unlisted',
      })
    );

    // Sync users
    results.users = await syncIndex(
      client, 'users', USERS_QUERY, 'users',
      (item: any) => ({
        objectID: item.id,
        address: item.id,
        username: undefined, // Profile metadata would need IPFS fetch
        total_spent: item.totalSpent,
        total_earned: item.totalEarned,
      })
    );

    // Sync launched tokens (as a separate index for the token launchpad)
    results.tokens = await syncIndex(
      client, 'tokens', TOKENS_QUERY, 'launchedTokens',
      (item: any) => ({
        objectID: item.id,
        name: item.name,
        symbol: item.symbol,
        total_supply: item.totalSupply,
        total_volume: item.totalVolume,
        total_trades: item.totalTrades,
        is_graduated: item.isGraduated,
        creator: item.creator,
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Search sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync search indexes' },
      { status: 500 }
    );
  }
}

async function syncIndex(
  client: ReturnType<typeof algoliasearch>,
  indexName: string,
  query: string,
  entityKey: string,
  transform: (item: any) => Record<string, any>
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;
  let skip = 0;
  const batchSize = 100;
  const index = client.initIndex(indexName);

  while (true) {
    try {
      const data = await fetchGraphQL<Record<string, any[]>>(query, {
        first: batchSize,
        skip,
      });

      const items = data[entityKey] || [];
      if (items.length === 0) break;

      const records = items.map(transform);
      await index.saveObjects(records);
      synced += records.length;
      skip += batchSize;

      // Safety limit
      if (skip >= 10000) break;
    } catch (error) {
      console.error(`Sync error for ${indexName} at offset ${skip}:`, error);
      errors += 1;
      break;
    }
  }

  return { synced, errors };
}

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
