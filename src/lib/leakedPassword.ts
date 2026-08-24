import { getSupabaseBrowserClient } from './supabaseClient';

/**
 * Sprawdzenie, czy hasło występuje w znanych wyciekach.
 *
 * Supabase ma taką funkcję wbudowaną, ale **wyłącznie w planie Pro**. Publiczne
 * API HaveIBeenPwned jest darmowe i nie wymaga klucza, więc ten projekt robi to
 * sam — i przy okazji lepiej, bo bez wysyłania hasła gdziekolwiek.
 *
 * **Model k-anonimowości.** Liczymy SHA-1 hasła w przeglądarce i wysyłamy
 * wyłącznie **pięć pierwszych znaków** skrótu. HIBP odsyła kilkaset sufiksów
 * zaczynających się od tego prefiksu, a porównanie odbywa się z powrotem
 * lokalnie. Ani hasło, ani jego pełny skrót nigdy nie opuszczają urządzenia.
 *
 * **Dlaczego przez funkcję brzegową, a nie prosto do HIBP.** Polityka
 * prywatności tego projektu obiecuje, że przeglądarka nie łączy się z żadną
 * firmą trzecią — łącznie z fontami, które dlatego hostujemy u siebie.
 * Zapytanie idzie więc do naszej funkcji w Supabase, a ona pyta HIBP. Z punktu
 * widzenia użytkownika to nadal wyłącznie nasz backend.
 */

/** Nazwa funkcji brzegowej. Musi zgadzać się z `supabase/functions/`. */
const FUNKCJA = 'sprawdz-haslo';

export interface LeakedPasswordResult {
  /** `true`, gdy hasło znaleziono w wyciekach. */
  leaked: boolean;
  /** W ilu wyciekach — pokazywane użytkownikowi, bo liczba przekonuje mocniej niż ostrzeżenie. */
  count: number;
  /**
   * `true`, gdy sprawdzenia nie udało się wykonać.
   *
   * Wywołujący **musi przepuścić** rejestrację w tym przypadku. Zablokowanie
   * zakładania konta dlatego, że padła cudza usługa, zamieniłoby udogodnienie
   * w pojedynczy punkt awarii całego produktu.
   */
  unavailable: boolean;
}

const NIEDOSTEPNE: LeakedPasswordResult = { leaked: false, count: 0, unavailable: true };

/** SHA-1 przez Web Crypto. Dostępne w każdym bezpiecznym kontekście, w tym na `localhost`. */
async function sha1Hex(text: string): Promise<string> {
  const bufor = new TextEncoder().encode(text);
  const skrot = await crypto.subtle.digest('SHA-1', bufor);
  return Array.from(new Uint8Array(skrot))
    .map((bajt) => bajt.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Zwraca informację o wycieku. **Nigdy nie rzuca wyjątkiem** — każdy problem
 * (brak sieci, padnięta funkcja, brak Web Crypto) kończy się `unavailable`,
 * żeby wywołujący nie musiał opakowywać tego w `try/catch` i żeby nie dało się
 * przypadkiem zablokować rejestracji obsługą błędu.
 */
export async function checkLeakedPassword(password: string): Promise<LeakedPasswordResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !globalThis.crypto?.subtle) return NIEDOSTEPNE;

  try {
    const skrot = await sha1Hex(password);
    const prefiks = skrot.slice(0, 5);
    const sufiks = skrot.slice(5);

    const { data, error } = await supabase.functions.invoke<{ suffixes?: string }>(FUNKCJA, {
      body: { prefix: prefiks },
    });

    if (error || typeof data?.suffixes !== 'string') return NIEDOSTEPNE;

    // Odpowiedź HIBP to linie „SUFIKS:LICZBA". Porównanie robimy tutaj —
    // dopiero na tym etapie w jednym miejscu spotyka się pełny skrót i lista.
    for (const linia of data.suffixes.split('\n')) {
      const [kandydat, liczba] = linia.trim().split(':');
      if (kandydat === sufiks) {
        return { leaked: true, count: Number.parseInt(liczba ?? '0', 10) || 0, unavailable: false };
      }
    }

    return { leaked: false, count: 0, unavailable: false };
  } catch {
    return NIEDOSTEPNE;
  }
}
