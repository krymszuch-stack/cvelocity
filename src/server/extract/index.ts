import * as cheerio from 'cheerio';
import type { ExtractedJob, ExtractionResult } from './types';
import { extractFromJsonLd } from './jsonLd';
import {
  companyFromMarkup,
  extractFromOpenGraph,
  extractMainContent,
  titleFromDocumentTitle,
  MIN_USABLE_DESCRIPTION,
} from './fallbacks';

export type { ExtractedJob, ExtractionResult, ExtractionTier } from './types';
export { MIN_USABLE_DESCRIPTION } from './fallbacks';

/**
 * Drabina ekstrakcji ogłoszenia.
 *
 * Kolejność jest celowa: schodzimy w dół tylko wtedy, gdy wyższy szczebel nie
 * dał treści. Szczeble 1–3 są deterministyczne i darmowe, więc każdy z nich
 * oszczędza całe wywołanie modelu — a na justjoin.it i nofluffjobs.com szczebel
 * pierwszy wystarcza do kompletu danych (tytuł, firma, widełki, tryb pracy,
 * umiejętności), co wcześniej próbowaliśmy uzyskiwać płatnym wywołaniem AI.
 *
 * 1. JSON-LD `schema.org/JobPosting`
 * 2. OpenGraph
 * 3. Treść główna dokumentu
 *
 * Do modelu (szczebel 4) zjeżdżamy poza tym modułem i tylko po to, by rozbić
 * `description` na wymagania i obowiązki — nigdy po dane, które już mamy.
 */
export function extractJobPosting(html: string): ExtractionResult {
  // Jeden parse na całą drabinę. Szczebel 3 usuwa węzły z drzewa, więc JSON-LD
  // musi zostać odczytany wcześniej — kolejność wywołań poniżej to gwarantuje.
  const $ = cheerio.load(html);

  const documentTitle = titleFromDocumentTitle($('title').first().text());
  const headingTitle = $('h1').first().text().replace(/\s+/g, ' ').trim();

  const structured = extractFromJsonLd($);
  if (structured && structured.description.length >= MIN_USABLE_DESCRIPTION) {
    return {
      job: {
        ...structured,
        title: structured.title || headingTitle || documentTitle,
      },
      tier: 'json-ld',
      structured: true,
    };
  }

  const openGraph = extractFromOpenGraph($);
  const markupCompany = companyFromMarkup($);

  // Dopiero teraz — ta funkcja usuwa węzły z dokumentu.
  const mainText = extractMainContent($);

  // JSON-LD bez treści (sam tytuł i firma) nadal jest lepszym źródłem metadanych
  // niż zgadywanie z znaczników — zachowujemy je i dokładamy tylko opis.
  const base: ExtractedJob = structured ?? { title: '', company: '', description: '' };

  const description =
    base.description.length >= MIN_USABLE_DESCRIPTION
      ? base.description
      : mainText.length >= MIN_USABLE_DESCRIPTION
        ? mainText
        : (openGraph.description ?? '');

  const job: ExtractedJob = {
    ...base,
    title: base.title || headingTitle || openGraph.title || documentTitle,
    company: base.company || markupCompany || openGraph.company || '',
    description,
  };

  if (structured) return { job, tier: 'json-ld', structured: true };
  if (mainText.length >= MIN_USABLE_DESCRIPTION) return { job, tier: 'main-content', structured: false };
  if (description.length > 0) return { job, tier: 'open-graph', structured: false };

  return { job, tier: 'none', structured: false };
}
