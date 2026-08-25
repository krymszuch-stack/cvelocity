import type { CheerioAPI } from 'cheerio';
import type { ExtractedJob } from './types';

/**
 * Szczebel drabiny: stan hydracji frameworków SPA.
 *
 * Portale single-page renderują ofertę w przeglądarce, ale dane oferty prawie
 * zawsze leżą w HTML-u w bloku stanu początkowego — gotowe do sparsowania bez
 * Chromium. Uruchamianie przeglądarki po to, żeby odczytać JSON, który serwer
 * i tak wysłał, kosztowałoby gigabajty RAM-u na Cloud Run dla informacji, która
 * jest już w odpowiedzi.
 *
 * Obsługiwane kształty (zweryfikowane na polskich portalach):
 * - Next.js: `<script id="__NEXT_DATA__" type="application/json">{...}</script>`
 * - Vue/Nuxt oraz różne React-appki: `window.__NUXT__ = {...}` albo
 *   `window.__INITIAL_STATE__ = {...}` we wpisanym skrypcie.
 */

/** Jak głęboko schodzimy w poszukiwaniu obiektu oferty w stanie aplikacji. */
const MAX_SEARCH_DEPTH = 8;

type JsonValue = Record<string, unknown>;

function asRecord(value: unknown): JsonValue | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonValue)
    : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Aliasy pól spotykane w stanach różnych frameworków. Klucze sprawdzamy
 * nierozróżniając wielkości liter — `jobTitle` i `jobtitle` opisują to samo,
 * a walka o konwencję nazewnictwa cudzej aplikacji nie jest naszym zadaniem.
 */
const FIELD_ALIASES: Record<keyof Pick<ExtractedJob, 'title' | 'company' | 'description'>, string[]> =
  {
    title: ['jobtitle', 'title', 'positionname', 'offername'],
    company: ['companyname', 'company', 'employername', 'hiringorganization'],
    description: ['description', 'jobdescription', 'descriptiontext', 'offerdescription'],
  };

function findField(node: JsonValue, aliases: string[], depth: number): string {
  if (depth > MAX_SEARCH_DEPTH) return '';

  for (const [key, value] of Object.entries(node)) {
    if (!aliases.includes(key.toLowerCase())) continue;

    // hiringOrganization bywa obiektem schema.org z polem name.
    const record = asRecord(value);
    if (record && typeof record.name === 'string') return record.name.trim();
    const text = asString(value);
    // Dłuższe teksty trafiają tu tylko jako treść opisu; krótkie „…” albo
    // „Brak danych” odfiltruje późniejsza walidacja długości w drabinie.
    if (text) return text;
  }

  for (const value of Object.values(node)) {
    const child = asRecord(value);
    if (!child) continue;
    const found = findField(child, aliases, depth + 1);
    if (found) return found;
  }

  return '';
}

function jobFromState(state: unknown): Partial<ExtractedJob> | null {
  const root = asRecord(state);
  if (!root) return null;

  const title = findField(root, FIELD_ALIASES.title, 0);
  const company = findField(root, FIELD_ALIASES.company, 0);
  const description = findField(root, FIELD_ALIASES.description, 0);

  if (!title && !company && !description) return null;

  return { ...(title ? { title } : {}), ...(company ? { company } : {}), ...(description ? { description } : {}) };
}

/** Parsuje JSON, zwracając `null` zamiast rzucać — uszkodzony stan to nie awaria. */
function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Wyciąga obiekt z przypisania `window.X = ...`. Stan potrafi być czystym
 * JSON-em albo wyrażeniem JS (`(function(){...})()` w Nuxt) — te drugie
 * pomijamy: bezpieczna parsowalność jest ważniejsza niż pełny zasięg.
 */
function extractWindowAssignment(scripts: string[], windowKey: string): unknown {
  const pattern = new RegExp(`window\\.${windowKey}\\s*=\\s*`, 'g');

  for (const code of scripts) {
    const match = pattern.exec(code);
    pattern.lastIndex = 0;
    if (!match) continue;

    const start = match.index + match[0].length;
    const opening = code[start];
    if (opening !== '{' && opening !== '[') continue;

    // Znajdź pasujący klamrowy koniec licząc głębokość — średnik w środku
    // stringa nie może przerwać cięcia w pół obiektu.
    let depth = 0;
    let inString: string | null = null;
    for (let i = start; i < code.length; i++) {
      const char = code[i];
      if (inString) {
        if (char === '\\') i++;
        else if (char === inString) inString = null;
        continue;
      }
      if (char === '"' || char === "'") inString = char;
      else if (char === '{' || char === '[') depth++;
      else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0) {
          return safeJsonParse(code.slice(start, i + 1));
        }
      }
    }
  }

  return null;
}

export function extractHydrationState($: CheerioAPI): Partial<ExtractedJob> | null {
  // Next.js: poprawny JSON w atrybucie id.
  const nextData = $('#__NEXT_DATA__').first().html();
  if (nextData) {
    const parsed = safeJsonParse(nextData);
    const job = jobFromState(parsed);
    if (job) return job;
  }

  // Treści wpisanych skryptów nie ma w usuwanych wcześniej węzłach — ta
  // funkcja działa przed ekstrakcją treści głównej (patrz kolejność w index.ts).
  const inlineScripts = $('script:not([src])')
    .toArray()
    .map((element) => $(element).html() ?? '');

  const nuxt = extractWindowAssignment(inlineScripts, '__NUXT__');
  const nuxtJob = jobFromState(nuxt);
  if (nuxtJob) return nuxtJob;

  const initialState = extractWindowAssignment(inlineScripts, '__INITIAL_STATE__');
  return jobFromState(initialState);
}
