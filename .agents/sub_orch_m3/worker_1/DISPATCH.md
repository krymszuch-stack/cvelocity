# DISPATCH — Worker 1 (Milestone 3)

Your working directory is: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\sub_orch_m3\worker_1
Original Request Path: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\ORIGINAL_REQUEST.md
Project Scope Document: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\PROJECT.md
Explorer Reports:
- Explorer 1: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\sub_orch_m3\explorer_1\handoff.md
- Explorer 2: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\sub_orch_m3\explorer_2\handoff.md
- Explorer 3: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\sub_orch_m3\explorer_3\handoff.md

## Mission & Tasks
1. Implement comprehensive unit & quality verification test suite in `src/components/__tests__/theme.test.ts` (and/or `src/components/__tests__/printable_area.test.ts` if separated).
2. The tests MUST cover:
   - Theme switching logic & `data-theme` attribute toggling (light <-> dark).
   - Champagne Gold (`--sv-brand-400` `#d4af37`, `--sv-brand-500` `#c5a059`, `--sv-brand-600` `#b38e47`) and Deep Navy (`--sv-canvas` `#0f172a`, `--sv-surface` `#1e293b`) token definitions and `@theme` mappings in `src/index.css`.
   - `.printable-area` white paper isolation rules (`background-color: #ffffff` or `#FFFFFF`, `color: #0f172a` or `#0F172A`, `color-scheme: light !important`, re-scoped `--sv-*` tokens, universal border locking) across both Light and Dark themes.
   - Component validation for `DocumentRenderer.tsx` and `CVWordBuilder.tsx` verifying `.printable-area` container class presence and isolation preservation.
3. Run R3 quality verification commands:
   - `npm run lint`
   - `npm test`
   - `npm run build`
4. Document all findings, implementation details, test outputs, and verification results in `handoff.md` inside your working directory.

## File Ownership
You exclusively own:
- `src/components/__tests__/theme.test.ts`
- `src/components/__tests__/printable_area.test.ts` (if created)

DO NOT modify `AGENTS.md`, `render.yaml`, `firebase.json`, or `.env*`.
DO NOT modify `.printable-area` internal CSS rules to break white paper isolation.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
