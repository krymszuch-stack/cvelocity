import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteGraphRepository } from '../src/repositories/SqliteGraphRepository.js';
import { normalizeTerm } from '../src/services/normalizer.js';
import { SearchEngine } from '../src/services/SearchEngine.js';
import { PathFinder } from '../src/services/PathFinder.js';
import { SeedImporter } from '../src/seed/SeedImporter.js';
import fs from 'fs';

const TEST_DB_PATH = './data/test_swg.db';

describe('Semantic Work Graph Engine', () => {
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

  it('powinien poprawnie normalizować polskie diakrytyki i wielkość liter', () => {
    const res = normalizeTerm('  Piecyk Gazowy JUNKERS  ');
    expect(res.normalized).toBe('piecyk gazowy junkers');
    expect(res.searchVariant).toBe('piecyk gazowy junkers');

    const resDiacritics = normalizeTerm('Kocioł & Ślusarz');
    expect(resDiacritics.searchVariant).toBe('kociol slusarz');
  });

  it('powinien zaimportować dane seed i poprawnie wyszukać pojęcie po aliasie lub nazwie', async () => {
    const importer = new SeedImporter(repo);
    await importer.importSeedFile('./data/seed/professions-top-100.pl.json');

    const engine = new SearchEngine(repo);
    const searchRes = await engine.search('piecyk gazowy');

    expect(searchRes.length).toBeGreaterThan(0);
    // Find device entity or profession entity containing piecyk gazowy
    const deviceEntity = searchRes.find((r) => r.entity.name === 'piecyk gazowy');
    const profEntity = searchRes.find((r) => r.entity.name === 'Serwisant kotłów gazowych');

    expect(deviceEntity || profEntity).toBeDefined();
  });

  it('powinien odnaleźć ścieżkę w grafie z serwisanta kotłów gazowych do marki Junkers', async () => {
    const importer = new SeedImporter(repo);
    await importer.importSeedFile('./data/seed/professions-top-100.pl.json');

    const finder = new PathFinder(repo);
    const res = await finder.explainPath('serwisant kotłów gazowych', 'Junkers');

    expect(res.found).toBe(true);
    expect(res.pathLength).toBeGreaterThan(0);
    expect(res.explanation.some((e) => e.includes('Junkers'))).toBe(true);
  });
});
