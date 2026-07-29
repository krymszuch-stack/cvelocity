export function normalizeTerm(text: string): { original: string; normalized: string; searchVariant: string } {
  const original = text;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Polish diacritics removal for resilient search indexing
  const searchVariant = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    original,
    normalized: lower,
    searchVariant,
  };
}

export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function calculateFuzzyScore(query: string, target: string): number {
  const normQuery = normalizeTerm(query).searchVariant;
  const normTarget = normalizeTerm(target).searchVariant;

  if (normQuery === normTarget) return 1.0;
  if (normTarget.includes(normQuery)) return 0.85;
  if (normQuery.includes(normTarget)) return 0.75;

  const distance = calculateLevenshteinDistance(normQuery, normTarget);
  const maxLength = Math.max(normQuery.length, normTarget.length);
  if (maxLength === 0) return 1.0;

  const similarity = 1 - distance / maxLength;
  return Math.max(0, similarity);
}
