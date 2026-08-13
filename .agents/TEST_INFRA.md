# E2E Test Infra: CVELOCITY Brand Alignment & Theme Verification

## Test Philosophy
- Opaque-box and component-level verification for theme switching and document paper isolation.
- Ensures design tokens resolve correctly in both Light and Dark modes.
- Enforces strict compliance with `AGENTS.md` §5 (CV document paper white invariant).

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 (Unit/Comp) | Tier 2 (Boundary/Theme) | Tier 3 (Integration) | Tier 4 (E2E Build) |
|---|---------|---------------------|:-----------------:|:----------------------:|:-------------------:|:------------------:|
| 1 | Token Definition | R1 | ✓ | ✓ | | |
| 2 | Champagne Gold Scale | R1 | ✓ | ✓ | | |
| 3 | Deep Navy Theme Surface | R1 | ✓ | ✓ | | |
| 4 | CV Printable Paper Lock | R2, AGENTS.md §5 | ✓ | ✓ | ✓ | |
| 5 | UI Chrome Alignment | R2 | ✓ | ✓ | | |
| 6 | Build & Quality Gate | R3 | | | | ✓ |

## Test Architecture
- Test Runner: Vitest (`npm test`) with jsdom / React Testing Library for component & theme isolation.
- Quality Commands: `npm run lint`, `npm test`, `npm run build`.

## Coverage Thresholds
- Tier 1: 100% pass on token and component tests.
- Tier 2: Verified dark mode toggle does NOT alter `.printable-area` white background (`#FFFFFF`) or text (`#0F172A`).
- Tier 3: Zero lint errors (`npm run lint`), 0 test failures (`npm test`), 0 build errors (`npm run build`).
