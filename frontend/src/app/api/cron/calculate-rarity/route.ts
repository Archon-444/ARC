import { NextRequest, NextResponse } from 'next/server';
import { RarityCache } from '@/lib/rarity/cache';
import type { NFTMetadata } from '@/lib/rarity/calculator';
import { getIPFSUrl } from '@/lib/utils';
import { fetchGraphQL } from '@/lib/graphql-client';

const COLLECTIONS_QUERY = `
  query GetCollections {
    collections(
      first: 100
      orderBy: totalVolume
      orderDirection: desc
      where: { totalSupply_gt: 0 }
    ) {
      id
      name
      totalSupply
    }
  }
`;

const COLLECTION_NFTS_QUERY = `
  query GetNFTs($collection: String!, $skip: Int!, $first: Int!) {
    nfts(
      where: { collection: $collection }
      first: $first
      skip: $skip
      orderBy: tokenId
      orderDirection: asc
    ) {
      tokenId
      tokenURI
    }
  }
`;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collections = await fetchCollections();
    const results: Array<Record<string, unknown>> = [];
    let successCount = 0;
    let failCount = 0;

    for (const collection of collections) {
      try {
        const nfts = await fetchCollectionNFTs(collection.id, Number(collection.totalSupply));
        if (nfts.length === 0) {
          results.push({
            collection: collection.name,
            address: collection.id,
            status: 'skipped',
            reason: 'no_nfts',
          });
          continue;
        }

        await RarityCache.calculateAndCache(collection.id, nfts);

        results.push({
          collection: collection.name,
          address: collection.id,
          nftCount: nfts.length,
          status: 'success',
        });
        successCount += 1;
      } catch (error) {
        results.push({
          collection: collection.name,
          address: collection.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failCount += 1;
      }

      await sleep(1000);
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      message: `Rarity calculation complete: ${successCount} succeeded, ${failCount} failed`,
      duration: `${durationSeconds}s`,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function fetchCollections(): Promise<Array<{ id: string; name: string; totalSupply: number }>> {
  try {
    const data = await fetchGraphQL<{ collections: Array<{ id: string; name: string; totalSupply: string }> }>(
      COLLECTIONS_QUERY
    );
    return (data.collections || []).map((collection) => ({
      id: collection.id,
      name: collection.name,
      totalSupply: Number(collection.totalSupply || 0),
    }));
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return [];
  }
}

async function fetchCollectionNFTs(
  collectionAddress: string,
  totalSupply: number
): Promise<NFTMetadata[]> {
  const allNFTs: Array<{ tokenId: string; tokenURI: string }> = [];
  const batchSize = 1000;
  const maxNFTs = Math.min(totalSupply || 0, 10000);
  let skip = 0;

  while (allNFTs.length < maxNFTs) {
    const data = await fetchGraphQL<{ nfts: Array<{ tokenId: string; tokenURI: string }> }>(
      COLLECTION_NFTS_QUERY,
      { collection: collectionAddress.toLowerCase(), skip, first: batchSize }
    );

    const nfts = data.nfts || [];
    if (nfts.length === 0) break;

    allNFTs.push(...nfts);
    skip += batchSize;
    await sleep(500);
  }

  const metadataResults: NFTMetadata[] = [];
  const metadataBatchSize = 50;

  for (let i = 0; i < allNFTs.length; i += metadataBatchSize) {
    const batch = allNFTs.slice(i, i + metadataBatchSize);
    const batchResults = await Promise.allSettled(
      batch.map((nft) => fetchNFTMetadata(nft.tokenURI, nft.tokenId))
    );

    const successful = batchResults
      .filter((r): r is PromiseFulfilledResult<NFTMetadata> => r.status === 'fulfilled')
      .map((r) => r.value);

    metadataResults.push(...successful);
    await sleep(200);
  }

  return metadataResults.filter((nft) => nft.attributes && nft.attributes.length > 0);
}

async function fetchNFTMetadata(tokenURI: string, tokenId: string): Promise<NFTMetadata> {
  if (!tokenURI) {
    return { tokenId, name: `#${tokenId}`, attributes: [] };
  }

  if (tokenURI.startsWith('data:application/json;base64,')) {
    try {
      const base64Data = tokenURI.split(',')[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf8');
      const metadata = JSON.parse(jsonString);
      return {
        tokenId,
        name: metadata.name,
        image: metadata.image,
        attributes: metadata.attributes || [],
      };
    } catch {
      return { tokenId, name: `#${tokenId}`, attributes: [] };
    }
  }

  const metadataURL = getIPFSUrl(tokenURI);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(metadataURL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const metadata = await response.json();
    return {
      tokenId,
      name: metadata.name,
      image: metadata.image || metadata.image_url,
      attributes: metadata.attributes || [],
    };
  } catch {
    return { tokenId, name: `#${tokenId}`, attributes: [] };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
