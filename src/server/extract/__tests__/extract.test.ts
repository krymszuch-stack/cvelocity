import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { extractJobPosting } from '../index';
import { extractFromJsonLd } from '../jsonLd';
import { extractMainContent, titleFromDocumentTitle } from '../fallbacks';

/**
 * Struktury w tych fixture'ach nie są wymyślone — odwzorowują bloki JSON-LD
 * pobrane z żywych ogłoszeń na justjoin.it i nofluffjobs.com (skrócone opisy
 * i lista krajów, reszta pól bez zmian).
 */

/** justjoin.it: JobPosting w korzeniu, widełki min/max, `unitText: "MONTH"`. */
const JUSTJOIN_HTML = `<!doctype html><html><head>
<title>Fullstack .NET Developer - SellIntegro - justjoin.it</title>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  datePosted: '2026-08-12T07:00:20.0655549Z',
  title: 'Fullstack .NET Developer',
  description:
    'Poszukujemy doświadczonego Fullstack Developera z technologiami przewodnimi: .NET 7+ oraz React. Wymagania: bardzo dobra znajomość .NET 7+, React 18+, Entity Framework, PostgreSQL, Docker i Kubernetes.',
  validThrough: '2026-08-27T21:59:59.999Z',
  employmentType: 'FULL_TIME',
  jobLocationType: 'TELECOMMUTE',
  baseSalary: {
    '@type': 'MonetaryAmount',
    currency: 'PLN',
    value: { '@type': 'QuantitativeValue', unitText: 'MONTH', minValue: 12000, maxValue: 17000 },
  },
  hiringOrganization: { '@type': 'Organization', name: 'SellIntegro' },
  jobLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressCountry: 'PL', addressLocality: 'Wrocław', addressRegion: '' },
  },
})}</script>
</head><body><main><h1>Fullstack .NET Developer</h1></main></body></html>`;

/**
 * NoFluffJobs: JobPosting schowany w `@graph`, pojedyncze `value` zamiast
 * widełek, `unitText: "Month"`, `validThrough: null`, niestandardowe `skills`
 * i `applicantLocationRequirements` z listą krajów całego świata.
 */
const NFJ_HTML = `<!doctype html><html><head>
<title>Senior PHP Developer | ingenious build | No Fluff Jobs</title>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: 'No Fluff Jobs' },
    { '@type': 'BreadcrumbList', itemListElement: [] },
    {
      '@type': 'JobPosting',
      title: 'Senior PHP Developer',
      description:
        'At INGENIOUS.BUILD we have developed a top-notch platform for companies in the real estate and construction industries worldwide. We are looking for a senior PHP engineer with Laravel and Symfony experience.',
      occupationalCategory: 'backend',
      datePosted: '2026-07-29',
      validThrough: null,
      employmentType: 'CONTRACTOR',
      hiringOrganization: { '@type': 'Organization', name: 'ingenious build' },
      experienceRequirements: { '@type': 'OccupationalExperienceRequirements', description: 'Senior' },
      applicantLocationRequirements: [
        'Poland', 'Hungary', 'Austria', 'Germany', 'Switzerland', 'France', 'Denmark', 'Norway',
        'Sweden', 'Finland', 'United Kingdom', 'United States', '---', 'Afghanistan', 'Albania',
        'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
      ].map((name) => ({ '@type': 'Country', name })),
      jobLocationType: 'TELECOMMUTE',
      jobBenefits: ['$500 office budget', 'PTO', 'Licenses for tools'],
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'PLN',
        value: { '@type': 'QuantitativeValue', value: 26000, unitText: 'Month' },
      },
      skills: [
        { value: 'PHP', type: 'main' },
        { value: 'Laravel', type: 'main' },
        { value: 'Symfony', type: 'main' },
      ],
    },
  ],
})}</script>
</head><body><main><h1>Senior PHP Developer</h1></main></body></html>`;

describe('Drabina ekstrakcji ogłoszeń', () => {
  describe('szczebel 1 — JSON-LD', () => {
    it('odczytuje komplet danych z justjoin.it bez udziału modelu', () => {
      const { job, tier, structured } = extractJobPosting(JUSTJOIN_HTML);

      expect(tier).toBe('json-ld');
      expect(structured).toBe(true);
      expect(job.title).toBe('Fullstack .NET Developer');
      expect(job.company).toBe('SellIntegro');
      expect(job.location).toBe('Wrocław');
      expect(job.remote).toBe(true);
      expect(job.employmentType).toBe('FULL_TIME');
      // Separator tysięcy to twarda spacja (U+00A0), żeby kwota nie łamała się
      // na dwie linie w interfejsie — zapisana jawnie, bo w tekście jest nie do
      // odróżnienia od zwykłej spacji.
      expect(job.salary).toBe('12 000 – 17 000 PLN / mies.');
      expect(job.description).toContain('Fullstack Developera');
    });

    it('znajduje JobPosting opakowany w @graph (NoFluffJobs)', () => {
      // Parser sprawdzający tylko `@type` w korzeniu zwróci tu pusto — korzeń
      // nie ma typu, JobPosting siedzi jako trzeci element @graph.
      const { job, tier } = extractJobPosting(NFJ_HTML);

      expect(tier).toBe('json-ld');
      expect(job.title).toBe('Senior PHP Developer');
      expect(job.company).toBe('ingenious build');
    });

    it('normalizuje unitText niezależnie od wielkości liter i obsługuje pojedynczą kwotę', () => {
      // justjoin.it wysyła "MONTH", NoFluffJobs "Month"; NFJ podaje jedną kwotę
      // zamiast widełek.
      expect(extractJobPosting(NFJ_HTML).job.salary).toBe('26 000 PLN / mies.');
    });

    it('czyta niestandardową tablicę skills {value, type} z NoFluffJobs', () => {
      expect(extractJobPosting(NFJ_HTML).job.skills).toEqual(['PHP', 'Laravel', 'Symfony']);
    });

    it('czyta jobBenefits i experienceRequirements', () => {
      const { job } = extractJobPosting(NFJ_HTML);
      expect(job.benefits).toEqual(['$500 office budget', 'PTO', 'Licenses for tools']);
      expect(job.seniority).toBe('Senior');
    });

    it('ignoruje applicantLocationRequirements będące listą krajów całego świata', () => {
      // 21 wpisów "od Afganistanu po Australię" znaczy "zdalnie skądkolwiek",
      // a nie lokalizację — wpisanie tego w pole lokalizacji byłoby śmieciem.
      expect(extractJobPosting(NFJ_HTML).job.location).toBeUndefined();
    });

    it('pomija validThrough podane jako null', () => {
      expect(extractJobPosting(NFJ_HTML).job.validThrough).toBeUndefined();
    });

    it('nie wywraca się na bloku ld+json z niepoprawnym JSON-em', () => {
      const html = `<html><head>
        <script type="application/ld+json">{to nie jest json</script>
        ${JUSTJOIN_HTML.slice(JUSTJOIN_HTML.indexOf('<script'))}`;

      expect(extractJobPosting(html).job.title).toBe('Fullstack .NET Developer');
    });

    it('zwraca null, gdy strona nie zawiera JobPosting', () => {
      const $ = cheerio.load(
        '<html><head><script type="application/ld+json">{"@type":"Article","headline":"X"}</script></head></html>'
      );
      expect(extractFromJsonLd($)).toBeNull();
    });
  });

  describe('szczebel 3 — treść główna', () => {
    it('nie duplikuje tekstu przy zagnieżdżonym <main> w <body>', () => {
      // Poprzednia wersja wołała $('main, article, body').text(), co jest SUMĄ
      // selektorów: tekst z <main> trafiał do wyniku dwa razy i przy limicie
      // znaków wypychał końcówkę ogłoszenia (zwykle wymagania).
      const html =
        '<html><body><main>WYMAGANIA: React TypeScript Node.js oraz doświadczenie w budowie aplikacji webowych i znajomość baz danych.</main></body></html>';

      const text = extractMainContent(cheerio.load(html));

      expect(text.match(/WYMAGANIA/g)).toHaveLength(1);
    });

    it('usuwa nawigację i stopkę, ale zostawia treść ogłoszenia', () => {
      const html = `<html><body>
        <nav>Strona główna Oferty Firmy Zaloguj</nav>
        <main>Szukamy backend developera ze znajomością Pythona, Django i PostgreSQL. Oferujemy pracę zdalną.</main>
        <footer>Regulamin Polityka prywatności</footer>
      </body></html>`;

      const text = extractMainContent(cheerio.load(html));

      expect(text).toContain('backend developera');
      expect(text).not.toContain('Polityka prywatności');
      expect(text).not.toContain('Zaloguj');
    });

    it('nie usuwa bloków JSON-LD przy czyszczeniu szumu', () => {
      // Czyszczenie musi zostawić ld+json, inaczej szczebel 1 nie ma czego czytać.
      const $ = cheerio.load(JUSTJOIN_HTML);
      extractMainContent($);
      expect($('script[type="application/ld+json"]').length).toBe(1);
    });
  });

  describe('tytuł z <title>', () => {
    it('nie ucina tytułów zawierających myślnik', () => {
      // split(/[-|]/)[0] zamieniał to na "Senior Full".
      expect(titleFromDocumentTitle('Senior Full-Stack Engineer - TechCorp')).toBe(
        'Senior Full-Stack Engineer'
      );
    });

    it('odcina nazwę portalu po pionowej kresce', () => {
      expect(titleFromDocumentTitle('Senior PHP Developer | No Fluff Jobs')).toBe(
        'Senior PHP Developer'
      );
    });

    it('zostawia tytuł bez separatora nietknięty', () => {
      expect(titleFromDocumentTitle('Fullstack .NET Developer')).toBe('Fullstack .NET Developer');
    });
  });

  describe('kolejność szczebli', () => {
    it('schodzi do OpenGraph, gdy nie ma ani JSON-LD, ani treści głównej', () => {
      const html = `<html><head>
        <meta property="og:title" content="Data Engineer - Acme">
        <meta property="og:description" content="Poszukujemy inżyniera danych z doświadczeniem w Sparku, Airflow i hurtowniach danych w chmurze.">
      </head><body></body></html>`;

      const { job, tier, structured } = extractJobPosting(html);

      expect(tier).toBe('open-graph');
      expect(structured).toBe(false);
      expect(job.title).toBe('Data Engineer');
      expect(job.description).toContain('inżyniera danych');
    });

    it('zgłasza brak treści, gdy strona nie zawiera nic użytecznego', () => {
      expect(extractJobPosting('<html><body><div>404</div></body></html>').tier).toBe('none');
    });
  });
});
