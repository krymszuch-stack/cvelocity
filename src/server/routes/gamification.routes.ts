import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { getSupabase } from '../supabase';

export const gamificationRouter = Router();

/**
 * Kopia stanu gamifikacji na koncie.
 *
 * Źródłem prawdy jest schowek przeglądarki — w trybie `local` konta nie ma
 * wcale, a punkty mają się liczyć także tam. Ta trasa istnieje po to, żeby
 * poziom przeżył zmianę urządzenia, i nie robi nic ponadto.
 *
 * Punktów nie przyznaje serwer, tylko klient. To znaczy, że wynik da się
 * podrobić — i jest to świadoma decyzja: nie ma rankingu ani nagrody, więc
 * jedyną osobą, którą oszuka podbity licznik, jest jego właściciel. Gdyby
 * kiedykolwiek pojawiła się tablica wyników, XP musi zacząć naliczać serwer
 * przy tych samych zdarzeniach, bo inaczej tablica będzie fikcją.
 */

const gamificationPayloadSchema = z.object({
  xp: z.number().int().min(0).max(10_000_000),
  counters: z.record(z.string(), z.number().int().min(0)).default({}),
  achievements: z.array(z.string().max(64)).max(200).default([]),
});

type GamificationPayload = z.infer<typeof gamificationPayloadSchema>;

gamificationRouter.get(
  '/gamification',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await getSupabase()
        .from('user_gamification')
        .select('xp, counters, achievements, updated_at')
        .eq('user_id', req.user!.id)
        .maybeSingle();

      if (error) throw new Error(`Nie udało się odczytać postępu: ${error.message}`);

      // Brak wiersza to normalny stan nowego konta, nie błąd.
      res.json({ success: true, gamification: data ?? null });
    } catch (err) {
      next(err);
    }
  }
);

gamificationRouter.put(
  '/gamification',
  requireAuth,
  validateBody(gamificationPayloadSchema),
  async (req: Request<unknown, unknown, GamificationPayload>, res: Response, next: NextFunction) => {
    try {
      const { xp, counters, achievements } = req.body;

      // `user_id` z tokenu, nigdy z ciała żądania — klient `service_role` omija
      // RLS, więc pole z żądania pozwoliłoby nadpisać cudzy wiersz.
      const { error } = await getSupabase().from('user_gamification').upsert(
        {
          user_id: req.user!.id,
          xp,
          counters,
          achievements,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw new Error(`Nie udało się zapisać postępu: ${error.message}`);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
