---
name: elevator-pitch-gen
description: "Elevator Pitch Generator tworzy 3 precyzyjne wersje autoprezentacji (1-liner, 30s, 90s) w 100% oparte na faktach i metrykach z MasterVault."
---

# Elevator Pitch Generator (elevator-pitch-gen-v1)

Skill generuje 3 warianty profesjonalnej autoprezentacji na rozmowę kwalifikacyjną, dostosowane do naturalnego tempa wypowiedzi (~130 WPM):
1. **1-liner** (szybki nagłówek / hook, ~10s)
2. **30s** (standardowa odpowiedź na „Opowiedz coś o sobie”, ~30-35s)
3. **90s** (pogłębiona narracja STAR z metrykami sukcesu, ~80-90s)

## Metadane Skilla
- **ID**: `elevator-pitch-gen-v1`
- **Dependencies**: `slot-filling-engine`, `master-vault`
- **Output**: 3 wersje pitcha (`1-liner`, `30s`, `90s`)
- **UI**: `EditableTextWithTimer`
- **Activation**:
  - Skrót klawiszowy: `Ctrl+P` / `Cmd+P`
  - Zdarzenie: `onInterviewStart`

## Rejestracja Skilla:
```typescript
import { ElevatorPitchGen } from './skills/elevator-pitch-gen';
import { ag } from './skills/liveHudSkill';

ag.registerSkill(ElevatorPitchGen);
ag.bindShortcut('Ctrl+P', () => ag.invokeSkill('elevator-pitch-gen-v1'));
```
