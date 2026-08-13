# Spostrzeżenia i notatki

> Notatnik roboczy: Adrian ↔ Claude.
>
> **Adrian** dopisuje uwagi w sekcji „🆕 Nowe" — jednym punktem `-`, bez żadnej dodatkowej składni.
> **Claude** przed każdą pracą nad repo czyta „🆕 Nowe", a po wykonaniu uwagi przenosi ją
> do „✅ Załatwione", przekreśla i dopisuje pod spodem krótkie podsumowanie.
>
> Zasady dla agentów opisane są w `AGENTS.md` §0.

---

## 🆕 Nowe

<!-- Dopisuj tutaj. Jeden punkt = jedna uwaga. -->

---

## ✅ Załatwione

<!--
Format wpisu:

- ~~Treść uwagi~~
  - **Claude 2026-08-12:** co zostało zrobione albo dlaczego zdecydowano inaczej. PR #NN.
-->

- ~~Import CV / preparse AI nie zachowywał rzeczywistych stanowisk i uczelni~~
  - **Claude 2026-08-12:** usunięto placeholdery z `src/lib/cvUniversalParser.ts`, dodano bezpieczny fallback lokalnego parsera w `src/server/gemini.ts` i test regresyjny z realnym CV. Weryfikacja: `npm run lint`, `npm test`, `npm run build`. PR #TBD.

- ~~Scraper ofert z URL nie działał na portalach typu OLX / Pracuj.pl / inne job boardy~~
  - **Claude 2026-08-12:** poprawiłem kolejność pobierania treści oferty, usunąłem błędne proxy i zachowałem bezpieczny fallback do surowego HTML/text; pipeline używa teraz czytelnego tekstu oferty zamiast kruchych extractorów na pojedynczym źródle. Weryfikacja: `npm run lint`, `npm test`, `npm run build`. PR #TBD.

- ~~Statystyki oszczędności tokenów były zbyt szacunkowe i nie odzwierciedlały realnej aktywności API~~
  - **Claude 2026-08-12:** usunięto sztuczne wartości startowe, dodano live synchronizację z rzeczywistych metryk Gemini z `usageMetadata` przez endpoint `/api/usage/stats`, a widget statystyk odświeża dane co 5 sekund. Weryfikacja: `npm run lint`, `npm test`, `npm run build`. PR #TBD.

- ~~Krok 1 Quizu Master Vault był ścianą tekstu (6 pól naraz), Krok 3 sugerował SQL fryzjerowi, Krok 2 miał zaszyte na sztywno realne dane osobowe jako "szablon", brak wsparcia dla formy gramatycznej (męska/żeńska) w pytaniach; brak strony głównej z poradami/blogiem pod SEO~~
  - **Claude 2026-08-12:** Krok 1 przerobiony na flow "jedno pytanie na ekran" (Typeform-style) z klikalnymi kropkami postępu; Imię/Nazwisko rozdzielone na dwa niezależne pola (nie gubią złożonych imion typu "Bogumił Radosław"). Dodano pytanie o formę gramatyczną (Kobieta/Mężczyzna/Nie chcę udzielać odpowiedzi) używaną wyłącznie do poprawnej odmiany czasowników w dalszych pytaniach Quizu (`genderForm` w `PersonalInfo`, nie trafia do CV). Krok 3: sugestie umiejętności są teraz wyprowadzane z tytułu zawodowego przez `roleKnowledge.ts` zamiast jednej statycznej listy dla wszystkich zawodów; brak dopasowania = wyszukiwarka po wszystkich zawodach, bez zmyślonych sugestii. Krok 2: usunięto zaszyte na sztywno "szablony historii" (Bank Pekao S.A. / PartWork / Interia.pl z realnymi datami i wskaźnikiem) — to były prawdziwe dane osobowe pokazywane jako przykład każdemu użytkownikowi. Dodano `src/components/LandingPage.tsx` jako nową domyślną zakładkę "Strona Główna": mikroblog (3 wpisy) + panel szybkich porad zawodowych, ustawioną jako punkt wejścia do aplikacji. Weryfikacja: `npm run lint`, `npm test` (113/113), `npm run build`, ręczne testy w przeglądarce. PR #TBD.

- ~~Dopasowanie ATS pokazywało 100% zgodności mimo słabego/pustego CV; sugestie stanowiska po kilku literach nie miały sensu; scraper ofert padał bez fallbacku przy limicie Gemini; nazwa dostawcy benefitu (PZU) była pokazywana jako wymagany skill~~
  - **Claude 2026-08-12:** (1) `atsSimulator.ts` — `hardSkillsCoverage`/`formalReqsCoverage` domyślnie zwracały 100%, gdy z ogłoszenia nie dało się wyodrębnić ŻADNYCH wymagań. Teraz domyślają do 0% i `gapAnalysis` jawnie informuje, że analiza jest niemiarodajna. (2) `roleKnowledge.ts` — `inferRoleKnowledge` dopasowywał rolę po dowolnym podciągu znaków bez minimalnej długości. Teraz wymaga min. 3 znaków i dopasowania po całych słowach. (3) `src/server/gemini.ts` — dodano fallback do lokalnego `parseJobDescriptionLocal`. (4) `atsSimulator.ts` — dodano PZU do `NON_SKILL_ACRONYMS`. Testy regresyjne zaktualizowane.

- ~~Słownik interviewGlossaryDictionary.ts nie zna terminów spoza IT (spawanie MIG/MAG/TIG, UDT, SEP, HACCP), więc glosariusz ściągi dla zawodów rzemieślniczych jest uczciwy, ale bardzo ubogi.~~
  - **Antigravity 2026-08-12:** dodano 24 nowe terminy z branży przemysłowej, logistycznej, budowlanej i księgowej (BHP, PPoż, Sanepid, UDT, WMS, Wózek widłowy, FIFO/LIFO, KPiR, ZUS, VAT, Triażowanie itp.).

- ~~Rebranding i zmiana nazwy projektu na CVELOCITY wraz z aktualizacją loga, tekstów UI, nagłówków, konfiguracji i bezpiecznej migracji kluczy localStorage.~~
  - **Antigravity 2026-08-12:** Przeprowadzono rebranding projektu na CVELOCITY (tytuł strony, sidebar, stopka, 2FA issuer, podpowiedzi Gemini, obsługa domeny cvelocity.oathcry.com i kluczy cvelocity_*).

- ~~Dopisanie testów jednostkowych do nieprzetestowanych modułów z src/lib/ oraz optymalizacja bundla (Code Splitting).~~
  - **Antigravity 2026-08-13:** Dodano 5 nowych zestawów testów unit (147 pasujących testów), oraz skonfigurowano `manualChunks` w `vite.config.ts` (skrócenie czasu budowania z 21.6 s do 6.2 s).

- ~~Audyt kodu pod kątem 0-Halucynacji (AGENTS.md §8.3) i nieprzetestowanych modułów security/api.~~
  - **Antigravity 2026-08-13:** Usunięto zmyśloną wartość domyślną ('Adrian Koziński') z `linkedinParser.ts` w przypadku braku danych, zsynchronizowano czyszczenie zmiennych oraz dodano 3 nowe zestawy testów jednostkowych (`linkedin_parser.test.ts`, `security_guardrails.test.ts`, `api_client.test.ts`).

- ~~Konta użytkowników i vault żyły wyłącznie w localStorage — aplikacja nie działała między urządzeniami/przeglądarkami, co czyniło ją de facto bezużyteczną~~
  - **Claude 2026-08-12:** zastąpiono domową bazę kont (`lib/auth.ts`, PBKDF2 + localStorage) prawdziwym Firebase Auth (email/hasło + Google), a vault przeniesiono do Firestore (`vaults/{uid}`, `lib/firestoreVault.ts`) z regułami bezpieczeństwa (`firestore.rules`) ograniczającymi dostęp do własnego uid. PR #64.
