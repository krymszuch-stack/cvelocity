# DISPATCH — Milestone 1: Design System Token Architecture & Theme Alignment

**Original Request Path**: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\ORIGINAL_REQUEST.md
**Project Scope Document**: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\PROJECT.md
**Working Directory**: c:\Users\Adrian\Documents\GitHub\skillvault\.agents\sub_orch_m1

## Objective
Implement Milestone 1 (Design System Token Architecture & Theme Alignment) in `src/index.css`.

## Scope & Requirements
1. **Champagne Gold Palette Scale**: Define a 10-shade scale (`brand-50` `#FAF6EA` through `brand-950` `#2E1E07`) with primary Champagne Gold accent `#C5A059` / `#D4AF37` in `src/index.css` under Tailwind v4 `@theme`.
2. **Deep Navy Surfaces & Typography**: Set Deep Navy (`#0F172A` / `#1E293B`) canvas, surface, and dark ink variables for both Light and Dark (`[data-theme="light"]`, `[data-theme="dark"]`) modes.
3. **Accessible WCAG Contrast Tokens**: Set `--sv-brand-fg` for Gold text (Deep Antique Gold `#795200` in light mode for 5.8:1 contrast; Bright Gold `#E5C158` in dark mode for 11.4:1 contrast) and `--sv-brand-solid-fg` (`#0F172A` for 8.4:1 contrast on Gold buttons).
4. **CV White Paper CSS Rule Protection**: Hard-lock `.printable-area` in `src/index.css` with `background-color: #ffffff !important;` and `color: #0f172a !important;` to ensure CV document paper remains white with dark text under all theme conditions (`AGENTS.md` §5).

## Execution Protocol
1. Create `SCOPE.md` and `BRIEFING.md` in your working directory.
2. Run the iteration loop:
   - Spawn Explorers (`teamwork_preview_explorer`) to analyze `src/index.css` details.
   - Spawn Worker (`teamwork_preview_worker`) to update `src/index.css` and run build/tests.
   - Spawn Reviewers (`teamwork_preview_reviewer`) to verify CSS correctness and contrast.
   - Spawn Challengers (`teamwork_preview_challenger`) to verify theme toggles and CSS isolation.
   - Spawn Forensic Auditor (`teamwork_preview_auditor`) to verify zero integrity violations.
   - Gate: Collect verdicts in `GATE_STATUS.md`. All criteria (build pass, ALL reviewers APPROVE, challenger PASS, auditor CLEAN) must pass.
3. On victory, write `handoff.md` and notify parent.
