import { NextRequest, NextResponse } from 'next/server';
import { fetchNFTDetails } from '@/lib/graphql-client';
import { getIPFSUrl } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: { collection: string; tokenId: string } }
) {
  try {
    const { collection, tokenId } = params;
    const nft = await fetchNFTDetails(collection, tokenId);

    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }

    const image = nft.image ? getIPFSUrl(nft.image) : undefined;

    return NextResponse.json({
      name: nft.name,
      image,
      attributes: nft.attributes || nft.metadata?.attributes || [],
    });
  } catch (error) {
    console.error('NFT metadata fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
