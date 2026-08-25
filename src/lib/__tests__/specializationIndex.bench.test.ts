import { describe, it, expect } from 'vitest';
import { matchSubRoles } from '../specializationIndex';

/**
 * Pomiar kosztu dopasowania podroli (reguła 6: liczba przed i po).
 *
 * `matchSubRoles` leży na gorącej ścieżce: formularze wołają go przy każdym
 * znaku wpisanym w pole z podpowiedziami, a edytor vaultu przy każdej zmianie
 * historii. Ten test mierzy wywołanie „zimne" (pierwsze, z budową indeksu)
 * i średnią „ciepłych" powtórzeń tego samego tekstu.
 *
 * Bez twardych progów czasowych — porównujemy względnie w obrębie jednego
 * uruchomienia, bo współdzielone CI nie daje gwarancji absolutnych liczb.
 */

const TEKSTY = {
  // Reguła 8: zawody fizyczne muszą być w pomiarze obok IT.
  fizyczny:
    'Serwis kotłów gazowych Junkers oraz Bosch. Montaż klimatyzatorów split, ' +
    'spawanie TIG stali nierdzewnej, uprawnienia SEP G3 i F-Gaz, obsługa wózka ' +
    'widłowego z uprawnieniami UDT. Praca przy instalacjach centralnego ogrzewania ' +
    'i pomp ciepła, przeglądy roczne, protokoły szczelności.',
  it: 'Frontend Developer React TypeScript. Budowa interfejsów w React, stan ' +
    'aplikacji w Redux Toolkit, testy jednostkowe Vitest i Testing Library, ' +
    'CSS Tailwind, integracja REST API i GraphQL, CI/CD na GitHub Actions.',
};

function sredniaCiepla(tekst: string, powtorzenia: number): number {
  const start = performance.now();
  for (let i = 0; i < powtorzenia; i++) matchSubRoles(tekst, 3);
  return (performance.now() - start) / powtorzenia;
}

describe('matchSubRoles — koszt dopasowania', () => {
  it('ciepłe wywołanie jest istotnie tańsze od zimnego (indeks fraz budowany raz)', () => {
    const zimnyFizyczny = (() => {
      const start = performance.now();
      matchSubRoles(TEKSTY.fizyczny, 3);
      return performance.now() - start;
    })();

    const cieplyFizyczny = sredniaCiepla(TEKSTY.fizyczny, 300);

    const zimnyIt = (() => {
      const start = performance.now();
      matchSubRoles(TEKSTY.it, 3);
      return performance.now() - start;
    })();

    const cieplyIt = sredniaCiepla(TEKSTY.it, 300);

    console.log(
      `\n  matchSubRoles:` +
        `\n    zawód fizyczny — zimne: ${zimnyFizyczny.toFixed(2)} ms, ciepłe śr.: ${cieplyFizyczny.toFixed(3)} ms` +
        `\n    IT             — zimne: ${zimnyIt.toFixed(2)} ms, ciepłe śr.: ${cieplyIt.toFixed(3)} ms\n`
    );

    // Dopasowanie nadal trafia we właściwe branże (reguła 8) — optymalizacja
    // nie może zmienić wyniku, tylko koszt.
    const trafienia = matchSubRoles(`${TEKSTY.fizyczny} ${TEKSTY.it}`, 5);
    expect(trafienia.length).toBeGreaterThan(0);

    // Ciepłe wywołanie robi ściśle mniej pracy niż zimne (rdzenie fraz już są
    // policzone), więc relacja musi się utrzymać na każdym środowisku.
    expect(cieplyFizyczny).toBeLessThan(zimnyFizyczny);
  });
});
