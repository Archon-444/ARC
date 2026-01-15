import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

/**
 * POST /v1/search/autocomplete
 * Search autocomplete
 */
router.post('/autocomplete', asyncHandler(async (req: Request, res: Response) => {
  const { query, types = ['nft', 'collection', 'user'], limit = 10 } = req.body;

  // Mock search results
  const results = {
    nfts: types.includes('nft') ? [
      {
        id: 'nft-1',
        name: `${query} NFT #1`,
        image: 'https://via.placeholder.com/100',
        collectionName: 'Cool Collection',
        price: '100',
      },
      {
        id: 'nft-2',
        name: `${query} NFT #2`,
        image: 'https://via.placeholder.com/100',
        collectionName: 'Cool Collection',
        price: '150',
      },
    ] : [],
    collections: types.includes('collection') ? [
      {
        id: 'collection-1',
        name: `${query} Collection`,
        image: 'https://via.placeholder.com/100',
        verified: true,
        floorPrice: '50',
      },
    ] : [],
    users: types.includes('user') ? [
      {
        address: '0x1234567890123456789012345678901234567890',
        username: `${query}_user`,
        avatar: 'https://via.placeholder.com/50',
        verified: false,
      },
    ] : [],
  };

  res.json(results);
}));

export default router;
