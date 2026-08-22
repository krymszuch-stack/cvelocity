import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadConfig } from './config';

/**
 * Klient bazy działający na kluczu `service_role`.
 *
 * ⚠️ Ten klucz **omija wszystkie polityki RLS**. Jest to zamierzone i konieczne:
 * webhook Stripe'a musi zapisać `subscriptions`, do której użytkownik nie ma
 * prawa zapisu — na tym polega cała ochrona statusu subskrypcji. Cena tej mocy
 * jest taka, że każde zapytanie wykonane tym klientem musi samo ograniczyć się
 * do właściwego `user_id`; baza już tego nie sprawdzi.
 *
 * Stąd konwencja: identyfikator użytkownika bierze się wyłącznie z `req.user.id`
 * ustawionego przez `requireAuth` (czyli z podpisanego tokenu), nigdy z ciała
 * żądania ani z parametru ścieżki.
 *
 * Klucz nigdy nie może dostać prefiksu `VITE_` — trafiłby wtedy do pakietu
 * przeglądarki, a wraz z nim pełny dostęp do bazy dla każdego odwiedzającego.
 */

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const config = loadConfig();

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    // Nie powinno się zdarzyć: `loadConfig()` przerywa start przy
    // BACKEND_MODE=cloud bez tych kluczy. Zostaje jako bezpiecznik na wypadek
    // wywołania z trybu `local`, gdzie ta ścieżka nie ma prawa się wykonać.
    throw new Error('Klient Supabase wymaga SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY.');
  }

  cached = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      // Proces serwera nie ma "sesji użytkownika" ani miejsca, w którym miałby
      // ją trzymać. Każde żądanie przynosi własny token.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}

/** Wyłącznie na potrzeby testów — produkcja tworzy klienta raz. */
export function resetSupabaseClient(): void {
  cached = null;
}
