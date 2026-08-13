import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

/**
 * GET /v1/collection/:slug
 */
router.get('/:slug', asyncHandler(async (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Collection not found',
    unavailable: true,
    reason: 'This API does not serve fabricated collection records.',
  });
}));

/**
 * GET /v1/collection/:slug/nfts
 */
router.get('/:slug/nfts', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    nfts: [],
    total: 0,
    hasMore: false,
    unavailable: true,
  });
}));

/**
 * GET /v1/collection/:slug/stats
 */
router.get('/:slug/stats', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    floorPrice: null,
    totalVolume: null,
    owners: 0,
    items: 0,
    listed: 0,
    royalty: null,
    unavailable: true,
    reason: 'Collection stats are not indexed yet.',
  });
}));

export default router;
