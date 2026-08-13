# AGENTS.md — kontrakt dla agentów pracujących nad SkillVault

Ten plik czytają agenci automatyczni (Jules, Claude Code i inne) **przed** pierwszą zmianą w repo.
Jeśli coś tutaj kłóci się z Twoim domyślnym zachowaniem — wygrywa ten plik.

---

## 0. `NOTATKI.md` — czytaj przed każdą zmianą

`NOTATKI.md` w katalogu głównym to bieżący notatnik uwag właściciela repo. Uwagi trafiają tam
z telefonu (Obsidian + Obsidian Git), więc bywają krótkie i nieformalne — to nie zmniejsza ich wagi.

**Przed rozpoczęciem pracy** przeczytaj sekcję „🆕 Nowe" i uwzględnij te uwagi w tym, co robisz.

**Po wykonaniu — lub po świadomym uwzględnieniu — uwagi:**

1. Przenieś ją z „🆕 Nowe" do „✅ Załatwione".
2. Przekreśl treść: `~~uwaga~~`.
3. Dopisz pod spodem jedną–dwie linijki: co zrobiłeś albo dlaczego zdecydowałeś inaczej,
   z datą i numerem PR-a.

```markdown
- ~~Popraw wykrywanie widełek płacowych~~
  - **Claude 2026-08-10:** dodana obsługa „net/brutto/gross" między kwotą a walutą. PR #16.
```

**Czego nie robić:** nie usuwaj uwag, nie przepisuj ich treści i nie przekreślaj czegoś, czego
realnie nie zrobiłeś. Jeśli uwagi nie da się wykonać albo się z nią nie zgadzasz — zostaw ją
w „🆕 Nowe" i dopisz pod spodem swoje zastrzeżenie. Decyzję podejmuje człowiek.

Zmiany w `NOTATKI.md` dołączaj do PR-a, którego dotyczą — nie rób z tego osobnego PR-a.

---

## 1. Czym jest ten projekt

SkillVault dopasowuje CV do konkretnej oferty pracy: parsuje ogłoszenie, przestawia i przeformułowuje
treść CV, symuluje ocenę ATS i generuje list motywacyjny. Znaczna część logiki jest **lokalna i bez-tokenowa**
(slot filling, ranking trafności, symulator ATS) — Gemini jest wołane tylko tam, gdzie lokalny algorytm nie wystarcza.

**Stack:** Vite + React 19 + TypeScript + Tailwind 4 (frontend), Express (backend `server.ts`), Vitest.
**Deploy:** frontend → Firebase Hosting; API → Render. To dwa osobne środowiska (patrz §6).

## 2. Układ repo

```
server.ts                 backend Express — WSZYSTKIE endpointy /api/*
src/server/gemini.ts      integracja z Gemini (klucz z process.env)
src/lib/                  logika domenowa (ats, slot filling, ranking, crypto, auth)
src/lib/apiClient.ts      JEDYNE miejsce, przez które front woła backend
src/components/ui/        komponenty bazowe design systemu
src/components/shell/     Sidebar + Topbar
src/index.css             tokeny design systemu (light/dark)
```

## 3. Weryfikacja — obowiązkowa przed każdym PR

```bash
npm run lint    # tsc --noEmit
npm test        # vitest run
npm run build   # klient + serwer
```

Wszystkie trzy muszą być zielone. **Nie otwieraj PR-a z czerwonym którymkolwiek z nich.**
Jeśli zmiana dotyczy UI — sprawdź **oba motywy** (przełącznik w topbarze), nie tylko jeden.

### 3.1 Znane pułapki przy bumpach zależności (Dependabot)

Zanim uznasz czerwony PR Dependabota za "trzeba to naprawić" albo od razu za "nie da się zmergować" —
sprawdź, czy to nie jeden ze znanych, powtarzalnych przypadków:

- **`@vitejs/plugin-react` w wersji major wymaga `vite` w tej samej major wersji.** Repo pinuje
  `vite@^6.x`; `@vitejs/plugin-react@6.x` deklaruje `peerDependencies: { vite: "^8.0.0" }`, więc
  `npm install` kończy się `ERESOLVE`. Same-osobny bump pluginu **nie jest bezpieczny do zmergowania**
  — albo bumpuj `vite` razem z nim (osobny, większy PR, wymaga pełnej regresji builda), albo zostaw
  PR otwarty do czasu, aż ktoś celowo zaplanuje upgrade Vite 8.
- **Duże majory `lucide-react` bywają CI-green mimo realnego błędu kompilacji**, jeśli test lokalny
  różni się od CI (np. lockfile drift). `lucide-react` w wersjach 1.x usunął część ikon
  powiązanych ze znakami towarowymi — np. `Linkedin` nie ma już żadnego eksportu w pakiecie.
  Po takim bumpie **zawsze uruchom `npm run lint` lokalnie z czystym `node_modules`** — `tsc`
  złapie brakujący import (`TS2305: has no exported member`); zamień na neutralną ikonę
  (np. `Link2`) w miejscach czysto dekoracyjnych, nie usuwaj funkcjonalności.
- **Czerwone CI na starym PR-ze Dependabota bywa nieaktualne** — jeśli commit bazowy PR-a jest
  sprzed dawna, błąd mógł już zniknąć wraz z innymi zmianami na `main` (np. literówka typu w
  zupełnie niepowiązanym pliku). Zawsze przetestuj bump lokalnie po rebase'ie na aktualny `main`,
  zamiast ufać staremu logowi CI z dnia utworzenia PR-a.

## 4. Design system — kontrakt

`src/index.css` definiuje dwie warstwy tokenów: surową paletę `--sv-*` przełączaną przez `[data-theme]`
oraz tokeny Tailwinda `@theme` wskazujące na nią. Dzięki temu `bg-surface`, `text-muted`, `border-line` itd.
są **automatycznie reaktywne na motyw**.

- Używaj komponentów z `src/components/ui/` (`Button`, `Card`, `Field`, `Modal`, `Tabs`, `Feedback`, `StatusBadge`).
  Nie twórz równoległych wariantów tego, co już istnieje.
- **Zakaz zaszytych klas palety** (`bg-white`, `text-slate-600`, `indigo-*`, `emerald-*`…) w kodzie UI.
  Brakuje tokena? Dodaj go do `index.css` — nie obchodź systemu.
- `emerald`/`success` = wyłącznie status powodzenia. Kolor marki to indigo (`brand-*`). Nigdy odwrotnie.
- `text-white` na kolorowym przycisku lub gradiencie jest poprawne — tego nie zamieniaj.

Kontekst i ściągę mapowania klas → tokeny znajdziesz w `REDESIGN_HANDOFF.md`.

## 5. ⚠️ Twarde zakazy

**Kartka CV musi zostać biała w obu motywach.**
`DocumentRenderer.tsx` i `CVWordBuilder.tsx` renderują dokument A4 (`w-[210mm] min-h-[297mm]`, klasa
`printable-area`), który jest **drukowany przez `window.print()` i eksportowany do PDF**. Zamiana kolorów
wewnątrz kartki na tokeny motywu da w trybie ciemnym jasny tekst na białym papierze — nieczytelne CV
i zepsuty eksport. Zmieniaj wyłącznie *chrome* dookoła kartki (toolbary, panele, modale).

**Nie dotykaj bez wyraźnego polecenia człowieka:**
`render.yaml`, `firebase.json`, `.github/workflows/**`, `.firebaserc`, `.env*` (poza `.env.example`),
oraz czegokolwiek związanego z sekretami i kluczami.

**Nigdy nie commituj sekretów.** `GEMINI_API_KEY` i klucze Firebase pochodzą ze zmiennych środowiskowych.
Jeśli potrzebujesz nowej zmiennej — dopisz ją do `.env.example` z pustą wartością i opisem.

**Nie merge'uj własnych PR-ów.** Każdą zmianę zatwierdza człowiek.

## 6. Backend i granica front–backend

- Front woła backend **wyłącznie** przez `apiFetch` z `src/lib/apiClient.ts`. Nie pisz `fetch('/api/...')`
  bezpośrednio — produkcja ma API na innej domenie i takie wywołanie tam nie zadziała.
- `VITE_API_BASE_URL` jest wstawiane przez Vite **w czasie builda** — nie da się go zmienić po deployu.
- W produkcji backend serwuje **tylko API**. Nie dodawaj tam fallbacku SPA (`app.get("*") → index.html`) —
  to dokładnie ta pomyłka, przez którą `/api/*` zwracało HTML 200 i cicho psuło wszystkie funkcje AI.
- Endpointy AI są publiczne i kosztują pieniądze. Zachowaj rate limit i walidację URL (SSRF) w `server.ts`.
  Każdy nowy outbound `fetch` musi mieć `AbortSignal.timeout(...)`.

## 7. Styl pracy

- **Jeden PR = jeden wąski zakres.** Migracja 11 komponentów to 11 PR-ów, nie jeden.
- Opis PR-a po polsku: co, dlaczego, jak zweryfikowane.
- Trzymaj się konwencji sąsiadującego kodu (importy względne, nazewnictwo, gęstość komentarzy).
- Komentarze pisz tylko tam, gdzie wyjaśniają *dlaczego*, nie *co*.
- Nie zostawiaj martwego kodu „na przyszłość" — usuwaj.

## 8. Definicja ukończenia — przeczytaj, zanim otworzysz PR

Ta sekcja istnieje, bo agent asynchroniczny (Jules, Claude Code) nie może dopytać w trakcie
i sam decyduje, że skończył. **„Kompiluje się" to nie jest ukończone zadanie.**

### 8.1 Zadanie jest ukończone, gdy

- `npm run lint && npm test && npm run build` przechodzi (§3) — i bramki nie zostały obejście (§8.2).
- Nowa funkcja jest **osiągalna z UI**. Kod, do którego użytkownik nie może kliknąć, jest martwy.
- Nowa logika domenowa ma test. Wzorzec do naśladowania:
  `src/lib/__tests__/slot_filling_determinism.test.ts` — regresja pilnująca konkretnego, realnego
  błędu, z komentarzem wyjaśniającym, co się zepsuło. Do parsowania ofert i CV używaj fixture'ów
  z **prawdziwych** dokumentów zamiast wymyślonych: syntetyczny przykład potrafi przejść, gdy
  produkcyjny tekst się wywala.
- W diffie nie ma `TODO`, `FIXME`, zakomentowanego kodu, `console.log`, nieużywanych importów
  ani abstrakcji „pod przyszłe użycie", z której nikt jeszcze nie korzysta.
- Opis PR-a mówi prawdę o tym, co **faktycznie** zostało zweryfikowane.

### 8.2 Zakaz obchodzenia bramek

Zielone CI ma znaczyć „działa", a nie „uciszone". **Nie wolno:**

- dodawać `@ts-ignore`, `as any` ani `eslint-disable`, żeby przeszedł lint,
- luzować `tsconfig.json`,
- oznaczać testów `.skip` / `.todo` ani ich kasować, żeby suite był zielony,
- naginać asercji testu pod wynik kodu, zamiast naprawić kod.

Jeśli test naprawdę jest błędny — popraw go i **napisz w PR, dlaczego** stara asercja była zła.

### 8.3 Brak danych to puste pole, nie zmyślona wartość

Produkt obiecuje „0-Halucynacji" (`SYSTEM_ARCHITECTURE_GUIDANCE.md` §6) i ta zasada obowiązuje
również w kodzie, nie tylko w promptach do modelu.

**Nigdy nie podstawiaj prawdopodobnie wyglądającej wartości domyślnej** w miejsce danych, których
nie udało się wyciągnąć. Puste pole UI pokaże uczciwie; zmyślona wartość trafia do CV kandydata
i wygląda tam jak fakt.

To nie jest hipotetyczne: parser ofert zwracał `['TypeScript', 'React', 'Node.js']`, gdy nie
rozpoznał żadnej technologii — przez co ogłoszenie dla spawacza „wymagało" Reacta.

### 8.4 Gdy nie możesz dokończyć

Wąski, domknięty kawałek jest lepszy niż szeroki i połowiczny.

- **Zadanie za duże** → zrób część, którą domykasz w całości, a resztę dopisz jako uwagę do
  `NOTATKI.md` (§0). Nie zostawiaj w kodzie rusztowania pod niezrobioną część.
- **Wymagania niejasne** → wybierz najprostszą sensowną interpretację, **zapisz ją w opisie PR-a**
  i dopisz pytanie do `NOTATKI.md`. Nie zgaduj po cichu.
- **Nie możesz czegoś zweryfikować** (brak `GEMINI_API_KEY`, brak przeglądarki do sprawdzenia obu
  motywów) → **napisz to wprost w PR** zamiast odhaczać punkt, którego nie wykonałeś.

Konkretna mechanika zostawiania śladu (gdzie, w jakim formacie) jest w `JULES_PLAYBOOK.md` §9.

## 9. Podział pracy między agentami

`JULES_PLAYBOOK.md` określa, **które zadania wolno wykonywać agentowi autonomicznemu**, a które
zostają przy człowieku. Przeczytaj go, zanim weźmiesz zadanie, którego nie zlecił Ci wprost człowiek.

Skrót zasady: deleguj to, co CI potrafi obalić. Obszary bezpieczeństwa (`server.ts`, `auth.ts`,
`twoFactorAuth.ts`, `vaultCrypto.ts`), poprawność parserów (`jdParser.ts`, `atsSimulator.ts`)
oraz ciało dokumentu A4 są **poza zasięgiem** — tam zielone CI nie dowodzi poprawności.

Obowiązuje też reguła antykolizyjna: jeden plik = jeden otwarty PR, a pliki współdzielone
(`src/index.css`, `src/types/index.ts`, `AGENTS.md`, `NOTATKI.md`) są poza zasięgiem zadań
zleconych agentom. Brakuje tokena? Zgłoś to w PR, nie dodawaj go samodzielnie.
