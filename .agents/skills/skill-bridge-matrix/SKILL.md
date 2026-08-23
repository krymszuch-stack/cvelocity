---
name: skill-bridge-matrix
description: "Skill Bridge Matrix zamienia luki technologiczne w przekonujące odpowiedzi rekrutacyjne oparte na ekwiwalencji pojęciowej i dowodach z MasterVault."
---

# Skill Bridge Matrix (skill-bridge-matrix-v1)

Skill analizuje luki kompetencyjne kandydata (Missing Skills) i generuje gotowe mosty kompetencyjne (**SkillBridge**) — perswazyjne odpowiedzi wyjaśniające, jak znajomość technologii pokrewnej w 100% niweluje brakujące narzędzie.

## Metadane Skilla
- **ID**: `skill-bridge-matrix-v1`
- **Dependencies**: `gap-analysis`, `master-vault`, `pathfinder`
- **Data Model**: `SkillBridge` (TypeScript interface)
- **Activation**:
  - Skrót klawiszowy: `Ctrl+B` / `Cmd+B`
  - Zdarzenie: `onQuestion("What about your lack of X?")`
  - Zdarzenie systemowe: `gap-detected` (auto-load mostów przy wykryciu luki w ogłoszeniu)

## Rejestracja Skilla:
```typescript
import { SkillBridgeMatrix } from './skills/skill-bridge-matrix';
import { ag } from './skills/agRegistry';

ag.registerSkill(SkillBridgeMatrix);

// Auto-load bridges gdy GapAnalysis wykryje lukę
ag.listen('gap-detected', (skill: string) => {
  ag.invokeSkill('skill-bridge-matrix-v1', { missingSkill: skill });
});
```
