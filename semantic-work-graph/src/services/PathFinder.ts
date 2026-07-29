import { Entity, Relation } from '../domain/types.js';
import { SqliteGraphRepository } from '../repositories/SqliteGraphRepository.js';
import { SearchEngine } from './SearchEngine.js';

export interface PathStep {
  fromEntity: Entity;
  relation: Relation;
  toEntity: Entity;
}

export interface GraphPathResult {
  found: boolean;
  fromTerm: string;
  toTerm: string;
  startEntity?: Entity;
  targetEntity?: Entity;
  pathLength: number;
  steps: PathStep[];
  overallConfidence: number;
  explanation: string[];
}

export class PathFinder {
  private searchEngine: SearchEngine;

  constructor(private repo: SqliteGraphRepository) {
    this.searchEngine = new SearchEngine(repo);
  }

  public async explainPath(fromTerm: string, toTerm: string, maxDepth: number = 4): Promise<GraphPathResult> {
    const startResults = await this.searchEngine.search(fromTerm, { limit: 1 });
    const targetResults = await this.searchEngine.search(toTerm, { limit: 1 });

    if (startResults.length === 0 || targetResults.length === 0) {
      return {
        found: false,
        fromTerm,
        toTerm,
        pathLength: 0,
        steps: [],
        overallConfidence: 0,
        explanation: [
          `Nie znaleziono odpowiednika dla "${startResults.length === 0 ? fromTerm : toTerm}" w grafie wiedzy.`,
        ],
      };
    }

    const startEntity = startResults[0].entity;
    const targetEntity = targetResults[0].entity;

    if (startEntity.id === targetEntity.id) {
      return {
        found: true,
        fromTerm,
        toTerm,
        startEntity,
        targetEntity,
        pathLength: 0,
        steps: [],
        overallConfidence: startEntity.confidence,
        explanation: [`Pojęcia "${fromTerm}" i "${toTerm}" odnoszą się do tego samego obiektu: "${startEntity.name}" [${startEntity.type}].`],
      };
    }

    const queue: Array<{ entityId: string; path: PathStep[] }> = [{ entityId: startEntity.id, path: [] }];
    const visited = new Set<string>([startEntity.id]);

    let foundSteps: PathStep[] | null = null;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.path.length >= maxDepth) {
        continue;
      }

      const relations = await this.repo.getRelationsForEntity(current.entityId);

      for (const rel of relations) {
        const neighborId = rel.fromEntityId === current.entityId ? rel.toEntityId : rel.fromEntityId;

        if (visited.has(neighborId)) continue;

        const fromNode = (await this.repo.getEntityById(current.entityId))!;
        const toNode = (await this.repo.getEntityById(neighborId))!;

        const newPath = [
          ...current.path,
          {
            fromEntity: fromNode,
            relation: rel,
            toEntity: toNode,
          },
        ];

        if (neighborId === targetEntity.id) {
          foundSteps = newPath;
          break;
        }

        visited.add(neighborId);
        queue.push({ entityId: neighborId, path: newPath });
      }

      if (foundSteps) break;
    }

    if (!foundSteps) {
      return {
        found: false,
        fromTerm,
        toTerm,
        startEntity,
        targetEntity,
        pathLength: 0,
        steps: [],
        overallConfidence: 0,
        explanation: [`Brak bezpośredniego lub pośredniego połączenia w granicach głębokości ${maxDepth} kroków pomiędzy "${startEntity.name}" a "${targetEntity.name}".`],
      };
    }

    let overallConfidence = 1.0;
    const explanationLines: string[] = [];

    foundSteps.forEach((step, idx) => {
      overallConfidence *= step.relation.confidence;
      const relationText = this.formatRelationName(step.relation.type);
      explanationLines.push(
        `Krok ${idx + 1}: [${step.fromEntity.type}] "${step.fromEntity.name}" --(${relationText})--> [${step.toEntity.type}] "${step.toEntity.name}" (pewność: ${Math.round(step.relation.confidence * 100)}%)`
      );
    });

    return {
      found: true,
      fromTerm,
      toTerm,
      startEntity,
      targetEntity,
      pathLength: foundSteps.length,
      steps: foundSteps,
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      explanation: explanationLines,
    };
  }

  private formatRelationName(type: string): string {
    const map: Record<string, string> = {
      alias_of: 'jest synonimem / aliasem',
      belongs_to: 'należy do',
      used_by: 'używane przez',
      used_for: 'używane do',
      installs: 'instaluje',
      services: 'serwisuje',
      repairs: 'naprawia',
      manufactures: 'produkuje',
      requires_skill: 'wymaga umiejętności',
      related_to: 'jest powiązane z',
      subtype_of: 'jest podtypem',
      compatible_with: 'jest kompatybilny z',
      works_in: 'pracuje w branży',
      produces: 'wytwarza',
      sells: 'sprzedaje',
      certifies: 'certyfikuje',
    };
    return map[type] || type;
  }
}
