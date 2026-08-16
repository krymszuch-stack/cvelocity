import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { aiEndpointsLimiter } from '../middleware/rateLimiter';
import {
  DeltaOptimizeRequest,
  CoverLetterRequest,
  InterviewPrepRequest,
} from '../../types/api';

export const aiRouter = Router();

// Applied per-route, not via aiRouter.use(): a path-less mount also throttles
// every route registered on later routers in the chain.

/**
 * POST /api/delta-optimize
 */
aiRouter.post(
  '/delta-optimize',
  aiEndpointsLimiter,
  async (req: Request<{}, {}, DeltaOptimizeRequest>, res: Response, next: NextFunction) => {
    try {
      const { originalBullet, targetRole, keywords = [] } = req.body;
      if (!originalBullet || typeof originalBullet !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Brak wymaganego tekstu punktora do optymalizacji.',
        });
      }

      const result = await aiService.optimizeDeltaPhrase(originalBullet, targetRole, keywords);
      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/cover-letter
 */
aiRouter.post(
  '/cover-letter',
  aiEndpointsLimiter,
  async (req: Request<{}, {}, CoverLetterRequest>, res: Response, next: NextFunction) => {
    try {
      const { targetRole, companyName, jobDescription, vault } = req.body;
      if (!vault || !targetRole) {
        return res.status(400).json({
          success: false,
          error: 'Brak wymaganych danych MasterVault lub tytułu stanowiska.',
        });
      }

      const result = await aiService.generateCoverLetter(
        targetRole,
        companyName || 'Państwa Firmie',
        jobDescription || '',
        vault
      );

      res.json({
        success: true,
        coverLetter: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/interview-prep
 */
aiRouter.post(
  '/interview-prep',
  aiEndpointsLimiter,
  async (req: Request<{}, {}, InterviewPrepRequest>, res: Response, next: NextFunction) => {
    try {
      const { targetRole, companyName, jobDescription, vault } = req.body;
      if (!vault) {
        return res.status(400).json({
          success: false,
          error: 'Brak profilu MasterVault do wygenerowania ściągi rekrutacyjnej.',
        });
      }

      const prep = await aiService.generateInterviewPrep(
        targetRole || 'Inżynier Oprogramowania',
        companyName || 'Firma Partnerska',
        jobDescription || '',
        vault
      );

      res.json({
        success: true,
        data: prep,
      });
    } catch (err) {
      next(err);
    }
  }
);
