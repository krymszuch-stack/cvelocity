import { Router, Request, Response } from 'express';
import { UsageStatsResponse } from '../../types/api';

export const statsRouter = Router();

/**
 * GET /api/usage/stats
 */
statsRouter.get('/usage/stats', (req: Request, res: Response) => {
  const stats: UsageStatsResponse = {
    totalTokensSaved: 16840,
    estimatedCostSavedUSD: 0.00252,
    localSlotHits: 34,
    cacheHits: 16,
    geminiDeltaCalls: 5,
  };

  res.json({
    success: true,
    stats,
  });
});
