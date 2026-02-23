import { NextRequest, NextResponse } from 'next/server';
import { generatePHash, hammingDistance } from '@/lib/phash';

/**
 * In-memory hash store. In production, replace with a persistent store
 * (e.g., Vercel KV, PostgreSQL, or a dedicated table in the subgraph).
 */
const hashStore = new Map<string, { hash: string; collectionAddress: string; tokenId: string; mintedAt: number }>();

const SIMILARITY_THRESHOLD = 10; // Hamming distance <= 10 = likely duplicate
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/nft/check-duplicate
 *
 * Checks if an uploaded NFT image is a near-duplicate of any previously
 * registered image using perceptual hashing (pHash).
 *
 * Body: FormData with 'image' file field
 * Optional query params: collectionAddress, tokenId (for registration)
 *
 * Response:
 * - { isDuplicate: false, hash: "..." } if no match found
 * - { isDuplicate: true, hash: "...", matches: [...] } if duplicates detected
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let imageBuffer: Buffer;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Image exceeds 10 MB limit' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // Accept raw image body for programmatic use
      const body = await request.arrayBuffer();
      if (body.byteLength === 0) {
        return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
      }
      if (body.byteLength > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Image exceeds 10 MB limit' }, { status: 400 });
      }
      imageBuffer = Buffer.from(body);
    }

    // Generate perceptual hash
    const hash = await generatePHash(imageBuffer);

    // Check against all stored hashes
    const matches: Array<{
      collectionAddress: string;
      tokenId: string;
      distance: number;
      mintedAt: number;
    }> = [];

    for (const [, stored] of hashStore) {
      const distance = hammingDistance(hash, stored.hash);
      if (distance <= SIMILARITY_THRESHOLD) {
        matches.push({
          collectionAddress: stored.collectionAddress,
          tokenId: stored.tokenId,
          distance,
          mintedAt: stored.mintedAt,
        });
      }
    }

    // Optionally register this hash
    const searchParams = new URL(request.url).searchParams;
    const collectionAddress = searchParams.get('collection');
    const tokenId = searchParams.get('tokenId');
    const register = searchParams.get('register') === 'true';

    if (register && collectionAddress && tokenId && matches.length === 0) {
      const key = `${collectionAddress.toLowerCase()}-${tokenId}`;
      hashStore.set(key, {
        hash,
        collectionAddress: collectionAddress.toLowerCase(),
        tokenId,
        mintedAt: Date.now(),
      });
    }

    return NextResponse.json({
      isDuplicate: matches.length > 0,
      hash,
      matches: matches.length > 0 ? matches : undefined,
    });
  } catch (error) {
    console.error('Duplicate check error:', error);
    return NextResponse.json(
      { error: 'Failed to process image for duplicate detection' },
      { status: 500 }
    );
  }
}
