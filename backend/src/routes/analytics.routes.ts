import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Request, Response } from 'express';

const router = Router();

/**
 * GET /v1/analytics/volume
 * Get volume data
 */
router.get('/volume', asyncHandler(async (req: Request, res: Response) => {
  const { period = '30d', collectionId } = req.query;

  // Generate mock volume data
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const data = Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    volume: Math.random() * 100000 + 50000,
    sales: Math.floor(Math.random() * 100 + 20),
    avgPrice: Math.random() * 500 + 100,
  }));

  res.json({
    data,
    summary: {
      totalVolume: data.reduce((sum, d) => sum + d.volume, 0).toFixed(2),
      totalSales: data.reduce((sum, d) => sum + d.sales, 0),
      avgPrice: (data.reduce((sum, d) => sum + d.avgPrice, 0) / data.length).toFixed(2),
      change24h: (Math.random() * 20 - 10).toFixed(2),
    },
  });
}));

/**
 * GET /v1/analytics/sales-distribution
 * Get sales distribution by price range
 */
router.get('/sales-distribution', asyncHandler(async (req: Request, res: Response) => {
  const distribution = [
    { range: '0-100 USDC', count: 120, percentage: 35 },
    { range: '100-500 USDC', count: 85, percentage: 25 },
    { range: '500-1000 USDC', count: 65, percentage: 19 },
    { range: '1000-5000 USDC', count: 48, percentage: 14 },
    { range: '5000+ USDC', count: 25, percentage: 7 },
  ];

  res.json(distribution);
}));

/**
 * GET /v1/analytics/holder-stats
 * Get holder statistics
 */
router.get('/holder-stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = [
    { range: '1 NFT', holders: 450 },
    { range: '2-5 NFTs', holders: 180 },
    { range: '6-10 NFTs', holders: 65 },
    { range: '11-25 NFTs', holders: 35 },
    { range: '26+ NFTs', holders: 20 },
  ];

  res.json(stats);
}));

/**
 * GET /v1/analytics/top-sales
 * Get top sales
 */
router.get('/top-sales', asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10, collectionId } = req.query;

  const sales = Array.from({ length: parseInt(limit as string) }, (_, i) => ({
    nft: {
      id: `nft-${i}`,
      name: `NFT #${i}`,
      image: `https://via.placeholder.com/100?text=NFT ${i}`,
      collection: { id: 'collection-1', name: 'Cool Collection' },
    },
    price: (Math.random() * 10000 + 1000).toFixed(2),
    buyer: '0x' + Math.random().toString(16).substring(2, 42),
    seller: '0x' + Math.random().toString(16).substring(2, 42),
    timestamp: Date.now() - i * 60 * 60 * 1000,
  }));

  res.json(sales);
}));

export default router;
