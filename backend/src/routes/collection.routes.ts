import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

const mockCollection = {
  id: 'collection-1',
  name: 'Cool Collection',
  slug: 'cool-collection',
  description: 'A collection of cool NFTs',
  image: 'https://via.placeholder.com/300',
  banner: 'https://via.placeholder.com/1500x400',
  verified: true,
  creator: 'Creator Name',
  creatorAddress: '0x1234567890123456789012345678901234567890',
  stats: {
    floorPrice: '50',
    totalVolume: '1000000',
    owners: 500,
    items: 1000,
    listed: 150,
    royalty: 5,
    change24h: {
      floorPrice: 5.2,
      volume: 12.5,
      sales: 25,
    },
  },
  socials: {
    twitter: 'https://twitter.com/coolcollection',
    discord: 'https://discord.gg/coolcollection',
    website: 'https://coolcollection.io',
  },
};

/**
 * GET /v1/collection/:slug
 * Get collection details
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  res.json({ ...mockCollection, slug });
}));

/**
 * GET /v1/collection/:slug/nfts
 * Get NFTs in collection
 */
router.get('/:slug/nfts', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { limit = 50, offset = 0, sort = 'recently_listed' } = req.query;

  // Mock NFTs
  const nfts = Array.from({ length: parseInt(limit as string) }, (_, i) => ({
    id: `nft-${parseInt(offset as string) + i}`,
    tokenId: (parseInt(offset as string) + i).toString(),
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    name: `NFT #${parseInt(offset as string) + i}`,
    image: `https://via.placeholder.com/300?text=NFT ${i}`,
    collection: { id: 'collection-1', name: 'Cool Collection', verified: true },
    owner: '0x' + Math.random().toString(16).substring(2, 42),
    price: (Math.random() * 500 + 50).toFixed(2),
    attributes: [
      { trait_type: 'Background', value: 'Blue', rarity: 15 },
      { trait_type: 'Eyes', value: 'Laser', rarity: 2 },
    ],
  }));

  res.json({
    nfts,
    total: 10000,
    hasMore: parseInt(offset as string) + nfts.length < 10000,
  });
}));

/**
 * GET /v1/collection/:slug/stats
 * Get collection statistics
 */
router.get('/:slug/stats', asyncHandler(async (req: Request, res: Response) => {
  res.json(mockCollection.stats);
}));

export default router;
