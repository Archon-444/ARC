import { NextRequest, NextResponse } from 'next/server';
import { fetchNFTDetails } from '@/lib/graphql-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string; tokenId: string } }
) {
  try {
    const { collection, tokenId } = params;
    const searchParams = new URL(request.url).searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || 5), 20);

    const nft = await fetchNFTDetails(collection, tokenId);
    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }

    const sales = (nft.sales || [])
      .map((sale: any) => ({
        id: sale.id,
        price: sale.price,
        timestamp: Number(sale.timestamp || sale.createdAt || 0),
      }))
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Price history error:', error);
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 });
  }
}
