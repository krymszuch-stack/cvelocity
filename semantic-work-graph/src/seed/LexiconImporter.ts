import fs from 'fs';
import path from 'path';
import readline from 'readline';
import zlib from 'zlib';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

import {
  markDerivedCategory,
  MorphEntry,
  SkillSynonym,
  SqliteGraphRepository,
} from '../repositories/SqliteGraphRepository.js';
import { buildOfflineMorphCorpus } from './lexicon/PolishMorphology.js';
import { buildOfflineSkillThesaurus, technologyLemmas, SkillSeed } from './lexicon/TechThesaurus.js';

/**
 * Części mowy zapisywane do słownika. PoliMorf rozróżnia kilkadziesiąt tagów;
 * do dopasowywania CV do ogłoszeń potrzebujemy rzeczowników, czasowników
 * (formy osobowe i przeszłe), rzeczowników odczasownikowych i przymiotników.
 */
export const ALLOWED_POS_TAGS = new Set(['subst', 'verb', 'fin', 'praet', 'ger', 'adj']);

/** Rozmiar paczki transakcyjnej przy imporcie strumieniowym. */
export const DEFAULT_BATCH_SIZE = 25_000;

/** Katalog na pobrane zbiory źródłowe. */
export const DEFAULT_SEED_DIR = './data/seed';

/**
 * Adresy wydania PoliMorf w kolejności prób.
 *
 * Pierwszy pochodzi z pierwotnej specyfikacji zadania; drugim jest katalog wydań
 * SGJP/IPI PAN, w którym nazwa pliku zawiera datę wydania — dlatego zamiast
 * zaszywać wersję, odczytujemy najnowszy katalog z indeksu (patrz
 * `discoverSgjpPoliMorfUrl`).
 */
export const POLIMORF_URL_CANDIDATES = [
  'https://raw.githubusercontent.com/morfologik/polimorf-tab/master/PoliMorf-0.6.7.tab.gz',
];

/** Indeks wydań słownika Morfeusz/PoliMorf utrzymywany przez SGJP. */
export const SGJP_RELEASE_INDEX = 'http://download.sgjp.pl/morfeusz/';

/** Publiczne API taksonomii ESCO (Komisja Europejska). */
export const ESCO_API_SEARCH = 'https://ec.europa.eu/esco/api/search';

export type SourceStatus = 'download' | 'cache' | 'offline-fallback' | 'skipped';

export interface LexiconImportOptions {
  /** Katalog na pliki źródłowe (domyślnie `./data/seed`). */
  seedDir?: string;
  /** Rozmiar paczki transakcyjnej (domyślnie 25 000). */
  batchSize?: number;
  /** Pomija ruch sieciowy i korzysta wyłącznie z plików lokalnych + korpusu offline. */
  offline?: boolean;
  /** Pobiera źródła ponownie, nawet jeśli są już w katalogu seed. */
  force?: boolean;
  /** Limit wierszy PoliMorf (do szybkich przebiegów kontrolnych). */
  maxPolimorfRows?: number;
  /** Limit czasu pojedynczego żądania HTTP w milisekundach. */
  requestTimeoutMs?: number;
  logger?: (message: string) => void;
}

export interface LexiconImportReport {
  morphSource: SourceStatus;
  morphFile: string | null;
  polimorfLinesRead: number;
  polimorfRowsWritten: number;
  curatedRowsWritten: number;
  morphDictionarySize: number;

  skillSource: SourceStatus;
  skillFile: string | null;
  skillRowsWritten: number;
  skillSynonymsSize: number;
  canonicalSkills: number;

  durationMs: number;
}

const noopLogger = (): void => {};

export class LexiconImporter {
  private readonly seedDir: string;
  private readonly batchSize: number;
  private readonly requestTimeoutMs: number;
  private readonly log: (message: string) => void;

  constructor(
    private readonly repo: SqliteGraphRepository,
    private readonly options: LexiconImportOptions = {}
  ) {
    this.seedDir = path.resolve(options.seedDir ?? DEFAULT_SEED_DIR);
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 120_000;
    this.log = options.logger ?? noopLogger;
  }

  /** Tworzy katalog na zbiory źródłowe, jeśli jeszcze nie istnieje. */
  public ensureSeedDir(): string {
    if (!fs.existsSync(this.seedDir)) {
      fs.mkdirSync(this.seedDir, { recursive: true });
      this.log(`Utworzono katalog na dane źródłowe: ${this.seedDir}`);
    }
    return this.seedDir;
  }

  // ---------------------------------------------------------------------------
  // Pobieranie
  // ---------------------------------------------------------------------------

  private async fetchWithTimeout(url: string, accept?: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: accept ? { Accept: accept } : undefined,
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Ustala adres najnowszego wydania PoliMorf w repozytorium SGJP.
   * Nazwa pliku zawiera datę wydania, więc czytamy indeks zamiast zgadywać wersję.
   */
  public async discoverSgjpPoliMorfUrl(): Promise<string | null> {
    try {
      const indexResponse = await this.fetchWithTimeout(SGJP_RELEASE_INDEX);
      if (!indexResponse.ok) return null;
      const indexHtml = await indexResponse.text();

      const releaseDirs = [...indexHtml.matchAll(/href="(\d{8})\/"/g)].map((m) => m[1]).sort();
      if (releaseDirs.length === 0) return null;

      const latest = releaseDirs[releaseDirs.length - 1];
      const releaseUrl = `${SGJP_RELEASE_INDEX}${latest}/`;
      const releaseResponse = await this.fetchWithTimeout(releaseUrl);
      if (!releaseResponse.ok) return null;
      const releaseHtml = await releaseResponse.text();

      const fileMatch = releaseHtml.match(/href="(polimorf-\d+\.tab\.gz)"/);
      if (!fileMatch) return null;

      return `${releaseUrl}${fileMatch[1]}`;
    } catch (error) {
      this.log(`Nie udało się odczytać indeksu wydań SGJP: ${(error as Error).message}`);
      return null;
    }
  }

  private async downloadToFile(url: string, destination: string): Promise<boolean> {
    try {
      this.log(`Pobieranie: ${url}`);
      const response = await this.fetchWithTimeout(url);
      if (!response.ok || !response.body) {
        this.log(`  -> odpowiedź HTTP ${response.status}, pomijam to źródło.`);
        return false;
      }

      const tempPath = `${destination}.part`;
      await pipeline(Readable.fromWeb(response.body as never), fs.createWriteStream(tempPath));
      fs.renameSync(tempPath, destination);

      const sizeMb = (fs.statSync(destination).size / 1024 / 1024).toFixed(1);
      this.log(`  -> zapisano ${destination} (${sizeMb} MB)`);
      return true;
    } catch (error) {
      this.log(`  -> błąd pobierania: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Pobiera archiwum PoliMorf do katalogu seed.
   * @returns ścieżka pliku oraz sposób jego pozyskania.
   */
  public async acquirePoliMorf(): Promise<{ filePath: string | null; status: SourceStatus }> {
    this.ensureSeedDir();
    const destination = path.join(this.seedDir, 'PoliMorf.tab.gz');

    if (fs.existsSync(destination) && !this.options.force) {
      this.log(`PoliMorf już pobrany: ${destination}`);
      return { filePath: destination, status: 'cache' };
    }

    if (this.options.offline) {
      this.log('Tryb offline - pomijam pobieranie PoliMorf.');
      return { filePath: null, status: 'skipped' };
    }

    const candidates = [...POLIMORF_URL_CANDIDATES];
    const envUrl = process.env.POLIMORF_URL;
    if (envUrl) candidates.unshift(envUrl);

    const discovered = await this.discoverSgjpPoliMorfUrl();
    if (discovered) candidates.push(discovered);

    for (const url of candidates) {
      if (await this.downloadToFile(url, destination)) {
        return { filePath: destination, status: 'download' };
      }
    }

    this.log('Żadne ze źródeł PoliMorf nie odpowiedziało - używam korpusu offline.');
    return { filePath: null, status: 'offline-fallback' };
  }

  // ---------------------------------------------------------------------------
  // Import strumieniowy PoliMorf
  // ---------------------------------------------------------------------------

  /**
   * Importuje słownik PoliMorf strumieniowo.
   *
   * Plik (kilkaset MB po rozpakowaniu) nigdy nie trafia w całości do pamięci:
   * gzip jest dekompresowany w locie, `readline` wydaje wiersz po wierszu,
   * a zapisy lecą paczkami po `batchSize` w jednej transakcji.
   */
  public async importPoliMorfStream(filePath: string): Promise<{ linesRead: number; rowsWritten: number }> {
    const readStream = fs.createReadStream(filePath);
    const input = filePath.endsWith('.gz') ? readStream.pipe(zlib.createGunzip()) : readStream;

    const rl = readline.createInterface({ input, crlfDelay: Infinity });

    let linesRead = 0;
    let rowsWritten = 0;
    let batch: MorphEntry[] = [];
    const limit = this.options.maxPolimorfRows ?? Infinity;

    const flush = (): void => {
      if (batch.length === 0) return;
      rowsWritten += this.repo.insertMorphBatch(batch, 'priority');
      batch = [];
    };

    try {
      for await (const rawLine of rl) {
        linesRead++;

        const line = rawLine.trimEnd();
        if (!line || line.startsWith('#')) continue;

        const parts = line.split('\t');
        if (parts.length < 3) continue; // nagłówek licencyjny i puste wiersze

        const form = parts[0].trim();
        // Lematy homonimiczne bywają znakowane sufiksem (np. "bez:s1").
        const lemma = parts[1].split(':')[0].trim();
        const posTag = parts[2].split(':')[0].trim();

        if (!form || !lemma || !ALLOWED_POS_TAGS.has(posTag)) continue;
        if (form.length > 64 || form.includes(' ')) continue;

        batch.push({ form, lemma, posTag });

        if (batch.length >= this.batchSize) {
          flush();
          if (rowsWritten % (this.batchSize * 20) === 0) {
            this.log(`  ... zaimportowano ${rowsWritten.toLocaleString('pl-PL')} form`);
          }
        }

        if (rowsWritten >= limit) break;
      }

      flush();
    } finally {
      rl.close();
      readStream.destroy();
    }

    return { linesRead, rowsWritten };
  }

  /**
   * Zapisuje kuratorowany korpus dziedzinowy.
   *
   * Uruchamiany **po** PoliMorf i w trybie nadpisywania: słownictwo IT
   * ("mikroserwis", "konteneryzacja", nazwy technologii) jest nadrzędne wobec
   * korpusu ogólnego, dzięki czemu wynik lematyzacji nie zależy od tego, czy
   * pobranie PoliMorf się powiodło.
   */
  public importCuratedCorpus(): number {
    const corpus = buildOfflineMorphCorpus(technologyLemmas());
    let written = 0;
    for (let i = 0; i < corpus.length; i += this.batchSize) {
      written += this.repo.insertMorphBatch(corpus.slice(i, i + this.batchSize), 'override');
    }
    this.log(`Zapisano kuratorowany korpus dziedzinowy: ${written.toLocaleString('pl-PL')} form.`);
    return written;
  }

  // ---------------------------------------------------------------------------
  // Taksonomia ESCO
  // ---------------------------------------------------------------------------

  /**
   * Pobiera polskie etykiety umiejętności z publicznego API ESCO i zapisuje je
   * jako CSV w katalogu seed. Zapytania budujemy z nazw bazowych tezaurusa
   * offline, więc pokrycie odpowiada słownictwu, którego faktycznie używamy.
   */
  public async acquireEscoCsv(): Promise<{ filePath: string | null; status: SourceStatus }> {
    this.ensureSeedDir();
    const destination = path.join(this.seedDir, 'esco-skills.pl.csv');

    if (fs.existsSync(destination) && !this.options.force) {
      this.log(`Taksonomia ESCO już pobrana: ${destination}`);
      return { filePath: destination, status: 'cache' };
    }

    if (this.options.offline) {
      this.log('Tryb offline - pomijam pobieranie ESCO.');
      return { filePath: null, status: 'skipped' };
    }

    // Oficjalny pakiet CSV ESCO wymaga rejestracji; gdy użytkownik ma własny
    // adres (np. kopię w wewnętrznym repozytorium), użyjemy go wprost.
    const csvUrl = process.env.ESCO_CSV_URL;
    if (csvUrl && (await this.downloadToFile(csvUrl, destination))) {
      return { filePath: destination, status: 'download' };
    }

    const queries = [...new Set(buildOfflineSkillThesaurus().map((row) => row.canonicalName))];
    const collected = new Map<string, SkillSynonym>();
    let failures = 0;

    this.log(`Odpytywanie API ESCO o ${queries.length} haseł...`);

    for (const query of queries) {
      try {
        const url =
          `${ESCO_API_SEARCH}?text=${encodeURIComponent(query)}` +
          '&language=pl&type=skill&limit=5&full=true';
        const response = await this.fetchWithTimeout(url, 'application/json');
        if (!response.ok) {
          failures++;
          continue;
        }

        const payload = (await response.json()) as EscoSearchResponse;
        for (const result of payload._embedded?.results ?? []) {
          for (const row of escoResultToSynonyms(result)) {
            collected.set(`${row.canonicalName} ${row.altLabel}`, row);
          }
        }
      } catch {
        failures++;
      }
    }

    if (collected.size === 0) {
      this.log(`API ESCO nie zwróciło danych (${failures} nieudanych zapytań) - używam tezaurusa offline.`);
      return { filePath: null, status: 'offline-fallback' };
    }

    const csv = [
      'canonical_name,alt_label,category',
      ...[...collected.values()].map((row) =>
        [row.canonicalName, row.altLabel, row.category].map(csvEscape).join(',')
      ),
    ].join('\n');

    fs.writeFileSync(destination, `${csv}\n`, 'utf-8');
    this.log(`Zapisano ${collected.size.toLocaleString('pl-PL')} etykiet ESCO do ${destination}`);
    return { filePath: destination, status: 'download' };
  }

  /** Wczytuje wiersze tezaurusa z pliku CSV (strumieniowo, wiersz po wierszu). */
  public async readSkillCsv(filePath: string): Promise<SkillSynonym[]> {
    const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
    const rows: SkillSynonym[] = [];
    let header: string[] | null = null;

    try {
      for await (const line of rl) {
        if (!line.trim()) continue;
        const fields = parseCsvLine(line);

        if (!header) {
          header = fields.map((f) => f.trim().toLowerCase());
          continue;
        }

        const record: Record<string, string> = {};
        header.forEach((column, index) => {
          record[column] = fields[index] ?? '';
        });

        // Obsługujemy zarówno nasz format eksportu, jak i oryginalne kolumny ESCO.
        const canonicalName = (record['canonical_name'] || record['preferredlabel'] || '').trim();
        if (!canonicalName) continue;
        const category = (record['category'] || record['concepttype'] || 'ESCO').trim();

        const altLabelField = record['alt_label'] ?? record['altlabels'] ?? '';
        const altLabels = altLabelField
          .split(/[\n|]/)
          .map((value) => value.trim())
          .filter(Boolean);

        rows.push({ canonicalName, altLabel: canonicalName, category });
        for (const altLabel of altLabels) {
          rows.push({ canonicalName, altLabel, category });
        }
      }
    } finally {
      rl.close();
    }

    return rows;
  }

  /**
   * Zapisuje tezaurus umiejętności paczkami transakcyjnymi.
   *
   * Obok etykiety źródłowej zapisujemy jej wariant zlematyzowany
   * ("konteneryzacji dockerowej" -> "konteneryzacja dockerowy"), dzięki czemu
   * odmieniona fraza z CV trafia w indeks bez przeszukiwania tabeli.
   */
  public importSkillThesaurus(rows: SkillSynonym[]): number {
    const expanded = new Map<string, SkillSynonym>();

    for (const row of rows) {
      const canonicalName = row.canonicalName.toLowerCase().trim();
      const altLabel = row.altLabel.toLowerCase().trim();
      if (!canonicalName || !altLabel) continue;

      expanded.set(`${canonicalName} ${altLabel}`, { canonicalName, altLabel, category: row.category });

      const lemmatized = altLabel
        .split(/\s+/)
        .map((token) => this.repo.lookupLemma(token)?.lemma ?? token)
        .join(' ');

      if (lemmatized !== altLabel) {
        expanded.set(`${canonicalName} ${lemmatized}`, {
          canonicalName,
          altLabel: lemmatized,
          // Znacznik kategorii: wiersz jest indeksem wyszukiwania,
          // a nie zwrotem, który wolno pokazać jako synonim.
          category: markDerivedCategory(row.category),
        });
      }
    }

    const all = [...expanded.values()];
    let written = 0;
    for (let i = 0; i < all.length; i += this.batchSize) {
      written += this.repo.insertSynonymBatch(all.slice(i, i + this.batchSize));
    }
    return written;
  }

  // ---------------------------------------------------------------------------
  // Orkiestracja
  // ---------------------------------------------------------------------------

  /** Pełny przebieg: pobranie źródeł, import morfologii, import tezaurusa. */
  public async run(): Promise<LexiconImportReport> {
    const startedAt = Date.now();
    this.ensureSeedDir();

    // 1. Słownik morfologiczny -------------------------------------------------
    const { filePath: morphFile, status: morphStatus } = await this.acquirePoliMorf();

    let polimorfLinesRead = 0;
    let polimorfRowsWritten = 0;

    if (morphFile) {
      this.log(`Import PoliMorf (strumieniowo, paczki po ${this.batchSize.toLocaleString('pl-PL')})...`);
      const result = await this.importPoliMorfStream(morphFile);
      polimorfLinesRead = result.linesRead;
      polimorfRowsWritten = result.rowsWritten;
      this.log(
        `PoliMorf: przeczytano ${polimorfLinesRead.toLocaleString('pl-PL')} wierszy, ` +
          `zapisano ${polimorfRowsWritten.toLocaleString('pl-PL')} form.`
      );
    }

    const curatedRowsWritten = this.importCuratedCorpus();

    // 2. Tezaurus umiejętności -------------------------------------------------
    const { filePath: skillFile, status: skillStatus } = await this.acquireEscoCsv();

    const skillRows: SkillSynonym[] = buildOfflineSkillThesaurus();
    if (skillFile) {
      skillRows.push(...(await this.readSkillCsv(skillFile)));
    }

    const skillRowsWritten = this.importSkillThesaurus(skillRows);
    this.log(`Tezaurus umiejętności: zapisano ${skillRowsWritten.toLocaleString('pl-PL')} etykiet.`);

    return {
      morphSource: morphStatus,
      morphFile,
      polimorfLinesRead,
      polimorfRowsWritten,
      curatedRowsWritten,
      morphDictionarySize: this.repo.countMorphEntries(),

      skillSource: skillStatus,
      skillFile,
      skillRowsWritten,
      skillSynonymsSize: this.repo.countSkillSynonyms(),
      canonicalSkills: this.repo.countCanonicalSkills(),

      durationMs: Date.now() - startedAt,
    };
  }

  /**
   * Import bez sieci - wyłącznie kuratorowany korpus i tezaurus offline.
   * Używany w testach jednostkowych na bazie w pamięci.
   */
  public seedOfflineCorpus(): { morphRows: number; skillRows: number } {
    const morphRows = this.importCuratedCorpus();
    const skillRows = this.importSkillThesaurus(buildOfflineSkillThesaurus());
    return { morphRows, skillRows };
  }
}

// ---------------------------------------------------------------------------
// Pomocnicze
// ---------------------------------------------------------------------------

interface EscoSearchResult {
  className?: string;
  title?: string;
  preferredLabel?: Record<string, string | string[] | undefined>;
  alternativeLabel?: Record<string, string[] | undefined>;
}

interface EscoSearchResponse {
  _embedded?: { results?: EscoSearchResult[] };
}

function firstLabel(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

/**
 * Zamienia rekord ESCO na wiersze tezaurusa: polska etykieta preferowana jest
 * nazwą bazową, a polskie etykiety alternatywne i angielski odpowiednik
 * (dwujęzyczne CV to w IT norma) stają się jej synonimami.
 */
export function escoResultToSynonyms(result: EscoSearchResult): SkillSynonym[] {
  const canonical = (firstLabel(result.preferredLabel?.pl) ?? result.title ?? '').toLowerCase().trim();
  if (!canonical) return [];

  const rows: SkillSynonym[] = [{ canonicalName: canonical, altLabel: canonical, category: 'ESCO' }];

  const alternatives = [
    ...(result.alternativeLabel?.pl ?? []),
    firstLabel(result.preferredLabel?.en) ?? '',
    ...(result.alternativeLabel?.en ?? []),
  ];

  for (const alternative of alternatives) {
    const altLabel = (alternative ?? '').toLowerCase().trim();
    if (!altLabel || altLabel === canonical) continue;
    rows.push({ canonicalName: canonical, altLabel, category: 'ESCO' });
  }

  return rows;
}

/** Minimalny parser wiersza CSV (RFC 4180: cudzysłowy i podwojone cudzysłowy). */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ',') {
      fields.push(current);
      current = '';
    } else current += char;
  }

  fields.push(current);
  return fields;
}

export function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export type { SkillSeed };
