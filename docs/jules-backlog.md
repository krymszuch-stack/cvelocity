# Backlog i rutyna konserwacyjna (Jules)

Zadania przygotowane pod agenta asynchronicznego. Każde jest **wąskie, samodzielne i weryfikowalne**
poleceniem z `AGENTS.md` §3. Przed startem agent czyta `AGENTS.md`, a przy zadaniach UI dodatkowo
`REDESIGN_HANDOFF.md`.

## Zasady zlecania

- Jedno zadanie = jeden PR. Nie łącz.
- W treści zlecenia zawsze podaj: plik(i), oczekiwany efekt, sposób weryfikacji.
- Zadania oznaczone 🔒 wymagają decyzji człowieka — nie zlecaj ich agentowi.

---

## A. Dokończenie redesignu (priorytet 1)

11 komponentów wciąż ma zaszyte klasy palety, przez co **tryb ciemny wygląda w nich źle**.
Kontrakt i ściąga mapowania: `REDESIGN_HANDOFF.md` §4.

Kolejność od najmniejszych — każdy osobnym PR-em:

| # | Plik | ~klas | Uwagi |
|---|---|---|---|
| A1 | `TokenStatsWidget.tsx` | 44 | przepiąć na `Modal` + `StatTile` |
| A2 | `ProfilerSection.tsx` | 74 | użyć `Toggle`, `Select`, `Card` |
| A3 | `CoverLetterView.tsx` | 84 | |
| A4 | `AtsSimulatorView.tsx` | 96 | użyć `ScoreRing`, `ProgressBar`, `StatTile` |
| A5 | `CVParserModal.tsx` | 97 | mimo nazwy to **strona**, nie modal |
| A6 | `AuthModal.tsx` | 107 | ekran 2FA wymaga `dismissable={false}` |
| A7 | `JDParserModal.tsx` | 112 | przepiąć na `Modal` |
| A8 | `GeminiAdvisorModal.tsx` | 157 | przepiąć na `Modal` |
| A9 | `CVWordBuilder.tsx` | 191 | ⚠️ kartka A4 (linia ~652) zostaje biała |
| A10 | `DocumentRenderer.tsx` | 263 | ⚠️ tylko chrome; ~740–1220 to treść dokumentu |
| A11 | `MasterVaultEditor.tsx` | 613 | 2943 linie — przy okazji rozbić na podkomponenty |

**Weryfikacja każdego:** `npm run lint && npm test && npm run build`, plus wizualnie oba motywy.
Dla A9/A10 dodatkowo: podgląd CV nadal białą kartką w trybie ciemnym, eksport PDF czytelny.

## B. Wydajność

- **B1.** Code-splitting ciężkich zależności przez `dynamic import()`: `pdfjs-dist`, `docx`, `jspdf`,
  `html2canvas`. Bundle waży dziś **2,8 MB (799 kB gzip)** w jednym chunku.
  Weryfikacja: `npm run build:client` pokazuje główny chunk wyraźnie mniejszy, aplikacja nadal parsuje PDF/DOCX i eksportuje.

## C. Jakość i testy

- **C1.** Testy jednostkowe dla `src/lib/atsSimulator.ts` (scoring, brakujące słowa kluczowe).
- **C2.** Testy jednostkowe dla `src/lib/relevanceRanking.ts` (kolejność przy różnych zestawach słów kluczowych).
- **C3.** Przegląd `MasterVaultEditor.tsx` pod kątem martwego kodu i powtórzeń (był już raz źródłem
  ~300 linii nieosiągalnego kodu w `JobMatcher.tsx`).

## D. Higiena

- **D1.** Sprawdzić, czy `README.md` i `.env.example` odpowiadają rzeczywistości. Rozjazd już raz wystąpił
  (nieaktualna sekcja Azure/MSAL długo po usunięciu integracji).
- **D2.** Przegląd `npm audit` — patch/minor do PR-a, major do decyzji człowieka.

## E. 🔒 Wymagające człowieka — nie zlecać agentowi

- Autoryzacja endpointów AI (weryfikacja Firebase ID tokena po stronie backendu). Dziś chroni je tylko
  rate limit — każdy może palić budżet Gemini.
- Ustawienie twardego budżetu i alertu na kluczu Gemini w Google AI Studio / GCP.
- Zmiany w `render.yaml`, `firebase.json`, workflowach deployu, DNS i sekretach.
- Aktualizacja opisu projektu w portfolio (`dev-portfolio`), który dziś opisuje SkillVault jako
  wieloużytkownikowy SaaS na Firestore — a aplikacja trzyma dane w localStorage.

---

## Rutyna konserwacyjna

### Warunki wstępne (bez nich automat robi szkody)

- **Branch protection na `main`**: wymagany zielony CI przed merge, zakaz bezpośredniego push.
  Krytyczne, bo Render ma `autoDeploy: true` — bez tej ochrony na produkcję trafi każdy commit,
  także taki, który nie przeszedł testów.
- Sekrety i zmienne skonfigurowane w GitHubie (patrz `REDESIGN_HANDOFF.md` / `deploy-frontend.yml`).

### Tygodniowo

1. Przegląd PR-ów Dependabota: patch/minor → merge przy zielonym CI; major → ocena człowieka.
2. Przegląd wyniku `npm audit` z CI.
3. Jedno zadanie z backlogu (kolejność: A → B → C).

### Miesięcznie

1. Raport rozmiaru bundla — czy nie rośnie bez powodu.
2. Przegląd martwego kodu i nieużywanych zależności.
3. Sprawdzenie, czy dokumentacja (`README.md`, `.env.example`, `AGENTS.md`) nadal odpowiada kodowi.
4. Kontrola zużycia darmowych limitów: instance-hours Rendera, transfer Firebase, quota Gemini.

### Reguła review

Każdy PR od agenta wymaga **zielonego CI** *oraz* **ludzkiego spojrzenia na diff** przed merge.
Agent nigdy nie merge'uje sam. Przy zmianach UI obowiązkowo sprawdzić zrzut w obu motywach.
