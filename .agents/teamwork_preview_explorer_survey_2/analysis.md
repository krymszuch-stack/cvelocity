# CVELOCITY UI & Chrome Brand Alignment Investigation Report

**Author:** teamwork_preview_explorer_survey_2  
**Date:** 2026-08-12  
**Target Project:** CVELOCITY (`c:\Users\Adrian\Documents\GitHub\skillvault`)  
**Scope:** Design system tokens (`src/index.css`), UI base components (`src/components/ui/`), App shell (`Sidebar.tsx`, `Topbar.tsx`, `App.tsx`), Feature views, Document paper white invariant (`DocumentRenderer.tsx`, `CVWordBuilder.tsx`), and Champagne Gold / Deep Navy brand alignment.

---

## 1. Executive Summary

CVELOCITY is undergoing a brand identity refresh to align with the new CVELOCITY logo (Champagne Gold `#D4AF37`/`#C5A059` accents, Deep Navy `#0F172A`/`#1E293B` surfaces, and sleek high-contrast dual Light/Dark mode aesthetics).

This investigation conducted a complete audit of all UI components, design tokens, app shell elements, modal dialogs, and printable CV document sheet containers across the codebase.

### Key Discoveries
1. **Design System Token Architecture (`src/index.css`)**:
   - The token system utilizes a clean two-layer architecture (`--sv-*` raw palette mapped to Tailwind `@theme --color-*` utility classes).
   - Currently, primary brand tokens (`--sv-brand-*` and `--color-brand-*`) map to an **Indigo palette** (`#6366f1` / `#4f46e5`).
   - Updating `--sv-brand-*` and `--color-brand-*` in `src/index.css` to Champagne Gold (`#D4AF37` / `#C5A059` / `#E5C158`) and dark surfaces to Deep Navy (`#0F172A` / `#1E293B`) will automatically transform all design system base components (`Button`, `Card`, `Modal`, `Tabs`, `StatusBadge`, `Field`, `Feedback`) and shell elements (`Sidebar`, `Topbar`, `App`).

2. **CV Document Paper White Invariant Verification**:
   - **Hard Rule (AGENTS.md §5, REDESIGN_HANDOFF.md §4)**: The A4 printable CV sheet MUST remain white with dark text in BOTH Light and Dark themes to ensure accurate `window.print()` and PDF generation.
   - `DocumentRenderer.tsx`: Line 787 renders `w-[210mm] min-h-[297mm] p-10 shadow-2xl printable-area transition-all ${activeFont.cssClass} ${activePaper.bgClass}`. Line 176 in `index.css` enforces `.printable-area, .printable-area * { border-color: #cbd5e1; }`. Paper content remains white (`bg-white` in `PAPER_BACKGROUNDS`) with hardcoded dark text (`text-slate-900`, `text-slate-800`). **COMPLIANT.**
   - `CVWordBuilder.tsx`: Line 573 renders `w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl rounded-sm font-sans text-xs text-slate-900 space-y-6`. Paper content is white with dark text. **COMPLIANT.** (Recommendation: append `printable-area` class to line 573 for extra safety against border leaks).

3. **Legacy Hardcoded Class Audit**:
   While base UI components and shell elements use design system tokens, several feature views still contain legacy hardcoded Tailwind palette classes (`bg-white`, `bg-slate-*`, `text-slate-*`, `indigo-*`, `emerald-*` used as brand instead of status). The largest component needing token migration is `MasterVaultEditor.tsx` (~613 hardcoded classes).

---

## 2. Component & Chrome Token Inventory

The following table catalogs every component across the codebase, its current token/color consumption status, and required Champagne Gold / Deep Navy alignment actions:

| Component Category | File Path | Current Token & Color Consumption | Paper Invariant | Required Brand Alignment & Migration Action |
|---|---|---|---|---|
| **Design System Tokens** | `src/index.css` | Raw palette `--sv-brand-*` maps to Indigo (`#6366f1`). Canvas maps to neutral grey `#f7f8fa` (light) and `#0a0b10` (dark). | Defines `.printable-area` border rule. | **Core Change**: Update `--sv-brand-*` / `--color-brand-*` to Champagne Gold (`#D4AF37`, `#C5A059`, `#E5C158`). Update dark canvas/surface tokens to Deep Navy (`#0F172A`, `#1E293B`). |
| **App Shell Logo Emblem** | `src/components/shell/Sidebar.tsx` | Line 64: `bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-600/25` with `Shield` icon. Active items use `bg-brand-soft text-brand-fg bg-brand-500`. | N/A (Chrome) | **Auto-aligns**: Inherits Champagne Gold gradient and Deep Navy background when `index.css` tokens update. |
| **App Shell Topbar** | `src/components/shell/Topbar.tsx` | Line 72: `bg-gradient-to-br from-brand-500 to-brand-700` avatar. Lines 55 & 84: `text-brand-fg` for token count & login icons. | N/A (Chrome) | **Auto-aligns**: Inherits Champagne Gold accent when tokens update. |
| **Main Layout** | `src/App.tsx` | Line 156: `bg-canvas text-ink font-sans flex selection:bg-brand-500/25`. | N/A (Shell) | **Auto-aligns**: Text selection and canvas background will reflect Champagne Gold and Deep Navy automatically. |
| **Base UI: Button** | `src/components/ui/Button.tsx` | `from-brand-500 to-brand-600 text-white border-brand-600 shadow-brand-600/25 text-brand-fg bg-brand-soft`. | N/A (UI Base) | **Auto-aligns**: Primary, outline, and ghost buttons inherit Champagne Gold gradient & soft washes automatically. |
| **Base UI: Card** | `src/components/ui/Card.tsx` | `PageHeader` uses `from-brand-500 to-brand-700 shadow-brand-600/25`. `CardHeader` accent uses `bg-brand-soft text-brand-fg`. | N/A (UI Base) | **Auto-aligns**: Icon chips and header gradients update to Champagne Gold automatically. |
| **Base UI: Feedback** | `src/components/ui/Feedback.tsx` | `ALERT_STYLES.info` (`bg-brand-soft text-brand-fg`), `ProgressBar` (`bg-brand-500`), `StatTile` (`bg-brand-soft text-brand-fg`). | N/A (UI Base) | **Auto-aligns**: Info alerts and progress bars update to Champagne Gold automatically. |
| **Base UI: Field** | `src/components/ui/Field.tsx` | `focus:border-brand-500 focus:ring-brand-500/12`, `Toggle` `peer-checked:bg-brand-600`. | N/A (UI Base) | **Auto-aligns**: Focus rings and toggle switches update to Champagne Gold automatically. |
| **Base UI: Modal** | `src/components/ui/Modal.tsx` | `header` uses `from-brand-500 to-brand-700 shadow-brand-600/25` for icon badge. Chrome uses `bg-surface border-line bg-sunken`. | N/A (UI Base) | **Auto-aligns**: Dialog chrome and header emblem update to Champagne Gold & Deep Navy automatically. |
| **Base UI: StatusBadge** | `src/components/ui/StatusBadge.tsx` | `variant="brand"` uses `bg-brand-soft text-brand-fg border-brand-500/25`. | N/A (UI Base) | **Auto-aligns**: Brand badges update to Champagne Gold automatically. |
| **Base UI: Tabs** | `src/components/ui/Tabs.tsx` | Active underline tab uses `text-brand-fg border-brand-500`. Pill tab uses `bg-surface text-ink shadow-sm`. | N/A (UI Base) | **Auto-aligns**: Active tab indicators update to Champagne Gold automatically. |
| **Base UI: ThemeToggle** | `src/components/ui/ThemeToggle.tsx` | Moon icon uses `text-brand-400`. Sun icon uses `text-warning-500`. Track uses `bg-sunken border-line`. | N/A (UI Base) | **Auto-aligns**: Dark mode moon icon updates to Champagne Gold automatically. |
| **Feature View: JobMatcher** | `src/components/JobMatcher.tsx` | Uses `bg-brand-500/10` ambient wash, `text-brand-500` link, `Button variant="primary"`, `CardHeader`. | N/A (View) | **Auto-aligns**: Ambient glow and primary action buttons update to Champagne Gold automatically. |
| **Feature View: RealtimeLivePreview** | `src/components/RealtimeLivePreview.tsx` | Refactored using design system tokens (`bg-surface border-line text-ink text-muted StatusBadge Tabs`). | N/A (View) | **Auto-aligns**: Live preview status bar and tabs inherit Champagne Gold automatically. |
| **CV Sheet: DocumentRenderer** | `src/components/DocumentRenderer.tsx` | **Paper**: Line 787 `printable-area` sheet container with `bg-white` and dark `slate-*` text.<br>**Chrome**: Toolbars & controls use legacy `bg-slate-100`, `from-slate-900 to-indigo-950`, `bg-indigo-50`. | **SAFE (White Paper Invariant Verified)** | **Chrome Migration Needed**: Preserve paper interior (lines 817-1220). Migrate outer toolbars and option panels (lines 525-784) from hardcoded `slate/indigo` to `bg-surface`, `bg-sunken`, `border-line`, `brand-*`. |
| **CV Sheet: CVWordBuilder** | `src/components/CVWordBuilder.tsx` | **Paper**: Line 573 `bg-white` sheet container with `text-slate-900`.<br>**Chrome**: Floating toolbar (line 488 `bg-slate-900/95 border-slate-700`) and outer container (line 486 `bg-slate-200/80`). | **SAFE (White Paper Invariant Verified)** | **Chrome Migration Needed**: Add `printable-area` class to line 573 paper container for extra protection. Migrate outer toolbars/panels (lines 418-560) from legacy `slate/indigo/blue` to design system tokens. |
| **Feature View: AtsSimulatorView** | `src/components/AtsSimulatorView.tsx` | Refactored using `bg-surface border-line bg-sunken bg-raised text-ink text-muted text-brand-fg`. | N/A (View) | **Auto-aligns**: Gauge score rings and 3-layer architecture cards inherit Champagne Gold & Deep Navy automatically. |
| **Feature View: CoverLetterView** | `src/components/CoverLetterView.tsx` | Uses `bg-surface border-line bg-sunken bg-brand-soft text-brand-fg bg-brand-600`. Contains minor `emerald-400` icon. | N/A (View) | **Auto-aligns**: Generator toggle and section editors inherit Champagne Gold automatically. |
| **Feature View: InterviewCheatSheetView** | `src/components/InterviewCheatSheetView.tsx` | Uses `bg-surface border-line text-ink text-muted bg-brand-soft text-brand-fg`. | N/A (View) | **Auto-aligns**: Glossary cards, STAR talking point chips, and emergency phrase borders inherit Champagne Gold automatically. |
| **Feature View: ProfilerSection** | `src/components/ProfilerSection.tsx` | Refactored using `bg-surface border-line text-ink text-muted bg-brand-soft text-brand-fg`. | N/A (View) | **Auto-aligns**: Flag matrix cards and location inputs inherit Champagne Gold automatically. |
| **Modal: GeminiAdvisorModal** | `src/components/GeminiAdvisorModal.tsx` | Uses `Modal`, `Button`, `bg-brand-soft text-brand-fg border-brand-600`. Contains minor `bg-brand-500/20`. | N/A (Modal) | **Auto-aligns**: Q&A teacher tabs, preset chips, and slang tester inherit Champagne Gold automatically. |
| **Modal: JDParserModal** | `src/components/JDParserModal.tsx` | Uses `Modal`, `Button`, `bg-brand-soft text-brand-fg border-brand-600 bg-brand-600`. | N/A (Modal) | **Auto-aligns**: Scraper tab switcher, URL inputs, and dealbreaker audit cards inherit Champagne Gold automatically. |
| **Modal: AuthModal** | `src/components/AuthModal.tsx` | Uses `Modal`, `Button`, `StatusBadge`, `bg-brand-soft text-brand-fg focus:border-brand-500`. | N/A (Modal) | **Auto-aligns**: Login/Register switcher, 2FA setup QR panel, and action buttons inherit Champagne Gold automatically. |
| **Modal: CVParserModal** | `src/components/CVParserModal.tsx` | Uses `bg-surface border-line text-ink text-muted bg-brand-soft text-brand-fg bg-brand-600`. | N/A (Modal) | **Auto-aligns**: Import guide banner, pre-parse file geometry cards, and consistency report inherit Champagne Gold automatically. |
| **Modal: TokenStatsWidget** | `src/components/TokenStatsWidget.tsx` | Uses `Modal`, `Button`, `bg-sunken text-brand-fg text-success-fg text-warning-fg bg-brand-500`. | N/A (Modal) | **Auto-aligns**: Savings metric cards and hybrid-cache ratio progress bars inherit Champagne Gold automatically. |
| **UI Helper: AutocompleteInput** | `src/components/AutocompleteInput.tsx` | Uses `FieldWrap`, `focus:border-brand-500`, `bg-brand-soft text-brand-fg`. | N/A (UI Helper) | **Auto-aligns**: Suggestion dropdown items and quick pills inherit Champagne Gold automatically. |
| **Feature View: MasterVaultEditor** | `src/components/MasterVaultEditor.tsx` | ~613 legacy hardcoded classes (`bg-white`, `text-slate-900`, `border-slate-200`, `bg-emerald-600`, `bg-indigo-600`, `bg-slate-900`). | N/A (View) | **Migration Required**: Replace hardcoded `white/slate/indigo` classes with design system tokens (`bg-surface`, `bg-sunken`, `border-line`, `text-ink`, `text-muted`, `brand-*`, `success-*`, `warning-*`, `danger-*`). |

---

## 3. CV Document Paper Invariant Audit

### Hard Rule Verification
As mandated by **AGENTS.md §5** and **REDESIGN_HANDOFF.md §4**:
> "Kartka CV MUSI zostać biała w obu motywach. `DocumentRenderer.tsx` i `CVWordBuilder.tsx` renderują podgląd dokumentu A4 (`w-[210mm] min-h-[297mm]`, klasa `printable-area`), który jest drukowany przez `window.print()` i eksportowany do PDF. Zamiana kolorów wewnątrz kartki na tokeny motywu da w trybie ciemnym jasny tekst na białym papierze — nieczytelne CV i zepsuty eksport. Zmieniaj wyłącznie chrome dookoła kartki."

### Findings
1. **`DocumentRenderer.tsx`**:
   - Container element (line 787):
     ```tsx
     <div className={`w-[210mm] min-h-[297mm] p-10 shadow-2xl printable-area transition-all ${activeFont.cssClass} ${activePaper.bgClass}`}>
     ```
   - Paper backgrounds are provided via `PAPER_BACKGROUNDS` array, defaulting to `bg-white` (`#ffffff`).
   - `src/index.css` contains hard override lines 176–179:
     ```css
     .printable-area,
     .printable-area * {
       border-color: #cbd5e1;
     }
     ```
   - Interior document text (lines 817–1220) strictly uses hardcoded slate colors (`text-slate-900`, `text-slate-800`, `text-slate-700`, `text-slate-600`, `border-slate-900`).
   - **Status: VERIFIED FULLY COMPLIANT.** The document sheet remains white with dark text across both light and dark themes.

2. **`CVWordBuilder.tsx`**:
   - Paper container (line 573):
     ```tsx
     <div className="w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl rounded-sm font-sans text-xs text-slate-900 space-y-6">
     ```
   - Interior document elements use explicit `bg-white`, `text-slate-900`, `text-indigo-800` (for section headers), and `text-slate-800`.
   - **Status: VERIFIED COMPLIANT.** However, line 573 currently omits the `printable-area` CSS class.
   - **Recommendation**: Append `printable-area` to `CVWordBuilder.tsx` line 573 (`className="w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl printable-area rounded-sm font-sans text-xs text-slate-900 space-y-6"`) to enforce the CSS border-color override in dark mode.

---

## 4. Champagne Gold & Deep Navy Brand Palette Mapping Specification

To execute the brand alignment for the new CVELOCITY logo identity, update `src/index.css` as follows:

### Primary Brand Accents (`--sv-brand-*` and `@theme --color-brand-*`)
Map brand tokens from Indigo to **Champagne Gold**:

| Token Name | Light Theme Value (`[data-theme='light']`) | Dark Theme Value (`[data-theme='dark']`) | Semantic Purpose |
|---|---|---|---|
| `--sv-brand-50` | `#fdfbf2` | `#1a170f` | Subtle tint / softest background wash |
| `--sv-brand-100` | `#f9f4dc` | `#292314` | Light badge background |
| `--sv-brand-200` | `#f3e7b5` | `#3d341b` | Subtle border tint |
| `--sv-brand-300` | `#eacc80` | `#eacc80` | Muted gold accent |
| `--sv-brand-400` | `#e0ba52` (Tailwind `@theme`) | `#e0ba52` (Tailwind `@theme`) | Secondary gold accent |
| `--sv-brand-500` | `#d4af37` (Tailwind `@theme`) | `#d4af37` (Tailwind `@theme`) | **Primary Champagne Gold Accent** |
| `--sv-brand-600` | `#c5a059` (Tailwind `@theme`) | `#c5a059` (Tailwind `@theme`) | Rich Gold (Buttons / Active states) |
| `--sv-brand-700` | `#a38136` (Tailwind `@theme`) | `#a38136` (Tailwind `@theme`) | Deep Gold Gradient end |
| `--sv-brand-800` | `#82642e` (Tailwind `@theme`) | `#82642e` (Tailwind `@theme`) | Dark Gold text |
| `--sv-brand-900` | `#6a5128` (Tailwind `@theme`) | `#6a5128` (Tailwind `@theme`) | Deepest Gold |
| `--sv-brand-950` | `#3b2c12` (Tailwind `@theme`) | `#3b2c12` (Tailwind `@theme`) | Ultra Dark Gold |
| `--sv-brand-soft` | `#faf6e8` | `rgba(212, 175, 55, 0.14)` | Soft chip / pill background |
| `--sv-brand-fg` | `#8b6e20` | `#e5c158` | High-contrast text & icon foreground |

### Canvas & Surface Hues (`--sv-canvas`, `--sv-surface`, `--sv-raised`, `--sv-sunken`, `--sv-overlay`)
Map dark theme backgrounds from neutral grey/black (`#0a0b10`) to **Deep Navy**:

| Token Name | Light Theme Value | Dark Theme Value (Deep Navy) | Semantic Purpose |
|---|---|---|---|
| `--sv-canvas` | `#f7f8fa` | `#0b0f19` | Application background canvas |
| `--sv-surface` | `#ffffff` | `#111827` | Main card & sidebar surface |
| `--sv-raised` | `#ffffff` | `#1e293b` | Elevated cards / popovers / tooltips |
| `--sv-sunken` | `#f1f2f6` | `#0f172a` | Inset containers, inputs, table rows |
| `--sv-overlay` | `rgba(15, 18, 32, 0.45)` | `rgba(4, 7, 16, 0.75)` | Modal backlight backdrop blur |
| `--sv-line` | `#e6e8ef` | `#1e293b` | Subtle hairlines and borders |
| `--sv-line-strong` | `#d2d6e0` | `#334155` | Focused borders and divider lines |

---

## 5. Verification Plan

Before completing any changes in subsequent implementation tasks, verify:
1. **Automated Verification**:
   - `npm run lint` — must pass with 0 errors.
   - `npm test` — must pass 100% of Vitest suites.
   - `npm run build` — must generate valid client and server bundles without TypeScript or CSS errors.
2. **Visual Inspection**:
   - Verify both Light and Dark themes via the topbar `ThemeToggle`.
   - Verify Sidebar logo emblem renders Champagne Gold gradient badge cleanly.
   - Verify CV sheet preview (`DocumentRenderer.tsx` and `CVWordBuilder.tsx`) remains a crisp white paper sheet in both light and dark themes.

---

## 6. Conclusion & Handoff Summary

- All UI components, chrome elements, and design tokens have been cataloged and evaluated.
- The design system architecture enables global brand transformation by updating `--sv-brand-*`, `--color-brand-*`, and dark surface tokens in `src/index.css`.
- The CV printable document white paper invariant is verified intact.
- The full investigation findings have been recorded in `analysis.md` and summarized in `handoff.md`.
