import { Router } from 'express';
import { clientErrorBatchSchema } from '../../types/contracts';
import { recordClientErrors } from '../errorStore';
import { errorReportsLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';

export const errorsRouter = Router();

/**
 * Przyjmowanie zanonimizowanych zgłoszeń błędów klienta.
 *
 * Celowo bez `requireAuth`: zgłaszany bywa właśnie crash interfejsu, a więc
 * stan, w którym sesja może być rozjechana — wymaganie tokenu odcięłoby
 * raportowanie dokładnie tych awarii, które najbardziej warto widzieć. Rolę
 * granicy pełnią: twardy schemat (`strictObject` odrzuca pola poza kontraktem,
 * więc nie da się przemycić danych osobowych obok sanityzera), dedykowany
 * limiter per IP i agregacja po fingerprintach w magazynie.
 */
errorsRouter.post(
  '/errors',
  errorReportsLimiter,
  validateBody(clientErrorBatchSchema),
  async (req, res, next) => {
    try {
      const result = await recordClientErrors(req.body.events);
      res.json({ success: true, mode: result.mode });
    } catch (error) {
      next(error);
    }
  }
);
