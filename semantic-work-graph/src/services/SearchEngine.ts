import { Entity, EntityType } from '../domain/types.js';
import { SqliteGraphRepository } from '../repositories/SqliteGraphRepository.js';
import { normalizeTerm, calculateHybridSimilarity } from './normalizer.js';

export interface SearchOptions {
  type?: EntityType;
  minConfidence?: number;
  limit?: number;
}

export interface SearchResult {
  entity: Entity;
  score: number;
  matchType: 'exact' | 'alias' | 'stem' | 'fuzzy' | 'tag';
  reason: string;
}

export class SearchEngine {
  constructor(private repo: SqliteGraphRepository) {}

  public async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { type, minConfidence = 0.0, limit = 20 } = options;
    const { normalized: normQuery, searchVariant: variantQuery, stemVariant } = normalizeTerm(query);

    const allEntities = (await this.repo.getAllEntities()).filter((e) => {
      if (type && e.type !== type) return false;
      if (e.confidence < minConfidence) return false;
      if (e.status === 'rejected' || e.status === 'deprecated') return false;
      return true;
    });

    const results: SearchResult[] = [];

    for (const entity of allEntities) {
      const normName = normalizeTerm(entity.name).normalized;
      const variantName = normalizeTerm(entity.name).searchVariant;
      const entityStemName = normalizeTerm(entity.name).stemVariant;

      // 1. Exact Name Match
      if (normName === normQuery || variantName === variantQuery) {
        results.push({
          entity,
          score: 1.0,
          matchType: 'exact',
          reason: `Dokładne dopasowanie nazwy: "${entity.name}"`,
        });
        continue;
      }

      // 2. Alias Exact Match
      let aliasMatched: string | null = null;
      for (const alias of entity.aliases) {
        const normAlias = normalizeTerm(alias).normalized;
        const variantAlias = normalizeTerm(alias).searchVariant;
        if (normAlias === normQuery || variantAlias === variantQuery) {
          aliasMatched = alias;
          break;
        }
      }

      if (aliasMatched) {
        results.push({
          entity,
          score: 0.96,
          matchType: 'alias',
          reason: `Dopasowanie przez synonim/alias: "${aliasMatched}" -> "${entity.name}"`,
        });
        continue;
      }

      // 3. Stemming / Grammar Inflection Match
      if (entityStemName === stemVariant || entityStemName.includes(stemVariant) || stemVariant.includes(entityStemName)) {
        results.push({
          entity,
          score: 0.91,
          matchType: 'stem',
          reason: `Dopasowanie lematyczne/gramatyczne (stem): "${query}" ~ "${entity.name}"`,
        });
        continue;
      }

      // 4. Tag Match
      const tagMatched = entity.tags.find((tag) => normalizeTerm(tag).searchVariant === variantQuery);
      if (tagMatched) {
        results.push({
          entity,
          score: 0.82,
          matchType: 'tag',
          reason: `Dopasowanie w tagach: tag "${tagMatched}" w obiekcie "${entity.name}"`,
        });
        continue;
      }

      // 5. Advanced Hybrid Similarity Score (Jaro-Winkler + Trigram N-gram + Levenshtein)
      const nameHybridScore = calculateHybridSimilarity(variantQuery, variantName);
      let bestAliasHybridScore = 0;
      let bestAliasName = '';

      for (const alias of entity.aliases) {
        const aScore = calculateHybridSimilarity(variantQuery, normalizeTerm(alias).searchVariant);
        if (aScore > bestAliasHybridScore) {
          bestAliasHybridScore = aScore;
          bestAliasName = alias;
        }
      }

      const topHybridScore = Math.max(nameHybridScore, bestAliasHybridScore);

      if (topHybridScore >= 0.52) {
        const compositeScore = Math.round((topHybridScore * 0.75 + entity.confidence * 0.25) * 100) / 100;
        results.push({
          entity,
          score: compositeScore,
          matchType: 'fuzzy',
          reason:
            bestAliasHybridScore > nameHybridScore
              ? `Podobieństwo hybrydowe (Jaro-Winkler+Trigram) z aliasem "${bestAliasName}" (${Math.round(bestAliasHybridScore * 100)}%)`
              : `Podobieństwo hybrydowe z nazwą "${entity.name}" (${Math.round(nameHybridScore * 100)}%)`,
        });
      }
    }

    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.entity.confidence - a.entity.confidence;
    });

    return results.slice(0, limit);
  }
}
