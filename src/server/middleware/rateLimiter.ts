import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs?: number; // default 1 minute
  maxRequests?: number; // default 60 per window
  message?: string;
}

/** Drop expired records so the map cannot grow without bound. */
function evictExpired(store: Map<string, RateLimitRecord>, now: number): void {
  for (const [key, record] of store) {
    if (now > record.resetTime) store.delete(key);
  }
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 60;
  const message =
    options.message || 'Przekroczono limit zapytań do API. Spróbuj ponownie za chwilę.';

  // Each limiter owns its counters. A shared module-level map would make every
  // limiter increment the same record, so the lowest cap would silently apply
  // to all of them and each request through two limiters would count twice.
  const store = new Map<string, RateLimitRecord>();
  let requestsSinceSweep = 0;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    if (++requestsSinceSweep >= 500) {
      requestsSinceSweep = 0;
      evictExpired(store, now);
    }

    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterMs = record.resetTime - now;
      res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000));
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterMs,
      });
    }

    record.count += 1;
    next();
  };
}

/** Broad limit for every /api route. */
export const standardApiLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 120 });

/**
 * Tighter limit for routes that spend money on model calls. Apply per-route —
 * mounting it on a router throttles everything mounted after it too.
 */
export const aiEndpointsLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Zbyt częste wywołania modeli AI. Ograniczono częstotliwość zapytań.',
});

/** Network fetches on behalf of a user are slow and abusable — keep them scarce. */
export const urlFetchLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 30,
  message: 'Przekroczono limit pobierania ofert z adresu URL. Spróbuj ponownie za godzinę.',
});
