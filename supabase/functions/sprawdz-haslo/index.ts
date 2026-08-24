import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

/**
 * Pośrednik do HaveIBeenPwned — sprawdzanie haseł z wycieków bez planu Pro.
 *
 * Supabase ma tę funkcję wbudowaną, ale wyłącznie w planie płatnym. Publiczne
 * API HIBP jest darmowe i nie wymaga klucza, więc robimy to sami.
 *
 * **Ta funkcja nigdy nie widzi hasła.** Przeglądarka liczy SHA-1 lokalnie
 * i przysyła wyłącznie pięć pierwszych znaków skrótu. Odsyłamy surową listę
 * sufiksów od HIBP, a porównanie wraca do przeglądarki. To jest model
 * k-anonimowości: przy pięciu znakach prefiksu odpowiedź obejmuje setki haseł,
 * więc ani my, ani HIBP nie wiemy, o które chodziło.
 *
 * **Po co pośrednik, skoro przeglądarka mogłaby zapytać HIBP wprost.** Polityka
 * prywatności projektu obiecuje, że przeglądarka użytkownika nie łączy się
 * z żadną firmą trzecią — łącznie z fontami, hostowanymi u siebie właśnie z tego
 * powodu. Zapytanie do HIBP wychodzi więc stąd, a nie z urządzenia użytkownika.
 *
 * **`verify_jwt` jest wyłączone celowo.** Sprawdzenie hasła musi zadziałać
 * *przed* założeniem konta, więc tokenu jeszcze nie ma. Funkcja nie dotyka
 * bazy, nie czyta sekretów i przyjmuje wyłącznie pięć znaków szesnastkowych —
 * nie ma tu czego nadużyć poza cudzym transferem.
 */

const HIBP = 'https://api.pwnedpasswords.com/range/';

/** Dokładnie pięć znaków szesnastkowych. Nic innego nie ma prawa polecieć dalej. */
const PREFIKS = /^[0-9A-F]{5}$/;

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

  let prefix: unknown;
  try {
    ({ prefix } = await req.json());
  } catch {
    return json({ error: 'Nieprawidłowe ciało żądania.' }, 400);
  }

  if (typeof prefix !== 'string' || !PREFIKS.test(prefix.toUpperCase())) {
    return json({ error: 'Parametr `prefix` musi mieć pięć znaków szesnastkowych.' }, 400);
  }

  try {
    // `Add-Padding` dokłada losowe wpisy do odpowiedzi, żeby jej rozmiar nie
    // zdradzał, ile haseł faktycznie pasuje do prefiksu.
    const odpowiedz = await fetch(`${HIBP}${prefix.toUpperCase()}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'CVelocity-password-check' },
      signal: AbortSignal.timeout(5000),
    });

    if (!odpowiedz.ok) return json({ unavailable: true }, 200);

    return json({ suffixes: await odpowiedz.text() });
  } catch {
    // Awaria HIBP nie może blokować rejestracji — odpowiadamy 200
    // z `unavailable`, a przeglądarka przepuszcza hasło dalej (fail-open).
    return json({ unavailable: true }, 200);
  }
});
