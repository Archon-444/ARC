import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

const UNAVAILABLE = {
  unavailable: true,
  reason: 'Analytics are not indexed yet. This endpoint does not invent metrics.',
};

/**
 * GET /v1/analytics/volume
 */
router.get('/volume', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    data: [],
    summary: null,
    ...UNAVAILABLE,
  });
}));

/**
 * GET /v1/analytics/sales-distribution
 */
router.get('/sales-distribution', asyncHandler(async (_req: Request, res: Response) => {
  res.json([]);
}));

/**
 * GET /v1/analytics/holder-stats
 */
router.get('/holder-stats', asyncHandler(async (_req: Request, res: Response) => {
  res.json([]);
}));

/**
 * GET /v1/analytics/top-sales
 */
router.get('/top-sales', asyncHandler(async (_req: Request, res: Response) => {
  res.json([]);
}));

export default router;
