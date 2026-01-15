import { NextRequest, NextResponse } from 'next/server';
import { fetchGraphQL } from '@/lib/graphql-client';
import { getIPFSUrl } from '@/lib/utils';
import type { ActivityEvent, ActivityEventType } from '@/lib/activity-types';

const ACTIVITY_QUERY = `
  query Activity($first: Int!, $skip: Int!) {
    sales(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc) {
      id
      price
      createdAt
      txHash
      nft {
        tokenId
        tokenURI
        collection {
          address
        }
      }
      seller {
        address
      }
      buyer {
        address
      }
    }
    listings(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc) {
      id
      collection
      tokenId
      seller
      price
      createdAt
      status
    }
    auctions(first: $first, skip: $skip, orderBy: startTime, orderDirection: desc) {
      id
      collection
      tokenId
      seller
      highestBid
      minBid
      startTime
      endTime
      status
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const cursor = Number(searchParams.get('cursor') || 0);
    const collection = searchParams.get('collection')?.toLowerCase();
    const tokenId = searchParams.get('tokenId');
    const user = searchParams.get('user')?.toLowerCase();
    const types = (searchParams.get('types') || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean) as ActivityEventType[];

    const data = await fetchGraphQL<{
      sales: any[];
      listings: any[];
      auctions: any[];
    }>(ACTIVITY_QUERY, {
      first: limit,
      skip: cursor,
    });

    const events: ActivityEvent[] = [];

    data.sales?.forEach((sale) => {
      events.push({
        id: `sale:${sale.id}`,
        type: 'sale',
        collectionAddress: sale.nft?.collection?.address || '',
        tokenId: sale.nft?.tokenId || '',
        tokenImage: sale.nft?.tokenURI,
        from: sale.seller?.address || '',
        to: sale.buyer?.address,
        price: sale.price,
        timestamp: Number(sale.createdAt) * 1000,
        transactionHash: sale.txHash,
      });
    });

    data.listings?.forEach((listing) => {
      events.push({
        id: `listing:${listing.id}`,
        type: 'listing',
        collectionAddress: listing.collection,
        tokenId: listing.tokenId,
        from: listing.seller,
        price: listing.price,
        timestamp: Number(listing.createdAt) * 1000,
      });
    });

    data.auctions?.forEach((auction) => {
      events.push({
        id: `bid:${auction.id}`,
        type: 'bid',
        collectionAddress: auction.collection,
        tokenId: auction.tokenId,
        from: auction.seller,
        price: auction.highestBid || auction.minBid,
        timestamp: Number(auction.startTime) * 1000,
      });
    });

    const filtered = events.filter((event) => {
      if (collection && event.collectionAddress?.toLowerCase() !== collection) return false;
      if (tokenId && event.tokenId !== tokenId) return false;
      if (user && event.from?.toLowerCase() !== user && event.to?.toLowerCase() !== user) return false;
      if (types.length > 0 && !types.includes(event.type)) return false;
      return true;
    });

    const sliced = await enrichEvents(filtered.slice(0, limit));
    const hasMore = filtered.length >= limit;

    return NextResponse.json({
      events: sliced,
      hasMore,
      nextCursor: hasMore ? String(cursor + limit) : undefined,
    });
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

async function enrichEvents(events: ActivityEvent[]): Promise<ActivityEvent[]> {
  const batchSize = 10;
  const enriched: ActivityEvent[] = [];

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (event) => {
        if (!event.tokenImage) return event;
        const metadata = await fetchNFTMetadata(event.tokenImage);
        return {
          ...event,
          tokenName: metadata?.name || event.tokenName,
          tokenImage: metadata?.image || event.tokenImage,
        };
      })
    );
    enriched.push(...results);
  }

  return enriched;
}

async function fetchNFTMetadata(tokenURI: string) {
  if (!tokenURI) return null;
  if (tokenURI.startsWith('data:application/json;base64,')) {
    try {
      const base64 = tokenURI.replace('data:application/json;base64,', '');
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  const url = getIPFSUrl(tokenURI);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
