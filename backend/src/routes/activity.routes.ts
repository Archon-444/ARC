import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';
import { broadcastTokenActivity } from '../websocket';

const router = Router();

function requireBroadcastSecret(req: Request, res: Response): boolean {
  const expected = process.env.TOKEN_BROADCAST_SECRET;
  if (!expected) {
    res.status(503).json({ error: 'TOKEN_BROADCAST_SECRET is not configured' });
    return false;
  }
  const provided = req.header('x-broadcast-secret');
  if (provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

/**
 * GET /v1/activity
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    activities: [],
    hasMore: false,
    total: 0,
    unavailable: true,
    reason: 'Activity is not indexed yet. This endpoint does not invent events.',
  });
}));

/**
 * GET /v1/activity/token/:address
 * Recent activity for a launched token (trades, graduation).
 */
router.get('/token/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  res.json({
    activities: [],
    tokenAddress: address,
    unavailable: true,
    reason: 'Token activity is not indexed yet. Use on-chain events or the subgraph.',
  });
}));

/**
 * POST /v1/activity/token/broadcast
 * Internal: push a token activity event to WebSocket subscribers (token room).
 * Requires TOKEN_BROADCAST_SECRET via x-broadcast-secret.
 */
router.post('/token/broadcast', asyncHandler(async (req: Request, res: Response) => {
  if (!requireBroadcastSecret(req, res)) return;

  const { tokenAddress, type, ...rest } = req.body || {};
  if (!tokenAddress || typeof tokenAddress !== 'string') {
    res.status(400).json({ error: 'tokenAddress required' });
    return;
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    res.status(400).json({ error: 'invalid tokenAddress' });
    return;
  }
  broadcastTokenActivity(tokenAddress, { type: type || 'buy', tokenAddress, ...rest });
  res.json({ ok: true, room: `token:${tokenAddress.toLowerCase()}` });
}));

export default router;
