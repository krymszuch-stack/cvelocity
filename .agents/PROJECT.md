# Project: CVELOCITY Brand Alignment & Design System Update

## Architecture
CVELOCITY is a web application with Vite + React 19 + TypeScript + Tailwind v4 frontend.
The design system architecture uses a two-layer theme token model in `src/index.css`:
1. Raw palette variables (`--sv-brand-*`, `--sv-surface-*`, `--sv-ink-*`) defined under `[data-theme="light"]` and `[data-theme="dark"]`.
2. Tailwind v4 theme mapping (`@theme`) mapping utility classes (`bg-brand-500`, `text-brand-fg`, `bg-surface`, `border-line`) to `--sv-*` variables.

Components in `src/components/ui/` (`Button`, `Card`, `Modal`, `Tabs`, `StatusBadge`, `Field`, `Feedback`) and application shell (`Sidebar`, `Topbar`) consume these tokens.
The printable CV paper (`printable-area` in `DocumentRenderer.tsx` and `CVWordBuilder.tsx`) is hard-constrained to remain white paper with dark text in both themes.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Champagne Gold Palette | 10-shade Champagne Gold scale (`--sv-brand-*` `#D4AF37`/`#C5A059`) in `src/index.css` | M1 | R1 |
| 2 | Deep Navy Surface & Ink | Deep Navy (`#0F172A`/`#1E293B`) canvas, surfaces, and typography tokens in Light & Dark modes | M1 | R1 |
| 3 | WCAG Contrast Tokens | Accessible `--sv-brand-fg` (Gold text) and `--sv-brand-solid-fg` (Deep Navy on solid Gold) for both modes | M1 | R1 |
| 4 | Printable CV Paper Lock | `.printable-area` CSS rule hard-locking white background (`#FFFFFF`) and dark text (`#0F172A`) | M1 | R2, AGENTS.md §5 |
| 5 | Sidebar & Topbar Emblem | Update logo emblem, brand text, and topbar accents to Champagne Gold & Deep Navy | M2 | R2 |
| 6 | UI Component Polish | Align `Button`, `Card`, `Modal`, `Tabs`, `StatusBadge`, `Field`, `Feedback` with updated brand tokens | M2 | R2 |
| 7 | Chrome View Migration | Migrate hardcoded legacy classes in `MasterVaultEditor.tsx`, `CVWordBuilder.tsx:573`, etc. to brand tokens | M2 | R2 |
| 8 | Theme & Paper Tests | Vitest component tests verifying `data-theme` switching, token rendering, and white paper isolation | M3 | R3, Dual-Track |
| 9 | Quality & Build Checks | Execute and verify 0 lint errors (`npm run lint`), 100% test pass (`npm test`), and valid build (`npm run build`) | M3 | R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Token & Palette System | `src/index.css`: Champagne Gold, Deep Navy, WCAG contrast tokens, `.printable-area` CSS protection | None | DONE |
| M2 | Component & Chrome Polish | `Sidebar`, `Topbar`, `src/components/ui/`, `MasterVaultEditor`, `CVWordBuilder` brand token alignment | M1 | DONE |
| M3 | Quality & Verification | Component/Theme tests for white paper & dark mode, clean `npm run lint`, `npm test`, `npm run build` | M1, M2 | DONE |

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
  - Immune to `[data-theme="dark"]` property cascades.

## Code Layout
```
src/
├── index.css                # Design system tokens, @theme definitions, printable-area rules
├── components/
│   ├── ui/                  # Base components (Button, Card, Field, Modal, Tabs, StatusBadge, Feedback)
│   ├── shell/               # App layout shell (Sidebar, Topbar)
│   ├── preview/             # DocumentRenderer.tsx, CVWordBuilder.tsx
│   └── __tests__/           # Theme & Component verification tests
└── lib/                     # Domain logic (ATS, slot filling, etc.)
```
