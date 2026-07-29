import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteGraphRepository } from '../src/repositories/SqliteGraphRepository.js';
import { normalizeTerm, stemPolishWord, calculateHybridSimilarity } from '../src/services/normalizer.js';
import { SearchEngine } from '../src/services/SearchEngine.js';
import { PathFinder } from '../src/services/PathFinder.js';
import { SeedImporter } from '../src/seed/SeedImporter.js';
import { GraphAnalytics } from '../src/services/GraphAnalytics.js';
import { GraphAuditor } from '../src/services/GraphAuditor.js';
import fs from 'fs';

const TEST_DB_PATH = './data/test_swg_advanced.db';

describe('Advanced Semantic Work Graph Algorithmic Suite', () => {
  let repo: SqliteGraphRepository;

  beforeEach(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    repo = new SqliteGraphRepository(TEST_DB_PATH);
  });

  afterEach(async () => {
    await repo.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('powinien poprawnie odmieniać lematycznie polskie słowa (Stemmer)', () => {
    expect(stemPolishWord('kotłów')).toBe('cotol');
    expect(stemPolishWord('kotłami')).toBe('cotol');
    expect(stemPolishWord('kotłach')).toBe('cotol');
  });

  it('powinien wyliczać podobieństwo hybrydowe Jaro-Winkler+Trigram dla odmian wyrazowych', () => {
    const score1 = calculateHybridSimilarity('kotłami gazowymi', 'kocioł gazowy');
    expect(score1).toBeGreaterThan(0.65);

    const score2 = calculateHybridSimilarity('serwisowania junkersów', 'serwisant junkersów');
    expect(score2).toBeGreaterThan(0.65);
  });

  it('powinien wyszukać pojęcie przy użyciu odmienionej formy gramatycznej', async () => {
    const importer = new SeedImporter(repo);
    await importer.importSeedFile('./data/seed/professions-top-100.pl.json');

    const engine = new SearchEngine(repo);
    const searchRes = await engine.search('kotłami gazowymi');

    expect(searchRes.length).toBeGreaterThan(0);
    const match = searchRes.find((r) => r.entity.name.includes('kotłów gazowych') || r.entity.name.includes('kocioł gazowy') || r.entity.name.includes('piecyk gazowy'));
    expect(match).toBeDefined();
  });

  it('powinien wyliczyć najkrótszą ścieżkę ważącą (Dijkstra) oraz statystyki PageRank', async () => {
    const importer = new SeedImporter(repo);
    await importer.importSeedFile('./data/seed/professions-top-100.pl.json');

    const finder = new PathFinder(repo);
    const pathRes = await finder.explainPath('serwisant kotłów gazowych', 'Junkers');

    expect(pathRes.found).toBe(true);
    expect(pathRes.totalCost).toBeLessThan(Infinity);

    const analytics = new GraphAnalytics(repo);
    const pagerank = await analytics.calculatePageRank();
    expect(pagerank.length).toBeGreaterThan(0);
    expect(pagerank[0].score).toBeGreaterThan(0);
  });

  it('powinien przeprowadzić audyt spójności grafu i zwrócić raport', async () => {
    const importer = new SeedImporter(repo);
    await importer.importSeedFile('./data/seed/professions-top-100.pl.json');

    const auditor = new GraphAuditor(repo);
    const report = await auditor.auditGraph();

    expect(report.totalEntities).toBeGreaterThan(0);
    expect(report.totalRelations).toBeGreaterThan(0);
    expect(Array.isArray(report.anomalies)).toBe(true);
  });
});
