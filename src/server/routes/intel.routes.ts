import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { createRateLimiter } from '../middleware/rateLimiter';
import { loadConfig } from '../config';
import { getSupabase } from '../supabase';

export const intelRouter = Router();

/**
 * Wiedza zbiorowa o pracodawcach i rekrutacjach.
 *
 * Każde wklejone ogłoszenie i każde potwierdzone pytanie z rozmowy dokłada
 * cegiełkę do wspólnego korpusu. Zapis jest **anonimowy z konstrukcji**: trasa
 * nie ma `requireAuth` i nie zapisuje `user_id`, więc z bazy nie da się
 * odtworzyć, kto gdzie aplikował — nawet mając do niej pełny dostęp. To nie
 * jest niedopatrzenie, tylko cała ochrona tego mechanizmu.
 *
 * Co nie trafia do bazy: treść CV, dane osobowe, notatki użytkownika. Wyłącznie
 * metadane ogłoszenia, które i tak było publiczne.
 */

/** Ostrzejszy limit niż domyślny: to jest zapis do wspólnego korpusu. */
const intelLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Za dużo zgłoszeń do bazy wiedzy naraz. Spróbuj ponownie za chwilę.',
});

const jobInsightSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  jobTitle: z.string().trim().min(2).max(160),
  requiredSkills: z.array(z.string().trim().min(1).max(80)).max(60).default([]),
  interviewQuestions: z.array(z.string().trim().min(3).max(400)).max(40).default([]),
  salaryRangeMin: z.number().nonnegative().max(100_000_000).nullable().optional(),
  salaryRangeMax: z.number().nonnegative().max(100_000_000).nullable().optional(),
  sourceUrl: z.string().url().max(2000).nullable().optional(),
  industry: z.string().trim().max(120).nullable().optional(),
});

type JobInsight = z.infer<typeof jobInsightSchema>;

/** `example.com` z pełnego adresu; `null`, gdy adresu nie było albo jest zły. */
function domainFrom(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

intelRouter.post(
  '/intel/job',
  intelLimiter,
  validateBody(jobInsightSchema),
  async (req: Request<unknown, unknown, JobInsight>, res: Response, next: NextFunction) => {
    try {
      // Bez bazy nie ma czego zasilać. 501, a nie ciche 200 — klient ma prawo
      // wiedzieć, że nic się nie zapisało (reguła 1: żadnych udawanych sukcesów).
      if (!loadConfig().backendEnabled) {
        return res.status(501).json({
          success: false,
          error: 'Ta instalacja działa lokalnie i nie prowadzi wspólnej bazy wiedzy.',
        });
      }

      const body = req.body;
      const supabase = getSupabase();

      // Firma: jeden wiersz na nazwę. `onConflict` na indeksie po `lower(name)`
      // nie zadziała, więc unikalność pilnuje indeks, a tu wystarczy odświeżyć
      // `last_seen_at`, gdy wiersz już jest.
      const { data: existing } = await supabase
        .from('crowdsourced_companies')
        .select('id')
        .ilike('company_name', body.companyName)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('crowdsourced_companies')
          .update({ last_seen_at: new Date().toISOString(), industry: body.industry ?? undefined })
          .eq('id', existing.id);
      } else {
        await supabase.from('crowdsourced_companies').insert({
          company_name: body.companyName,
          normalized_domain: domainFrom(body.sourceUrl),
          industry: body.industry ?? null,
        });
      }

      const { error } = await supabase.from('crowdsourced_job_insights').insert({
        company_name: body.companyName,
        job_title: body.jobTitle,
        required_skills: body.requiredSkills,
        interview_questions: body.interviewQuestions,
        salary_range_min: body.salaryRangeMin ?? null,
        salary_range_max: body.salaryRangeMax ?? null,
        source_url: body.sourceUrl ?? null,
      });

      if (error) throw new Error(`Nie udało się dopisać do bazy wiedzy: ${error.message}`);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/intel/company?name=...
 *
 * Odczyt tego, co zebrali inni. Publiczny, bo taka jest umowa: kto dokłada,
 * ten korzysta — i odwrotnie.
 */
intelRouter.get('/intel/company', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!loadConfig().backendEnabled) {
      return res.status(501).json({
        success: false,
        error: 'Ta instalacja działa lokalnie i nie prowadzi wspólnej bazy wiedzy.',
      });
    }

    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (name.length < 2) {
      return res.status(400).json({ success: false, error: 'Podaj nazwę firmy.' });
    }

    const { data, error } = await getSupabase()
      .from('crowdsourced_job_insights')
      .select('job_title, required_skills, interview_questions, salary_range_min, salary_range_max, created_at')
      .ilike('company_name', name)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(`Nie udało się odczytać bazy wiedzy: ${error.message}`);

    res.json({ success: true, insights: data ?? [] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/intel/application-feedback
 *
 * Ankieta „udało się zaaplikować?" pokazywana po eksporcie dokumentu.
 * Anonimowa dokładnie tak samo jak reszta tej trasy: bez `requireAuth`, bez
 * `user_id`. Zapisujemy firmę, stanowisko i odpowiedź z zamkniętej listy —
 * czyli to, co pozwala policzyć, ile ofert kończy się realną wysyłką i gdzie
 * portale psują proces. Nic z tego nie wskazuje na konkretną osobę.
 */
const applicationFeedbackSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  jobTitle: z.string().trim().min(2).max(160),
  appliedSuccessfully: z.boolean(),
  // Zamknięte listy, nie wolny tekst: wolny tekst prędzej czy później przyniósł
  // by tu dane osobowe wklejone z notatek.
  applicationChannel: z.enum(['Pracuj.pl', 'LinkedIn', 'Strona kariery firmy', 'Inne']).nullable().optional(),
  salaryTransparency: z.enum(['jawne', 'brak', 'rozbiezne']).nullable().optional(),
  failureReason: z.enum(['formularz', 'format-pliku', 'wygasla', 'rezygnacja']).nullable().optional(),
});

type ApplicationFeedback = z.infer<typeof applicationFeedbackSchema>;

intelRouter.post(
  '/intel/application-feedback',
  intelLimiter,
  validateBody(applicationFeedbackSchema),
  async (req: Request<unknown, unknown, ApplicationFeedback>, res: Response, next: NextFunction) => {
    try {
      if (!loadConfig().backendEnabled) {
        return res.status(501).json({
          success: false,
          error: 'Ta instalacja działa lokalnie i nie prowadzi wspólnej bazy wiedzy.',
        });
      }

      const body = req.body;
      const supabase = getSupabase();

      const { error } = await supabase.from('application_feedbacks').insert({
        company_name: body.companyName,
        job_title: body.jobTitle,
        applied_successfully: body.appliedSuccessfully,
        application_channel: body.applicationChannel ?? null,
        salary_transparency: body.salaryTransparency ?? null,
        failure_reason: body.failureReason ?? null,
      });

      if (error) throw new Error(`Nie udało się zapisać ankiety: ${error.message}`);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
