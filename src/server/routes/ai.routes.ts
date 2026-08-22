import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { aiEndpointsLimiter } from '../middleware/rateLimiter';

export const aiRouter = Router();

// Limiter doklejany per trasa, nie przez aiRouter.use(): montowanie bez ścieżki
// dławi też wszystkie trasy zarejestrowane na późniejszych routerach.

/**
 * POST /api/parse-jd
 *
 * Jedyna trasa AI podpięta do interfejsu (JobMatcher). Pozostałe endpointy
 * (`delta-optimize`, `cover-letter`, `interview-prep`, `parse-cv`) zostały
 * zdjęte z powierzchni publicznej: nie miały ani jednego wywołania z UI, a
 * każde z nich wołało Gemini na koszt właściciela projektu — bez uwierzytelnienia
 * i bez limitu kwot. Na Cloud Run z `--allow-unauthenticated` byłyby otwartym,
 * cudzym kosztem finansowanym proxy do modelu.
 *
 * Implementacje w `gemini.ts` i `ai.service.ts` zostają nietknięte, więc
 * przywrócenie każdej z tych tras w Fazie 6 — już za `requireAuth` i licznikiem
 * kwot — to dopisanie handlera, a nie pisanie funkcji od nowa.
 */
aiRouter.post(
  '/parse-jd',
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

      const parsedJd = await aiService.parseJd(rawJdText);
      res.json({ success: true, parsedJd });
    } catch (err) {
      next(err);
    }
  }
);
