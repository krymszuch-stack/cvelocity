/**
 * Lista zakazanego żargonu i pustych frazesów (BANNED phrases).
 * Zgodnie z zasadami ATS i nowoczesnej rekrutacji, eliminujemy lanie wody.
 */
export const BANNED_PATTERNS: string[] = [
  'kreatywny gracz zespołowy',
  'myślenie out of the box',
  'dynamiczny pracownik',
  'pracoholik',
  'perfekcjonista',
  'człowiek orkiestra',
  'młody dynamiczny zespół',
  'praca pod presją czasu',
  'odporny na stres',
];

/**
 * Sztywne reguły jakościowe dla generowanych podsumowań.
 */
export const CONSTRAINTS = {
  maxWords: 65,
  minWords: 15,
  maxSentences: 3,
  minSentences: 1,
};

/**
 * Oblicza odległość Levenshteina między dwoma tekstami, aby wykryć zbyt podobne warianty.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // usunięcie
        dp[i][j - 1] + 1, // wstawienie
        dp[i - 1][j - 1] + cost // zamiana
      );
    }
  }

  return dp[m][n];
}

/**
 * Sprawdza, czy wariant spełnia sztywne ograniczenia jakościowe.
 */
export function passesQualityConstraints(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  const lower = text.toLowerCase();

  // 1. Sprawdzenie zakazanych frazesów
  for (const banned of BANNED_PATTERNS) {
    if (lower.includes(banned)) return false;
  }

  // 2. Liczba słów
  const words = text.trim().split(/\s+/);
  if (words.length < CONSTRAINTS.minWords || words.length > CONSTRAINTS.maxWords) {
    return false;
  }

  // 3. Liczba zdań
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length < CONSTRAINTS.minSentences || sentences.length > CONSTRAINTS.maxSentences) {
    return false;
  }

  // 4. Zakaz niepoprawnych podwójnych spacji i niedomkniętych nawiasów/slotów
  if (text.includes('{') || text.includes('}') || text.includes('undefined') || text.includes('null')) {
    return false;
  }

  return true;
}

/**
 * Sprawdza sanityzację pojedynczego leksemu / frazy przed dodaniem do banku leksykonu.
 */
export function passesLexemeSanity(phrase: string): boolean {
  if (!phrase || typeof phrase !== 'string') return false;
  const clean = phrase.trim().toLowerCase();
  if (clean.length < 3 || clean.length > 120) return false;

  for (const banned of BANNED_PATTERNS) {
    if (clean.includes(banned)) return false;
  }

  if (clean.includes('{') || clean.includes('}') || clean.includes('undefined') || clean.includes('null')) {
    return false;
  }

  return true;
}

/**
 * Filtruje listę wariantów, usuwając zbyt podobne duplikaty.
 */
export function deduplicateVariants(variants: string[], similarityThreshold = 0.25): string[] {
  const unique: string[] = [];

  for (const v of variants) {
    let isTooSimilar = false;
    for (const existing of unique) {
      const maxLen = Math.max(v.length, existing.length);
      const distance = calculateLevenshteinDistance(v, existing);
      const ratio = distance / maxLen;

      if (ratio < similarityThreshold) {
        isTooSimilar = true;
        break;
      }
    }

    if (!isTooSimilar) {
      unique.push(v);
    }
  }

  return unique;
}
