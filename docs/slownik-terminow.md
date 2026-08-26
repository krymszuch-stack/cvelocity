# Słownik terminów produktowych — CVELOCITY

> **Status:** decyzja namingowa po audycie treści
> ([`AUDYT-TRESCI-MARKETINGOWEJ.md`](./AUDYT-TRESCI-MARKETINGOWEJ.md) §4).
> To jedyne miejsce, które ustala, jak nazywamy rzeczy w interfejsie. Nowe copy
> brać stąd; stary wariant w istniejącym tekście to błąd do poprawy przy
> dotykaniu pliku (reguła 4 — klasa, nie wystąpienie).

## Terminy kanoniczne

| Kanon | Wykluczone warianty | Uzasadnienie (skąd decyzja) |
|---|---|---|
| **audyt ATS** (odm. „audytu ATS") | Ocena ATS · Symulator ATS · audytor ATS · Analiza ATS | Jedna funkcja, cztery nazwy (§4). „Audyt" pokrywa się z nazwą modułu „Laboratorium Audytu ATS 360°" i wierszem cennika |
| **Master Vault** (gen. „Master Vaultu") | MasterVault (w copy) · Vault · Skarbiec · „profil" wymiennie | Dwuczłonowa forma czyta się w polszczyźnie lepiej; identyfikatory kodu (`masterVault`, typy) zostają bez spacji — reguła dotyczy wyłącznie tekstu UI |
| **CVelocity Pro** / **CVelocity Free** (pełna nazwa planu) | CVELOCITY Pro/Free w zdaniach · Plan Podstawowy · Plan Pro | Wielkość liter marki: camelCase jak w logo, meta i dokumencie; „Podstawowy" tworzył drugą nazwę tego samego planu. Chip „Pro"/„Free" pozostaje skrótem w pigułkach stanu |
| **Doradca Kariery** | Doradca AI · Okienko Doradcy AI (Gemini Advisor) | Nazwa funkcji, nie technologii; po audycie §2.4 modal jest regułowy, a brand modelu w etykiecie wprowadzał w błąd |
| **pipeline aplikacji** (małą w zdaniu; kafele „Pipeline aplikacji") | CRM · CRM Rejestr · Live Recruitment CRM · Pipeline zgłoszeń (CRM) | „CRM" niczego użytkownikowi nie mówiło i naklejało trzecią nazwę; rejestr i analityka to dwa różne fakty |
| **Pro Insights** (bez dopisku CRM) | Pro Insights CRM · Trendy & Prognozy | Analityka Pro to osobna funkcja od pipeline'u — rozgraniczenie z wiersza wyżej |
| **Modern i Minimal** / **Executive i Creative** | Modern/Minimal · Modern & Minimal · Nowoczesny i Minimalny | Nazwy własne szablonów (`modern/minimal/executive/creative`) + polski spójnik; koniec trzech pisowni jednej pary |
| **30 dni za darmo** (chip/CTA) | Trial 30 dni · Aktywuj trial · 6 innych wariantów | Jeden komunikat oferty; opis „darmowy okres próbny" dopuszczalny wyłącznie w treści karty planu |
| **S — Sytuacja / T — Zadanie / A — Działanie / R — Rezultat** | S (Situation • Kontekst) · [S] Situation · S (Situation) | Trzy rodziny nagłówków STAR (§4); polski opis pod literą metododyki, jednolity we wszystkich widokach |
| **Mock Drill** (moduł), **trening odpowiedzi** (czynność) | DrillMode · drill/drillu · Mock Drill Mode · Ćwicz | Koniec mieszania trzech słów w obrębie jednego okna |
| **Live Tracker** (moduł) | Zasobnik Rozmowy | Dwie nazwy tego samego ekranu śledzenia rozmowy |
| **Mapper słów kluczowych** | JD Keyword Mapper | Polska nazwa funkcji; identyfikator techniczny zostaje w kodzie |
| **Most kompetencyjny** | Skill Bridging · most transferowy · Most (Bridge) | Cztery nazwy jednego mechanizmu (§4) |
| **e-mail follow-up** (rzeczownik), „follow-up" w zdaniu małą | Follow-Up Email · mail · (Follow-Up) | Jedna pisownia zapożyczenia i jedna kolejność członów |
| **List motywacyjny bez szablonu** (nagłówek) | Anti-Template Cover Letter (0-Token Engine) | Angielski banner w polskim interfejsie obiecywał „engine" — treść po polsku, obietnica 0 tokenów zostaje |
| **Ściąga na rozmowę rekrutacyjną** | Interview Cheat Sheet w nagłówku głównym | Angielski alias może pozostać jako drobny podtytuł (wyszukiwalność), nie jako tytuł |

## Świadome wyjątki

- **Odznaki ALL-CAPS** („CVELOCITY PRICING", „ATS LOKALNIE") to styl
  typograficzny badge'ów `font-mono uppercase`, nie osobna pisownia marki —
  zostają.
- **Etykiety makiet landingu** („Rentgen ATS", „Mapa ciepła") opisują tryby
  podglądu wizualizacji, nie funkcję produktu — zostają.
- **Identyfikatory w kodzie** (`masterVault`, `TemplateId`, `DrillModeModal`)
  nie podlegają słownikowi; dotyczy on wyłącznie tekstu widocznego dla
  użytkownika.
