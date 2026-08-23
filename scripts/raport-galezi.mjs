#!/usr/bin/env node
/**
 * Klasyfikuje gałęzie zdalne i wypisuje raport w Markdownie na standardowe
 * wyjście. Nic nie kasuje i z niczym się nie łączy — decyzję o usunięciu
 * podejmuje człowiek.
 *
 * Powód istnienia: repozytorium doszło do 37 gałęzi, z których najstarsza była
 * 104 commity za `main`. W jednej z nich leżał gotowy silnik Ściągi na Rozmowę,
 * o którym nikt nie pamiętał — a `main` w tym czasie pokazywał użytkownikom
 * atrapę tej funkcji. Nic o tym nie przypominało, bo nic tego nie liczyło.
 *
 * Uruchamiany przez .github/workflows/higiena-galezi.yml. Wymaga pełnej
 * historii (fetch-depth: 0).
 */

import { execFileSync } from 'node:child_process';

const BAZA = process.env.GALAZ_BAZOWA ?? 'origin/main';
const PROG_W_TYLE = Number(process.env.PROG_W_TYLE ?? 50);
const PROG_DNI = Number(process.env.PROG_DNI ?? 30);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const galezie = git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin')
  .split('\n')
  .filter((b) => b && b !== 'origin/HEAD' && b !== BAZA);

const dzisiaj = Date.now();
const zawarte = [];
const wTyle = [];
const porzucone = [];

for (const ref of galezie) {
  const nazwa = ref.replace(/^origin\//, '');

  // `git cherry` oznacza `+` commity, których odpowiednika (po patch-id) nie ma
  // w bazie. Zero takich commitów = cała treść gałęzi jest już w `main`, także
  // gdy trafiła tam przez squash-merge, którego `git branch --merged` nie widzi.
  const wlasne = git('cherry', BAZA, ref)
    .split('\n')
    .filter((l) => l.startsWith('+')).length;

  const dataISO = git('log', '-1', '--format=%aI', ref);
  const dni = Math.floor((dzisiaj - new Date(dataISO).getTime()) / 86_400_000);
  const data = dataISO.slice(0, 10);
  const behind = Number(git('rev-list', '--count', `${ref}..${BAZA}`));

  if (wlasne === 0) {
    zawarte.push({ nazwa, data });
  } else if (behind > PROG_W_TYLE) {
    wTyle.push({ nazwa, data, behind, wlasne });
  } else if (dni > PROG_DNI) {
    porzucone.push({ nazwa, data, dni, wlasne });
  }
}

const sekcje = [];

if (zawarte.length > 0) {
  sekcje.push(
    `### Bezpieczne do usunięcia — ${zawarte.length}\n\n` +
      'Cała treść jest już w `main` (sprawdzone po patch-id, więc squash-merge też się liczy).\n\n' +
      '| Gałąź | Ostatni commit |\n| --- | --- |\n' +
      zawarte.map((b) => `| \`${b.nazwa}\` | ${b.data} |`).join('\n')
  );
}

if (wTyle.length > 0) {
  sekcje.push(
    `### Ryzyko dryfu — ${wTyle.length}\n\n` +
      `Mają własne commity i są ponad ${PROG_W_TYLE} commitów za \`main\`. ` +
      'Przy takim dystansie pliki potrafią zmienić katalog, a wtedy merge nie robi ' +
      'konfliktu, tylko dokłada drugi komplet plików — trzeba portować ręcznie.\n\n' +
      '| Gałąź | W tyle | Własnych | Ostatni commit |\n| --- | ---: | ---: | --- |\n' +
      wTyle.map((b) => `| \`${b.nazwa}\` | ${b.behind} | ${b.wlasne} | ${b.data} |`).join('\n')
  );
}

if (porzucone.length > 0) {
  sekcje.push(
    `### Bez ruchu od ponad ${PROG_DNI} dni — ${porzucone.length}\n\n` +
      '| Gałąź | Dni bez commita | Własnych | Ostatni commit |\n| --- | ---: | ---: | --- |\n' +
      porzucone.map((b) => `| \`${b.nazwa}\` | ${b.dni} | ${b.wlasne} | ${b.data} |`).join('\n')
  );
}

if (sekcje.length === 0) {
  // Pusty wynik jest sygnałem dla workflow, żeby zamknąć issue zamiast
  // publikować raport „nie ma nic do zgłoszenia". AGENTS.md: zadanie cykliczne
  // bez treści nie otwiera zgłoszenia.
  process.exit(0);
}

console.log(
  `Stan na ${new Date().toISOString().slice(0, 10)}. Gałęzi zdalnych poza \`main\`: ${galezie.length}.\n\n` +
    sekcje.join('\n\n') +
    '\n\n---\n\n' +
    'Raport jest odtwarzany co tydzień — to zgłoszenie jest aktualizowane, nie duplikowane. ' +
    'Nic nie zostało skasowane automatycznie.\n\n' +
    'Zanim zaczniesz pracę na którejkolwiek z tych gałęzi, uruchom ' +
    '`scripts/sprawdz-swiezosc.sh` (reguła 10 w `AGENTS.md`).'
);
