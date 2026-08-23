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
