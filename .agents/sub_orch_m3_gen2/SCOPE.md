# Scope: Milestone 3 — Automated Test Suite & Quality Verification

## Architecture
Milestone 3 covers quality verification, automated component/theme testing, and build verification for the CVELOCITY Brand Alignment project.
It validates:
1. Design system token definition and `@theme` mappings in `src/index.css`.
2. `ThemeContext` and `ThemeToggle` behavior, including `data-theme` attribute toggling and local storage resolution hierarchy.
3. Strict paper color isolation for `.printable-area` in `DocumentRenderer.tsx` and `CVWordBuilder.tsx` across both Light and Dark themes.
4. R3 quality verification: 0 lint errors (`npm run lint`), 100% passing unit tests (`npm test`), and clean client/server bundle generation (`npm run build`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 8 | Theme & Paper Tests | Vitest component tests verifying `data-theme` switching, token rendering, and white paper isolation | M3 | R3, Dual-Track |
| 9 | Quality & Build Checks | Execute and verify 0 lint errors (`npm run lint`), 100% test pass (`npm test`), and valid build (`npm run build`) | M3 | R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M3.1 | Test Implementation | `theme.test.ts` & `printable_area.test.ts` creation and initial verification | None | DONE |
| M3.2 | Verification & Audit Gate | 2 Reviewers, 2 Challengers, 1 Auditor evaluation | M3.1 | DONE |

## Interface Contracts
### Design System ↔ UI Components Contract
- Tokens exposed via `@theme` in `src/index.css`: `--color-brand-*`, `--color-canvas`, `--color-surface`, `--color-ink`, `--color-muted`, `--color-subtle`, `--color-line`.
- Hard constraint: `.printable-area` override rules (`background-color: #ffffff !important; color: #0f172a !important;`).

## Code Layout
```
src/
├── index.css
├── components/
│   ├── ui/
│   ├── shell/
│   ├── preview/ (DocumentRenderer.tsx, CVWordBuilder.tsx)
│   └── __tests__/ (theme.test.ts, printable_area.test.ts)
└── lib/
```
