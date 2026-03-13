import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';
import { broadcastTokenActivity } from '../websocket';

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

/**
 * GET /v1/activity/token/:address
 * Recent activity for a launched token (trades, graduation).
 * Used by token page and discovery for momentum; real data can be wired from subgraph.
 */
router.get('/token/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { limit = 30 } = req.query;

  const activities = Array.from({ length: Math.min(parseInt(limit as string) || 30, 50) }, (_, i) => ({
    id: `token-activity-${address}-${i}`,
    type: i % 3 === 0 ? 'buy' : i % 3 === 1 ? 'sell' : 'graduation',
    tokenAddress: address,
    from: { address: '0x' + Math.random().toString(16).substring(2, 42) },
    to: { address: '0x' + Math.random().toString(16).substring(2, 42) },
    amount: (Math.random() * 1000).toFixed(2),
    timestamp: Date.now() - i * 60 * 1000,
    txHash: '0x' + Math.random().toString(16).substring(2),
  }));

  res.json({
    activities,
    tokenAddress: address,
  });
}));

/**
 * POST /v1/activity/token/broadcast
 * Internal: push a token activity event to WebSocket subscribers (token room).
 * Call from indexer, cron, or chain listener when a trade/graduation occurs.
 * Body: { tokenAddress: string, type: 'buy' | 'sell' | 'graduation', ... }
 */
router.post('/token/broadcast', asyncHandler(async (req: Request, res: Response) => {
  const { tokenAddress, type, ...rest } = req.body || {};
  if (!tokenAddress || typeof tokenAddress !== 'string') {
    res.status(400).json({ error: 'tokenAddress required' });
    return;
  }
  broadcastTokenActivity(tokenAddress, { type: type || 'buy', tokenAddress, ...rest });
  res.json({ ok: true, room: `token:${tokenAddress.toLowerCase()}` });
}));

export default router;
