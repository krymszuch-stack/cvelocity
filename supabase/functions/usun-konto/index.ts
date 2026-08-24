import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Usunięcie konta razem z danymi (RODO art. 17).
 *
 * Odpowiednik `DELETE /api/me` z serwera Express, postawiony jako funkcja
 * brzegowa, bo na produkcji stoi sam frontend na Firebase Hosting i `/api/*`
 * tam nie istnieje. Kolejność i uzasadnienia są celowo takie same jak
 * w `src/server/routes/me.routes.ts` — dwie różne odpowiedzi na to samo
 * pytanie rozjechałyby się przy pierwszej zmianie.
 *
 * **Identyfikator bierzemy wyłącznie z tokenu**, nigdy z ciała żądania.
 * Klucz serwisowy omija RLS, więc `user_id` przysłany przez klienta pozwoliłby
 * skasować cudze konto.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Dozwolone wyłącznie POST.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !serviceKey || !anonKey) return json({ error: 'Braki w konfiguracji.' }, 500);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Wymagane zalogowanie.' }, 401);

  // Klientem `anon` z nagłówkiem wywołującego ustalamy, KTO prosi.
  const jako = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: dane, error: bladUzytkownika } = await jako.auth.getUser();
  if (bladUzytkownika || !dane.user) return json({ error: 'Sesja wygasła.' }, 401);

  const userId = dane.user.id;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Najpierw dane, potem konto. Gdyby konto poszło pierwsze, a sprzątanie
  // zawiodło, zostałyby osierocone wiersze bez możliwości zalogowania się
  // i powtórzenia operacji.
  const { error: bladDanych } = await admin.rpc('delete_user_data', { p_user: userId });
  if (bladDanych) return json({ error: 'Nie udało się usunąć danych.' }, 500);

  const { error: bladKonta } = await admin.auth.admin.deleteUser(userId);
  if (bladKonta) return json({ error: 'Nie udało się usunąć konta.' }, 500);

  return json({ success: true });
});
