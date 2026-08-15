import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[API Error] ${req.method} ${req.path}:`, err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Wystąpił nieoczekiwany błąd podczas przetwarzania żądania.';

  res.status(statusCode).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV !== 'production' ? err.stack || err.details : undefined,
  });
}
