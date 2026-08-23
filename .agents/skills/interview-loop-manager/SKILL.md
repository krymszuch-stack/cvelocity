---
name: interview-loop-manager
description: "Interview Loop Manager zarządza pełnym cyklem rozmowy rekrutacyjnej (360°): checklistą techniczną przed spotkaniem, śledzeniem etapów i notatek na żywo oraz debriefem z generatorem maila follow-up."
---

# Interview Loop Manager (interview-loop-manager-v1)

Skill wspiera kandydata przed, w trakcie i po rozmowie rekrutacyjnej (Interview Loop) za pośrednictwem 3 podmodułów:
1. **Pre-Call Checklist** (`pre-call-checklist`): Weryfikacja techniczna (mikrofon, kamera, sieć), merytoryczna (pitch 30s, badania firmy, historie STAR) i otoczenia (woda, Live HUD).
2. **Live Tracker** (`live-tracker`): Dynamiczne monitorowanie etapów spotkania (Intro $\rightarrow$ Technical $\rightarrow$ System Design $\rightarrow$ Behavioral $\rightarrow$ Candidate Q&A $\rightarrow$ Wrap-up), rejestracja pytań i szybkich notatek z sentymentem.
3. **Post-Call Debrief** (`post-call-debrief`): Natychmiastowa analiza po rozmowie, wychwycenie trudnych pytań, kwestii do doprecyzowania oraz generowanie profesjonalnego maila z podziękowaniem (Follow-Up Email).

## Metadane Skilla
- **ID**: `interview-loop-manager-v1`
- **Sub-skills**: `pre-call-checklist`, `live-tracker`, `post-call-debrief`
- **Storage**: `IndexedDB` / `LocalStorage` (rejestr `StorageKeys.interviewLoops` w `src/lib/storage.ts`)
- **Activation**:
  - `onPageLoad("/interview/[id]")`
  - `onInterviewSessionOpen`
  - Kliknięcie w widoku aplikacji

## Rejestracja Skilla:
```typescript
import { InterviewLoopManager } from './skills/interview-loop-manager';
import { ag } from './skills/liveHudSkill';

ag.registerSkill(InterviewLoopManager);
```
