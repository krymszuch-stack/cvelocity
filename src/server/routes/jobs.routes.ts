import { Router, Request, Response, NextFunction } from 'express';
import { FetchJdUrlRequest } from '../../types/api';
import { safeFetchHtml, SafeFetchError, type SafeFetchResult } from '../net/safeFetch';
import { urlFetchLimiter } from '../middleware/rateLimiter';
import { extractJobPosting, MIN_USABLE_DESCRIPTION } from '../extract';
import { getCachedExtraction, setCachedExtraction } from '../extract/cache';

export const jobsRouter = Router();

/*
 * Był tu endpoint `GET /api/jobs` serwujący pięć ofert wpisanych na sztywno
 * w kod — z nazwami firm, widełkami i stackiem, których nikt nigdy nie wystawił —
 * wraz z filtrami po portalach (Pracuj.pl, LinkedIn), które sugerowały
 * wyszukiwanie na żywo. Interfejs ostrzegał, że to dane demonstracyjne, ale
 * wymyślone oferty w działającej trasie zostają wymyślonymi ofertami.
 *
 * Plan rozstrzygnął kierunek: nie budujemy agregatora cudzych ogłoszeń (prawo
 * sui generis do bazy danych, ToS portali), tylko najlepszy parser pojedynczej
 * oferty na wyraźne żądanie użytkownika. Miejsce zakładki zajęło „wypróbuj na
 * przykładzie" — jawnie oznaczone przykładowe ogłoszenie do wklejenia.
 */

/**
 * POST /api/fetch-jd-url
 *
 * Pobiera ogłoszenie wskazane przez użytkownika i zwraca **wyłącznie
 * wyekstrahowane pola** — nigdy surowej treści odpowiedzi. Dzięki temu nawet
 * obejście zabezpieczeń w `safeFetch` nie daje atakującemu czytelnych danych.
 */
jobsRouter.post(
  '/fetch-jd-url',
  urlFetchLimiter,
  async (req: Request<unknown, unknown, FetchJdUrlRequest>, res: Response, next: NextFunction) => {
    try {
      const { url } = req.body;
      if (typeof url !== 'string' || url.length === 0 || url.length > 2048) {
        return res.status(400).json({
          success: false,
          error: 'Podaj prawidłowy adres URL ogłoszenia o pracę (http/https).',
        });
      }

      // Ta sama oferta wklejona przez wielu użytkowników pobierana jest raz.
      const cached = getCachedExtraction(url);
      if (cached) {
        return res.json(buildResponse(cached.result, cached.finalUrl, true));
      }

      let fetched: SafeFetchResult;
      try {
        fetched = await safeFetchHtml(url);
      } catch (err) {
        if (err instanceof SafeFetchError) {
          // Mapujemy błąd na status, na który interfejs potrafi zareagować.
          const status =
            err.code === 'BOT_PROTECTED' || err.code === 'ROBOTS_DISALLOWED'
              ? 403
              : err.code === 'INVALID_URL' || err.code === 'BLOCKED_TARGET'
                ? 400
                : err.code === 'TOO_LARGE' || err.code === 'BAD_CONTENT_TYPE'
                  ? 422
                  : 502;

          return res.status(status).json({
            success: false,
            // Oba przypadki kończą się dla użytkownika tak samo: treść trzeba
            // wkleić ręcznie. Nie obchodzimy ani ochrony botów, ani robots.txt.
            requiresManualPaste: err.code === 'BOT_PROTECTED' || err.code === 'ROBOTS_DISALLOWED',
            error: err.message,
          });
        }
        throw err;
      }

      const extraction = extractJobPosting(fetched.html);

      if (extraction.job.description.length < MIN_USABLE_DESCRIPTION) {
        return res.status(422).json({
          success: false,
          requiresManualPaste: true,
          error:
            'Pobrano stronę, ale nie udało się z niej odczytać treści ogłoszenia. Wklej treść oferty ręcznie.',
        });
      }

      setCachedExtraction(url, extraction, fetched.finalUrl);
      res.json(buildResponse(extraction, fetched.finalUrl, false));
    } catch (err) {
      next(err);
    }
  }
);

function buildResponse(
  extraction: ReturnType<typeof extractJobPosting>,
  finalUrl: string,
  fromCache: boolean
) {
  const { job, tier, structured } = extraction;

  return {
    success: true,
    title: job.title,
    company: job.company,
    descriptionRaw: job.description,
    location: job.location,
    remote: job.remote,
    employmentType: job.employmentType,
    salary: job.salary,
    seniority: job.seniority,
    skills: job.skills,
    benefits: job.benefits,
    sourceUrl: finalUrl,
    // `structured: true` mówi interfejsowi, że tytuł, firma i widełki pochodzą
    // z danych strukturalnych strony, więc nie ma po co pytać o nie modelu.
    extraction: { tier, structured, fromCache },
  };
}
