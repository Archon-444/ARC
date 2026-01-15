import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

/**
 * GET /v1/user/:address
 * Get user profile
 */
router.get('/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  // Mock user data
  const user = {
    address,
    username: `user_${address.slice(2, 8)}`,
    bio: 'NFT collector and enthusiast',
    avatar: 'https://via.placeholder.com/150',
    banner: 'https://via.placeholder.com/1500x400',
    verified: Math.random() > 0.7,
    social: {
      twitter: 'https://twitter.com/nftuser',
      discord: 'nftuser#1234',
      website: 'https://nftuser.io',
    },
    stats: {
      owned: Math.floor(Math.random() * 100 + 10),
      created: Math.floor(Math.random() * 50),
      favorited: Math.floor(Math.random() * 200 + 20),
      volumeTraded: (Math.random() * 100000 + 10000).toFixed(2),
    },
  };

  res.json(user);
}));

export default router;
