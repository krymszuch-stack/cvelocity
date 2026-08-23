#!/usr/bin/env node
/**
 * Pilnuje, żeby pliki reguł mieściły się w limicie Antigravity.
 *
 * Antigravity przycina plik reguł powyżej 12 000 znaków i **nie zgłasza tego
 * błędem** — kontrakt po prostu urywa się w połowie, a agent pracuje dalej na
 * tym, co zostało. Ten skrypt zamienia cichą utratę reguł w czerwony build.
 *
 * Uwaga na pułapkę, na którą łatwo się nadziać przy polskim tekście: `wc -m`
 * bez ustawionego locale zwraca **bajty**, nie znaki. Dla `AGENTS.md` dawało to
 * 12 084 zamiast 11 585 — zawyżenie o 4%, wystarczające, żeby zgłosić awarię,
 * której nie ma. Liczymy więc `[...tekst].length`, czyli punkty kodowe.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Limit Antigravity dla pliku reguł w przestrzeni roboczej. */
const LIMIT = 12_000;

/**
 * Próg alarmu z zapasem. Plik dobity dokładnie do limitu pęka przy pierwszej
 * poprawce literówki — 500 znaków zapasu to miejsce na jedną sensowną dopiskę.
 */
const PROG = 11_500;

/** Katalogi, których zawartość `.md` w całości podlega limitowi. */
const KATALOGI = ['.agents/rules', '.agents/workflows'];

/** Pojedyncze pliki czytane przez Antigravity jako reguły. */
const PLIKI = ['AGENTS.md', 'GEMINI.md'];

function zbierzPliki() {
  const wynik = [];

  for (const plik of PLIKI) {
    if (existsSync(plik)) wynik.push(plik);
  }

  for (const katalog of KATALOGI) {
    if (!existsSync(katalog)) continue;
    for (const nazwa of readdirSync(katalog)) {
      if (nazwa.endsWith('.md')) wynik.push(join(katalog, nazwa));
    }
  }

  return wynik.sort();
}

const pliki = zbierzPliki();

if (pliki.length === 0) {
  console.error('Nie znalazłem żadnego pliku reguł — sprawdź, czy uruchamiasz to z katalogu głównego repo.');
  process.exit(2);
}

let przekroczone = 0;
let ostrzezenia = 0;

console.log(`Limit Antigravity: ${LIMIT} znaków, próg alarmu: ${PROG}\n`);

for (const plik of pliki) {
  // Punkty kodowe, nie bajty i nie jednostki UTF-16 — polskie znaki
  // diakrytyczne zajmują dwa bajty, ale liczą się jako jeden znak.
  const znaki = [...readFileSync(plik, 'utf8')].length;
  const procent = Math.round((znaki / LIMIT) * 100);

  let status = '  ok  ';
  if (znaki > PROG) {
    status = ' BŁĄD ';
    przekroczone++;
  } else if (znaki > PROG * 0.9) {
    status = 'ostrz.';
    ostrzezenia++;
  }

  console.log(`[${status}] ${plik.padEnd(46)} ${String(znaki).padStart(6)} znaków  (${procent}% limitu)`);
}

console.log();

if (przekroczone > 0) {
  console.error(
    `${przekroczone} plik(i) powyżej progu ${PROG}. Antigravity obetnie je bez ostrzeżenia.\n` +
      'Przenieś część treści do docs/ i zostaw odsyłacz — tak zrobiono z sekcją\n' +
      'o delegowaniu (docs/agents/delegowanie.md). Nie kopiuj reguł do drugiego pliku.'
  );
  process.exit(1);
}

if (ostrzezenia > 0) {
  console.log(`${ostrzezenia} plik(i) zbliżają się do progu — czas pomyśleć o wydzieleniu treści.`);
}

console.log('Wszystkie pliki reguł mieszczą się w limicie.');
