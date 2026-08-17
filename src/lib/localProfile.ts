import { MasterVault } from '../types';
import { createEmptyVault } from './sampleVault';

/**
 * Profil lokalny — jawny stan przejściowy, zanim wejdzie Supabase Auth.
 *
 * Ten moduł zastąpił `auth.ts`, który udawał system kont: hashował hasła
 * (PBKDF2-SHA1, 1000 iteracji — ~1300× poniżej normy OWASP), trzymał sekrety
 * TOTP obok hasha w localStorage i „szyfrował" vault kluczem `'default_key'`,
 * zapisując obok **drugą, jawną kopię**, którą odczyt i tak preferował. Żadna
 * z tych funkcji nie miała wywołań: jedyny ekran logowania wpuszczał każdego
 * bez sprawdzania czegokolwiek.
 *
 * Zamiast zostawiać atrapę bezpieczeństwa, nazywamy rzecz po imieniu: to jest
 * profil zapisany w tej przeglądarce, bez konta i bez ochrony kryptograficznej.
 * Interfejs mówi to użytkownikowi wprost, a `SECURITY.md` opisuje to samo.
 * Prawdziwe uwierzytelnienie i szyfrowanie w spoczynku wchodzą razem z Supabase.
 */
export interface LocalProfile {
  id: string;
  name: string;
  /** Opcjonalny — profil lokalny nie wymaga adresu e-mail do niczego. */
  email?: string;
  createdAt: string;
}

const PROFILE_KEY = 'cvelocity_local_profile_v1';

/**
 * Zachowane z poprzedniej wersji, żeby nie porzucić danych osób, które już
 * coś w aplikacji zapisały.
 */
const vaultKey = (profileId: string) => `skillvault_vault_active_${profileId}`;

/**
 * Prefiksy czyszczone przy usuwaniu profilu.
 *
 * Aplikacja używa obu konwencji zapisu — `cvelocity-auth-state` z myślnikiem
 * obok `cvelocity_local_profile_v1` z podkreśleniem — więc lista musi objąć
 * jedno i drugie. Wariant z samym podkreśleniem zostawiał za sobą stan
 * subskrypcji, co wyłapał test regresyjny.
 */
const OWNED_KEY_PREFIXES = ['cvelocity', 'skillvault'];

/**
 * Klucze, które przeżywają usunięcie profilu: to ustawienie interfejsu, nie
 * dane osobowe, a przywitanie użytkownika nagłym jasnym motywem wygląda jak
 * awaria.
 */
const PRESERVED_KEYS = new Set(['cvelocity-theme']);

function isBrowser(): boolean {
  return typeof localStorage !== 'undefined';
}

export function getActiveProfile(): LocalProfile | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LocalProfile;
    return parsed && typeof parsed.id === 'string' && parsed.id ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Zakłada profil w tej przeglądarce. Nie ma tu weryfikacji, bo nie ma czego
 * weryfikować — i właśnie dlatego funkcja nie nazywa się `login`.
 */
export function createLocalProfile(name: string, email?: string): { profile: LocalProfile; vault: MasterVault } {
  const trimmedName = name.trim();
  const trimmedEmail = email?.trim();

  const profile: LocalProfile = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    ...(trimmedEmail ? { email: trimmedEmail } : {}),
    createdAt: new Date().toISOString(),
  };

  if (isBrowser()) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  const existing = loadProfileVault(profile.id);
  return { profile, vault: existing ?? createEmptyVault() };
}

/** Kończy korzystanie z profilu, ale zostawia zapisane dane na urządzeniu. */
export function signOutLocalProfile(): void {
  if (isBrowser()) localStorage.removeItem(PROFILE_KEY);
}

export function loadProfileVault(profileId: string): MasterVault | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(vaultKey(profileId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as MasterVault;
  } catch {
    return null;
  }
}

/**
 * Zapisuje vault w localStorage **czystym tekstem** — i to jest świadoma,
 * opisana decyzja, nie przeoczenie. Poprzednia wersja szyfrowała drugą kopię
 * kluczem `'default_key'` zaszytym w kodzie, co przy modelu zagrożeń „XSS czyta
 * localStorage" nie chroni przed niczym: atakujący, który wykonuje skrypt na
 * stronie, odczyta ten klucz z tego samego bundla. Dwie kopie tych samych
 * danych to była wtedy sama wada, bez żadnej korzyści.
 *
 * Realna ochrona to szyfrowanie kopertowe po stronie serwera (Faza 3).
 */
export function saveProfileVault(profileId: string, vault: MasterVault): void {
  if (!isBrowser()) return;
  localStorage.setItem(vaultKey(profileId), JSON.stringify(vault));
}

/**
 * Usuwa profil wraz ze wszystkimi danymi aplikacji z tej przeglądarki.
 *
 * Iteracja po prefiksach, nie zakodowana lista kluczy. Poprzednia wersja
 * wyliczała klucze do usunięcia ręcznie i przez to zostawiała za sobą m.in.
 * stan subskrypcji — a „usuń moje dane", które czegoś nie usuwa, jest gorsze
 * niż brak takiej funkcji.
 */
export function deleteLocalProfile(): void {
  if (!isBrowser()) return;

  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || PRESERVED_KEYS.has(key)) continue;
    if (OWNED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) doomed.push(key);
  }

  for (const key of doomed) localStorage.removeItem(key);
}
