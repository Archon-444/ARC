import { NextRequest, NextResponse } from 'next/server';
import Typesense from 'typesense';
import { fetchGraphQL } from '@/lib/graphql-client';

const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!, $skip: Int!) {
    collections(first: $first, skip: $skip, orderBy: totalVolume, orderDirection: desc) {
      id
      name
      symbol
      totalSupply
      floorPrice
      volumeTraded
    }
  }
`;

const NFTS_QUERY = `
  query GetNFTs($first: Int!, $skip: Int!) {
    nfts(first: $first, skip: $skip, orderBy: updatedAt, orderDirection: desc) {
      id
      tokenId
      name
      owner
      collection {
        id
        name
      }
      listings(where: { status: ACTIVE }, first: 1) {
        price
      }
    }
  }
`;

const USERS_QUERY = `
  query GetUsers($first: Int!, $skip: Int!) {
    users(first: $first, skip: $skip) {
      id
      profile {
        username
        bio
      }
      nftsOwned {
        id
      }
    }
  }
`;

function getTypesenseAdmin(): Typesense.Client {
  return new Typesense.Client({
    nodes: [
      {
        host: process.env.TYPESENSE_HOST || process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'localhost',
        port: parseInt(process.env.TYPESENSE_PORT || process.env.NEXT_PUBLIC_TYPESENSE_PORT || '8108'),
        protocol: process.env.TYPESENSE_PROTOCOL || process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || 'http',
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY || 'xyz',
    connectionTimeoutSeconds: 5,
  });
}

const COLLECTION_SCHEMAS: Record<string, any> = {
  collections: {
    name: 'collections',
    fields: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string', optional: true },
      { name: 'total_supply', type: 'int32', optional: true },
      { name: 'floor_price', type: 'string', optional: true },
      { name: 'volume_traded', type: 'string', optional: true },
    ],
  },
  nfts: {
    name: 'nfts',
    fields: [
      { name: 'name', type: 'string' },
      { name: 'token_id', type: 'string' },
      { name: 'owner', type: 'string' },
      { name: 'collection_address', type: 'string' },
      { name: 'collection_name', type: 'string', optional: true },
      { name: 'price', type: 'string', optional: true },
    ],
  },
  users: {
    name: 'users',
    fields: [
      { name: 'address', type: 'string' },
      { name: 'username', type: 'string', optional: true },
      { name: 'bio', type: 'string', optional: true },
      { name: 'nft_count', type: 'int32', optional: true },
    ],
  },
};

async function ensureCollection(client: Typesense.Client, name: string) {
  try {
    await client.collections(name).retrieve();
  } catch {
    await client.collections().create(COLLECTION_SCHEMAS[name]);
  }
}

async function fetchAllPaginated<T>(
  query: string,
  key: string,
  pageSize = 100,
  maxPages = 10,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const data = await fetchGraphQL<Record<string, T[]>>(query, {
      first: pageSize,
      skip: page * pageSize,
    });
    const results = data[key] || [];
    all.push(...results);
    if (results.length < pageSize) break;
  }
  return all;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = getTypesenseAdmin();
  const stats = { collections: 0, nfts: 0, users: 0, errors: [] as string[] };

  try {
    // Ensure Typesense collections exist
    for (const name of Object.keys(COLLECTION_SCHEMAS)) {
      await ensureCollection(client, name);
    }

    // Sync collections
    try {
      const collections = await fetchAllPaginated<any>(COLLECTIONS_QUERY, 'collections');
      const docs = collections.map((c) => ({
        id: c.id,
        name: c.name || '',
        symbol: c.symbol || '',
        total_supply: parseInt(c.totalSupply || '0'),
        floor_price: c.floorPrice || '0',
        volume_traded: c.volumeTraded || '0',
      }));
      if (docs.length > 0) {
        await client.collections('collections').documents().import(docs, { action: 'upsert' });
      }
      stats.collections = docs.length;
    } catch (err: any) {
      stats.errors.push(`collections: ${err.message}`);
    }

    // Sync NFTs
    try {
      const nfts = await fetchAllPaginated<any>(NFTS_QUERY, 'nfts');
      const docs = nfts.map((n) => ({
        id: n.id,
        name: n.name || `#${n.tokenId}`,
        token_id: n.tokenId,
        owner: n.owner,
        collection_address: n.collection?.id || '',
        collection_name: n.collection?.name || '',
        price: n.listings?.[0]?.price || '',
      }));
      if (docs.length > 0) {
        await client.collections('nfts').documents().import(docs, { action: 'upsert' });
      }
      stats.nfts = docs.length;
    } catch (err: any) {
      stats.errors.push(`nfts: ${err.message}`);
    }

    // Sync users
    try {
      const users = await fetchAllPaginated<any>(USERS_QUERY, 'users');
      const docs = users.map((u) => ({
        id: u.id,
        address: u.id,
        username: u.profile?.username || '',
        bio: u.profile?.bio || '',
        nft_count: u.nftsOwned?.length || 0,
      }));
      if (docs.length > 0) {
        await client.collections('users').documents().import(docs, { action: 'upsert' });
      }
      stats.users = docs.length;
    } catch (err: any) {
      stats.errors.push(`users: ${err.message}`);
    }

    return NextResponse.json({
      success: true,
      synced: {
        collections: stats.collections,
        nfts: stats.nfts,
        users: stats.users,
      },
      errors: stats.errors.length > 0 ? stats.errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 },
    );
  }
}
