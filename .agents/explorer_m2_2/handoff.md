# Handoff Report: Base UI Components Audit (`src/components/ui/`)

## 1. Observation

A line-by-line read-only audit of all base UI components in `src/components/ui/` (`Button.tsx`, `Card.tsx`, `Field.tsx`, `Modal.tsx`, `Tabs.tsx`, `StatusBadge.tsx`, `Feedback.tsx`, `AdvisorButton.tsx`, and `ThemeToggle.tsx`) was conducted against the design system tokens defined in `src/index.css` and the rules in `AGENTS.md` §4.

### Component-by-Component Findings:

#### 1. `src/components/ui/Field.tsx`
- **File**: `src/components/ui/Field.tsx`
- **Line 201**:
  ```tsx
  <span
    className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm
               transition-transform duration-200 peer-checked:translate-x-[18px]"
  />
  ```
- **Violation**: Contains `bg-white` for the `Toggle` handle thumb. AGENTS.md §4 explicitly prohibits hardcoded raw palette classes (`bg-white`, `slate-*`, `indigo-*`, `emerald-*`) in UI code.
- **Proposed Replacement**:
  ```tsx
  <span
    className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-surface shadow-sm
               transition-transform duration-200 peer-checked:translate-x-[18px]"
  />
  ```

#### 2. `src/components/ui/AdvisorButton.tsx`
- **File**: `src/components/ui/AdvisorButton.tsx`
- **Line 23**:
  ```tsx
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-warning-50 hover:bg-warning-500/20 border border-warning-500/30 text-xs text-warning-700 transition-all active:scale-95 shadow-xs group ${className}`}
  >
  ```
- **Violation**: Uses legacy un-themed Tailwind color scale classes (`bg-warning-50` and `text-warning-700`). These utility classes are missing from `@theme` and `:root`/`[data-theme="dark"]` token definitions, causing unreadable dark-amber text on dark backgrounds in Dark Mode.
- **Proposed Replacement**:
  ```tsx
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-warning-soft hover:bg-warning-500/20 border border-warning-500/30 text-xs text-warning-fg transition-all active:scale-95 shadow-xs group ${className}`}
  >
  ```

#### 3. `src/components/ui/Button.tsx`
- **File**: `src/components/ui/Button.tsx`
- **Lines 16-19**:
  ```tsx
  primary:
    'bg-gradient-to-b from-brand-500 to-brand-600 text-white border border-brand-600 ' +
    'shadow-sm hover:from-brand-400 hover:to-brand-500 hover:shadow-md ' +
    'shadow-brand-600/25 hover:-translate-y-px',
  ```
- **Observation / Optimization Opportunity**:
  - AGENTS.md §4 states: "`text-white` na kolorowym przycisku lub gradiencie jest poprawne — tego nie zamieniaj." Therefore, `text-white` on `primary` is technically permissible under this rule exception.
  - However, Milestone 1 introduced the specific WCAG contrast token `--color-brand-solid-fg` (`#0F172A` Deep Navy) to provide WCAG AAA contrast (>7:1) on solid or gradient Champagne Gold (`#C5A059` / `#B38E47`) backgrounds.
- **Proposed Options**:
  - **Option A (Compliant with AGENTS.md §4 exception)**: Retain existing `text-white` on gradient buttons.
  - **Option B (Enhanced WCAG Contrast Token Alignment)**:
    ```tsx
    primary:
      'bg-gradient-to-b from-brand-500 to-brand-600 text-brand-solid-fg font-semibold border border-brand-600 ' +
      'shadow-sm hover:from-brand-400 hover:to-brand-500 hover:shadow-md ' +
      'shadow-brand-600/25 hover:-translate-y-px',
    ```

#### 4. `src/components/ui/Card.tsx`
- **Status**: 100% Compliant.
- **Tokens Used**: `bg-surface`, `bg-sunken`, `sv-glass`, `border-line`, `border-line-strong`, `bg-brand-soft text-brand-fg`, `from-brand-500 to-brand-700`, `shadow-brand-600/25`, `text-ink`, `text-muted`.

#### 5. `src/components/ui/Modal.tsx`
- **Status**: 100% Compliant.
- **Tokens Used**: `bg-overlay`, `bg-surface`, `border-line`, `from-brand-500 to-brand-700`, `shadow-brand-600/25`, `text-ink`, `text-muted`, `bg-sunken`.

#### 6. `src/components/ui/Tabs.tsx`
- **Status**: 100% Compliant.
- **Tokens Used**: `border-line`, `text-brand-fg`, `border-brand-500`, `text-muted`, `hover:text-ink`, `bg-sunken`, `bg-surface`, `text-ink`.

#### 7. `src/components/ui/StatusBadge.tsx`
- **Status**: 100% Compliant.
- **Tokens Used**: `bg-success-soft text-success-fg border-success-500/25`, `bg-warning-soft text-warning-fg border-warning-500/25`, `bg-danger-soft text-danger-fg border-danger-500/25`, `bg-brand-soft text-brand-fg border-brand-500/25`, `bg-sunken text-muted border-line`. `emerald`/`success` is strictly isolated to success status.

#### 8. `src/components/ui/Feedback.tsx`
- **Status**: 100% Compliant.
- **Tokens Used**: `bg-sunken`, `border-line`, `text-subtle`, `text-ink`, `text-muted`, `bg-brand-soft border-brand-500/25 text-brand-fg`, `bg-brand-500`, `sv-skeleton`.

#### 9. `src/components/ui/ThemeToggle.tsx`
- **Status**: 100% Compliant.
- **Tokens Used**: `bg-sunken`, `border-line`, `bg-surface`, `shadow-sm`, `text-warning-500`, `text-brand-400`.

---

## 2. Logic Chain

1. **Rule Verification against AGENTS.md §4**:
   - Rule 4.1: Hardcoded raw palette classes (`bg-white`, `slate-*`, `indigo-*`, `emerald-*`) are forbidden in UI components outside printable paper.
   - Rule 4.2: `emerald`/`success` is exclusively reserved for success state. Brand color is Champagne Gold (`brand-*`).
   - Rule 4.3: `text-white` on colored gradient buttons is acceptable.
2. **Deductions**:
   - In `Field.tsx` (line 201), `bg-white` is used inside the `Toggle` component. Replacing `bg-white` with `bg-surface` satisfies Rule 4.1 while keeping the toggle knob visual hierarchy intact across themes.
   - In `AdvisorButton.tsx` (line 23), `bg-warning-50` and `text-warning-700` violate token design rules because they are static Tailwind scale utilities. Replacing them with `bg-warning-soft` and `text-warning-fg` ensures theme reactivity in both Light and Dark modes.
   - In `Button.tsx` (line 17), `text-white` on Champagne Gold primary buttons can either be kept under Rule 4.3 or upgraded to `text-brand-solid-fg` for WCAG AAA compliance.
   - The remaining 6 components (`Card.tsx`, `Modal.tsx`, `Tabs.tsx`, `StatusBadge.tsx`, `Feedback.tsx`, `ThemeToggle.tsx`) already fully consume theme tokens and require zero changes.

---

## 3. Caveats

- **No Code Modifications Made**: Explorer agents operate in read-only mode. No files in `src/` were edited.
- **Button Primary Text Contrast**: Decision between Option A (`text-white`) and Option B (`text-brand-solid-fg`) is left to the implementer or human owner based on design aesthetic preference versus WCAG AAA strictness.

---

## 4. Conclusion

The base UI component directory `src/components/ui/` is in excellent alignment with the Champagne Gold and Deep Navy token system. Only **2 direct token replacements** (`Field.tsx` line 201 and `AdvisorButton.tsx` line 23) and **1 optional enhancement** (`Button.tsx` line 17) are required to achieve 100% token purity across all 9 UI components.

---

## 5. Verification Method

To verify these findings and any subsequent code replacements:

1. **Code Inspection**:
   - `src/components/ui/Field.tsx`: Ensure line 201 uses `bg-surface` instead of `bg-white`.
   - `src/components/ui/AdvisorButton.tsx`: Ensure line 23 uses `bg-warning-soft` and `text-warning-fg`.
   - `src/components/ui/Button.tsx`: Check primary variant styling.
2. **Automated Verification**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
3. **Visual Verification**:
   - Open app UI in browser, toggle theme between Light and Dark mode in Topbar.
   - Confirm `Toggle` handle, `AdvisorButton`, and `Button` primary actions render with high contrast and without color flaking in either mode.
