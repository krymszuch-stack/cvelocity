/**
 * Formatowanie liczb dla polskiego interfejsu.
 *
 * Powód istnienia: `toFixed` rozsiał po widokach kropki dziesiętne
 * („31.25 zł/h"), a liczniki typu `${count} pozycji` łamały odmianę
 * („1 pozycji"). Audyt treści 2026-08-26 (docs/AUDYT-TRESCI-MARKETINGOWEJ.md,
 * §5.1–§5.2) wytypował oba wzorce jako klasę błędu — naprawiamy u źródła,
 * jednym helperem, zamiast poprawiać pojedyncze napisy.
 *
 * Czysta logika bez DOM-u — konwencja repo (testowalne w Node).
 */

/** Odmiana rzeczownika po liczebniku: 1 / 2–4 (poza 12–14) / pozostałe. */
export function pluralPl(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const rest10 = abs % 10;
  const rest100 = abs % 100;
  if (abs === 1) return one;
  if (rest10 >= 2 && rest10 <= 4 && (rest100 < 12 || rest100 > 14)) return few;
  return many;
}

/**
 * Liczba dziesiętna z przecinkiem (pl-PL), stała liczba miejsc po przecinku —
 * zamiennik `toFixed`, który zawsze wypisuje kropkę.
 */
export function formatDecimalPl(value: number, fractionDigits = 2): string {
  return value.toLocaleString('pl-PL', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
