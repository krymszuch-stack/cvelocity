import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateCosineSimilarity, LocalSemanticCache } from '../semanticCache';

describe('semanticCache (Cosine Similarity & Token Analytics)', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    const localStorageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  describe('calculateCosineSimilarity', () => {
    it('1. Calculates high similarity for semantically matching tech phrases', () => {
      const textA = 'Zoptymalizowałem zapytania SQL w bazie PostgreSQL';
      const textB = 'Optymalizacja zapytań SQL i bazy danych PostgreSQL';
      const sim = calculateCosineSimilarity(textA, textB);
      expect(sim).toBeGreaterThan(0.3);
    });

    it('2. Returns 0 for empty or completely disjoint token sets', () => {
      expect(calculateCosineSimilarity('', 'React')).toBe(0);
      expect(calculateCosineSimilarity('Gotowanie zupy pomidorowej', 'Kubernetes Docker')).toBe(0);
    });
  });

  describe('LocalSemanticCache', () => {
    it('1. Initializes default cache and token stats when storage is empty', () => {
      const cache = new LocalSemanticCache();
      const phrases = cache.getAllCachedPhrases();
      const stats = cache.getStats();

      expect(phrases.length).toBeGreaterThan(0);
      expect(stats.totalTokensSaved).toBeGreaterThanOrEqual(0);
    });

    it('2. Finds matching cached phrase when requirement similarity meets threshold', () => {
      const cache = new LocalSemanticCache();
      const { match, similarity } = cache.findMatch('Zoptymalizowałem zapytania SQL i PostgreSQL', 0.5);

      expect(match).not.toBeNull();
      expect(similarity).toBeGreaterThan(0.5);
      expect(match?.originalText).toContain('SQL');
    });

    it('3. Records token savings on slot filling hit and allows stats reset', () => {
      const cache = new LocalSemanticCache();
      const beforeTokens = cache.getStats().totalTokensSaved;

      cache.recordSlotFillingHit();
      expect(cache.getStats().totalTokensSaved).toBeGreaterThan(beforeTokens);

      cache.resetStats();
      expect(cache.getStats().totalTokensSaved).toBe(0);
      expect(cache.getStats().localSlotHits).toBe(0);
    });
  });
});
