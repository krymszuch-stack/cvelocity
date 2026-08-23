import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { aiEndpointsLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/requireAuth';
import { executeAiOperation } from '../quota';

export const aiRouter = Router();

/**
 * POST /api/parse-jd
 */
aiRouter.post(
  '/parse-jd',
  requireAuth,
  aiEndpointsLimiter,
  async (req: Request<unknown, unknown, { rawJdText?: string }>, res: Response, next: NextFunction) => {
    try {
      const { rawJdText } = req.body;
      if (!rawJdText || typeof rawJdText !== 'string' || rawJdText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Brak treści ogłoszenia o pracę.',
        });
      }

      const userId = req.user!.id;
      // Zakładamy podstawowy tier/plan z req.user lub domyślny
      const tier = 'FREE';

      const parsedJd = await executeAiOperation(
        userId,
        tier,
        'parse-jd',
        async () => {
          const result = await aiService.parseJd(rawJdText);
          return { data: result };
        }
      );

      res.json({ success: true, parsedJd });
    } catch (err) {
      next(err);
    }
  }
);
