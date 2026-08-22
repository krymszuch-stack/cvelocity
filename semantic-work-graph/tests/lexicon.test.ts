import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';

import {
  DERIVED_LABEL_PREFIX,
  SqliteGraphRepository,
} from '../src/repositories/SqliteGraphRepository.js';
import { LexiconImporter, ALLOWED_POS_TAGS, DEFAULT_BATCH_SIZE, parseCsvLine, escoResultToSynonyms } from '../src/seed/LexiconImporter.js';
import { LinguisticEngine, LEMMA_CACHE_LIMIT } from '../src/services/LinguisticEngine.js';
import { JargonMapper } from '../src/services/JargonMapper.js';
import { buildOfflineMorphCorpus, dedupeByPosPriority } from '../src/seed/lexicon/PolishMorphology.js';
import { technologyLemmas, TECHNOLOGY_SKILLS } from '../src/seed/lexicon/TechThesaurus.js';
import {
  defaultLexiconPath,
  getDefaultLexiconRepository,
  resetDefaultLexiconRepository,
} from '../src/repositories/defaultLexicon.js';

/**
 * Cały zestaw pracuje na bazie w pamięci (`:memory:`) zasianej korpusem
 * kuratorowanym. Test nie dotyka sieci ani dysku, więc wynik nie zależy od tego,
 * czy PoliMorf i ESCO udało się wcześniej pobrać.
 */
describe('Leksykon: deterministyczna lematyzacja PL i tezaurus umiejętności ESCO', () => {
  let repo: SqliteGraphRepository;
  let engine: LinguisticEngine;
  let mapper: JargonMapper;

  beforeAll(() => {
    repo = new SqliteGraphRepository(':memory:');
    const importer = new LexiconImporter(repo, { offline: true });
    importer.seedOfflineCorpus();

    engine = new LinguisticEngine(repo);
    mapper = new JargonMapper(repo);
  });

  afterAll(async () => {
    await repo.close();
  });

  // ---------------------------------------------------------------------------
  // Schemat i konfiguracja bazy
  // ---------------------------------------------------------------------------

  describe('schemat SQLite', () => {
    it('tworzy tabelę morph_dictionary z kluczem głównym na formie i indeksem na lemacie', () => {
      const db = repo.getRawDb();

      const columns = db.prepare('PRAGMA table_info(morph_dictionary)').all() as Array<{
        name: string;
        type: string;
        pk: number;
      }>;
      expect(columns.map((c) => c.name)).toEqual(['form', 'lemma', 'pos_tag']);
      expect(columns.every((c) => c.type === 'TEXT')).toBe(true);
      expect(columns.find((c) => c.name === 'form')?.pk).toBe(1);

      const indexes = db.prepare('PRAGMA index_list(morph_dictionary)').all() as Array<{ name: string }>;
      expect(indexes.some((i) => i.name === 'idx_morph_dictionary_lemma')).toBe(true);
    });

    it('tworzy tabelę skill_synonyms z indeksami na alt_label i canonical_name', () => {
      const db = repo.getRawDb();

      const columns = db.prepare('PRAGMA table_info(skill_synonyms)').all() as Array<{
        name: string;
        pk: number;
      }>;
      expect(columns.map((c) => c.name)).toEqual(['id', 'canonical_name', 'alt_label', 'category']);
      expect(columns.find((c) => c.name === 'id')?.pk).toBe(1);

      const indexes = (db.prepare('PRAGMA index_list(skill_synonyms)').all() as Array<{ name: string }>).map(
        (i) => i.name
      );
      expect(indexes).toContain('idx_skill_synonyms_alt_label');
      expect(indexes).toContain('idx_skill_synonyms_canonical_name');
    });

    it('ustawia PRAGMA synchronous = NORMAL, a dla bazy plikowej także journal_mode = WAL', async () => {
      // W bazie `:memory:` dziennik nie istnieje, więc WAL sprawdzamy na pliku.
      expect(repo.getPragma('synchronous')).toBe(1); // 1 == NORMAL

      const fileRepo = new SqliteGraphRepository(
        `${process.env.TMPDIR ?? '/tmp'}/swg-pragma-${process.pid}.db`
      );
      try {
        expect(String(fileRepo.getPragma('journal_mode')).toLowerCase()).toBe('wal');
        expect(fileRepo.getPragma('synchronous')).toBe(1);
      } finally {
        await fileRepo.close();
      }
    });

    it('filtruje części mowy zgodnie z listą subst/verb/fin/praet/ger/adj', () => {
      expect([...ALLOWED_POS_TAGS].sort()).toEqual(['adj', 'fin', 'ger', 'praet', 'subst', 'verb']);

      const tags = (
        repo.getRawDb().prepare('SELECT DISTINCT pos_tag FROM morph_dictionary').all() as Array<{
          pos_tag: string;
        }>
      ).map((row) => row.pos_tag);

      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) {
        expect(ALLOWED_POS_TAGS.has(tag)).toBe(true);
      }
    });

    it('zapisuje paczki transakcyjnie i domyślnie po 25 000 wierszy', () => {
      expect(DEFAULT_BATCH_SIZE).toBe(25_000);

      const before = repo.countMorphEntries();
      expect(() =>
        repo.insertMorphBatch(
          [
            { form: 'testowaforma', lemma: 'testowylemat', posTag: 'subst' },
            { form: 'zlaforma', lemma: '', posTag: 'subst' }, // NOT NULL, ale pusty string przechodzi
          ],
          'override'
        )
      ).not.toThrow();
      expect(repo.countMorphEntries()).toBe(before + 2);

      // Transakcja jest atomowa: błąd w środku paczki cofa całą paczkę.
      const beforeFailure = repo.countMorphEntries();
      expect(() =>
        repo.insertMorphBatch(
          [
            { form: 'poprawnaforma', lemma: 'lemat', posTag: 'subst' },
            { form: 'bledna', lemma: null as unknown as string, posTag: 'subst' },
          ],
          'override'
        )
      ).toThrow();
      expect(repo.countMorphEntries()).toBe(beforeFailure);
      expect(repo.lookupLemma('poprawnaforma')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Lematyzacja
  // ---------------------------------------------------------------------------

  describe('lemmatize()', () => {
    it.each([
      ['zarządzałem', 'zarządzać'],
      ['zarządzałam', 'zarządzać'],
      ['zarządzali', 'zarządzać'],
      ['zarządzam', 'zarządzać'],
      ['zarządzanie', 'zarządzać'],
      ['zarządzania', 'zarządzać'],
      ['wdrożenie', 'wdrożyć'],
      ['wdrożeń', 'wdrożyć'],
      ['wdrożyłem', 'wdrożyć'],
      ['uruchomienie', 'uruchomić'],
      ['projektowaniem', 'projektować'],
      ['optymalizowałem', 'optymalizować'],
      ['osiągnąłem', 'osiągnąć'],
      ['osiągnęła', 'osiągnąć'],
      ['programuję', 'programować'],
      ['obsługuję', 'obsługiwać'],
      ['utrzymywałem', 'utrzymywać'],
    ])('sprowadza odmieniony czasownik akcji %s do bezokolicznika %s', (form, lemma) => {
      expect(engine.lemmatize(form)).toBe(lemma);
    });

    it.each([
      ['mikroserwisów', 'mikroserwis'],
      ['mikroserwisy', 'mikroserwis'],
      ['mikroserwisem', 'mikroserwis'],
      ['mikroserwisie', 'mikroserwis'],
      ['kontenerach', 'kontener'],
      ['kontenerów', 'kontener'],
      ['zespołem', 'zespół'],
      ['zespołów', 'zespół'],
      ['błędów', 'błąd'],
      ['przychodów', 'przychód'],
      ['programistów', 'programista'],
      ['programiści', 'programista'],
      ['użytkownicy', 'użytkownik'],
      ['wydajności', 'wydajność'],
      ['aplikacji', 'aplikacja'],
      ['środowiskach', 'środowisko'],
      ['narzędzi', 'narzędzie'],
    ])('sprowadza odmieniony rzeczownik %s do mianownika %s', (form, lemma) => {
      expect(engine.lemmatize(form)).toBe(lemma);
    });

    it('obsługuje formy nieregularne z obocznością tematu (ó→o, ą→ę)', () => {
      // Wymiana samogłoski w temacie jest w polszczyźnie nieprzewidywalna
      // regułą sufiksową — dlatego słownik, a nie heurystyka.
      expect(engine.lemmatize('zespole')).toBe('zespół');
      expect(engine.lemmatize('błędzie')).toBe('błąd');
      expect(engine.lemmatize('przychodzie')).toBe('przychód');
    });

    it('rozstrzyga homonimię na rzecz formy standardowej w słownictwie zawodowym', () => {
      // PoliMorf notuje obok "kocioł" regionalny wariant "kocieł" o identycznej
      // odmianie. Korpus kuratorowany przesądza, że lematem jest forma wzorcowa.
      expect(engine.lemmatize('kotłów')).toBe('kocioł');
      expect(engine.lemmatize('kotle')).toBe('kocioł');
      expect(engine.lemmatize('spawarce')).toBe('spawarka');
      expect(engine.lemmatize('usterce')).toBe('usterka');
    });

    it('tworzy narzędnik z miękką końcówką po temacie na k/g', () => {
      expect(engine.lemmatize('piecykiem')).toBe('piecyk');
      expect(engine.lemmatize('grzejnikiem')).toBe('grzejnik');
    });

    it('odmienia zapożyczone nazwy technologii według polskiego wzorca', () => {
      expect(engine.lemmatize('dockerze')).toBe('docker');
      expect(engine.lemmatize('dockera')).toBe('docker');
      expect(engine.lemmatize('kubernetesa')).toBe('kubernetes');
      expect(engine.lemmatize('terraformem')).toBe('terraform');
    });

    it('jest odporny na wielkość liter i otaczające białe znaki', () => {
      expect(engine.lemmatize('  ZARZĄDZAŁEM  ')).toBe('zarządzać');
      expect(engine.lemmatize('Mikroserwisów')).toBe('mikroserwis');
    });

    it('zwraca słowo bez zmian, gdy nie ma go w słowniku (bez zgadywania)', () => {
      expect(engine.lemmatize('nieistniejacywyrazxyz')).toBe('nieistniejacywyrazxyz');
      expect(engine.lemmatize('')).toBe('');
    });

    it('nie tworzy fałszywych lematów dla słów spoza korpusu', () => {
      // Stary stemmer heurystyczny obcinał końcówki także tam, gdzie nie było
      // odmiany. Wersja słownikowa zwraca wejście nietknięte.
      for (const word of ['kubernetes', 'docker', 'python', 'linux']) {
        expect(engine.lemmatize(word)).toBe(word);
      }
    });
  });

  describe('pamięć podręczna LRU', () => {
    it('ma limit 20 000 wpisów i odpowiada z pamięci przy powtórnym zapytaniu', () => {
      const local = new LinguisticEngine(repo);
      expect(LEMMA_CACHE_LIMIT).toBe(20_000);
      expect(local.getCacheStats().limit).toBe(20_000);

      expect(local.lemmatize('zarządzałem')).toBe('zarządzać');
      const afterFirst = local.getCacheStats();
      expect(afterFirst.misses).toBe(1);
      expect(afterFirst.hits).toBe(0);

      expect(local.lemmatize('zarządzałem')).toBe('zarządzać');
      expect(local.lemmatize('zarządzałem')).toBe('zarządzać');
      const afterRepeats = local.getCacheStats();
      expect(afterRepeats.misses).toBe(1);
      expect(afterRepeats.hits).toBe(2);
      expect(afterRepeats.size).toBe(1);
    });

    it('nie przekracza limitu i eksmituje najdawniej używany wpis', () => {
      const local = new LinguisticEngine(repo);
      // Zapełniamy ponad limit sztucznymi słowami spoza słownika.
      for (let i = 0; i < LEMMA_CACHE_LIMIT + 500; i++) {
        local.lemmatize(`slowo${i}`);
      }
      expect(local.getCacheStats().size).toBeLessThanOrEqual(LEMMA_CACHE_LIMIT);

      // Najstarszy klucz wypadł, najnowszy został.
      const statsBefore = local.getCacheStats();
      local.lemmatize('slowo0');
      expect(local.getCacheStats().misses).toBe(statsBefore.misses + 1);

      const statsAfter = local.getCacheStats();
      local.lemmatize(`slowo${LEMMA_CACHE_LIMIT + 499}`);
      expect(local.getCacheStats().hits).toBe(statsAfter.hits + 1);
    });
  });

  // ---------------------------------------------------------------------------
  // Normalizacja zdań
  // ---------------------------------------------------------------------------

  describe('normalizeSentence()', () => {
    it('usuwa interpunkcję, zachowuje polskie znaki diakrytyczne i lematyzuje tokeny', () => {
      const lemmas = engine.normalizeSentence('Zarządzałem zespołem programistów, wdrażając mikroserwisy!');

      expect(lemmas).toContain('zarządzać');
      expect(lemmas).toContain('zespół');
      expect(lemmas).toContain('programista');
      expect(lemmas).toContain('mikroserwis');
      expect(lemmas.join(' ')).not.toMatch(/[,!?.]/);
    });

    it('nie okalecza wyrazów przez usuwanie znaków diakrytycznych', () => {
      // Forma pozbawiona ogonków nie występuje w słowniku ortograficznym,
      // więc zdejmowanie diakrytyków zerwałoby dopasowanie do lematu.
      const lemmas = engine.normalizeSentence('Wdrożenie środowiska ciągłej integracji');
      expect(lemmas).toContain('wdrożyć');
      expect(lemmas).toContain('środowisko');
      expect(lemmas.some((l) => l.includes('ś') || l.includes('ż') || l.includes('ą'))).toBe(true);
    });

    it('pomija słowa funkcyjne i tokeny jednoznakowe', () => {
      const lemmas = engine.normalizeSentence('Praca w zespole i przy projektach dla klienta');
      expect(lemmas).not.toContain('w');
      expect(lemmas).not.toContain('i');
      expect(lemmas).not.toContain('dla');
      expect(lemmas).toContain('zespół');
      expect(lemmas).toContain('klient');
    });

    it('zachowuje znaki wchodzące w skład nazw technologii', () => {
      const lemmas = engine.normalizeSentence('Znajomość C++, C# oraz node.js i CI/CD.');
      expect(lemmas).toContain('c++');
      expect(lemmas).toContain('c#');
      expect(lemmas).toContain('node.js');
      expect(lemmas).toContain('ci/cd');
    });

    it('zwraca pustą listę dla pustego wejścia', () => {
      expect(engine.normalizeSentence('')).toEqual([]);
      expect(engine.normalizeSentence('   ')).toEqual([]);
      expect(engine.normalizeSentence('... !!! ???')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Pokrycie zdań niezależne od składni
  // ---------------------------------------------------------------------------

  describe('calculateLemmaOverlap()', () => {
    it('daje 1.0 dla zdań o tej samej treści i różnej składni', () => {
      expect(
        engine.calculateLemmaOverlap('Zarządzałem zespołem programistów', 'Zarządzanie zespołem programistów')
      ).toBe(1);

      expect(
        engine.calculateLemmaOverlap(
          'Wdrożyłem mikroserwisy w kontenerach',
          'Wdrożenie mikroserwisów w kontenerze'
        )
      ).toBe(1);
    });

    it('jest odporny na zmianę szyku, przypadka i interpunkcji', () => {
      const a = 'Optymalizacja wydajności aplikacji i baz danych.';
      const b = 'Optymalizacja baz danych oraz wydajności aplikacji';
      expect(engine.calculateLemmaOverlap(a, b)).toBe(1);
    });

    it('rozróżnia derywację słowotwórczą: rzeczownik i czasownik to osobne lematy', () => {
      // „optymalizacja” i „optymalizować” mają wspólny rdzeń, ale są odrębnymi
      // hasłami słownikowymi. Lematyzacja nie udaje analizy słowotwórczej —
      // pokrycie jest wysokie dzięki reszcie zdania, ale nie pełne.
      const score = engine.calculateLemmaOverlap(
        'Optymalizacja wydajności aplikacji i baz danych.',
        'Optymalizowałem bazy danych oraz wydajność aplikacji'
      );
      expect(score).toBeGreaterThan(0.6);
      expect(score).toBeLessThan(1);
    });

    it('jest symetryczny', () => {
      const a = 'Projektowanie architektury systemów rozproszonych';
      const b = 'Projektowałem architekturę systemu';
      expect(engine.calculateLemmaOverlap(a, b)).toBe(engine.calculateLemmaOverlap(b, a));
    });

    it('zwraca 0 dla zdań bez wspólnej treści', () => {
      expect(engine.calculateLemmaOverlap('spawanie konstrukcji stalowych', 'analiza danych finansowych')).toBe(0);
    });

    it('zwraca 0, gdy którekolwiek zdanie jest puste', () => {
      expect(engine.calculateLemmaOverlap('', 'zarządzanie zespołem')).toBe(0);
      expect(engine.calculateLemmaOverlap('zarządzanie zespołem', '')).toBe(0);
      expect(engine.calculateLemmaOverlap('', '')).toBe(0);
    });

    it('daje wynik częściowy dla zdań częściowo pokrywających się', () => {
      const score = engine.calculateLemmaOverlap(
        'Zarządzałem zespołem programistów',
        'Zarządzanie budżetem projektu'
      );
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('mierzy pokrycie niesymetryczne (wymagania vs. CV)', () => {
      const wymagania = 'Wdrożenie mikroserwisów';
      const cv = 'Wdrażałem mikroserwisy, zarządzałem zespołem i optymalizowałem bazy danych';

      // Aspekt dokonany i niedokonany to osobne lematy, więc pokryty jest rzeczownik.
      expect(engine.calculateLemmaCoverage(wymagania, cv)).toBeGreaterThan(0);
      expect(engine.calculateLemmaCoverage('mikroserwisy', cv)).toBe(1);
      expect(engine.calculateLemmaCoverage(cv, 'mikroserwisy')).toBeLessThan(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Tezaurus umiejętności
  // ---------------------------------------------------------------------------

  describe('JargonMapper.findCanonicalSkill()', () => {
    it.each([
      ['k8s', 'kubernetes'],
      ['K8S', 'kubernetes'],
      ['kube', 'kubernetes'],
      ['orkiestracja kontenerów', 'kubernetes'],
      ['konteneryzacja dockerowa', 'docker'],
      ['konteneryzacja', 'docker'],
      ['postgres', 'postgresql'],
      ['golang', 'go'],
      ['nodejs', 'node.js'],
      ['microservices', 'mikroserwis'],
      ['machine learning', 'uczenie maszynowe'],
      ['gdpr', 'rodo'],
    ])('mapuje wariant %s na nazwę bazową %s', (term, canonical) => {
      expect(mapper.findCanonicalSkill(term)).toBe(canonical);
    });

    it('rozpoznaje frazy odmienione dzięki wariantowi zlematyzowanemu', () => {
      expect(mapper.findCanonicalSkill('konteneryzacji dockerowej')).toBe('docker');
      expect(mapper.findCanonicalSkill('orkiestracją kontenerów')).toBe('kubernetes');
    });

    it('wydobywa umiejętność z dłuższego zdania', () => {
      expect(mapper.findCanonicalSkill('migracja klastrów kubernetes do chmury')).toBe('kubernetes');
      expect(mapper.findCanonicalSkill('doświadczenie w pracy z k8s')).toBe('kubernetes');
    });

    it('zwraca nazwę bazową także dla niej samej (idempotencja)', () => {
      expect(mapper.findCanonicalSkill('kubernetes')).toBe('kubernetes');
      expect(mapper.findCanonicalSkill('docker')).toBe('docker');
    });

    it('zwraca null dla terminów spoza tezaurusa', () => {
      expect(mapper.findCanonicalSkill('zupełnieniezwiązanytermin')).toBeNull();
      expect(mapper.findCanonicalSkill('')).toBeNull();
    });
  });

  describe('JargonMapper.getSynonymsForSkill()', () => {
    it('zwraca etykiety alternatywne dla nazwy bazowej', () => {
      const synonyms = mapper.getSynonymsForSkill('docker');
      expect(synonyms).toContain('konteneryzacja dockerowa');
      expect(synonyms).toContain('kontenery docker');
      expect(synonyms).not.toContain('docker'); // nazwa bazowa nie jest swoim synonimem
    });

    it('działa również wtedy, gdy podano synonim zamiast nazwy bazowej', () => {
      expect(mapper.getSynonymsForSkill('k8s')).toEqual(mapper.getSynonymsForSkill('kubernetes'));
      expect(mapper.getSynonymsForSkill('k8s')).toContain('k8s');
    });

    it('nie ujawnia wariantów wygenerowanych maszynowo', () => {
      const derived = repo
        .getRawDb()
        .prepare(`SELECT alt_label FROM skill_synonyms WHERE category LIKE '${DERIVED_LABEL_PREFIX}%'`)
        .all() as Array<{ alt_label: string }>;
      expect(derived.length).toBeGreaterThan(0);

      // Warianty zlematyzowane są indeksem wyszukiwania, nie treścią dla użytkownika.
      const synonyms = mapper.getSynonymsForSkill('kubernetes');
      expect(synonyms).not.toContain('orkiestracja kontener');
    });

    it('zwraca pustą listę dla nieznanej umiejętności', () => {
      expect(mapper.getSynonymsForSkill('zupełnieniezwiązanytermin')).toEqual([]);
    });

    it('podaje kategorię dziedzinową umiejętności', () => {
      expect(mapper.getCategoryForSkill('k8s')).toBe('Chmura');
      expect(mapper.getCategoryForSkill('scrum')).toBe('Metodyki');
    });
  });

  describe('pokrycie tezaurusa', () => {
    it('zawiera 100 technologii, każdą z co najmniej jedną etykietą alternatywną', () => {
      expect(TECHNOLOGY_SKILLS).toHaveLength(100);
      for (const skill of TECHNOLOGY_SKILLS) {
        expect(skill.altLabels.length).toBeGreaterThan(0);
        expect(skill.category).toBeTruthy();
      }
    });

    it('każda technologia jest rozpoznawalna po nazwie bazowej', () => {
      for (const skill of TECHNOLOGY_SKILLS) {
        expect(mapper.findCanonicalSkill(skill.canonical)).toBe(skill.canonical);
      }
    });

    it('każda etykieta alternatywna prowadzi do swojej nazwy bazowej', () => {
      for (const skill of TECHNOLOGY_SKILLS) {
        for (const alt of skill.altLabels) {
          expect(mapper.findCanonicalSkill(alt)).toBe(skill.canonical);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Korpus i narzędzia importera
  // ---------------------------------------------------------------------------

  describe('korpus kuratorowany', () => {
    it('nie zawiera zduplikowanych form', () => {
      const corpus = buildOfflineMorphCorpus(technologyLemmas());
      const forms = corpus.map((entry) => entry.form);
      expect(new Set(forms).size).toBe(forms.length);
    });

    it('rozstrzyga kolizje form według priorytetu części mowy', () => {
      const deduped = dedupeByPosPriority([
        { form: 'kolizja', lemma: 'przymiotnikowy', posTag: 'adj' },
        { form: 'kolizja', lemma: 'rzeczownik', posTag: 'subst' },
        { form: 'kolizja', lemma: 'czasownik', posTag: 'fin' },
      ]);
      expect(deduped).toHaveLength(1);
      expect(deduped[0].lemma).toBe('rzeczownik');
    });

    it('zapisuje formy małymi literami niezależnie od zapisu źródłowego', () => {
      repo.insertMorphBatch([{ form: 'WIELKIMI', lemma: 'MAŁYMI', posTag: 'subst' }], 'override');
      expect(repo.lookupLemma('wielkimi')?.lemma).toBe('małymi');
      expect(repo.lookupLemma('WIELKIMI')?.lemma).toBe('małymi');
    });

    it('pozwala odczytać wszystkie formy danego lematu (indeks po lemacie)', () => {
      const forms = repo.getFormsForLemma('mikroserwis');
      expect(forms).toContain('mikroserwisów');
      expect(forms).toContain('mikroserwisy');
      expect(forms.length).toBeGreaterThan(4);
    });
  });

  describe('narzędzia importera', () => {
    it('parsuje wiersz CSV z cudzysłowami i przecinkami w polu', () => {
      expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
      expect(parseCsvLine('"a,1",b,"c ""cytat"""')).toEqual(['a,1', 'b', 'c "cytat"']);
      expect(parseCsvLine('a,,c')).toEqual(['a', '', 'c']);
    });

    it('zamienia rekord ESCO na wiersze tezaurusa z polską nazwą bazową', () => {
      const rows = escoResultToSynonyms({
        title: 'zarządzanie projektami',
        preferredLabel: { pl: 'zarządzanie projektami', en: 'project management' },
        alternativeLabel: { pl: ['kierowanie projektami'] },
      });

      expect(rows[0]).toEqual({
        canonicalName: 'zarządzanie projektami',
        altLabel: 'zarządzanie projektami',
        category: 'ESCO',
      });
      expect(rows.map((r) => r.altLabel)).toContain('kierowanie projektami');
      expect(rows.map((r) => r.altLabel)).toContain('project management');
      expect(rows.every((r) => r.canonicalName === 'zarządzanie projektami')).toBe(true);
    });

    it('pomija rekord ESCO bez polskiej etykiety', () => {
      expect(escoResultToSynonyms({ preferredLabel: { en: 'only english' } })).toEqual([]);
    });
  });

  describe('domyślne repozytorium leksykonu', () => {
    it('czyta ścieżkę bazy ze zmiennej SWG_DB_PATH', () => {
      const previous = process.env.SWG_DB_PATH;
      try {
        process.env.SWG_DB_PATH = '/tmp/inna-baza.db';
        expect(defaultLexiconPath()).toBe('/tmp/inna-baza.db');
      } finally {
        if (previous === undefined) delete process.env.SWG_DB_PATH;
        else process.env.SWG_DB_PATH = previous;
      }
    });

    it('nie tworzy pliku bazy, gdy ten nie istnieje', () => {
      const previous = process.env.SWG_DB_PATH;
      const missingPath = `${process.env.TMPDIR ?? '/tmp'}/swg-nieistnieje-${process.pid}.db`;

      try {
        resetDefaultLexiconRepository();
        process.env.SWG_DB_PATH = missingPath;

        // Serwisy językowe bywają tworzone bez wstrzykniętego repozytorium.
        // Otwarcie bazy „na wszelki wypadek” zasypywałoby dysk pustymi plikami
        // w losowych katalogach roboczych, więc brak pliku = brak słownika.
        expect(getDefaultLexiconRepository()).toBeNull();
        expect(fs.existsSync(missingPath)).toBe(false);

        // Bez słownika lematyzacja pracuje w trybie tożsamościowym.
        expect(new LinguisticEngine().lemmatize('zarządzałem')).toBe('zarządzałem');
      } finally {
        resetDefaultLexiconRepository();
        if (previous === undefined) delete process.env.SWG_DB_PATH;
        else process.env.SWG_DB_PATH = previous;
        resetDefaultLexiconRepository();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Scenariusz zbiorczy
  // ---------------------------------------------------------------------------

  describe('scenariusz: dopasowanie CV do ogłoszenia', () => {
    it('sprowadza opis z CV i wymaganie z ogłoszenia do wspólnego zbioru lematów', () => {
      const cv = 'Zarządzałem zespołem programistów i wdrażałem mikroserwisy na klastrach k8s.';
      const oferta = 'Zarządzanie zespołem programistów, wdrażanie mikroserwisów, klaster Kubernetes.';

      const overlap = engine.calculateLemmaOverlap(cv, oferta);
      expect(overlap).toBeGreaterThan(0.6);

      expect(mapper.findCanonicalSkill('k8s')).toBe(mapper.findCanonicalSkill('Kubernetes'));
    });

    it('potok processQuery zwraca lematy i nazwę bazową umiejętności', () => {
      const result = engine.processQuery('serwisowanie kotłów gazowych');

      expect(result.lemmas.length).toBeGreaterThan(0);
      expect(result.actorProfessions).toContain('serwisant');
      expect(result.verbalNouns).toContain('serwisowanie');
    });
  });
});
