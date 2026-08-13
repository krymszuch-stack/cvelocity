# Theme Toggling & Document Rendering Analysis — CVELOCITY

## Executive Summary
This document provides a comprehensive technical investigation of the theme toggling mechanism, design token system, and printable CV document paper isolation (`.printable-area`) within the CVELOCITY codebase. It defines the exact specification for component and integration unit tests to be placed in `src/components/__tests__/theme.test.ts` (or `src/lib/__tests__/theme.test.ts`) for Milestone 3 (M3).

---

## 1. Theme Toggling Implementation & State Management

### 1.1 Context & Hook (`src/context/ThemeContext.tsx`)
- **State Type**: `Theme = 'light' | 'dark'`.
- **Storage Keys**: Primary key `cvelocity_theme`, legacy fallback key `skillvault_theme`.
- **Initial Theme Resolution (`resolveInitialTheme()`)**:
  1. Checks `window.localStorage.getItem('cvelocity_theme')` or `window.localStorage.getItem('skillvault_theme')`. If set to `'light'` or `'dark'`, that preference is returned.
  2. If no stored key exists, evaluates system preference via `window.matchMedia('(prefers-color-scheme: light)').matches`. Returns `'light'` if matched, otherwise defaults to `'dark'`.
  3. SSR safe fallback: defaults to `'dark'` if `window` is undefined.
- **DOM Attribute Update**:
  `useEffect` triggers on `theme` state changes:
  ```typescript
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  ```
- **OS Listener**:
  `useEffect` registers a `change` event listener on `window.matchMedia('(prefers-color-scheme: light)')` when `localStorage` has no saved theme preference, dynamically adjusting the theme when OS theme switches.
- **State Mutation Methods**:
  - `setTheme(next: Theme)`: Persists `next` in `localStorage.setItem('cvelocity_theme', next)` and updates React state.
  - `toggleTheme()`: Toggles state between `'light'` and `'dark'`, persisting to `localStorage`.

### 1.2 Theme Toggle UI Component (`src/components/ui/ThemeToggle.tsx`)
- Renders a pill-shaped sliding switch (`w-[52px] h-7 rounded-full bg-sunken border border-line`).
- Consumes `useTheme()` hook to read `theme` and call `toggleTheme()`.
- Updates `aria-label` and `title` dynamically: `'Przełącz na jasny motyw'` when in dark mode, `'Przełącz na ciemny motyw'` when in light mode.
- Uses sliding transform (`translateX(24px)` vs `translateX(0)`) and opacity cross-fade for `Sun` and `Moon` icons from `lucide-react`.

### 1.3 App Shell Integration (`src/components/shell/Topbar.tsx`)
- `Topbar` renders `ThemeToggle` on line 62 within global actions container alongside token stats and auth modal buttons.

### 1.4 Design Tokens & Theme Architecture (`src/index.css`)
- **Two-Layer Design Token Model**:
  1. **Raw Palette Layer (`--sv-*`)**:
     - Light Mode (`:root, [data-theme='light']`):
       - `--sv-canvas`: `#f8fafc`
       - `--sv-surface`: `#ffffff`
       - `--sv-ink`: `#0f172a`
       - `--sv-muted`: `#475569`
       - `--sv-subtle`: `#64748b`
       - `--sv-line`: `#e2e8f0`
       - `--sv-brand-500`: `#c5a059` (Primary Champagne Gold accent)
       - `--sv-brand-400`: `#d4af37`
       - `--sv-brand-600`: `#b38e47`
       - `--sv-brand-fg`: `#795200` (High-contrast gold text)
       - `--sv-brand-solid-fg`: `#0f172a` (Deep Navy text on solid Gold elements)
     - Dark Mode (`[data-theme='dark']`):
       - `--sv-canvas`: `#0f172a` (Deep Navy canvas)
       - `--sv-surface`: `#1e293b` (Deep Navy surface)
       - `--sv-raised`: `#273549`
       - `--sv-sunken`: `#0b1120`
       - `--sv-ink`: `#f8fafc`
       - `--sv-muted`: `#cbd5e1`
       - `--sv-subtle`: `#94a3b8`
       - `--sv-line`: `#334155`
       - `--sv-brand-500`: `#c5a059`
       - `--sv-brand-fg`: `#e5c158` (Bright gold text for dark surfaces)
       - `--sv-brand-solid-fg`: `#0f172a`
  2. **Tailwind v4 Theme Layer (`@theme`)**:
     Maps Tailwind utilities (`bg-canvas`, `bg-surface`, `bg-raised`, `bg-sunken`, `text-ink`, `text-muted`, `text-subtle`, `text-brand-fg`, `text-brand-solid-fg`, `border-line`, `bg-brand-500`) directly to `var(--sv-*)`.

---

## 2. Document Rendering & White Paper Isolation

### 2.1 Printable CV Document Components
1. **`src/components/DocumentRenderer.tsx`** (Line 787):
   ```tsx
   <div
     ref={docRef}
     className={`w-[210mm] min-h-[297mm] p-10 shadow-2xl printable-area transition-all ${activeFont.cssClass} ${activePaper.bgClass}`}
     style={{ boxSizing: 'border-box' }}
   >
   ```
2. **`src/components/CVWordBuilder.tsx`** (Line 573):
   ```tsx
   <div className="w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl rounded-sm font-sans text-xs text-slate-900 space-y-6 printable-area">
   ```

### 2.2 CSS Isolation & Invariants (`src/index.css`)
- **Rule 1: Base `.printable-area`**:
  ```css
  .printable-area {
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
  }
  ```
- **Rule 2: Specificity override for Dark Mode (`[data-theme='dark'] .printable-area`)**:
  ```css
  [data-theme='dark'] .printable-area {
    background-color: #ffffff !important;
    color: #0f172a !important;
  }
  ```
- **Rule 3: Border Color Lock**:
  ```css
  .printable-area,
  .printable-area * {
    border-color: #cbd5e1;
  }
  ```
- **JSX Hygiene**:
  Neither `DocumentRenderer.tsx` nor `CVWordBuilder.tsx` contains `dark:` utility variants inside `.printable-area` blocks, ensuring no dark theme leakage occurs during UI interactions or PDF/Print exports.

---

## 3. Recommended Component / Integration Test Cases

To verify theme behavior and paper isolation according to Milestone 3 requirements, the following test suite structure should be implemented in `src/components/__tests__/theme.test.ts`:

### 3.1 Suite 1: Theme State & DOM Toggle Mechanism
- **Test 1.1**: Default initial theme selection follows `localStorage` or `matchMedia` preference.
- **Test 1.2**: Toggling theme via `ThemeToggle` updates `data-theme` attribute on `document.documentElement` to `'light'` or `'dark'`.
- **Test 1.3**: Toggling theme persists updated theme value in `localStorage.getItem('cvelocity_theme')`.
- **Test 1.4**: `ThemeToggle` updates its `aria-label` and `title` attributes when state changes.

### 3.2 Suite 2: Design System Token Definitions
- **Test 2.1**: `src/index.css` defines `--sv-brand-500` as `#c5a059` (Champagne Gold) in both light and dark themes.
- **Test 2.2**: `src/index.css` defines `--sv-canvas` as `#0f172a` and `--sv-surface` as `#1e293b` (Deep Navy) in `[data-theme='dark']`.
- **Test 2.3**: `src/index.css` defines `--sv-brand-solid-fg` as `#0f172a` across themes for text contrast on solid gold backgrounds.

### 3.3 Suite 3: White Paper Isolation of `.printable-area`
- **Test 3.1**: `.printable-area` CSS block enforces `background-color: #ffffff` and `color: #0f172a !important`.
- **Test 3.2**: `[data-theme='dark'] .printable-area` block enforces `background-color: #ffffff !important` and `color: #0f172a !important`.
- **Test 3.3**: `.printable-area` re-scopes `--sv-canvas` to `#ffffff` and `--sv-ink` to `#0f172a`.
- **Test 3.4**: JSX check: `DocumentRenderer.tsx` and `CVWordBuilder.tsx` render `.printable-area` containers with fixed A4 dimensions (`w-[210mm]`, `min-h-[297mm]`) without `dark:` class leakage.
