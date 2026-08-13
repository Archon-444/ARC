import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

/**
 * GET /v1/nft/:id
 */
router.get('/:id', asyncHandler(async (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'NFT not found',
    unavailable: true,
    reason: 'This API does not serve fabricated NFT records.',
  });
}));

/**
 * GET /v1/nft/:contractAddress/:tokenId/price-history
 */
router.get('/:contractAddress/:tokenId/price-history', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    data: [],
    stats: null,
    unavailable: true,
    reason: 'Price history is not indexed yet.',
  });
}));

export default router;
