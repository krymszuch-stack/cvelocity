# Scope: Milestone 2 — UI Component & Application Chrome Brand Alignment

## Architecture
Milestone 2 updates all application chrome and base UI components to consume Champagne Gold (`--sv-brand-*` / `@theme brand-*`) and Deep Navy (`--sv-surface-*`, `--sv-ink-*`) tokens introduced in Milestone 1.
The printable CV paper (`.printable-area` in `DocumentRenderer.tsx` and `CVWordBuilder.tsx`) must remain strictly isolated (white paper `#FFFFFF`, dark text `#0F172A`) across both Light and Dark themes.

## Feature Inventory & Assignment
| # | Feature | Description | Scope Target | Source |
|---|---------|-------------|--------------|--------|
| 5 | Sidebar & Topbar Emblem | Update logo emblem, brand text, and topbar accents (`Sidebar.tsx`, `Topbar.tsx`) | M2 | R2 |
| 6 | UI Component Polish | Align `Button`, `Card`, `Modal`, `Tabs`, `StatusBadge`, `Field`, `Feedback` with updated brand tokens | M2 | R2 |
| 7 | Chrome View Migration | Migrate hardcoded legacy classes in `MasterVaultEditor.tsx`, `DocumentRenderer.tsx` chrome toolbar, `CVWordBuilder.tsx` chrome | M2 | R2 |

## Milestones (Sub-tasks for M2)
| # | Work Package | Target Files | Status |
|---|--------------|--------------|--------|
| M2.1 | Shell Components | `src/components/shell/Sidebar.tsx`, `src/components/shell/Topbar.tsx` | DONE |
| M2.2 | Base UI Components | `src/components/ui/Button.tsx`, `Card.tsx`, `Field.tsx`, `Modal.tsx`, `Tabs.tsx`, `StatusBadge.tsx`, `Feedback.tsx` | DONE |
| M2.3 | Chrome Views | `src/components/MasterVaultEditor.tsx`, `src/components/preview/DocumentRenderer.tsx` (chrome toolbar), `CVWordBuilder.tsx` (chrome toolbar) | DONE |

## Interface Contracts
- Consume tokens defined in `src/index.css` `@theme`:
  - `bg-brand-500`, `hover:bg-brand-600`, `text-brand-fg`, `text-brand-solid-fg`, `bg-brand-soft`, `border-brand-border`
  - `bg-surface`, `bg-surface-elevated`, `text-ink`, `text-ink-muted`, `border-line`
- Hard constraint: `.printable-area` must remain white background (`#FFFFFF`) with dark text (`#0F172A`) regardless of `[data-theme]` attribute.
- AGENTS.md rules: No hardcoded color palette classes (`bg-white`, `text-slate-600`, `indigo-*`, `emerald-*`) outside `.printable-area` / explicit exceptions allowed by AGENTS.md §4. `emerald`/`success` only for success state; brand color is indigo/champagne gold.
