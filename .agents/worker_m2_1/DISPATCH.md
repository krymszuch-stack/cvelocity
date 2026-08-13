## 2026-08-12T20:58:38Z
You are worker_m2_1.
Your working directory is: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\worker_m2_1
Required Reading:
- Original Request Path: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\ORIGINAL_REQUEST.md
- Project Scope Document: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\PROJECT.md
- Milestone Scope Document: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\sub_orch_m2\SCOPE.md
- AGENTS.md rules: c:\Users\Adrian\Documents\GitHub\skillvault\AGENTS.md
- Explorer M2.1 Handoff Report: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\explorer_m2_1\handoff.md
- Explorer M2.2 Handoff Report: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\explorer_m2_2\handoff.md
- Explorer M2.3 Handoff Report: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\explorer_m2_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task:
Implement Milestone 2 UI Component & Application Chrome Brand Alignment updates based on the Explorer reports:

1. Shell Components (`src/components/shell/`):
   - `Sidebar.tsx`: Update Shield emblem icon (line 65) from `text-white` to `text-brand-solid-fg`. Keep `bg-success-500` vault ready dot (compliant with AGENTS.md §4).
   - `Topbar.tsx`: Update user avatar initials badge (line 72) from `text-white` to `text-brand-solid-fg`.

2. Base UI Components (`src/components/ui/`):
   - `Field.tsx`: Update line 201 Toggle handle knob from `bg-white` to `bg-surface`.
   - `AdvisorButton.tsx`: Update line 23 from `bg-warning-50 text-warning-700` to `bg-warning-soft text-warning-fg`.
   - `Button.tsx`: Update line 17 primary variant text styling to `text-brand-solid-fg` to align with Champagne Gold WCAG AAA contrast token.

3. Chrome Views & Document Renderers (`src/components/` and `src/components/preview/`):
   - `DocumentRenderer.tsx`: Update all surrounding chrome toolbars, auto-tailor banner (`from-slate-900 to-brand-950`, `text-brand-300`, `text-brand-400`), variant selector bar, action buttons, export dropdown menu, style mixer bar (`from-brand-500 to-brand-600 text-brand-solid-fg`), outer canvas container (`bg-canvas border-line`), and external modals (Photo, Pre-flight, Compare) to consume design system tokens (`bg-surface`, `bg-sunken`, `bg-raised`, `bg-canvas`, `text-ink`, `text-muted`, `text-subtle`, `border-line`, `brand-*`, `success-*`, `warning-*`, `danger-*`).
   - `CVWordBuilder.tsx`: Update control banner, track changes stats, main canvas container (`bg-canvas border-line`), sticky MS Word ribbon toolbar (`sv-glass bg-surface/90 text-ink border-line`, `text-brand-fg`), A4 format badge (`bg-brand-soft border-brand-border text-brand-fg`), and promotion modal to consume design system tokens.
   - `MasterVaultEditor.tsx`: Update main container card (`bg-surface border-line text-ink`), vault header bar (`border-line`, icon box `bg-brand-soft text-brand-fg`, progress bar `from-brand-500 via-brand-400 to-brand-600`, save active `bg-brand-500 text-brand-solid-fg ring-brand-400`, export JSON `bg-raised hover:bg-sunken text-ink border-line`), sub-tabs bar (`border-line`, active tab `border-brand-500 text-brand-fg bg-brand-soft`), and form panel containers.

CRITICAL REQUIREMENT:
DO NOT modify, edit, or alter `.printable-area` white paper lock inside `DocumentRenderer.tsx` (line 787) or `CVWordBuilder.tsx` (line 573). The CV paper sheet MUST remain strictly locked to white paper (`#FFFFFF`) with dark text (`#0F172A`) across both light and dark themes.

Verification & Delivery:
1. Run `npm run lint` — must pass cleanly with 0 errors.
2. Run `npm test` — must pass 100% of test suites.
3. Run `npm run build` — must generate valid client and server bundles.
4. Write a comprehensive handoff report to `c:\Users\Adrian\Documents\GitHub\skillvault\.agents\worker_m2_1\handoff.md` documenting your exact code changes, test results, build results, and layout compliance.
5. Report completion back to parent `sub_orch_m2` using send_message.
