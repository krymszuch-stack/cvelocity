import { getPolishStem } from './atsSimulator';

/**
 * Normalizes text by lowercasing, trimming, and normalizing whitespace.
 */
export function normalizeText(text: string): string {
  return (text || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Unified helper to check if a keyword or phrase (needle) is matched within a larger text (haystack).
 * Handles word boundaries with Polish characters, stemming, and prevents empty/short substring false positives.
 */
export function matchesKeyword(haystack: string, needle: string): boolean {
  const normHaystack = normalizeText(haystack);
  const normNeedle = normalizeText(needle);

  if (!normHaystack || !normNeedle) return false;

  // Prevent matching very short 1-char needles unless it's a specific tech term like "R" or "C"
  if (normNeedle.length < 2 && !['r', 'c'].includes(normNeedle)) {
    return false;
  }

  // 1. Exact match
  if (normHaystack === normNeedle) return true;

  // 2. Word boundary match using unicode-aware boundary checks
  // Prevents "b2" from matching inside "b2b", or "git" matching inside "digital"
  const escapedNeedle = normNeedle.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&').replace(/\s+/g, '\\s+');
  const boundaryRegex = new RegExp('(?:^|[^\\p{L}\\p{N}#+.-])' + escapedNeedle + '(?:[^\\p{L}\\p{N}#+.-]|$)', 'iu');
  if (boundaryRegex.test(normHaystack)) {
    return true;
  }

  // 3. Multi-word phrase or stemming match
  const needleWords = normNeedle.split(/[\s,./()]+/).filter((w) => w.length >= 2);
  const haystackWords = normHaystack.split(/[\s,./()]+/).filter((w) => w.length >= 2);

  if (needleWords.length === 0 || haystackWords.length === 0) {
    return false;
  }

  const needleStems = needleWords.map(getPolishStem);
  const haystackStems = haystackWords.map(getPolishStem);

  // If needle has multiple words, all needle stems must be present in haystack stems
  return needleStems.every((nStem) =>
    haystackStems.some((hStem) => hStem === nStem || (nStem.length >= 3 && hStem.startsWith(nStem)))
  );
}
