import { Entity, EntityType } from '../domain/types.js';
import { SqliteGraphRepository } from '../repositories/SqliteGraphRepository.js';
import { normalizeTerm, calculateFuzzyScore } from './normalizer.js';

export interface SearchOptions {
  type?: EntityType;
  minConfidence?: number;
  limit?: number;
}

export interface SearchResult {
  entity: Entity;
  score: number;
  matchType: 'exact' | 'alias' | 'fuzzy' | 'tag';
  reason: string;
}

export class SearchEngine {
  constructor(private repo: SqliteGraphRepository) {}

  public async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { type, minConfidence = 0.0, limit = 20 } = options;
    const { normalized: normQuery, searchVariant: variantQuery } = normalizeTerm(query);

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

      // 2. Alias Match
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
          score: 0.95,
          matchType: 'alias',
          reason: `Dopasowanie przez synonim/alias: "${aliasMatched}" -> "${entity.name}"`,
        });
        continue;
      }

      // 3. Tag Match
      const tagMatched = entity.tags.find((tag) => normalizeTerm(tag).searchVariant === variantQuery);
      if (tagMatched) {
        results.push({
          entity,
          score: 0.8,
          matchType: 'tag',
          reason: `Dopasowanie w tagach: tag "${tagMatched}" w obiekcie "${entity.name}"`,
        });
        continue;
      }

      // 4. Fuzzy / Substring Match
      const nameScore = calculateFuzzyScore(variantQuery, variantName);
      let bestAliasScore = 0;
      let bestAliasName = '';

      for (const alias of entity.aliases) {
        const aScore = calculateFuzzyScore(variantQuery, normalizeTerm(alias).searchVariant);
        if (aScore > bestAliasScore) {
          bestAliasScore = aScore;
          bestAliasName = alias;
        }
      }

      const topFuzzyScore = Math.max(nameScore, bestAliasScore);

      if (topFuzzyScore >= 0.55) {
        results.push({
          entity,
          score: Math.round(topFuzzyScore * 100) / 100,
          matchType: 'fuzzy',
          reason:
            bestAliasScore > nameScore
              ? `Podobieństwo z aliasem "${bestAliasName}" (${Math.round(bestAliasScore * 100)}%)`
              : `Podobieństwo z nazwą "${entity.name}" (${Math.round(nameScore * 100)}%)`,
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
