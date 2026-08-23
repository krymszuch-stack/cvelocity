/**
 * Jedyne miejsce, które wie, co ta aplikacja zapisuje w przeglądarce.
 *
 * Wcześniej klucze były rozsiane po ośmiu plikach w trzech konwencjach naraz:
 * `cvelocity-theme` z myślnikiem, `cvelocity_applications_data` z podkreśleniem
 * i `skillvault_vault_active_*` po dawnej marce. Każde nowe miejsce zapisu
 * trzeba było pamiętać dopisać do `deleteLocalProfile()`, a raz już się nie
 * udało — „usuń moje dane" zostawiało za sobą stan subskrypcji, co wyłapał
 * dopiero test regresyjny.
 *
 * Rejestr poniżej odwraca ten kierunek: usuwanie danych iteruje po tym, co jest
 * tutaj zadeklarowane, więc klucz nieobecny w rejestrze nie istnieje.
 */

/** Jedna konwencja: `cvelocity:<nazwa>`. */
const PREFIX = 'cvelocity:';

export const StorageKeys = {
  theme: `${PREFIX}theme`,
  profile: `${PREFIX}profile`,
  vault: `${PREFIX}vault`,
  applications: `${PREFIX}applications`,
  sidebarCollapsed: `${PREFIX}sidebar-collapsed`,
  favoriteTips: `${PREFIX}favorite-tips`,
  entitlementsCache: `${PREFIX}entitlements-cache`,
  cheatSheetCache: `${PREFIX}cheatsheet`,
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/** Vault zapisywany pod profilem — jedyny klucz z częścią zmienną. */
export function vaultKeyFor(profileId: string): string {
  return `${StorageKeys.vault}:${profileId}`;
}

/**
 * Cache spersonalizowanej części ściągi, kluczowany skrótem (oferta + vault).
 *
 * Wchodzi pod wspólny prefiks świadomie. Wpis zawiera punkty STAR zbudowane
 * z prawdziwej historii zatrudnienia, więc jest daną osobową i musi znikać
 * razem z resztą przy `wipeAppStorage()` — dokładnie tego pilnuje ten rejestr.
 */
export function cheatSheetCacheKeyFor(hash: string): string {
  return `${StorageKeys.cheatSheetCache}:${hash}`;
}

/**
 * Ustawienia interfejsu przeżywają usunięcie profilu: motyw nie jest daną
 * osobową, a przywitanie użytkownika nagłym jasnym motywem wygląda jak awaria.
 */
const PRESERVED_ON_WIPE = new Set<string>([StorageKeys.theme]);

/**
 * Mapa starych kluczy na nowe, uruchamiana raz przy starcie aplikacji.
 *
 * Bez niej wdrożenie tej zmiany skasowałoby dane każdemu, kto już czegokolwiek
 * w aplikacji użył — dane nie zniknęłyby z dysku, ale aplikacja przestałaby
 * wiedzieć, gdzie ich szukać, co dla użytkownika jest tym samym.
 */
const LEGACY_KEY_MAP: Record<string, string> = {
  'cvelocity-theme': StorageKeys.theme,
  'cvelocity_local_profile_v1': StorageKeys.profile,
  'cvelocity_applications_data': StorageKeys.applications,
  'cvelocity_sidebar_collapsed': StorageKeys.sidebarCollapsed,
  'cvelocity-favorite-tips': StorageKeys.favoriteTips,
  'cvelocity-auth-state': StorageKeys.entitlementsCache,
};

/** Prefiksy sprzątane przy usuwaniu profilu — łącznie z dawną marką. */
const OWNED_PREFIXES = ['cvelocity', 'skillvault'];

function isBrowser(): boolean {
  return typeof localStorage !== 'undefined';
}

export function readRaw(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    // Prywatne okno albo zablokowane dane witryny — brak zapisu to nie awaria.
    return null;
  }
}

export function writeRaw(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Przepełniony limit albo tryb prywatny. Utrata zapisu jest do przeżycia,
    // wywrócenie się interfejsu na niej nie.
  }
}

export function removeRaw(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* jw. */
  }
}

/** Odczyt JSON-a. Uszkodzona wartość daje `fallback`, nie wyjątek. */
export function readJson<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    writeRaw(key, JSON.stringify(value));
  } catch {
    // Cykl w strukturze danych — nie ma czego zapisać.
  }
}

/**
 * Przenosi dane spod starych kluczy pod nowe. Idempotentna: klucz docelowy,
 * który już istnieje, nie jest nadpisywany, więc powtórne wywołanie nie cofa
 * niczego, co użytkownik zdążył zmienić po migracji.
 */
export function migrateLegacyKeys(): void {
  if (!isBrowser()) return;

  for (const [legacy, current] of Object.entries(LEGACY_KEY_MAP)) {
    const value = readRaw(legacy);
    if (value === null) continue;
    if (readRaw(current) === null) writeRaw(current, value);
    removeRaw(legacy);
  }

  // Vaulty profilowe mają w kluczu identyfikator profilu, więc nie da się ich
  // wypisać z góry — trzeba przejść po tym, co faktycznie leży w schowku.
  const legacyVaultPrefix = 'skillvault_vault_active_';
  const toMigrate: Array<[string, string]> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(legacyVaultPrefix)) continue;
    toMigrate.push([key, vaultKeyFor(key.slice(legacyVaultPrefix.length))]);
  }

  for (const [legacy, current] of toMigrate) {
    const value = readRaw(legacy);
    if (value !== null && readRaw(current) === null) writeRaw(current, value);
    removeRaw(legacy);
  }

  // Pozostałości po module udającym system kont: baza „użytkowników" z hashami
  // haseł i sekretami TOTP oraz vault „zaszyfrowany" kluczem zaszytym w kodzie.
  // Nic tego już nie czyta, a są to dane osobowe — zostawianie ich w cudzej
  // przeglądarce nie ma żadnego uzasadnienia.
  removeRaw('skillvault_users_db_v1');
  removeRaw('skillvault_master_vault_enc_v2');
}

/**
 * Usuwa z tej przeglądarki wszystkie dane aplikacji poza ustawieniami
 * interfejsu. Iteruje po prefiksach zamiast po liście kluczy, żeby dane zapisane
 * przez kod, który powstanie później, też zostały objęte.
 */
export function wipeAppStorage(): void {
  if (!isBrowser()) return;

  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || PRESERVED_ON_WIPE.has(key)) continue;
    if (OWNED_PREFIXES.some((prefix) => key.startsWith(prefix))) doomed.push(key);
  }

  for (const key of doomed) removeRaw(key);
}
