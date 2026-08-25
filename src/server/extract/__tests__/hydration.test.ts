import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { extractHydrationState } from '../hydration';
import { detectPortal, looksLikeSpaSkeleton, SPA_SKELETON_MIN_TEXT } from '../spaDetector';
import { extractJobPosting } from '../index';

const LONG_DESCRIPTION =
  'Zakres obowiązków: budowa i utrzymanie aplikacji, code review, współpraca ' +
  'z zespołem produktowym. Wymagania: doświadczenie w React i TypeScript, ' +
  'znajomość testów jednostkowych. Oferujemy pracę hybrydową i budżet szkoleniowy.';

describe('warstwa hydracji stanu SPA', () => {
  it('odczytuje ofertę z bloku __NEXT_DATA__ (Next.js)', () => {
    const html = `<!doctype html><html><head><title>Oferta</title></head><body>
      <div id="__next"></div>
      <script id="__NEXT_DATA__" type="application/json">
        {"props":{"pageProps":{"offer":{"jobTitle":"Frontend Developer","companyName":"TechCorp","description":"${LONG_DESCRIPTION}"}}}}
      </script>
    </body></html>`;

    const state = extractHydrationState(cheerio.load(html));
    expect(state).toEqual({
      title: 'Frontend Developer',
      company: 'TechCorp',
      description: LONG_DESCRIPTION,
    });
  });

  it('odczytuje przypisanie window.__INITIAL_STATE__ ze skryptu inline', () => {
    const html = `<html><body>
      <script>window.__INITIAL_STATE__ = {"listing":{"title":"Backend Engineer","company":{"name":"DataWorks"},"description":"${LONG_DESCRIPTION}"}};
      console.log("bootstrap");</script>
    </body></html>`;
    // Uwaga na średnik wewnątrz stringa — cięcie po zbalansowanych nawiasach
    // musi go przetrwać.
    const withTrap = html.replace('console.log', '"średnik; w stringu";console.log');

    const state = extractHydrationState(cheerio.load(withTrap));
    expect(state?.title).toBe('Backend Engineer');
    expect(state?.company).toBe('DataWorks');
  });

  it('uszkodzony JSON w stanie daje null zamiast wyjątku', () => {
    const html = `<html><script id="__NEXT_DATA__" type="application/json">{zepsuty json</script></html>`;
    expect(extractHydrationState(cheerio.load(html))).toBeNull();
  });

  it('drabina wybiera szczebel hydration, gdy JSON-LD nie istnieje', () => {
    const html = `<!doctype html><html><head><title>Oferta — Portal</title></head><body>
      <div id="app">ładowanie…</div>
      <script id="__NEXT_DATA__" type="application/json">
        {"pageProps":{"job":{"jobTitle":"DevOps Engineer","companyName":"CloudSp. z o.o.","description":"${LONG_DESCRIPTION}"}}}
      </script>
    </body></html>`;

    const result = extractJobPosting(html);
    expect(result.tier).toBe('hydration');
    expect(result.structured).toBe(true);
    expect(result.job.title).toBe('DevOps Engineer');
    expect(result.job.company).toBe('CloudSp. z o.o.');
  });
});

describe('detekcja pustego szkieletu SPA', () => {
  it('pusty kontener montowania to szkielet niezależnie od rozmiaru HTML', () => {
    const skeleton = `<html><head><script src="/app.js"></script></head><body>
      <div id="root"><div class="loader">…</div></div></body></html>`;
    expect(looksLikeSpaSkeleton(skeleton)).toBe(true);
  });

  it('strona z realną treścią nie jest szkieletem', () => {
    const page = `<html><body><main>${'Opis stanowiska i wymagania. '.repeat(30)}</main></body></html>`;
    expect(looksLikeSpaSkeleton(page)).toBe(false);
  });

  it('próg ma sens liczbowy: tekst tuż pod progiem to szkielet', () => {
    const short = `<html><body>${'x'.repeat(SPA_SKELETON_MIN_TEXT - 5)}</body></html>`;
    expect(looksLikeSpaSkeleton(short)).toBe(true);
  });
});

describe('rozpoznawanie portalu', () => {
  it('rozpoznaje znane portale po adresie URL', () => {
    expect(detectPortal('https://www.pracuj.pl/praca/123')).toBe('Pracuj.pl');
    expect(detectPortal('https://justjoin.it/offers/abc')).toBe('JustJoin.it');
    expect(detectPortal('https://nofluffjobs.com/pl/job/x')).toBe('No Fluff Jobs');
  });

  it('nieznany host zwraca null — brak etykiety nie jest błędem', () => {
    expect(detectPortal('https://firma-przykladowa.example/rekrutacja')).toBeNull();
  });

  it('przyjmuje też samą nazwę hosta bez schematu', () => {
    expect(detectPortal('rocketjobs.pl')).toBe('RocketJobs');
  });
});
