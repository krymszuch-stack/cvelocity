import { CachedPhrase, TokenStats } from '../types';

const STATS_STORAGE_KEY = 'clumsy_vector_token_stats';
const CACHE_STORAGE_KEY = 'clumsy_vector_phrase_cache';

// Average tokens saved per CV bullet optimization ~180 input/output tokens
const TOKENS_PER_BULLET = 180;
// Estimated cost per token (Gemini API ~ $0.00015 / 1k tokens)
const COST_PER_TOKEN = 0.00000015;

export const INITIAL_TOKEN_STATS: TokenStats = {
  totalTokensSaved: 14200,
  estimatedCostSavedUSD: 0.00213,
  localSlotHits: 28,
  cacheHits: 12,
  geminiDeltaCalls: 4,
};

/**
 * Calculates N-gram & Keyword Cosine Similarity between target Job requirement and cached phrase.
 */
export function calculateCosineSimilarity(textA: string, textB: string): number {
  const tokenize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\sąęćłńóśźż]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const vocabulary = Array.from(new Set([...tokensA, ...tokensB]));

  const vecA = vocabulary.map((word) => tokensA.filter((t) => t === word).length);
  const vecB = vocabulary.map((word) => tokensB.filter((t) => t === word).length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vocabulary.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class LocalSemanticCache {
  private cache: CachedPhrase[] = [];
  private stats: TokenStats;

  constructor() {
    this.stats = this.loadStats();
    this.cache = this.loadCache();

    // Populate default cache if empty
    if (this.cache.length === 0) {
      this.populateDefaultCache();
    }
  }

  private loadStats(): TokenStats {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { ...INITIAL_TOKEN_STATS };
  }

  private saveStats() {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
  }

  private loadCache(): CachedPhrase[] {
    const saved = localStorage.getItem(CACHE_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  }

  private saveCache() {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(this.cache));
  }

  public getStats(): TokenStats {
    return { ...this.stats };
  }

  public getAllCachedPhrases(): CachedPhrase[] {
    return [...this.cache];
  }

  /**
   * Search cache for a phrase matching job requirements with Similarity > 0.88 threshold.
   */
  public findMatch(
    requirementText: string,
    threshold: number = 0.88
  ): { match: CachedPhrase | null; similarity: number } {
    let bestMatch: CachedPhrase | null = null;
    let maxSim = 0;

    for (const item of this.cache) {
      const sim = calculateCosineSimilarity(requirementText, item.originalText + ' ' + item.keywords.join(' '));
      if (sim > maxSim) {
        maxSim = sim;
        bestMatch = item;
      }
    }

    if (maxSim >= threshold && bestMatch) {
      bestMatch.hitCount += 1;
      bestMatch.lastUsed = new Date().toISOString();
      this.saveCache();

      // Record cache hit token savings
      this.recordCacheHit();
      return { match: bestMatch, similarity: maxSim };
    }

    return { match: null, similarity: maxSim };
  }

  public addPhraseToCache(
    originalText: string,
    optimizedText: string,
    keywords: string[]
  ): CachedPhrase {
    const newEntry: CachedPhrase = {
      id: 'cache_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      originalText,
      optimizedText,
      slots: {
        template: '{action} {target} ({tool}) -> {metric}',
        action: 'Zrealizowałem',
        target: originalText,
        tool: keywords.join(', '),
        metric: 'poprawa wskaźników wydajności',
        keywords,
      },
      keywords,
      hitCount: 1,
      score: 95,
      lastUsed: new Date().toISOString(),
    };

    this.cache.push(newEntry);
    this.saveCache();
    return newEntry;
  }

  public recordSlotFillingHit() {
    this.stats.localSlotHits += 1;
    this.stats.totalTokensSaved += TOKENS_PER_BULLET;
    this.stats.estimatedCostSavedUSD += TOKENS_PER_BULLET * COST_PER_TOKEN;
    this.saveStats();
  }

  public recordCacheHit() {
    this.stats.cacheHits += 1;
    this.stats.totalTokensSaved += TOKENS_PER_BULLET;
    this.stats.estimatedCostSavedUSD += TOKENS_PER_BULLET * COST_PER_TOKEN;
    this.saveStats();
  }

  public recordGeminiDeltaCall() {
    this.stats.geminiDeltaCalls += 1;
    this.saveStats();
  }

  public resetStats() {
    this.stats = {
      totalTokensSaved: 0,
      estimatedCostSavedUSD: 0,
      localSlotHits: 0,
      cacheHits: 0,
      geminiDeltaCalls: 0,
    };
    this.saveStats();
  }

  private populateDefaultCache() {
    this.cache = [
      {
        id: 'c_default_1',
        originalText: 'Zoptymalizowałem zapytania SQL i strukturę bazy PostgreSQL',
        optimizedText: 'Skróciłem czas wykonania zapytań SQL o 42% poprzez optymalizację indeksów PostgreSQL.',
        slots: {
          template: '{action} {target} ({tool}) -> {metric}',
          action: 'Skróciłem czas wykonania',
          target: 'zapytań SQL',
          tool: 'PostgreSQL, PGStat',
          metric: '42% redukcja czasu odpowiedzi',
          keywords: ['SQL', 'PostgreSQL', 'Optimization', 'Performance'],
        },
        keywords: ['SQL', 'PostgreSQL', 'Optimization', 'Performance', 'Database'],
        hitCount: 5,
        score: 98,
        lastUsed: new Date().toISOString(),
      },
      {
        id: 'c_default_2',
        originalText: 'Zaprojektowałem architekturę mikroserwisów w Node.js i Dockerze',
        optimizedText: 'Wdrożyłem kontenerową architekturę mikroserwisów w Node.js i Dockerze z redukcją opóźnień transakcyjnych o 35%.',
        slots: {
          template: '{action} {target} ({tool}) -> {metric}',
          action: 'Wdrożyłem',
          target: 'kontenerową architekturę mikroserwisów',
          tool: 'Node.js, Docker, Kubernetes',
          metric: 'redukcja opóźnień o 35%',
          keywords: ['Microservices', 'Node.js', 'Docker', 'Kubernetes'],
        },
        keywords: ['Microservices', 'Node.js', 'Docker', 'Kubernetes', 'Backend'],
        hitCount: 8,
        score: 96,
        lastUsed: new Date().toISOString(),
      },
    ];
    this.saveCache();
  }
}

export const semanticCacheInstance = new LocalSemanticCache();
