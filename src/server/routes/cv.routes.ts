import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { aiEndpointsLimiter } from '../middleware/rateLimiter';

export const cvRouter = Router();

/**
 * POST /api/parse-cv
 */
cvRouter.post('/parse-cv', aiEndpointsLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Brak wymaganego tekstu dokumentu do przetworzenia.',
      });
    }

    const parsedVault = await aiService.parseCv(rawText);
    res.json({
      success: true,
      parsedVault,
      data: parsedVault,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/parse-jd
 */
cvRouter.post('/parse-jd', aiEndpointsLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rawJdText } = req.body;
    if (!rawJdText || typeof rawJdText !== 'string' || rawJdText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Brak treści ogłoszenia o pracę.',
      });
    }

    const parsedJd = await aiService.parseJd(rawJdText);
    res.json({
      success: true,
      parsedJd,
    });
  } catch (err) {
    next(err);
  }
});
