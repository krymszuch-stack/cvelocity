import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientEnv } from './clientEnv';
import { setAccessTokenProvider } from './apiClient';

/**
 * Klient Supabase po stronie przeglądarki.
 *
 * Działa na kluczu `anon`, który jest publiczny z definicji — chroni go RLS,
 * a nie utajnienie. To jest ta różnica, przez którą `anon` może trafić do
 * pakietu, a `service_role` nigdy: pierwszy podlega politykom, drugi je omija.
 *
 * Tworzony leniwie i tylko wtedy, gdy konfiguracja jest kompletna. W trybie
 * `BACKEND_MODE=local` nie ma z czym się łączyć i nie ma powodu, żeby ten kod
 * cokolwiek robił.
 */

let cached: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cached) return cached;
  if (!clientEnv.supabaseUrl || !clientEnv.supabaseAnonKey) return null;

  cached = createClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Token z linku potwierdzającego e-mail wraca we fragmencie adresu.
      detectSessionInUrl: true,
    },
  });

  // Od tej chwili każde wywołanie przez `api.*` niesie nagłówek Authorization.
  // Token pobierany jest przy każdym żądaniu, a nie zapamiętywany: klient
  // Supabase odświeża go w tle, a kopia zapisana raz wygasłaby po godzinie
  // i logowała użytkownika wylogowaniem w środku pracy.
  setAccessTokenProvider(async () => {
    const { data } = await cached!.auth.getSession();
    return data.session?.access_token ?? null;
  });

  return cached;
}

/** `true`, gdy aplikacja ma z czym rozmawiać — patrz `clientEnv.backendConfigured`. */
export function isCloudBackendAvailable(): boolean {
  return getSupabaseBrowserClient() !== null;
}
