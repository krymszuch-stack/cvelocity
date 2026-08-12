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

- Po pobraniu oferty z URL dobre parsowanie z Gemini jest wyrzucane: `JobMatcher.tsx` używa `parsedJd` tylko do audytu dopasowania, a `RealtimeLivePreview` i tak przelicza wszystko lokalnie. CV, list, ATS i ściąga korzystają więc z gorszych danych, mimo że lepsze już są pobrane. _(wpis od Claude — usuń, jeśli nieaktualny)_
- Formularz startuje z danymi demo („Senior Full-Stack Engineer & Cloud Systems Architect", „TechGrowth Inc."). Nowy użytkownik może wziąć je za własne i wygenerować CV pod fikcyjną firmę. _(wpis od Claude — usuń, jeśli nieaktualny)_
- Słownik `interviewGlossaryDictionary.ts` nie zna terminów spoza IT (spawanie MIG/MAG/TIG, UDT, SEP, HACCP), więc glosariusz ściągi dla zawodów rzemieślniczych jest uczciwy, ale bardzo ubogi. _(wpis od Claude — usuń, jeśli nieaktualny)_

---

## ✅ Załatwione

<!--
Format wpisu:

- ~~Treść uwagi~~
  - **Claude 2026-08-10:** co zostało zrobione albo dlaczego zdecydowano inaczej. PR #NN.
-->
