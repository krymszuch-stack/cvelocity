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
  - **Claude 2026-08-12:** (1) `atsSimulator.ts` — `hardSkillsCoverage`/`formalReqsCoverage` domyślnie zwracały 100%, gdy z ogłoszenia nie dało się wyodrębnić ŻADNYCH wymagań (pusty JD, JD niepasujący do słownika) — to już był udokumentowany bug w `docs/audyt-bugi-2026-08-04.md`. Teraz domyślają do 0% i `gapAnalysis` jawnie informuje, że analiza jest niemiarodajna. (2) `roleKnowledge.ts` — `inferRoleKnowledge` dopasowywał rolę po dowolnym podciągu znaków bez minimalnej długości, więc 1-2 wpisane litery tytułu stanowiska trafiały losowo w niepowiązaną rolę i pokazywały bezsensowne "Typowe wymagania". Teraz wymaga min. 3 znaków i dopasowania po całych słowach. (3) `src/server/gemini.ts` — `parseJobDescriptionWithGemini` (używane przez `/api/parse-jd` i `/api/fetch-jd-url`, czyli też przez scraper ofert) nie miało żadnego fallbacku przy błędzie Gemini (429/timeout) — całe wczytanie ogłoszenia po prostu się wywalało. Dodano fallback do lokalnego `parseJobDescriptionLocal`, analogicznie do już istniejącego wzorca w `parseRawCvToVault`. (4) `atsSimulator.ts` — ekstraktor akronimów łapał nazwy dostawców benefitów (np. "PZU" z sekcji "oferujemy ubezpieczenie PZU") jako rzekomo wymagany hard skill; dodano je do `NON_SKILL_ACRONYMS`. Testy regresyjne: `security_ats.test.ts` (puste JD, PZU), `role_knowledge_matching.test.ts` (nowy plik), `gemini_validation.test.ts` (fallback bez klucza Gemini). Weryfikacja: `npm run lint`, `npm test` (113 testów), `npm run build`. PR #TBD.
