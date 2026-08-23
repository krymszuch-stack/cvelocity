# AGENTS.md — wytyczne pracy nad CVelocity

Plik dla **każdego** agenta pracującego nad tym repozytorium: Jules (Google),
Claude Code i dowolnego innego. Opisuje realia projektu, reguły wyprowadzone
z jego historii oraz to, co wolno delegować, a czego nie.

Każda reguła powstała po tym, jak jej brak kosztował realny błąd, i wskazuje
miejsce w kodzie, gdzie ten błąd jest opisany. Odwołanie jest istotne — pozwala
sprawdzić, że reguła nie została wymyślona.

Wizję produktu opisują `SYSTEM_ARCHITECTURE_GUIDANCE.md` i `README.md`, model
zagrożeń `SECURITY.md`. Tutaj jest wyłącznie to, jak pisać kod, żeby pasował.

Bieżące obserwacje właściciela repo — rzeczy zauważone, ale jeszcze nie
naprawione — są w [`NOTATKI.md`](./NOTATKI.md). Przejrzyj je przed zmianą
w obszarze, którego dotyczą; to kanał na spostrzeżenia, nie na reguły.

Incydenty, z których wyprowadzono reguły poniżej, są opisane w archiwum
[`docs/historia/`](./docs/historia/). Dokumenty pochodzą sprzed przebudowy
projektu i nie opisują stanu bieżącego — służą wyłącznie do sprawdzenia,
skąd wzięła się dana reguła.

## Dwa pakiety, dwie konfiguracje

| | katalog główny | `semantic-work-graph/` |
| --- | --- | --- |
| co to jest | aplikacja (React + Express) | silnik semantyczny i graf wiedzy |
| baza | Supabase/Postgres (`BACKEND_MODE=cloud`) albo localStorage (`local`) | SQLite przez `better-sqlite3` |
| testy | `npm test` (Vitest, Node) | `npm test` (własny `vitest.config.ts`) |

**Pakiet `semantic-work-graph` jest wykluczony z konfiguracji katalogu głównego**
— w `tsconfig.json`, `eslint.config.js` i `vite.config.ts`. Ma własny `tsconfig`,
własne zależności i własnego Vitest. Uruchamiając cokolwiek dla tego pakietu,
rób to z jego katalogu.

**Workflow CI (`.github/workflows/ci.yml`) obejmuje wyłącznie katalog główny.**
Testy `semantic-work-graph` nie uruchamiają się na GitHubie. Jeśli zmieniasz ten
pakiet, uruchom jego testy lokalnie — nikt inny tego za ciebie nie zrobi.

## Komendy

```bash
# katalog główny
npm run dev            # serwer deweloperski (tsx server.ts)
npm run lint           # eslint . && tsc --noEmit  — to jest bramka CI
npm test               # vitest run
npm run build          # klient (vite) + serwer (esbuild)

# semantic-work-graph/
npm test               # vitest run
npm run seed:import    # graf profesji z pliku seed
npm run seed:lexicon   # PoliMorf + ESCO (pełny przebieg: kilkadziesiąt minut)
npm run seed:lexicon -- --esco-no-alt   # same nazwy bazowe, ok. minuty
npm run cli -- search "piecyk gazowy"
```

`npm run lint` to jednocześnie sprawdzenie typów. Uruchom je przed każdym
commitem — CI robi dokładnie to samo.

## Konwencje, które łatwo złamać nieświadomie

**Testy biegną w Node, nie w przeglądarce.** Brak `jsdom`, brak
`@testing-library`. Interfejsy przeglądarki podstawia się ręcznymi atrapami —
wzorzec w `src/lib/__tests__/localProfile.test.ts:14`. Logikę wymagającą DOM-u
wydziel do zwykłego modułu i przetestuj tam; w komponencie zostaw cienkie
spięcie (przykład: `src/lib/deferredWriter.ts` i `src/hooks/useDeferredPersist.ts`).
Dokładanie `jsdom` to zmiana konfiguracji testów całego projektu — nie rób tego
mimochodem.

**Komentarze wyjaśniają „dlaczego", nie „co".** Ten kod jest gęsto opatrzony
komentarzami tłumaczącymi, dlaczego coś wygląda tak, a nie inaczej — zwykle
dlatego, że poprzednie podejście zawiodło. Zachowuj je i pisz w tym stylu.
Komentarz powtarzający treść linijki jest szumem; komentarz ratujący następną
osobę przed powtórzeniem błędu jest najcenniejszą rzeczą w pliku.

**Język: polski.** Komentarze, komunikaty błędów, opisy testów i treść PR-ów.

**`src/lib/storage.ts` jest jedynym rejestrem tego, co aplikacja zapisuje
w przeglądarce.** Nowy klucz dopisujesz tam, nie obok. Usuwanie danych iteruje
po rejestrze, więc klucz spoza niego przetrwa „usuń moje dane" — to się już raz
zdarzyło ze stanem subskrypcji (`storage.ts:4`).

**Serwer odpowiada spójnym kształtem** `{ success, error, requestId }`
ustalonym w `src/server/middleware/errorHandler.ts`. Klient rozmawia z API
wyłącznie przez `src/lib/apiClient.ts` — nie wpisuj `fetch` do komponentu.

**`user_id` bierze się z tokenu, nigdy z ciała żądania.** Klient `service_role`
omija RLS, więc pole z żądania pozwoliłoby nadpisać cudze dane
(`src/server/routes/vault.routes.ts:36`).

## Dziewięć reguł

Każda ma za sobą konkretny błąd w historii tego repozytorium.

**1. Zero wymyślonych danych.** Nie wstawiaj przykładowych rekordów do stanu
startowego, wartości domyślnych do sparsowanych struktur ani stałych udających
pomiar. Brak danych to pusty stan albo `null`. Czego nie da się zmierzyć, ten
endpoint zwraca `501`, nie liczbę.
> Tracker wstawiał cztery wymyślone aplikacje z nazwami firm i notatkami
> z rozmów, których nikt nie odbył (`ApplicationTracker.tsx:29`). Trasa statystyk
> zwracała zmyślone stałe jako zużycie tokenów (`stats.routes.ts:10`). Osobny
> commit nazywa się „fałszywe 100% ATS".

**2. Nie buduj interfejsu dla zabezpieczenia, którego nie ma.** Ekran, który nie
weryfikuje, ma o tym napisać wprost. Kontrola dostępu po stronie klienta jest
podpowiedzią dla interfejsu, nigdy egzekucją.
> Ekran logowania przepuszczał dowolne hasło, dowolne sześć znaków „potwierdzało"
> 2FA, a przycisk Google wstawiał zaszytego `google-user-1` (`AuthModal.tsx:13`).
> Uprawnienia egzekwowane wyłącznie w przeglądarce nazywano kontrolą dostępu
> (`useEntitlements.ts:18`).

**3. Jedno źródło prawdy na fakt.** Zanim dopiszesz warunek, wyrażenie regularne
albo klucz — sprawdź `grep`em, czy ten sam fakt nie jest już zakodowany gdzie
indziej. Jeśli jest, wydziel go zamiast kopiować.
> Klucze schowka leżały w ośmiu plikach w trzech konwencjach (`storage.ts:4`).
> Klasyfikacja narzędzia była powielona dwoma **różnymi** wyrażeniami
> regularnymi i tworzyła relacje do nieistniejących węzłów grafu
> (`semantic-work-graph/src/seed/SeedImporter.ts`).

**4. Poprawiaj klasę, nie wystąpienie.** Po znalezieniu błędu przeszukaj repo pod
kątem tego samego wzorca i wymień wszystkie trafienia w jednej zmianie.
> Commit `551d064` nazywa się „audit round 2 — **remaining** py-0.2 in Tabs,
> ApplicationTracker, AchievementEditor, InterviewCheatSheetView". Runda pierwsza
> poprawiła część wystąpień, nie problem.

**5. Nie dodawaj kodu bez konsumenta.** Endpoint, opcja czy eksport bez wywołania
nie wchodzi do repozytorium — albo podłącz go w tej samej zmianie, albo go nie
pisz.
> `PUT /api/vault`, `GET /api/vault`, `/api/applications` i `/api/stats` mają
> zero wywołań z klienta. Importer leksykonu przyjmował opcje, których CLI nie
> wystawiało, a komunikat odsyłał do nieistniejącego przełącznika.

**6. Zmierz, zanim zoptymalizujesz — i zmierz naprawdę.** Podaj liczbę przed
i po. Pomiar ma przepuszczać dane przez prawdziwy mechanizm, nie przez wzór
szacujący wynik. Optymalizacja bez pomiaru trafia w to, co wygląda na wolne.
> Wzorzec: `src/lib/__tests__/vaultPersistence.bench.test.ts`. Bez progów
> czasowych — testy wydajności z twardym limitem sypią się na współdzielonym CI
> z przyczyn niezwiązanych ze zmianą i uczą zespół ignorowania czerwonego builda.

**7. Sprawdź założenie w kodzie, zanim je zrealizujesz.** Jeśli zadanie mówi
„autosave co kilkanaście sekund obciąża bazę" — prześledź ścieżkę zapisu, zanim
zaczniesz optymalizować bazę.
> Zadanie P2 opisywało narzut zapisu do Postgresa. Vault nigdy do Postgresa nie
> trafiał; pełna serializacja szła do localStorage przy każdym wpisanym znaku.
> Zrealizowanie zadania dosłownie zoptymalizowałoby martwą ścieżkę.

**8. Domena to prace fizyczne, nie tylko IT.** Reguły dopasowania testuj na
monterze, spawaczu i magazynierze, zanim uznasz je za gotowe.
> Audyt kryteriów zerojedynkowych sprawdzał dokładnie dwa warunki — prawo jazdy B
> i angielski C1 — podczas gdy monter odpada na SEP-ie, UDT i F-Gazie
> (`knockouts.ts:8`).

**9. Odłożenie zapisu wymaga gwarancji dosłania.** Każde opóźnienie utrwalania
tworzy okno, w którym dane są tylko w pamięci. Domknij je przy ukryciu karty
(`visibilitychange`), zamknięciu strony (`pagehide` — Safari i iOS nie wywołują
`beforeunload`) i odmontowaniu komponentu.
> Wzorzec i testy: `src/lib/deferredWriter.ts`.

## Co wolno delegować agentowi autonomicznemu

> **Deleguj to, co CI potrafi obalić. Resztę albo najpierw obłóż testem, albo zatrzymaj.**

Agent autonomiczny udowadnia dokładnie jedno: „testy przechodzą, build zielony".
Bramką jest `npm run lint` → `npm test` → `npm run build` w `.github/workflows/ci.yml`.

Są jednak zmiany, **których CI nie obali** — i to one wyznaczają granicę.

### Zielona lista

Praca mechaniczna, o wąskim zakresie, w całości weryfikowalna przez CI.

| Typ zadania | Dlaczego bezpieczne |
| --- | --- |
| Dopisanie testów do istniejących modułów `src/lib/` | Nowy przechodzący test sam siebie dowodzi |
| Usuwanie nieużywanych importów i martwego kodu | Pilnuje `tsc --noEmit` |
| Dynamiczny `import()` dla ciężkich bibliotek | Weryfikowalne rozmiarem bundla w wyjściu builda |
| Przepięcie ręcznie pisanych modali na `src/components/ui/Modal.tsx` | Istniejący komponent bazowy, jasny cel |
| Uzupełnienie komentarzy „dlaczego" tam, gdzie ich brak | Nie zmienia zachowania |

### Czerwona lista

| Obszar | Powód |
| --- | --- |
| `src/server/net/safeFetch.ts`, walidacja SSRF, rate limiting | Publiczne, płatne endpointy; kod generowany przez modele często zawiera podatności |
| Logika uwierzytelniania i szyfrowania | To repo ma historię deklaracji „AES-256" przy zapisie jawnym tekstem (`localProfile.ts:103`). Testy wolno delegować, zmiany zachowania nie |
| `src/lib/jdParser.ts`, `atsSimulator.ts`, `knockouts.ts` — poprawność wyników | Zasada zera wymyślonych danych wymaga osądu i konfrontacji z prawdziwymi ogłoszeniami |
| Ciało dokumentu A4 w rendererach CV | Kartka musi zostać biała w trybie ciemnym; podmiana kolorów na tokeny motywu przechodzi build i psuje eksport PDF — CI tego nie obali |
| `semantic-work-graph/` | Poza zasięgiem CI; nikt nie zweryfikuje zmiany automatycznie |
| `.github/workflows/**`, `Dockerfile`, `vercel.json`, `.env*` | Konfiguracja wdrożeniowa |
| Decyzje architektoniczne | Przekrojowe, wymagają projektu, nie wykonania |

### Zadania cykliczne raportują, nie commitują

Bezobsługowe zmiany w kodzie według harmonogramu maksymalizują obciążenie
recenzją i ryzyko. Wąskim gardłem nie jest limit zadań agenta, tylko zdolność
właściciela repo do recenzowania PR-ów.

Zadanie cykliczne ma wbudowaną zasadę: **gdy nie ma co zgłosić, nie otwiera
issue**. Bez tego w kolejce lądują śmieciowe zgłoszenia w nieskończoność.

### Reguły antykolizyjne

1. **Jeden plik = jeden otwarty PR.** Partycjonuj po plikach, nie po limicie agenta.
2. **Pliki współdzielone są poza zasięgiem agenta:** `src/index.css`,
   `src/types/index.ts`, `AGENTS.md`. Jeśli zadanie wymaga nowego tokena
   w `index.css` — zatrzymaj się i napisz o tym w PR, nie zaszywaj koloru
   w komponencie.
3. **Najwyżej cztery otwarte PR-y od agentów naraz.** Limit wynika z recenzji.
4. **Pilot przed skalowaniem.** Pierwsze zadanie danego typu idzie pojedynczo.

Gotowe briefy, napisane według tych reguł: [`docs/zadania-dla-agenta.md`](./docs/zadania-dla-agenta.md).

## Zanim zgłosisz zmianę

- [ ] `npm run lint` bez błędów (to bramka CI)
- [ ] `npm test` na zielono; jeśli tknąłeś `semantic-work-graph`, jego testy też
- [ ] żadnych wymyślonych danych, żadnych nowych ścieżek bez konsumenta
- [ ] przy zmianie wydajnościowej — liczba przed i po w opisie PR-a
- [ ] opis PR-a mówi, **dlaczego** tak, nie tylko **co** się zmieniło; jeśli
      odszedłeś od treści zadania, uzasadnij to dowodem z kodu
