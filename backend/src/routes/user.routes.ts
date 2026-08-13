import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

/**
 * GET /v1/user/:address
 */
router.get('/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  res.json({
    address,
    username: null,
    bio: null,
    avatar: null,
    banner: null,
    verified: false,
    social: {},
    stats: {
      owned: 0,
      created: 0,
      favorited: 0,
      volumeTraded: '0',
    },
    unavailable: true,
    reason: 'User profiles are not indexed yet. Stats are not invented.',
  });
}));

export default router;
