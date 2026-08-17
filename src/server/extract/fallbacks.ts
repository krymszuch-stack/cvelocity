import type { CheerioAPI } from 'cheerio';
import type { ExtractedJob } from './types';

/**
 * Szczeble 2–3 drabiny: metadane OpenGraph i ekstrakcja treści głównej.
 * Oba nadal deterministyczne i darmowe — model jest ostatecznością, nie normą.
 */

/** Górny limit treści przekazywanej dalej; ~60 kB to i tak limit wejścia modelu. */
const MAX_DESCRIPTION_CHARS = 20_000;

/** Poniżej tylu znaków uznajemy, że ekstrakcja nie znalazła realnej treści. */
export const MIN_USABLE_DESCRIPTION = 80;

/**
 * Elementy, które nigdy nie niosą treści ogłoszenia. Uwaga: `script` NIE jest
 * tu usuwany globalnie — bloki `application/ld+json` muszą przetrwać do
 * szczebla 1. Usuwamy wyłącznie skrypty wykonywalne.
 */
const NOISE_SELECTORS = [
  'script:not([type="application/ld+json"])',
  'style',
  'svg',
  'noscript',
  'iframe',
  'header',
  'footer',
  'nav',
  'aside',
  'form',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[aria-hidden="true"]',
  '[aria-label*="cookie" i]',
  '[class*="cookie" i]',
  '[class*="newsletter" i]',
].join(', ');

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Tytuł z elementu `<title>`.
 *
 * Wcześniej robił to `split(/[-|]/)[0]`, który kaleczył każdy tytuł
 * zawierający myślnik: „Senior Full-Stack Engineer – TechCorp" stawało się
 * „Senior Full". Odcinamy więc tylko wyraźny separator (myślnik lub pionowa
 * kreska otoczone spacjami) i tylko ostatni jego wystąpienie, bo nazwa portalu
 * jest zawsze na końcu.
 */
export function titleFromDocumentTitle(rawTitle: string): string {
  const title = collapse(rawTitle);
  if (!title) return '';

  const separator = /\s+[|–—·]\s+|\s+-\s+/g;
  const parts = title.split(separator).filter(Boolean);
  if (parts.length <= 1) return title;

  // Ostatni fragment to zwykle nazwa portalu („No Fluff Jobs", „justjoin.it").
  parts.pop();
  return parts.join(' - ').trim() || title;
}

/** Szczebel 2: OpenGraph. Do tej pory nieczytany w ogóle, choć jest darmowy. */
export function extractFromOpenGraph($: CheerioAPI): Partial<ExtractedJob> {
  const meta = (property: string): string =>
    collapse(
      $(`meta[property="${property}"]`).attr('content') ??
        $(`meta[name="${property}"]`).attr('content') ??
        ''
    );

  const result: Partial<ExtractedJob> = {};

  const title = meta('og:title') || meta('twitter:title');
  if (title) result.title = titleFromDocumentTitle(title);

  const description = meta('og:description') || meta('twitter:description') || meta('description');
  if (description) result.description = description;

  const siteName = meta('og:site_name');
  if (siteName) result.company = siteName;

  return result;
}

/**
 * Szczebel 3: treść główna dokumentu.
 *
 * Poprzednia wersja wołała `$('main, article, [role="main"], body').text()`, co
 * jest **sumą** selektorów — gdy `<main>` leży wewnątrz `<body>`, cheerio skleja
 * tekst obu elementów i ta sama treść pojawia się dwa razy, w dodatku bez
 * separatora („…TypeScriptWYMAGANIA…"). Przy limicie 5000 znaków oznaczało to,
 * że druga połowa ogłoszenia (zwykle wymagania) w ogóle nie trafiała dalej.
 *
 * Teraz wybieramy **jeden** kontener — pierwszy, który faktycznie istnieje.
 */
export function extractMainContent($: CheerioAPI): string {
  $(NOISE_SELECTORS).remove();

  for (const selector of ['main', '[role="main"]', 'article', 'body']) {
    const node = $(selector).first();
    if (node.length === 0) continue;

    const text = collapse(node.text());
    if (text.length >= MIN_USABLE_DESCRIPTION) return text.slice(0, MAX_DESCRIPTION_CHARS);
  }

  return collapse($.root().text()).slice(0, MAX_DESCRIPTION_CHARS);
}

/**
 * Nazwa firmy z atrybutów klas/danych. Heurystyka ostatniej szansy — bierzemy
 * krótki tekst, bo dopasowanie po `[class*="company"]` łatwo trafia w kontener
 * z całą sekcją „o firmie".
 */
export function companyFromMarkup($: CheerioAPI): string {
  const candidates = $(
    '[itemprop="hiringOrganization"], [data-testid*="company" i], [class*="company-name" i], [class*="employer" i], [class*="company" i]'
  );

  for (const element of candidates.toArray()) {
    const text = collapse($(element).text());
    if (text.length >= 2 && text.length <= 80) return text;
  }

  return '';
}
