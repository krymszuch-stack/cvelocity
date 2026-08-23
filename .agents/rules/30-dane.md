---
trigger: glob
globs: src/lib/**/*.ts
---

# Logika i dane

Kanon: **@../../AGENTS.md**. Poniżej dwie rzeczy, na których w tym katalogu
najłatwiej się przewrócić.

## `storage.ts` jest jedynym rejestrem tego, co ląduje w przeglądarce

Nowy klucz dopisujesz do `StorageKeys` w `src/lib/storage.ts` — nie obok, nie
gołym `localStorage.setItem`. Usuwanie danych (`wipeAppStorage`) iteruje po
prefiksach z rejestru, więc **klucz spoza niego przeżywa „usuń moje dane"**.

Zdarzyło się to już dwa razy:
- stan subskrypcji zostawał po usunięciu konta (`storage.ts:4`),
- cache ściągi na rozmowę pisał pod `sv_cheatsheet_*` — poza `OWNED_PREFIXES` —
  mimo że wpis zawiera punkty STAR zbudowane z prawdziwej historii zatrudnienia
  (naprawione w PR #87).

Klucz ze zmienną częścią robi się funkcją obok `vaultKeyFor` /
`cheatSheetCacheKeyFor`. Do odczytu i zapisu używaj `readJson` / `writeJson` —
mają obsłużony tryb prywatny i przepełniony limit.

## Testy biegną w Node, nie w przeglądarce

Brak `jsdom`, brak `@testing-library`. Interfejsy przeglądarki podstawia się
ręcznymi atrapami — wzorzec w `src/lib/__tests__/localProfile.test.ts:14`.

Logikę wymagającą DOM-u wydziel do zwykłego modułu i przetestuj tam, a
w komponencie zostaw cienkie spięcie (`src/lib/deferredWriter.ts` +
`src/hooks/useDeferredPersist.ts`). **Dokładanie `jsdom` to zmiana konfiguracji
testów całego projektu — nie rób tego mimochodem.**

Funkcje w `src/lib/` mają być czyste i deterministyczne tam, gdzie to możliwe:
ten sam wejściowy zestaw danych daje ten sam wynik, bez `Math.random()`
i `Date.now()` w treści. Wzorzec i uzasadnienie:
`src/lib/interviewCheatSheetEngine.ts` oraz test determinizmu obok niego.
