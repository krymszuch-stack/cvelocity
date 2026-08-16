import type { CheerioAPI } from 'cheerio';
import * as cheerio from 'cheerio';
import type { ExtractedJob } from './types';

/**
 * Szczebel 1 drabiny: schema.org/JobPosting z bloków `application/ld+json`.
 *
 * To jest najcenniejszy szczebel — na justjoin.it i nofluffjobs.com tytuł,
 * firma, widełki z walutą, tryb pracy i lista umiejętności są podane wprost,
 * deterministycznie i za darmo. Zero halucynacji, zero kosztu modelu.
 *
 * Kształty zweryfikowane na żywych ogłoszeniach z obu portali — stąd obsługa
 * rozbieżności, które naiwny parser przeoczy (patrz komentarze niżej).
 */

/** Ile wpisów w `applicantLocationRequirements` uznajemy jeszcze za informację. */
const MAX_MEANINGFUL_LOCATIONS = 15;

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
 * `@type` bywa stringiem albo tablicą (`["JobPosting", "Thing"]`).
 */
function hasType(node: unknown, type: string): boolean {
  const record = asRecord(node);
  if (!record) return false;
  const raw = record['@type'];
  if (typeof raw === 'string') return raw === type;
  if (Array.isArray(raw)) return raw.some((entry) => entry === type);
  return false;
}

/**
 * Wyszukuje węzeł JobPosting w dowolnie zagnieżdżonej strukturze.
 *
 * NoFluffJobs opakowuje wszystko w `@graph` — węzeł najwyższego poziomu ma
 * wtedy `@type: undefined`, więc parser sprawdzający tylko korzeń zwróci pusto.
 * Zweryfikowane: ich `@graph` zawiera Organization, BreadcrumbList i JobPosting.
 */
function findJobPosting(node: unknown, depth = 0): JsonValue | null {
  if (depth > 6) return null;

  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findJobPosting(entry, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const record = asRecord(node);
  if (!record) return null;
  if (hasType(record, 'JobPosting')) return record;

  for (const key of ['@graph', 'mainEntity', 'itemListElement']) {
    if (key in record) {
      const found = findJobPosting(record[key], depth + 1);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Opis w JSON-LD bywa HTML-em (`<p>`, `<ul>`), a bywa czystym tekstem.
 * Przepuszczamy przez cheerio bezwarunkowo — dla czystego tekstu to no-op.
 */
function htmlToText(raw: string): string {
  if (!raw) return '';
  const text = raw.includes('<') ? cheerio.load(`<div>${raw}</div>`)('div').text() : raw;
  return text.replace(/\s+/g, ' ').trim();
}

/** `"PL"` (justjoin) i `"POL"` (NFJ) opisują ten sam kraj. */
function normalizeCountry(raw: string): string {
  const value = raw.trim().toUpperCase();
  if (value === 'PL' || value === 'POL' || value === 'POLAND' || value === 'POLSKA') return 'PL';
  return value;
}

/** justjoin.it wysyła `"MONTH"`, NoFluffJobs `"Month"` — to samo pole. */
const UNIT_LABELS: Record<string, string> = {
  HOUR: 'godz.',
  DAY: 'dzień',
  WEEK: 'tydz.',
  MONTH: 'mies.',
  YEAR: 'rok',
};

function formatAmount(value: number): string {
  // Wąska spacja rozdzielająca tysiące; unikamy zależności od locale środowiska.
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Składa widełki w jeden czytelny ciąg.
 *
 * Obsługuje oba warianty spotkane na żywo: `minValue`/`maxValue` (justjoin.it)
 * oraz pojedyncze `value` (NoFluffJobs).
 */
function extractSalary(node: JsonValue): string | undefined {
  const base = asRecord(node.baseSalary);
  if (!base) return undefined;

  const currency = asString(base.currency) || asString(base.currencyCode);
  const amount = asRecord(base.value);
  if (!amount) return undefined;

  const min = typeof amount.minValue === 'number' ? amount.minValue : undefined;
  const max = typeof amount.maxValue === 'number' ? amount.maxValue : undefined;
  const single = typeof amount.value === 'number' ? amount.value : undefined;

  const unitKey = asString(amount.unitText).toUpperCase();
  const unit = UNIT_LABELS[unitKey];
  const suffix = [currency, unit ? `/ ${unit}` : ''].filter(Boolean).join(' ');

  let range: string;
  if (min !== undefined && max !== undefined) {
    range = min === max ? formatAmount(min) : `${formatAmount(min)} – ${formatAmount(max)}`;
  } else if (single !== undefined) {
    range = formatAmount(single);
  } else if (min !== undefined) {
    range = `od ${formatAmount(min)}`;
  } else if (max !== undefined) {
    range = `do ${formatAmount(max)}`;
  } else {
    return undefined;
  }

  return suffix ? `${range} ${suffix}` : range;
}

function extractLocation(node: JsonValue): string | undefined {
  const place = Array.isArray(node.jobLocation) ? node.jobLocation[0] : node.jobLocation;
  const address = asRecord(asRecord(place)?.address);

  if (address) {
    const city = asString(address.addressLocality);
    const region = asString(address.addressRegion);
    const country = normalizeCountry(asString(address.addressCountry));
    const parts = [city, region, country === 'PL' ? '' : country].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }

  // `applicantLocationRequirements` bywa listą ~200 krajów świata (zweryfikowane
  // na NoFluffJobs) — to znaczy „zdalnie skądkolwiek", a nie lokalizacja.
  // Czytamy je tylko, gdy lista jest na tyle krótka, że coś faktycznie zawęża.
  const requirements = node.applicantLocationRequirements;
  const list = Array.isArray(requirements) ? requirements : requirements ? [requirements] : [];
  if (list.length > 0 && list.length <= MAX_MEANINGFUL_LOCATIONS) {
    const names = list
      .map((entry) => asString(asRecord(entry)?.name))
      .filter((name) => name && name !== '---');
    if (names.length > 0) return names.join(', ');
  }

  return undefined;
}

/**
 * `skills` nie jest polem schema.org — NoFluffJobs wysyła tam własną tablicę
 * obiektów `{value, type}`. Przyjmujemy też zwykłą tablicę stringów i pojedynczy
 * string rozdzielony przecinkami, bo warianty bywają różne między portalami.
 */
function extractSkills(raw: unknown): string[] | undefined {
  const collected: string[] = [];

  if (typeof raw === 'string') {
    collected.push(...raw.split(','));
  } else if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry === 'string') collected.push(entry);
      else {
        const value = asString(asRecord(entry)?.value) || asString(asRecord(entry)?.name);
        if (value) collected.push(value);
      }
    }
  }

  const cleaned = [...new Set(collected.map((s) => s.trim()).filter(Boolean))];
  return cleaned.length > 0 ? cleaned : undefined;
}

function extractBenefits(raw: unknown): string[] | undefined {
  if (typeof raw === 'string') {
    const single = htmlToText(raw);
    return single ? [single] : undefined;
  }
  if (!Array.isArray(raw)) return undefined;

  const cleaned = raw
    .map((entry) => (typeof entry === 'string' ? entry.trim() : asString(asRecord(entry)?.name)))
    .filter(Boolean);
  return cleaned.length > 0 ? [...new Set(cleaned)] : undefined;
}

function extractSeniority(node: JsonValue): string | undefined {
  const requirements = node.experienceRequirements;
  if (typeof requirements === 'string') return requirements.trim() || undefined;
  const description = asString(asRecord(requirements)?.description);
  return description || undefined;
}

/** Zwraca surowe teksty wszystkich bloków ld+json obecnych w dokumencie. */
export function collectJsonLdBlocks($: CheerioAPI): string[] {
  const blocks: string[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).contents().text().trim();
    if (raw) blocks.push(raw);
  });
  return blocks;
}

/**
 * Zwraca dane ogłoszenia albo `null`, gdy strona nie zawiera JobPosting.
 * Blok z niepoprawnym JSON-em jest pomijany, a nie wywraca całej ekstrakcji —
 * jedna zepsuta wtyczka analityczna na stronie nie może kosztować nas wywołania AI.
 */
export function extractFromJsonLd($: CheerioAPI): ExtractedJob | null {
  for (const raw of collectJsonLdBlocks($)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const node = findJobPosting(parsed);
    if (!node) continue;

    const title = asString(node.title);
    const description = htmlToText(asString(node.description));
    if (!title && !description) continue;

    const organization = asRecord(node.hiringOrganization);
    const employmentType = Array.isArray(node.employmentType)
      ? asString(node.employmentType[0])
      : asString(node.employmentType);

    const job: ExtractedJob = {
      title,
      company: asString(organization?.name),
      description,
    };

    const location = extractLocation(node);
    if (location) job.location = location;

    // TELECOMMUTE to jedyna wartość, z której wolno wnioskować pracę zdalną.
    // Jej brak nie znaczy „stacjonarnie", więc pole zostaje niezdefiniowane.
    if (asString(node.jobLocationType).toUpperCase() === 'TELECOMMUTE') job.remote = true;

    if (employmentType) job.employmentType = employmentType.toUpperCase();

    const salary = extractSalary(node);
    if (salary) job.salary = salary;

    const seniority = extractSeniority(node);
    if (seniority) job.seniority = seniority;

    const skills = extractSkills(node.skills);
    if (skills) job.skills = skills;

    const benefits = extractBenefits(node.jobBenefits);
    if (benefits) job.benefits = benefits;

    // `validThrough` bywa jawnym `null` (zweryfikowane na NoFluffJobs).
    const datePosted = asString(node.datePosted);
    if (datePosted) job.datePosted = datePosted;
    const validThrough = asString(node.validThrough);
    if (validThrough) job.validThrough = validThrough;

    return job;
  }

  return null;
}
