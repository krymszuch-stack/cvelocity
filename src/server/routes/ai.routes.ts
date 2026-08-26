import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { aiEndpointsLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/requireAuth';
import { executeAiOperation } from '../quota';
import { MasterVault } from '../../types';

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
      // Limit dobowy wyprowadza `executeAiOperation` ze statusu subskrypcji —
      // wcześniej „FREE” stało tu na sztywno i płacący Pro miał darmowy sufit.
      const parsedJd = await executeAiOperation(
        userId,
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

/**
 * POST /api/generate-cheat-sheet
 *
 * Wzbogaca lokalnie zbudowaną ściągę o część wymagającą modelu. Za
 * `requireAuth` i licznikiem kwot, jak każde inne wywołanie płatne — stara
 * wersja tej trasy stała otworem i nie meldowała zużycia.
 */
aiRouter.post(
  '/generate-cheat-sheet',
  requireAuth,
  aiEndpointsLimiter,
  async (
    req: Request<
      unknown,
      unknown,
      {
        vault?: MasterVault;
        targetRole?: string;
        companyName?: string;
        jobDescription?: string;
        topRequirements?: string[];
      }
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { vault, targetRole, companyName, jobDescription, topRequirements } = req.body;

      if (!vault || typeof vault !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Brak profilu kandydata (MasterVault).',
        });
      }

      const userId = req.user!.id;

      const enrichment = await executeAiOperation(
        userId,
        'generate-cheat-sheet',
        async () => {
          const result = await aiService.generateCheatSheetEnrichment(
            targetRole ?? '',
            companyName ?? '',
            jobDescription ?? '',
            vault,
            Array.isArray(topRequirements) ? topRequirements : []
          );
          return { data: result };
        }
      );

      res.json({ success: true, enrichment });
    } catch (err) {
      next(err);
    }
  }
);
