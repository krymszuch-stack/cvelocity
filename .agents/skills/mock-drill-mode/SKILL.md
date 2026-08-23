---
name: mock-drill-mode
description: "Mock Drill Mode (mock-drill-mode-v1) to interaktywny symulator szybkich odpowiedzi rekrutacyjnych z 60-sekundowym timerem, analizą struktury STAR, wykrywaniem twardych metryk liczbowych, miernikiem sprawczości (I vs We), opcjonalnym nagrywaniem audio i historią prób."
---

# Mock Drill Mode (mock-drill-mode-v1)

Skill symuluje szybkie sesje treningowe przed rozmową kwalifikacyjną w rygorystycznym formacie próby czasowej:
- **Timer 60s**: Zmusza do zwięzłości i eliminacji lania wody.
- **Scoring**: Automatyczna ewaluacja struktury STAR (Sytuacja, Zadanie, Działanie, Rezultat), wykrywanie metryk liczbowych oraz wskaźnik sprawczości (forma pierwszej osoby „Ja” vs rozmyte „My”).
- **History**: Trwały zapis wyników w `StorageKeys.drillHistory` (`cvelocity:drill-history`).
- **Audio Recording (opcjonalnie)**: Możliwość nagrywania głosu przez mikrofon lub wprowadzania tekstu.

## Metadane Skilla
- **ID**: `mock-drill-mode-v1`
- **Features**: `timer`, `scoring`, `history`, `audio recording (opcjonalnie)`
- **Activation**:
  - Przycisk UI: „Practice” / „Ćwicz (Cmd+D)”
  - Skrót klawiszowy: `Cmd+D` / `Ctrl+D`
  - Zdarzenia: `onPracticeStart`, `onClick("Practice")`

## Rejestracja Skilla:
```typescript
import { MockDrillMode } from './skills/mock-drill-mode';
import { ag } from './skills/liveHudSkill';

ag.registerSkill(MockDrillMode);
ag.bindShortcut('Cmd+D', () => ag.invokeSkill('mock-drill-mode-v1'));
ag.bindShortcut('Ctrl+D', () => ag.invokeSkill('mock-drill-mode-v1'));
```
