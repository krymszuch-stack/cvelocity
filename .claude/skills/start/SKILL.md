---
name: start
description: Kontrola przed rozpoczęciem pracy nad CVelocity — świeżość gałęzi, kolizje z innymi gałęziami, otwarte uwagi w NOTATKI.md. Użyj, gdy zaczynasz nowe zadanie w tym repozytorium, zanim napiszesz pierwszą linijkę kodu.
---

# Zanim zaczniesz pracę

## 1. Uruchom kontrolę

```bash
scripts/sprawdz-swiezosc.sh [obszar…]
```

Obszary podawaj, gdy już wiesz, czego dotknie zadanie — np.
`scripts/sprawdz-swiezosc.sh src/server src/lib`. Skrypt wypisze wtedy gałęzie
ruszające te same ścieżki.

Cała logika siedzi w skrypcie. Nie powtarzaj jej tutaj i nie licz commitów
własnoręcznie — workflow `/rozpocznij` w Antigravity woła ten sam plik, a dwie
kopie rozjechałyby się po pierwszej zmianie progu.

## 2. Zinterpretuj wynik

**Kod 0** — pracuj dalej.

**Kod 1 (gałąź za progiem)** — nie zaczynaj pisać. Wybierz:

- gałąź ma już własną pracę do zachowania → `git merge origin/main` i rozwiąż
  konflikty, zanim dołożysz cokolwiek nowego;
- zaczynasz od zera → `git checkout -B <nazwa> origin/main`.

Nie proponuj `rebase` na cudzej gałęzi — przepisanie historii unieważnia
checkouty innych osób. Na gałęzi, którą sam założyłeś, decyduje konwencja repo.

**Wypisane gałęzie ruszające ten sam obszar** — sprawdź, czy nie robisz drugi
raz tego, co ktoś zaczął. `AGENTS.md` mówi: jeden plik = jeden otwarty PR.
Jeśli kolizja jest realna, powiedz o tym właścicielowi repo, zamiast otwierać
równoległy front.

**Otwarte uwagi w `NOTATKI.md`** — przeczytaj sekcję „🆕 Nowe". Bywa, że opisana
tam obserwacja dotyczy dokładnie obszaru, w który wchodzisz, i zmienia zakres
zadania.

## 3. Wczytaj kontrakt

Reguły są w [`AGENTS.md`](../../../AGENTS.md) — dziesięć reguł z odwołaniami do
miejsc w kodzie, w których ich brak kosztował błąd. Przeczytaj przynajmniej
sekcję „Konwencje, które łatwo złamać nieświadomie", jeśli nie masz jej w
kontekście.

## 4. Bramka na wyjściu

Przed zgłoszeniem zmiany: `npm run lint` → `npm test` → `npm run build`.
`lint` obejmuje `tsc --noEmit`. Ruszałeś `semantic-work-graph/`? Jego testy
odpal osobno, z jego katalogu — CI ich nie uruchamia.
