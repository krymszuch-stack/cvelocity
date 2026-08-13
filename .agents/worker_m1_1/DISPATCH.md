## 2026-08-12T20:50:12Z
You are worker_m1_1.
Your working directory is: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\worker_m1_1.

Mandatory Context Files to Read:
- c:\Users\Adrian\Documents\GitHub\skillvault\.agents\ORIGINAL_REQUEST.md
- c:\Users\Adrian\Documents\GitHub\skillvault\.agents\PROJECT.md
- c:\Users\Adrian\Documents\GitHub\skillvault\.agents\sub_orch_m1\SCOPE.md
- c:\Users\Adrian\Documents\GitHub\skillvault\AGENTS.md
- c:\Users\Adrian\Documents\GitHub\skillvault\.agents\explorer_m1_1\handoff.md
- c:\Users\Adrian\Documents\GitHub\skillvault\.agents\explorer_m1_2\handoff.md
- c:\Users\Adrian\Documents\GitHub\skillvault\.agents\explorer_m1_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Assigned Files & Ownership:
You own edits to:
- `src/index.css`
- `src/components/CVWordBuilder.tsx`

Task Instructions:
1. Update `src/index.css`:
   a. In `@theme`: Map all 10 brand shades (`--color-brand-50: var(--sv-brand-50);` through `--color-brand-950: var(--sv-brand-950);`), plus `--color-brand-soft`, `--color-brand-border`, `--color-brand-fg`, `--color-brand-solid-fg`. Preserve all canvas, surface, raised, sunken, overlay, line, line-strong, ink, muted, subtle, inverse mappings.
   b. In `:root, [data-theme='light']`:
      - Set `color-scheme: light;`
      - Set Deep Navy / Slate light surfaces & canvas: `--sv-canvas: #f8fafc;`, `--sv-surface: #ffffff;`, `--sv-raised: #ffffff;`, `--sv-sunken: #f1f5f9;`, `--sv-overlay: rgba(15, 23, 42, 0.5);`
      - Set borders: `--sv-line: #e2e8f0;`, `--sv-line-strong: #cbd5e1;`
      - Set ink: `--sv-ink: #0f172a;`, `--sv-muted: #475569;`, `--sv-subtle: #64748b;`, `--sv-inverse: #ffffff;`
      - Set 10-shade Champagne Gold scale:
        `--sv-brand-50: #faf6ea;`, `--sv-brand-100: #f3eacf;`, `--sv-brand-200: #e6d4a3;`, `--sv-brand-300: #d8bd77;`, `--sv-brand-400: #d4af37;`, `--sv-brand-500: #c5a059;`, `--sv-brand-600: #b38e47;`, `--sv-brand-700: #8f6e2e;`, `--sv-brand-800: #5f481b;`, `--sv-brand-900: #423211;`, `--sv-brand-950: #2e1e07;`
      - Set brand auxiliary tokens: `--sv-brand-soft: #faf6ea;`, `--sv-brand-border: rgba(197, 160, 89, 0.28);`, `--sv-brand-fg: #795200;` (7.05:1 contrast), `--sv-brand-solid-fg: #0f172a;` (8.4:1 contrast on gold).
      - Set shadows: `--sv-shadow-color: rgba(15, 23, 42, 0.06);`, `--sv-shadow-strong: rgba(15, 23, 42, 0.16);`
   c. In `[data-theme='dark']`:
      - Set `color-scheme: dark;`
      - Set Deep Navy dark surfaces & canvas: `--sv-canvas: #0f172a;` (Slate 900), `--sv-surface: #1e293b;` (Slate 800), `--sv-raised: #273549;`, `--sv-sunken: #0b1120;`, `--sv-overlay: rgba(2, 6, 23, 0.75);`
      - Set borders: `--sv-line: #334155;`, `--sv-line-strong: #475569;`
      - Set ink: `--sv-ink: #f8fafc;`, `--sv-muted: #cbd5e1;`, `--sv-subtle: #94a3b8;`, `--sv-inverse: #0f172a;`
      - Set 10-shade Champagne Gold scale (dark theme values):
        `--sv-brand-50: #2e1e07;`, `--sv-brand-100: #423211;`, `--sv-brand-200: #5f481b;`, `--sv-brand-300: #8f6e2e;`, `--sv-brand-400: #d4af37;`, `--sv-brand-500: #c5a059;`, `--sv-brand-600: #b38e47;`, `--sv-brand-700: #d8bd77;`, `--sv-brand-800: #e6d4a3;`, `--sv-brand-900: #f3eacf;`, `--sv-brand-950: #faf6ea;`
      - Set brand auxiliary tokens: `--sv-brand-soft: rgba(212, 175, 55, 0.12);`, `--sv-brand-border: rgba(212, 175, 55, 0.30);`, `--sv-brand-fg: #e5c158;` (11.46:1 contrast), `--sv-brand-solid-fg: #0f172a;` (8.4:1 contrast on gold).
      - Set shadows: `--sv-shadow-color: rgba(2, 6, 23, 0.45);`, `--sv-shadow-strong: rgba(2, 6, 23, 0.75);`
   d. Update `.printable-area` CSS rules:
      - Set `background-color: #ffffff;`, `color: #0f172a !important;`, `color-scheme: light !important;`
      - Locally re-scope light-mode theme variables within `.printable-area` (`--sv-canvas: #ffffff`, `--sv-surface: #ffffff`, `--sv-ink: #0f172a`, `--sv-muted: #475569`, `--sv-subtle: #64748b`, `--sv-line: #cbd5e1`, `--sv-line-strong: #94a3b8`)
      - Add `[data-theme='dark'] .printable-area { background-color: #ffffff !important; color: #0f172a !important; }`
      - Maintain `.printable-area, .printable-area * { border-color: #cbd5e1; }`
2. Update `src/components/CVWordBuilder.tsx`:
   - Line 573: Add `printable-area` class to the A4 page container element.
3. Verification Commands:
   - Run `npm run lint`
   - Run `npm test`
   - Run `npm run build`
4. Output Requirement:
   Write your handoff report to `c:\Users\Adrian\Documents\GitHub\skillvault\.agents\worker_m1_1\handoff.md` with:
   - Observation & rationale
   - Changed files
   - Command outputs for lint, test, build
   - Send summary message to parent.
