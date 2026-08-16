import { Router, Request, Response } from 'express';

export const statsRouter = Router();

/**
 * GET /api/usage/stats
 *
 * Real token accounting does not exist yet: `response.usageMetadata` from the
 * Gemini SDK is not read anywhere, so there is nothing to report. This used to
 * return invented constants, which is worse than returning nothing — pricing
 * decisions would rest on numbers that measure no actual usage.
 *
 * Wired up in the phase that adds per-call usage recording.
 */
statsRouter.get('/usage/stats', (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: 'Statystyki zużycia nie są jeszcze dostępne — trwa wdrażanie realnego liczenia tokenów.',
  });
});
