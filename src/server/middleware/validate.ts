import { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

/**
 * Waliduje ciało żądania i podmienia je na wartość po parsowaniu, więc trasa
 * dostaje dane już przycięte i o właściwym typie.
 *
 * Komunikaty `zod` idą do klienta świadomie: opisują wyłącznie kształt tego, co
 * sam przysłał ("url: String must contain at most 2048 character(s)"), i nie
 * mówią nic o wnętrzu systemu. To jest ta sama granica co `expose: true`
 * w `errorHandler` — bezpieczne 4xx wraca z treścią, 5xx nigdy.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join('; ');

      res.status(400).json({ success: false, error: `Nieprawidłowe dane żądania. ${details}` });
      return;
    }

    req.body = result.data;
    next();
  };
}
