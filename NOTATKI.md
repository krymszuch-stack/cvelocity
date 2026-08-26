# Spostrzeżenia i notatki

> Notatnik roboczy: Adrian ↔ agenci.
>
> **Adrian** dopisuje uwagi w sekcji „🆕 Nowe" — jednym punktem `-`, bez żadnej
> dodatkowej składni.
> **Agent** czyta „🆕 Nowe" przed pracą nad repo, a po załatwieniu uwagi przenosi
> ją do „✅ Załatwione", przekreśla i dopisuje pod spodem krótkie podsumowanie.
>
> To kanał na obserwacje, nie na reguły. Reguły są w [`AGENTS.md`](./AGENTS.md)
> i to on rozstrzyga spory — notatka, która urosłaby do reguły, ma tam trafić,
> a nie zostać tutaj w drugiej kopii.

---

## 🆕 Nowe

<!-- Dopisuj tutaj. Jeden punkt = jedna uwaga. -->

- `GET /api/gamification` (`gamification.routes.ts`) nie ma ani jednego
  wywołania w kliencie — sklep wysyła tylko `PUT`. Trasa powstała pod
  synchronizację poziomu między urządzeniami, ale reguła „kto wygrywa, gdy
  schowek i konto się różnią" nigdy nie zapadła (ostatni zapis? większe XP?
  wybór użytkownika?). Bez tej decyzji podpięcie odczytu mogłoby nadpisywać
  lokalny postęp pustym kontem. Do decyzji przed implementacją synchronizacji.
  _(wpis od agenta)_

- Zniżki za rangę (−15%/−30% z `LEVEL_PRIVILEGES`) nalicza teraz serwer przy
  tworzeniu sesji checkout (kupony Stripe `ranga-15`/`ranga-30`, twórczone przy
  pierwszym użyciu). Odczyt XP idzie z tabeli `user_gamification` — **do czasu
  aplikowania migracji `docs/migracje/0007` sesje po prostu wychodzą bez
  zniżki** (log ostrzega). Przed włączeniem płatności aplikować migrację,
  inaczej obietnica z Centrum Kariery będzie martwa mimo kodu.
  _(wpis od agenta)_

- Karnet Aplikacyjny — stan po częściowym domknięciu: **strona odczytu dla
  funkcji beta istnieje** (`GET /api/me` → `hasActivePass` z
  `profiles.plan_expires_at`, przekazywane do bramek `FeatureGate` jako
  `hasPaidPass`). Nadal otwarta pozostaje decyzja produktowa, jak 30 wywołań
  AI z karnetu ma się liczyć wobec dziennego resetu `user_quotas` — do tego
  czasu kupujący karnet dostaje funkcje beta, ale wywołania AI liczą mu się
  dobowo tak samo jak kontu darmowemu. Karnetu nadal nie ma w cenniku UI, a
  `stripe_price_id` planu `karnet` czeka na prawdziwą cenę.
  _(wpis od agenta — usuń, jeśli nieaktualny)_

- Eksport Lovable (`cvelocity_doimportu`) zawierał plik `.env.development` z
  **prawdziwym kluczem publikowalnym Stripe (`pk_test_…`)**. Do repo go nie
  wpuściłem, ale klucz krążył poza kontrolą wersji — jeśli ten projekt testowy
  Stripe jest jeszcze żywy, rozważ użycie nowego klucza publishable w katalogu
  testowym. Pliku nie ma w historii gita, więc rotacja to czysta ostrożność.
  _(wpis od agenta po PR #101)_

- Migracje `docs/migracje/0005–0007` (gamifikacja, ankieta, antyfarming) i
  `docs/sql/0005_katalog_platnosci.sql` (tabela `template_entitlements`) są
  **dokumentacją schematu, nie zastosowanymi migracjami** — trasy
  `gamification.routes.ts` i `intel.routes.ts` zamontowane w `server.ts`
  odpalą się dopiero w trybie chmurowym i przy braku tych tabel będą padać.
  Pod Firebase Hosting (frontend-only) nie mają dziś odbiorcy, zgodnie z
  opisem stanu w README. Decyzja: aplikować do Supabase przed włączeniem
  backendu w chmurze.
  _(wpis od agenta po PR #101)_


- Karnet Aplikacyjny ma dziś stronę **zapisu** (webhook `mode=payment` →
  `activate_application_pass`, migracja `0004`), ale **nie ma jeszcze strony
  odczytu**: `getEntitlements` i `consume_quota` rozstrzygają wyłącznie po
  `subscriptions.status`, więc kupiony karnet niczego użytkownikowi nie
  odblokuje. Domknięcie wymaga decyzji produktowej, jak 30 wywołań AI ma się
  liczyć wobec istniejącego dziennego resetu `user_quotas` — dlatego tego nie
  zgadywałem w gałęzi. Przed włączeniem płatności trzeba też wpisać prawdziwy
  `stripe_price_id` w wierszu planu `karnet`.
  _(wpis od agenta — usuń, jeśli nieaktualny)_

- Suita testowa podpakietu `semantic-work-graph` krzacza się przy teardównie na
  Node 22/Windows natywnym błędem better-sqlite3 (`Assertion failed:
  (env) != nullptr`) — odtworzone na czystym drzewie bez moich zmian, więc to
  zastane. Testy jednostkowe przechodzą; wysypuje się samo zamykanie procesu.
  Do diagnozy osobno (wersja better-sqlite3 vs Node ABI / pool vitest).
  _(wpis od agenta — usuń, jeśli nieaktualny)_

- `matchSubRoles` nie trafia w realistyczny tytuł zawodu fizycznego, a trafia
  w informatyczny — i to psuje więcej niż podpowiedzi. Marka figuruje
  w katalogu jako `'Junkers / Bosch'`, a `phraseSpecificity`
  (`specializationIndex.ts:121`) wymaga **wszystkich** członów frazy, więc
  „Serwisant kotłów gazowych Junkers" zbiera zero punktów, podczas gdy
  „Frontend Developer React TypeScript" zbiera dwadzieścia — React i TypeScript
  stoją w katalogu jako osobne umiejętności. Domyślny próg `minimumScore = 4`
  przepuszcza więc programistę i odrzuca montera, dokładnie odwrotnie do
  reguły 8. `cvQuestionEngine` obchodzi to progiem zerowym i trzecim stanem
  „nie wiem" (wtedy pokazuje przykłady z obu światów), ale sam indeks zostaje
  niedokładny — a korzysta z niego też `quickAtsCheck`. Naprawa to albo
  rozbicie fraz wielomarkowych przy imporcie katalogu, albo dopuszczenie
  trafienia częściowego z niższą wagą.
  _(wpis od agenta — usuń, jeśli nieaktualny)_

- `AchievementEditor.handleUpdateText` (`:37-55`) wyciąga słowa kluczowe
  wyrażeniem `/^[A-Za-z0-9+#.-]+$/`, które **odrzuca polskie znaki**.
  „wdrożenie", „bezpieczeństwo" czy „zarządzanie" nigdy nie zostaną słowem
  kluczowym, więc chipy pod osiągnięciem są dla polskojęzycznego CV prawie
  puste. Reszta projektu ma do tego `getPolishStem` i `HR_AND_COMMON_STOP_WORDS`
  w `atsSimulator.ts` — ten regex jest trzecim, gorszym podejściem do tego
  samego zadania.
  _(wpis od agenta — usuń, jeśli nieaktualny)_

- Martwy łańcuch propa `onOpenAdvisor`: `ExperienceSection` (`:22, :29, :225`)
  przyjmuje go i przekazuje do `AchievementEditor`, gdzie jest destrukturyzowany
  (`:19`) i **nigdy nieużyty**. Nie usunąłem przy okazji usuwania fałszywego
  przycisku „AI", bo skasowanie propa kaskaduje w górę przez dwa komponenty
  i ich wywołania — to osobna, mechaniczna zmiana (reguła 5).
  _(wpis od agenta — usuń, jeśli nieaktualny)_

- Silnik „następnego kroku" (`src/lib/nextAction.ts`) liczy się w przeglądarce,
  choć raport strategiczny przewiduje dla niego endpoint `GET /api/next-action`.
  Powód jest w kodzie, nie w wygodzie: `AuthContext` zakłada wyłącznie profil
  lokalny i nikogo nie uwierzytelnia (`src/context/AuthContext.tsx:30`), a
  `setAccessTokenProvider` nie ma po stronie klienta ani jednego logowania,
  które dostarczyłoby token. Trasy pod `requireAuth` — `/api/vault`
  i `/api/applications` — są więc z tej przeglądarki nieosiągalne i dalej mają
  zero wywołań, dokładnie jak opisuje reguła 5 w `AGENTS.md`. Endpoint czytający
  Supabase zwracałby dziś „uzupełnij profil" każdemu, bo vault nigdy tam nie
  trafia. Przeniesienie silnika na serwer ma sens dopiero po zalogowaniu
  po stronie klienta i po fazie 1–3 synchronizacji vaultu; sam silnik jest już
  czystą funkcją bez dostępu do DOM-u i do schowka, więc przeprowadzka to
  podmiana źródła danych, nie przepisanie logiki.
  _(wpis od agenta — usuń, jeśli nieaktualny)_

- `JobOffer` gubi część płatnego parsowania oferty. `/api/parse-jd` zwraca pełne
  `ParsedJobDescription`, ale do `JobOffer` trafiają z niego tylko tytuł, firma,
  widełki, `requirements` i `techStack`. `seniorityLevel`, `coreResponsibilities`,
  `mandatoryRequirements` i `requiredSoftSkills` przepadają, więc widoki, które
  ich potrzebują — m.in. ściąga na rozmowę — odtwarzają je lokalną heurystyką
  z `parseJobDescriptionLocal`, mimo że lepszy wynik był już opłacony. Naprawa to
  przeniesienie `ParsedJobDescription` przez `JobOffer` albo obok niego.
  _(wpis od agenta — usuń, jeśli nieaktualny)_

---

## ✅ Załatwione

<!--
Format wpisu:

- ~~Treść uwagi~~
  - **Agent RRRR-MM-DD:** co zostało zrobione albo dlaczego zdecydowano inaczej. PR #NN.
-->

- ~~Wielowariantowe hooki, przywitania i eliminacja powtarzalności w generatorach (Pitch, Cover Letter, Follow-up).~~
  - **Antigravity 2026-08-24:** stworzono moduł `phrasingVariations.ts` z bankiem dynamicznych hooków, wstępów i CTA dla autoprezentacji (1-liner, 30s, 90s), listu motywacyjnego, podziękowań follow-up oraz renderera `ConsistencyGuard`. Dodano testy w `phrasingVariations.test.ts`.

- ~~Wykrywanie cyrylicy (CV z Ukrainy/Białorusi) i wymóg alfabetu łacińskiego w parserze CV.~~
  - **Antigravity 2026-08-24:** dodano funkcję `detectCyrillicScript()` w `cvUniversalParser.ts`, pole `hasCyrillicScript` oraz `warnings` w `ParsedCVResult`, baner ostrzegawczy w `DiffView.tsx` informujący o konieczności ręcznego uzupełnienia/przetłumaczenia oraz dedykowany zestaw testów w `src/lib/__tests__/cv_parser_cyrillic.test.ts`.

- ~~Słownik `interviewGlossaryDictionary.ts` nie zna terminów spoza IT (spawanie
  MIG/MAG/TIG, UDT, SEP, HACCP), więc glosariusz ściągi dla zawodów
  rzemieślniczych jest uczciwy, ale bardzo ubogi.~~
  - **Agent 2026-08-23:** dopisane 22 hasła z zawodów fizycznych — SEP G1/G2/G3,
    UDT, F-Gaz, metody spawania MIG/MAG/TIG/MMA, HACCP, GMP, sanepid, BHP, praca
    na wysokości, utrzymanie ruchu, 5S, Kaizen, ISO 9001, WMS, kompletacja.
    Pokrycia pilnuje test w `interview_cheat_sheet_engine.test.ts` („defines
    trade qualifications, not just IT terms"), bo bez niego znikłoby przy
    pierwszej edycji słownika. Które uprawnienia w ogóle istnieją, pozostaje
    w `src/data/licenses.ts` — słownik mówi wyłącznie, co znaczą.

- ~~Formularz startuje z danymi demo („Senior Full-Stack Engineer & Cloud Systems
  Architect", „TechGrowth Inc."). Nowy użytkownik może wziąć je za własne
  i wygenerować CV pod fikcyjną firmę.~~
  - **Agent 2026-08-23:** nieaktualne. Obecny `JobMatcher` startuje z pustymi
    polami, a `sampleVault.ts` eksportuje już tylko `createEmptyVault`.
    Uporządkowane przy okazji reguły 1 („zero wymyślonych danych").
