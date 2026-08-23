---
name: claim-consistency-guard
description: "Claim Consistency Guard (claim-consistency-guard-v1) waliduje spójność claimId pomiędzy MasterVault a rendererami CV, HUD, Pitch i eksporterem LinkedIn. Pilnuje rozbieżności w datach (< 0.5r) i sprzeczności technologicznych."
---

# Claim Consistency Guard (claim-consistency-guard-v1)

Skill czuwa nad bezwzględną spójnością faktów w całym ekosystemie aplikacji (Single Source of Truth):
- **Weryfikacja Claimów**: Każde osiągnięcie, data i skill posiada unikalny `claimId` wywodzący się z MasterVault.
- **Renderery Oparte o ClaimId**:
  - `cv-renderer`: Generuje sekcje i punkty CV powiązane z potwierdzonymi faktami.
  - `live-hud-renderer`: Ekstrahuje zweryfikowane metryki do telepromptera.
  - `pitch-renderer`: Formułuje Elevator Pitch w 100% oparty o udokumentowane claims.
  - `linkedin-exporter`: Eksportuje profil zawodowy ze zweryfikowanymi pozycjami doświadczenia.
- **Walidator Reguł**:
  - Rozbieżność w latach pomiędzy źródłem a prezentacją nie może przekraczać **0.5 roku** (6 miesięcy).
  - Wykrywanie sprzeczności w skillach i technologiach.
  - Wykrywanie odwołań do nieistniejących lub usuniętych `claimId`.
- **Interfejs Użytkownika**:
  - Ikona 🔒 (`ConsistencyLockBadge`) przy każdej sekcji z tooltipem *"Spójność potwierdzona"*.

## Metadane Skilla
- **ID**: `claim-consistency-guard-v1`
- **Dependencies**: `master-vault`, `cv-renderer`, `linkedin-exporter`
- **Action**: Waliduje spójność `claimId` między renderami
- **UI**: Ikona 🔒 przy każdej sekcji z tooltipem
- **Trigger**: `onSave`, `onExport`, `onGenerate`

## Rejestracja Skilla:
```typescript
import { ClaimConsistencyGuard } from './skills/claim-consistency-guard';
import { ag } from './skills/liveHudSkill';

ag.registerSkill(ClaimConsistencyGuard);
```
