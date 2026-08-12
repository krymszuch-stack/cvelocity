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

- ~~Błąd klucza vaultu i duplikacja wpisów po imporcie CV~~
  - **Claude 2026-08-12:** usunięto fallback `default_key` z `AuthContext`, dodano bezpieczne przechowywanie sekretu vaultu w pamięci sesji i poprawiono merge po imporcie CV tak, by nie dublować historii, edukacji, projektów i certyfikacji. Weryfikacja: `npm run lint`, `npm test`, `npm run build`. PR #TBD.
