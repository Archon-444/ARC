import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

const activityTypes = ['sale', 'listing', 'transfer', 'offer', 'offer_accepted', 'bid', 'cancel_listing'];

/**
 * GET /v1/activity
 * Get activity feed
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { nftId, collectionId, type, limit = 50, offset = 0 } = req.query;

  // Mock activity data
  const activities = Array.from({ length: parseInt(limit as string) }, (_, i) => ({
    id: `activity-${i}`,
    type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
    nftId: nftId || `nft-${i}`,
    from: {
      address: '0x' + Math.random().toString(16).substring(2, 42),
      username: `user${i}`,
    },
    to: {
      address: '0x' + Math.random().toString(16).substring(2, 42),
      username: `user${i + 1}`,
    },
    price: Math.random() > 0.5 ? (Math.random() * 1000).toFixed(2) : undefined,
    timestamp: Date.now() - i * 60 * 60 * 1000,
    txHash: '0x' + Math.random().toString(16).substring(2),
  }));

  res.json({
    activities,
    hasMore: parseInt(offset as string) + activities.length < 1000,
    total: 1000,
  });
}));

export default router;
