import { NextFunction, Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import {
  applicationInputSchema,
  applicationPatchSchema,
  type ApplicationInput,
} from '../../types/contracts';
import { getSupabase } from '../supabase';

export const applicationsRouter = Router();

/**
 * Historia wysłanych aplikacji.
 *
 * Każde zapytanie filtruje po `user_id` z tokenu. Klient `service_role` omija
 * RLS, więc pominięty filtr oznaczałby wyciek cudzych danych — dlatego jest
 * w każdym z czterech miejsc, również przy UPDATE i DELETE, gdzie kusi, żeby
 * zaufać samemu identyfikatorowi wiersza.
 */

/** Baza używa `snake_case`, interfejs `camelCase`. Tłumaczenie w jednym miejscu. */
interface ApplicationRow {
  id: string;
  company: string;
  position: string;
  salary: string | null;
  applied_at: string | null;
  status: string;
  notes: string | null;
  job_url: string | null;
}

function toClient(row: ApplicationRow) {
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    salary: row.salary ?? '',
    date: row.applied_at ?? '',
    status: row.status,
    notes: row.notes ?? '',
    jobUrl: row.job_url ?? undefined,
  };
}

function toRow(input: Partial<ApplicationInput>) {
  const row: Record<string, unknown> = {};
  if (input.company !== undefined) row.company = input.company;
  if (input.position !== undefined) row.position = input.position;
  if (input.salary !== undefined) row.salary = input.salary;
  if (input.appliedAt !== undefined) row.applied_at = input.appliedAt || null;
  if (input.status !== undefined) row.status = input.status;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.jobUrl !== undefined) row.job_url = input.jobUrl;
  return row;
}

const SELECT = 'id, company, position, salary, applied_at, status, notes, job_url';

applicationsRouter.get(
  '/applications',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await getSupabase()
        .from('applications')
        .select(SELECT)
        .eq('user_id', req.user!.id)
        .order('applied_at', { ascending: false, nullsFirst: false });

      if (error) throw new Error(`Nie udało się odczytać aplikacji: ${error.message}`);

      res.json({ success: true, applications: (data as ApplicationRow[]).map(toClient) });
    } catch (err) {
      next(err);
    }
  }
);

applicationsRouter.post(
  '/applications',
  requireAuth,
  validateBody(applicationInputSchema),
  async (req: Request<unknown, unknown, ApplicationInput>, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await getSupabase()
        .from('applications')
        .insert({ ...toRow(req.body), user_id: req.user!.id })
        .select(SELECT)
        .single();

      if (error) throw new Error(`Nie udało się zapisać aplikacji: ${error.message}`);

      res.status(201).json({ success: true, application: toClient(data as ApplicationRow) });
    } catch (err) {
      next(err);
    }
  }
);

applicationsRouter.patch(
  '/applications/:id',
  requireAuth,
  validateBody(applicationPatchSchema),
  async (
    req: Request<{ id: string }, unknown, Partial<ApplicationInput>>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const changes = toRow(req.body);
      if (Object.keys(changes).length === 0) {
        res.status(400).json({ success: false, error: 'Żądanie nie zawiera żadnych zmian.' });
        return;
      }

      const { data, error } = await getSupabase()
        .from('applications')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .eq('user_id', req.user!.id)
        .select(SELECT)
        .maybeSingle();

      if (error) throw new Error(`Nie udało się zaktualizować aplikacji: ${error.message}`);

      // Brak wiersza znaczy „nie ma takiej aplikacji **u tego użytkownika**".
      // Odróżnianie „nie istnieje" od „istnieje, ale należy do kogoś innego"
      // potwierdzałoby obcemu, że dany identyfikator jest w użyciu.
      if (!data) {
        res.status(404).json({ success: false, error: 'Nie znaleziono takiej aplikacji.' });
        return;
      }

      res.json({ success: true, application: toClient(data as ApplicationRow) });
    } catch (err) {
      next(err);
    }
  }
);

applicationsRouter.delete(
  '/applications/:id',
  requireAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { error } = await getSupabase()
        .from('applications')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user!.id);

      if (error) throw new Error(`Nie udało się usunąć aplikacji: ${error.message}`);

      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);
