/**
 * Polityka haseł — czysta funkcja, bez sieci i bez DOM-u.
 *
 * Istnieje, bo odrzucanie słabych haseł po stronie Supabase kończy się na
 * minimalnej długości. Sprawdzanie haseł z wycieków (HaveIBeenPwned) jest tam
 * funkcją **płatną**, więc ten projekt robi je sam — po stronie serwera,
 * w `src/lib/leakedPassword.ts`. Ten moduł odpowiada wyłącznie za to, co da się
 * ocenić lokalnie, natychmiast i bez ani jednego żądania.
 *
 * Zwraca **listę problemów po polsku**, a nie `boolean`. Komunikat „hasło jest
 * za słabe" zmusza użytkownika do zgadywania, czego brakuje, i kończy się
 * dopisaniem wykrzyknika na końcu — czyli hasłem równie słabym, tylko dłuższym.
 */

/**
 * Dwanaście znaków, nie osiem.
 *
 * Tyle deklaruje już `docs/SETUP.md` w instrukcji konfiguracji Supabase, więc
 * kod i dokument mówią to samo — inaczej rozjechałyby się przy pierwszej
 * zmianie (reguła 3). Osiem znaków przy dzisiejszych kartach graficznych jest
 * łamane offline w czasie, który nie robi nikomu różnicy.
 */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Górny limit istnieje, bo bcrypt po stronie dostawcy tnie wejście na 72
 * bajtach — hasło dłuższe niż limit dawałoby użytkownikowi złudzenie, że
 * kolejne znaki cokolwiek dokładają.
 */
export const MAX_PASSWORD_LENGTH = 72;

export interface PasswordCheck {
  ok: boolean;
  /** Co dokładnie jest nie tak. Puste, gdy hasło przechodzi. */
  problems: string[];
}

/** Fragment adresu przed małpą — na tyle długi, żeby trafienie nie było przypadkiem. */
const MIN_EMAIL_FRAGMENT = 4;

function emailLocalPart(email: string | undefined): string {
  if (!email) return '';
  return email.split('@')[0]?.trim().toLowerCase() ?? '';
}

/**
 * Ocena hasła. `email` jest opcjonalny — przy zmianie hasła nie zawsze jest pod
 * ręką, a brak adresu ma po prostu wyłączyć jedną regułę, a nie wywrócić całość.
 */
export function checkPassword(password: string, email?: string): PasswordCheck {
  const problems: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    problems.push(`Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    problems.push(`Hasło nie może być dłuższe niż ${MAX_PASSWORD_LENGTH} znaków.`);
  }

  if (!/\p{Ll}/u.test(password)) problems.push('Dodaj małą literę.');
  if (!/\p{Lu}/u.test(password)) problems.push('Dodaj wielką literę.');
  if (!/\d/u.test(password)) problems.push('Dodaj cyfrę.');

  // Klasy znaków sprawdzamy własnościami Unicode, nie zakresem [a-z]: „ł" i „Ż"
  // są literami tak samo jak „l" i „Z", a polski użytkownik ma prawo ich użyć.

  const local = emailLocalPart(email);
  if (local.length >= MIN_EMAIL_FRAGMENT && password.toLowerCase().includes(local)) {
    problems.push('Hasło nie może zawierać Twojego adresu e-mail.');
  }

  // Cztery takie same znaki pod rząd. Wyłapuje „aaaa" i „1111" — typowe
  // wypełniacze dokładane wyłącznie po to, żeby dobić do wymaganej długości.
  if (/(.)\1{3,}/u.test(password)) {
    problems.push('Hasło nie może zawierać czterech takich samych znaków pod rząd.');
  }

  return { ok: problems.length === 0, problems };
}

/**
 * Siła hasła w skali 0–4 — wyłącznie do paska w formularzu.
 *
 * To jest **wskazówka wizualna, nie kontrola dostępu**: o przyjęciu hasła
 * decyduje `checkPassword`, a o odrzuceniu tych z wycieków — sprawdzenie
 * w HIBP. Pasek ma zachęcić do dłuższego hasła, a nie udawać pomiaru
 * entropii, którego ta funkcja nie robi.
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 16) score++;
  if (/\p{Ll}/u.test(password) && /\p{Lu}/u.test(password)) score++;
  if (/\d/u.test(password) && /[^\p{L}\d]/u.test(password)) score++;

  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

export const STRENGTH_LABELS: Record<number, string> = {
  0: 'Bardzo słabe',
  1: 'Słabe',
  2: 'Przeciętne',
  3: 'Dobre',
  4: 'Mocne',
};
