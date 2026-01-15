import { NextRequest, NextResponse } from 'next/server';
import { ActivityEvent } from '@/lib/activity-types';

const SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const tokenId = searchParams.get('tokenId');
    const user = searchParams.get('user');
    const types = searchParams.get('types')?.split(',') || [];
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);

    // Fetch all activity types in parallel
    const [salesData, listingsData, auctionsData] = await Promise.all([
      fetchGraphQL(SALES_QUERY, { first: limit * 2, skip: cursor }), // Over-fetch for merging
      fetchGraphQL(LISTINGS_QUERY, { first: limit * 2, skip: cursor }),
      fetchGraphQL(AUCTIONS_QUERY, { first: limit * 2, skip: cursor }),
    ]);

    // Parse and combine events
    const sales = parseSales(salesData.data?.sales || []);
    const listings = parseListings(listingsData.data?.listings || []);
    const auctions = parseAuctions(auctionsData.data?.auctions || []);

    let allEvents = [...sales, ...listings, ...auctions];

    // Filter by collection/tokenId/user
    if (collection) {
      allEvents = allEvents.filter(e => e.collectionAddress.toLowerCase() === collection.toLowerCase());
    }
    if (tokenId) {
      allEvents = allEvents.filter(e => e.tokenId === tokenId);
    }
    if (user) {
      allEvents = allEvents.filter(e => 
        e.from.toLowerCase() === user.toLowerCase() || 
        e.to?.toLowerCase() === user.toLowerCase()
      );
    }
    if (types.length > 0) {
      allEvents = allEvents.filter(e => types.includes(e.type));
    }

    // Sort by timestamp (descending)
    allEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Paginate
    const paginatedEvents = allEvents.slice(cursor, cursor + limit);
    const hasMore = allEvents.length > cursor + limit;

    // ✅ BATCH ENRICH: Fetch metadata for all events in one go
    const enrichedEvents = await batchEnrichEvents(paginatedEvents);

    return NextResponse.json({
      events: enrichedEvents,
      hasMore,
      nextCursor: hasMore ? String(cursor + limit) : undefined,
      total: allEvents.length,
    });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

/**
 * Batch enrich events with metadata
 * Fetches metadata for all unique NFTs in one batch
 */
async function batchEnrichEvents(events: ActivityEvent[]): Promise<ActivityEvent[]> {
  // Get unique NFTs
  const uniqueNFTs = new Map<string, { collection: string; tokenId: string }>();
  
  events.forEach(event => {
    const key = `${event.collectionAddress}-${event.tokenId}`;
    if (!uniqueNFTs.has(key)) {
      uniqueNFTs.set(key, {
        collection: event.collectionAddress,
        tokenId: event.tokenId,
      });
    }
  });

  // Fetch metadata for all unique NFTs in parallel (batches of 20)
  const metadataPromises: Promise<{ key: string; metadata: any }>[] = [];
  const entries = Array.from(uniqueNFTs.entries());

  for (let i = 0; i < entries.length; i += 20) {
    const batch = entries.slice(i, i + 20);
    
    const batchPromises = batch.map(async ([key, nft]) => {
      try {
        const metadata = await fetchNFTMetadataInternal(nft.collection, nft.tokenId);
        return { key, metadata };
      } catch (error) {
        console.error(`Failed to fetch metadata for ${key}:`, error);
        return { key, metadata: null };
      }
    });

    metadataPromises.push(...batchPromises);
  }

  const metadataResults = await Promise.allSettled(metadataPromises);
  
  // Build metadata map
  const metadataMap = new Map<string, any>();
  metadataResults.forEach(result => {
    if (result.status === 'fulfilled' && result.value.metadata) {
      metadataMap.set(result.value.key, result.value.metadata);
    }
  });

  // Enrich events with metadata
  return events.map(event => {
    const key = `${event.collectionAddress}-${event.tokenId}`;
    const metadata = metadataMap.get(key);
    
    return {
      ...event,
      tokenName: metadata?.name || `#${event.tokenId}`,
      tokenImage: metadata?.image,
    };
  });
}

/**
 * Internal metadata fetcher (shared logic)
 */
async function fetchNFTMetadataInternal(collection: string, tokenId: string) {
  try {
    // Fetch tokenURI from subgraph
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetNFT($id: ID!) {
            nft(id: $id) {
              tokenId
              tokenURI
            }
          }
        `,
        variables: { id: `${collection}-${tokenId}` },
      }),
    });

    const { data } = await response.json();
    
    if (!data?.nft?.tokenURI) {
      return null;
    }

    let tokenURI = data.nft.tokenURI;

    // Handle IPFS
    if (tokenURI.startsWith('ipfs://')) {
      tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Handle base64 JSON
    if (tokenURI.startsWith('data:application/json;base64,')) {
      const base64Data = tokenURI.split(',')[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf8');
      const metadata = JSON.parse(jsonString);
      
      let image = metadata.image;
      if (image?.startsWith('ipfs://')) {
        image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      
      return {
        name: metadata.name,
        image,
      };
    }

    // Fetch metadata with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const metadataResponse = await fetch(tokenURI, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!metadataResponse.ok) {
      return null;
    }

    const metadata = await metadataResponse.json();
    
    let image = metadata.image || metadata.image_url;
    if (image?.startsWith('ipfs://')) {
      image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    return {
      name: metadata.name,
      image,
    };
  } catch (error) {
    console.error(`Metadata fetch failed for ${collection}/${tokenId}:`, error);
    return null;
  }
}

// Helper functions (existing)
function fetchGraphQL(query: string, variables: any) {
  return fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  }).then(res => res.json());
}

function parseSales(sales: any[]): ActivityEvent[] {
  return sales.map(sale => ({
    id: sale.id,
    type: 'sale' as const,
    collectionAddress: sale.nft.collection.id,
    tokenId: sale.nft.tokenId,
    from: sale.seller,
    to: sale.buyer,
    price: sale.price,
    priceUSD: sale.priceUSD,
    timestamp: parseInt(sale.timestamp) * 1000,
    transactionHash: sale.transactionHash,
    blockNumber: parseInt(sale.blockNumber),
  }));
}

function parseListings(listings: any[]): ActivityEvent[] {
  return listings.map(listing => ({
    id: listing.id,
    type: 'listing' as const,
    collectionAddress: listing.nft.collection.id,
    tokenId: listing.nft.tokenId,
    from: listing.seller,
    price: listing.price,
    priceUSD: listing.priceUSD,
    timestamp: parseInt(listing.timestamp) * 1000,
    transactionHash: listing.transactionHash,
  }));
}

function parseAuctions(auctions: any[]): ActivityEvent[] {
  return auctions.flatMap(auction => {
    const events: ActivityEvent[] = [];
    
    // Auction start
    events.push({
      id: `${auction.id}-start`,
      type: 'listing' as const,
      collectionAddress: auction.nft.collection.id,
      tokenId: auction.nft.tokenId,
      from: auction.seller,
      price: auction.startingPrice,
      timestamp: parseInt(auction.startTime) * 1000,
      transactionHash: auction.transactionHash,
    });
    
    // Bids
    auction.bids?.forEach((bid: any) => {
      events.push({
        id: bid.id,
        type: 'bid' as const,
        collectionAddress: auction.nft.collection.id,
        tokenId: auction.nft.tokenId,
        from: bid.bidder,
        price: bid.amount,
        timestamp: parseInt(bid.timestamp) * 1000,
        transactionHash: bid.transactionHash,
      });
    });
    
    return events;
  });
}

const SALES_QUERY = `
  query GetSales($first: Int!, $skip: Int!) {
    sales(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
      id
      nft { collection { id } tokenId }
      seller
      buyer
      price
      priceUSD
      timestamp
      transactionHash
      blockNumber
    }
  }
`;

const LISTINGS_QUERY = `
  query GetListings($first: Int!, $skip: Int!) {
    listings(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc, where: { status: ACTIVE }) {
      id
      nft { collection { id } tokenId }
      seller
      price
      priceUSD
      timestamp
      transactionHash
    }
  }
`;

const AUCTIONS_QUERY = `
  query GetAuctions($first: Int!, $skip: Int!) {
    auctions(first: $first, skip: $skip, orderBy: startTime, orderDirection: desc) {
      id
      nft { collection { id } tokenId }
      seller
      startingPrice
      startTime
      transactionHash
      bids(orderBy: timestamp, orderDirection: desc) {
        id
        bidder
        amount
        timestamp
        transactionHash
      }
    }
  }
`;

export const dynamic = 'force-dynamic';
