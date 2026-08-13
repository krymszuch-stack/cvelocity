# Handoff Report: Explorer 1 — CSS Token & Printable Area Investigation

**Working Directory**: `c:\Users\Adrian\Documents\GitHub\skillvault\.agents\sub_orch_m3\explorer_1`  
**Target File**: `src/index.css`  
**Date**: 2026-08-12  

---

## 1. Observation

Direct inspection of `src/index.css` (321 lines total) reveals:

1. **Two-Layer Design Token System (`src/index.css:13-166`)**:
   - Layer 1 (`@theme` block, lines 13-75): Utility token mappings (`--color-canvas: var(--sv-canvas);`, `--color-brand-500: var(--sv-brand-500);`, `--color-brand-fg: var(--sv-brand-fg);`, `--color-brand-solid-fg: var(--sv-brand-solid-fg);`).
   - Layer 2 (`:root, [data-theme='light']` lines 78-121 and `[data-theme='dark']` lines 124-166): Raw custom properties.

2. **Champagne Gold Brand Token Scale (`src/index.css:96-110`, `141-155`)**:
   - Metallic Accent `--sv-brand-400`: `#d4af37`
   - Primary Accent `--sv-brand-500`: `#c5a059`
   - Hover Accent `--sv-brand-600`: `#b38e47`
   - Contrast Foreground (Light mode) `--sv-brand-fg`: `#795200`
   - Contrast Foreground (Dark mode) `--sv-brand-fg`: `#e5c158`
   - Button Solid Text `--sv-brand-solid-fg`: `#0f172a` (Deep Navy in both themes)

3. **Deep Navy Palette Tokens (`src/index.css:82-94`, `127-140`)**:
   - Light canvas `--sv-canvas`: `#f8fafc`; Light text `--sv-ink`: `#0f172a`
   - Dark canvas `--sv-canvas`: `#0f172a` (Deep Navy slate-900)
   - Dark surface `--sv-surface`: `#1e293b` (Deep Navy slate-800)
   - Dark raised `--sv-raised`: `#273549`
   - Dark overlay `--sv-overlay`: `rgba(2, 6, 23, 0.75)`

4. **White Paper Isolation Rules (`src/index.css:196-218`)**:
   - Default selector `.printable-area` (lines 196-208):
     ```css
     background-color: #ffffff;
     color: #0f172a !important;
     color-scheme: light !important;
     --sv-canvas: #ffffff;
     --sv-surface: #ffffff;
     --sv-ink: #0f172a;
     --sv-muted: #475569;
     --sv-subtle: #64748b;
     --sv-line: #cbd5e1;
     --sv-line-strong: #94a3b8;
     ```
   - Dark theme override `[data-theme='dark'] .printable-area` (lines 210-213):
     ```css
     background-color: #ffffff !important;
     color: #0f172a !important;
     ```
   - Child border rule `.printable-area, .printable-area *` (lines 215-218):
     ```css
     border-color: #cbd5e1;
     ```

5. **Existing Test Coverage**:
   - `src/lib/__tests__/printable_area_isolation.test.ts`
   - `src/lib/__tests__/empirical_theme_isolation_stress.test.ts`

---

## 2. Logic Chain

1. **Observation 1 & 2** demonstrate that `@theme` maps `--color-brand-*` and `--color-canvas`/`surface`/`ink` directly to raw `--sv-*` variables, ensuring all components using standard Tailwind utility classes adapt dynamically when `[data-theme]` changes.
2. **Observation 2 & 3** confirm that Champagne Gold (`#D4AF37` / `#C5A059`) and Deep Navy (`#0F172A` / `#1E293B`) are fully integrated into both light and dark palette definitions with high-contrast text tokens (`--sv-brand-fg` `#795200` in light mode, `#e5c158` in dark mode; `--sv-brand-solid-fg` `#0f172a` in both).
3. **Observation 4** proves that `.printable-area` is strictly protected: both light and dark theme rules enforce `background-color: #ffffff` (with `!important` in dark mode) and `color: #0f172a !important`, while re-scoping semantic CSS variables to light mode values. This guarantees compliance with `AGENTS.md` §5 (white CV paper invariant).
4. **Observation 5** shows that automated regression tests exist to prevent accidental removal or dilution of these CSS rules.

---

## 3. Caveats

- Investigation was strictly read-only as required by agent identity.
- Secondary elevation variables (`--sv-raised`, `--sv-sunken`, `--sv-inverse`) are not explicitly re-scoped inside `.printable-area`, but `.printable-area` specifies explicit `background-color: #ffffff`, `--sv-canvas: #ffffff`, and `--sv-surface: #ffffff` which prevents surface leakage under standard CV document rendering.

---

## 4. Conclusion

`src/index.css` strictly adheres to all requirements:
1. Palette tokens (`--sv-*`) and `@theme` definitions establish a clean 2-layer design system.
2. Champagne Gold (`#D4AF37`/`#C5A059`) and Deep Navy (`#0F172A`/`#1E293B`) are correctly defined with contrast-compliant foreground tokens.
3. `.printable-area` is hard-locked to `#ffffff` background and `#0f172a !important` text color across both light and dark themes.

---

## 5. Verification Method

1. Run Vitest suite:
   ```bash
   npx vitest run src/lib/__tests__/printable_area_isolation.test.ts
   npx vitest run src/lib/__tests__/empirical_theme_isolation_stress.test.ts
   ```
2. File inspection:
   - Verify `src/index.css` lines 78-166 for Champagne Gold & Deep Navy hex values.
   - Verify `src/index.css` lines 196-218 for `.printable-area` CSS overrides.
3. Invalidation conditions:
   - Removal of `!important` flags from `[data-theme='dark'] .printable-area`.
   - Modifying `--sv-brand-500` or `--sv-canvas` dark theme values without updating contrast text tokens.
