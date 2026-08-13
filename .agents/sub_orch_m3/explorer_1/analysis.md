# Analysis Report: CSS Tokens, Theme Definitions & Printable Area Isolation

**Target File**: `src/index.css`  
**Investigator**: Explorer 1 (Milestone 3)  
**Date**: 2026-08-12  

---

## 1. Overview of Architecture

The design system in `src/index.css` follows a two-layer theme token architecture:
1. **Raw Palette Layer (`--sv-*`)**: Custom CSS properties defined in `:root, [data-theme='light']` and `[data-theme='dark']`.
2. **Tailwind v4 Layer (`@theme`)**: Maps standard Tailwind utility variables (`--color-*`) to raw `--sv-*` variables, enabling theme reactivity across utilities like `bg-surface`, `text-ink`, `border-line`, `bg-brand-500`, etc.

---

## 2. Palette Tokens (`--sv-*`) & Theme Overrides

### 2.1 `@theme` Definitions (`src/index.css` lines 13–75)
```css
@theme {
  /* Semantic surfaces & text */
  --color-canvas: var(--sv-canvas);
  --color-surface: var(--sv-surface);
  --color-raised: var(--sv-raised);
  --color-sunken: var(--sv-sunken);
  --color-overlay: var(--sv-overlay);

  --color-line: var(--sv-line);
  --color-line-strong: var(--sv-line-strong);

  --color-ink: var(--sv-ink);
  --color-muted: var(--sv-muted);
  --color-subtle: var(--sv-subtle);
  --color-inverse: var(--sv-inverse);

  /* Brand (Champagne Gold) */
  --color-brand-50: var(--sv-brand-50);
  --color-brand-100: var(--sv-brand-100);
  --color-brand-200: var(--sv-brand-200);
  --color-brand-300: var(--sv-brand-300);
  --color-brand-400: var(--sv-brand-400);
  --color-brand-500: var(--sv-brand-500);
  --color-brand-600: var(--sv-brand-600);
  --color-brand-700: var(--sv-brand-700);
  --color-brand-800: var(--sv-brand-800);
  --color-brand-900: var(--sv-brand-900);
  --color-brand-950: var(--sv-brand-950);
  --color-brand-soft: var(--sv-brand-soft);
  --color-brand-border: var(--sv-brand-border);
  --color-brand-fg: var(--sv-brand-fg);
  --color-brand-solid-fg: var(--sv-brand-solid-fg);

  /* Status */
  --color-success-500: #10b981;
  --color-success-600: #059669;
  --color-success-soft: var(--sv-success-soft);
  --color-success-fg: var(--sv-success-fg);

  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-warning-soft: var(--sv-warning-soft);
  --color-warning-fg: var(--sv-warning-fg);

  --color-danger-500: #f43f5e;
  --color-danger-600: #e11d48;
  --color-danger-soft: var(--sv-danger-soft);
  --color-danger-fg: var(--sv-danger-fg);

  /* Type scale */
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Elevation */
  --shadow-xs: 0 1px 2px var(--sv-shadow-color);
  --shadow-sm: 0 1px 3px var(--sv-shadow-color), 0 1px 2px -1px var(--sv-shadow-color);
  --shadow-md: 0 4px 12px -2px var(--sv-shadow-color), 0 2px 6px -2px var(--sv-shadow-color);
  --shadow-lg: 0 12px 28px -6px var(--sv-shadow-color), 0 6px 12px -6px var(--sv-shadow-color);
  --shadow-xl: 0 24px 56px -12px var(--sv-shadow-strong);

  --radius-card: 14px;
}
```

---

## 3. Brand Colors: Champagne Gold & Deep Navy Tokens

### 3.1 Light Theme (`:root, [data-theme='light']`, lines 78–121)

| Category | Token Name | Exact Value | Purpose / Description |
|---|---|---|---|
| **Deep Navy Canvas/Ink** | `--sv-canvas` | `#f8fafc` | Canvas background (slate-50) |
| | `--sv-surface` | `#ffffff` | Primary container surface |
| | `--sv-raised` | `#ffffff` | Raised card surface |
| | `--sv-sunken` | `#f1f5f9` | Inset/sunken background (slate-100) |
| | `--sv-overlay` | `rgba(15, 23, 42, 0.5)` | Deep Navy modal backdrop (slate-900 at 50% opacity) |
| | `--sv-line` | `#e2e8f0` | Subdued border line (slate-200) |
| | `--sv-line-strong` | `#cbd5e1` | Strong border line (slate-300) |
| | `--sv-ink` | `#0f172a` | Primary typography text (Deep Navy slate-900) |
| | `--sv-muted` | `#475569` | Muted text (slate-600) |
| | `--sv-subtle` | `#64748b` | Subtle text (slate-500) |
| | `--sv-inverse` | `#ffffff` | Contrast inverse background |
| **Champagne Gold Scale** | `--sv-brand-50` | `#faf6ea` | Soft gold background highlight |
| | `--sv-brand-100` | `#f3eacf` | Extra soft gold tint |
| | `--sv-brand-200` | `#e6d4a3` | Soft gold border tint |
| | `--sv-brand-300` | `#d8bd77` | Medium light gold accent |
| | `--sv-brand-400` | `#d4af37` | **Metallic Champagne Gold** accent |
| | `--sv-brand-500` | `#c5a059` | **Primary Champagne Gold** accent |
| | `--sv-brand-600` | `#b38e47` | **Hover Champagne Gold** accent |
| | `--sv-brand-700` | `#8f6e2e` | Dark gold shade |
| | `--sv-brand-800` | `#5f481b` | Deep gold brown shade |
| | `--sv-brand-900` | `#423211` | Dark gold brown shade |
| | `--sv-brand-950` | `#2e1e07` | Ultra dark gold shade |
| **Brand Modifiers** | `--sv-brand-soft` | `#faf6ea` | Soft badge/button background |
| | `--sv-brand-border` | `rgba(197, 160, 89, 0.28)` | Translucent gold border |
| | `--sv-brand-fg` | `#795200` | High-contrast gold text on light canvas |
| | `--sv-brand-solid-fg` | `#0f172a` | **Deep Navy** text on solid gold buttons |

### 3.2 Dark Theme (`[data-theme='dark']`, lines 124–166)

| Category | Token Name | Exact Value | Purpose / Description |
|---|---|---|---|
| **Deep Navy Canvas/Ink** | `--sv-canvas` | `#0f172a` | **Deep Navy** canvas background (slate-900) |
| | `--sv-surface` | `#1e293b` | **Deep Navy** surface background (slate-800) |
| | `--sv-raised` | `#273549` | Deep Navy elevated panel |
| | `--sv-sunken` | `#0b1120` | Dark sunken container background |
| | `--sv-overlay` | `rgba(2, 6, 23, 0.75)` | Deep Navy modal overlay (slate-950 at 75% opacity) |
| | `--sv-line` | `#334155` | Dark mode border line (slate-700) |
| | `--sv-line-strong` | `#475569` | Dark mode strong border line (slate-600) |
| | `--sv-ink` | `#f8fafc` | Light text on dark canvas (slate-50) |
| | `--sv-muted` | `#cbd5e1` | Muted text on dark canvas (slate-300) |
| | `--sv-subtle` | `#94a3b8` | Subtle text on dark canvas (slate-400) |
| | `--sv-inverse` | `#0f172a` | Inverse Deep Navy background |
| **Champagne Gold Scale** | `--sv-brand-50` | `#2e1e07` | Inverted dark scale (darkest brown-gold tint) |
| | `--sv-brand-100` | `#423211` | Dark scale tint |
| | `--sv-brand-200` | `#5f481b` | Dark scale tint |
| | `--sv-brand-300` | `#8f6e2e` | Dark scale tint |
| | `--sv-brand-400` | `#d4af37` | **Metallic Champagne Gold** accent |
| | `--sv-brand-500` | `#c5a059` | **Primary Champagne Gold** accent |
| | `--sv-brand-600` | `#b38e47` | **Hover Champagne Gold** accent |
| | `--sv-brand-700` | `#d8bd77` | Light scale tint |
| | `--sv-brand-800` | `#e6d4a3` | Light scale tint |
| | `--sv-brand-900` | `#f3eacf` | Light scale tint |
| | `--sv-brand-950` | `#faf6ea` | Lightest gold highlight |
| **Brand Modifiers** | `--sv-brand-soft` | `rgba(212, 175, 55, 0.12)` | Translucent gold background highlight |
| | `--sv-brand-border` | `rgba(212, 175, 55, 0.30)` | Translucent gold border accent |
| | `--sv-brand-fg` | `#e5c158` | Accessible bright gold text on dark background |
| | `--sv-brand-solid-fg` | `#0f172a` | **Deep Navy** text on solid gold buttons |

---

## 4. White Paper Isolation: `.printable-area` Rules

In `src/index.css` (lines 196–218), `.printable-area` is strictly isolated from dark theme cascades to fulfill ADR-95 and `AGENTS.md` §5 (CV document paper remains pure white in both Light and Dark modes).

### Exact Selectors and Rule Definitions:

1. **Default Rule (`.printable-area`, lines 196–208)**:
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

2. **Dark Theme Specific Override (`[data-theme='dark'] .printable-area`, lines 210–213)**:
```css
[data-theme='dark'] .printable-area {
  background-color: #ffffff !important;
  color: #0f172a !important;
}
```

3. **Universal Border Color Lock (`.printable-area, .printable-area *`, lines 215–218)**:
```css
.printable-area,
.printable-area * {
  border-color: #cbd5e1;
}
```

### Key Verification Findings for `.printable-area`:
- **Background Color**: Explicitly set to `#ffffff` in default `.printable-area` and `#ffffff !important` under `[data-theme='dark'] .printable-area`.
- **Text Color**: Explicitly set to `#0f172a !important` in both default and dark-mode override rules.
- **Color Scheme**: Locked to `light !important`.
- **Local CSS Variables**: Core semantic variables (`--sv-canvas`, `--sv-surface`, `--sv-ink`, `--sv-muted`, `--sv-subtle`, `--sv-line`, `--sv-line-strong`) are re-scoped to light-mode values inside `.printable-area`, preventing variable inheritance from dark mode.
- **Universal Borders**: All child elements inside `.printable-area` are locked to `#cbd5e1` border color.

---

## 5. Usage in Components and Tests

1. **JSX Instances**:
   - `src/components/DocumentRenderer.tsx:787`: `<div className="... printable-area ...">`
   - `src/components/CVWordBuilder.tsx:573`: `<div className="... printable-area ...">`
2. **Automated Vitest Verification**:
   - `src/lib/__tests__/printable_area_isolation.test.ts`: Verifies rule existence, `#ffffff` background, `#0f172a !important` text color, rescoped `--sv-*` variables, and border locking.
   - `src/lib/__tests__/empirical_theme_isolation_stress.test.ts`: Stress tests CSS rule specificity, JSX structure, and absence of `dark:` utility classes inside `.printable-area` containers.
