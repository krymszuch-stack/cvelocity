# Scope: Milestone 1 — Design System Token Architecture & Theme Alignment

## Architecture
CVELOCITY design system uses a two-layer theme token model in `src/index.css`:
1. Raw palette variables (`--sv-brand-*`, `--sv-surface-*`, `--sv-ink-*`) defined under `[data-theme="light"]` and `[data-theme="dark"]`.
2. Tailwind v4 theme mapping (`@theme`) mapping utility classes (`bg-brand-500`, `text-brand-fg`, `bg-surface`, `border-line`, etc.) to `--sv-*` variables.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Champagne Gold Palette | 10-shade Champagne Gold scale (`--sv-brand-*` `#D4AF37`/`#C5A059`) in `src/index.css` | M1 | R1 | DONE |
| 2 | Deep Navy Surface & Ink | Deep Navy (`#0F172A`/`#1E293B`) canvas, surfaces, and typography tokens in Light & Dark modes | M1 | R1 | DONE |
| 3 | WCAG Contrast Tokens | Accessible `--sv-brand-fg` (Gold text) and `--sv-brand-solid-fg` (Deep Navy on solid Gold) for both modes | M1 | R1 | DONE |
| 4 | Printable CV Paper Lock | `.printable-area` CSS rule hard-locking white background (`#FFFFFF`) and dark text (`#0F172A`) | M1 | R2, AGENTS.md §5 | DONE |

## Interface Contracts
### Design System ↔ UI Components Contract
- Tokens exposed via `@theme`:
  - `--color-brand-50` through `--color-brand-950`
  - `--color-brand-500` = `#C5A059` (Primary Champagne Gold accent)
  - `--color-brand-600` = `#B38E47` (Hover Champagne Gold accent)
  - `--color-brand-fg` = `--sv-brand-fg` (WCAG AAA/AA text contrast)
  - `--color-brand-solid-fg` = `#0F172A` (Deep Navy text on solid Gold buttons)
  - `--color-brand-soft` = `--sv-brand-soft` (Subtle Gold highlight background)
  - `--color-brand-border` = `--sv-brand-border` (Gold border accent)
- Hard constraint: `.printable-area` override rules:
  - `background-color: #ffffff !important;`
  - `color: #0f172a !important;`
