import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs?: number; // default 1 minute (60,000ms)
  maxRequests?: number; // default 60 requests per window
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 60;
  const message = options.message || 'Przekroczono limit zapytań do API. Spróbuj ponownie za chwilę.';

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const record = ipRequestMap.get(ip);

    if (!record || now > record.resetTime) {
      ipRequestMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterMs: record.resetTime - now,
      });
    }

    record.count += 1;
    next();
  };
}

// Pre-configured rate limiters
export const standardApiLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 120 });
export const aiEndpointsLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Zbyt częste wywołania modeli AI. Ograniczono częstotliwość zapytań.',
});
