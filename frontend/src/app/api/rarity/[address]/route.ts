import { NextRequest, NextResponse } from 'next/server';
import { RarityCache } from '@/lib/rarity/cache';
import type { NFTMetadata } from '@/lib/rarity/calculator';
import { fetchGraphQL } from '@/lib/graphql-client';
import { getIPFSUrl } from '@/lib/utils';

const COLLECTION_NFTS_QUERY = `
  query CollectionNFTs($id: ID!, $first: Int!, $skip: Int!) {
    collection(id: $id) {
      id
      nfts(first: $first, skip: $skip) {
        tokenId
        tokenURI
      }
    }
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    if (!address) {
      return NextResponse.json(
        { error: 'Collection address required' },
        { status: 400 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || 500), 1000);

    const nfts = await fetchCollectionNFTs(address, limit);
    if (!nfts || nfts.length === 0) {
      return NextResponse.json(
        { error: 'No NFTs found in collection' },
        { status: 404 }
      );
    }

    const rarityData = await RarityCache.getOrCalculate(address, nfts);

    return NextResponse.json({
      success: true,
      collectionAddress: address,
      collectionSize: rarityData.length,
      rarityData,
    });
  } catch (error) {
    console.error('Rarity calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate rarity' },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    await RarityCache.invalidate(address);
    return NextResponse.json({
      success: true,
      message: `Cache invalidated for ${address}`,
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}

async function fetchCollectionNFTs(address: string, limit: number): Promise<NFTMetadata[]> {
  const data = await fetchGraphQL<{ collection: { nfts: { tokenId: string; tokenURI: string }[] } }>(
    COLLECTION_NFTS_QUERY,
    {
      id: address.toLowerCase(),
      first: limit,
      skip: 0,
    }
  );

  const nfts = data.collection?.nfts || [];
  const metadataList: NFTMetadata[] = [];

  const batchSize = 20;
  for (let i = 0; i < nfts.length; i += batchSize) {
    const batch = nfts.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (nft) => {
        const metadata = await fetchNFTMetadata(nft.tokenURI);
        return {
          tokenId: nft.tokenId,
          name: metadata?.name,
          image: metadata?.image,
          attributes: metadata?.attributes || [],
        } as NFTMetadata;
      })
    );
    metadataList.push(...results);
  }

  return metadataList.filter((item) => item.attributes && item.attributes.length > 0);
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
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { gql } from 'graphql-request';
import { fetchGraphQL } from '@/lib/graphql-client';
import { RarityCache } from '@/lib/rarity/cache';
import { NFTMetadata } from '@/lib/rarity/calculator';
import { getIPFSUrl } from '@/lib/utils';

const GET_COLLECTION_NFTS = gql`
  query GetCollectionNFTs($id: ID!, $first: Int = 1000, $skip: Int = 0) {
    collection(id: $id) {
      id
      nfts(first: $first, skip: $skip) {
        tokenId
        tokenURI
      }
    }
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    if (!address) {
      return NextResponse.json(
        { error: 'Collection address required' },
        { status: 400 }
      );
    }

    const nfts = await fetchCollectionNFTs(address);
    if (!nfts.length) {
      return NextResponse.json({ error: 'No NFTs found' }, { status: 404 });
    }

    const rarityData = await RarityCache.getOrCalculate(address, nfts);

    return NextResponse.json({
      success: true,
      collectionAddress: address,
      collectionSize: rarityData.length,
      rarityData,
    });
  } catch (error) {
    console.error('Rarity calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate rarity' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    if (!address) {
      return NextResponse.json(
        { error: 'Collection address required' },
        { status: 400 }
      );
    }
    await RarityCache.invalidate(address);

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for ${address}`,
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}

async function fetchCollectionNFTs(address: string): Promise<NFTMetadata[]> {
  const data = await fetchGraphQL<{
    collection: { nfts: Array<{ tokenId: string; tokenURI: string }> } | null;
  }>(GET_COLLECTION_NFTS, { id: address.toLowerCase() });

  const nfts = data.collection?.nfts ?? [];

  const metadataList: NFTMetadata[] = [];
  for (const nft of nfts) {
    if (!nft.tokenURI) continue;
    try {
      const response = await fetch(getIPFSUrl(nft.tokenURI), { next: { revalidate: 3600 } });
      if (!response.ok) continue;
      const metadata = await response.json();
      if (!metadata?.attributes) continue;
      metadataList.push({
        tokenId: nft.tokenId,
        name: metadata.name,
        image: metadata.image,
        attributes: metadata.attributes,
      });
    } catch (error) {
      console.warn('Failed to fetch metadata', nft.tokenId, error);
    }
  }

  return metadataList;
}
