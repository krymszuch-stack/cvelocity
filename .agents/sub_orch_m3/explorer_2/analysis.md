# M3 Quality Verification & Test Infrastructure Analysis

## Executive Summary
This report presents a thorough investigation of the test environment, configuration, existing test suites, and DOM/CSS testing capabilities for Milestone 3 (Automated Test Suite & Quality Verification) of CVELOCITY.

---

## 1. Test Environment & Configuration

### Configuration File
- The repository uses `vite.config.ts` (there is no separate `vitest.config.ts`).
- Vitest configuration block in `vite.config.ts`:
  ```ts
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  }
  ```
- **Test Discovery Scope**: Restricted to `src/**/*.{test,spec}.{ts,tsx}` to prevent accidental execution of sub-project tests (e.g., `semantic-work-graph/`).

### Test Scripts & Verification Commands
- `npm test`: Runs `vitest run` (10 test suites, 93 tests currently passing).
- `npm run lint`: Runs `tsc --noEmit` (TypeScript type checking & linting).
- `npm run build`: Runs `npm run build:client && npm run build:server` (Vite client build & esbuild server bundle).

### Test Environment
- **Default Execution Environment**: `'node'` (default Vitest environment).
- **DOM Emulation**: Neither `jsdom` nor `happy-dom` is currently listed in `package.json` or installed in `node_modules`.
- **Testing Libraries**: `@testing-library/react` and `@testing-library/jest-dom` are currently absent.

---

## 2. Existing Test Suites & Conventions

### Directory Layout
- **`src/lib/__tests__/`**: Contains 10 test files (93 passing tests total):
  1. `printable_area_isolation.test.ts` (5 tests) — Verifies `.printable-area` CSS rules, color-scheme, and rescope variables.
  2. `empirical_theme_isolation_stress.test.ts` (7 tests) — Empirical stress test for theme toggling and `.printable-area` white paper lock.
  3. `outbound_url_validation.test.ts` (22 tests) — SSRF and URL validation tests.
  4. `slot_filling_determinism.test.ts` (3 tests) — Slot filling determinism regression test.
  5. `cv_parser.test.ts` (1 test) — CV text parser tests.
  6. `relevance_ranking.test.ts` (4 tests) — Relevance ranking scoring.
  7. `interview_cheat_sheet_engine.test.ts` (10 tests) — Interview cheat sheet generation logic.
  8. `two_factor_auth.test.ts` (5 tests) — 2FA OTP and vault crypto tests.
  9. `security_ats.test.ts` (5 tests) — ATS security checks.
  10. `jd_parser_real_offers.test.ts` (31 tests) — Real offer job description parsing.
- **`src/components/__tests__/`**: Currently does **not** exist.

### Test Patterns & Mechanics
- **Domain Logic Tests**: Pure TypeScript/JavaScript unit tests asserting inputs and outputs.
- **Theme & Paper Isolation Tests**: `fs.readFileSync` based regex/string parsing of `src/index.css`, `DocumentRenderer.tsx`, and `CVWordBuilder.tsx`.
- **Execution Output**: All 10 suites pass in ~535ms with zero errors.

---

## 3. CSS & DOM Testing Capabilities in Vitest

### CSS Testing Strategies
1. **Static CSS Token Parsing & AST Checks**:
   - Read `src/index.css` with Node `fs`.
   - Parse and assert token definitions (`--sv-brand-50` through `--sv-brand-950`), surface tokens (`--sv-canvas`, `--sv-surface`), WCAG text contrast tokens (`--sv-brand-fg`, `--sv-brand-solid-fg`), and `.printable-area` CSS overrides.
   - Provides 100% deterministic verification without browser engine layout overhead.

2. **React Component HTML String Verification (`react-dom/server`)**:
   - Use `renderToString` from `react-dom/server` directly in Node environment.
   - Allows rendering React UI components (`Button`, `Card`, `Modal`, `Tabs`, `StatusBadge`, `Field`, `Feedback`, `Sidebar`, `Topbar`) to HTML strings.
   - Enables asserting that UI components consume design system tokens (`bg-surface`, `text-ink`, `bg-brand-500`, `border-line`, etc.) and do not contain forbidden hardcoded palette classes.

3. **JSX Static Analysis & Invariant Testing**:
   - Inspect component JSX files to ensure no forbidden `dark:*` variant classes leak into printable document containers.
   - Check container dimensions (`w-[210mm] min-h-[297mm]`) and required classes (`printable-area bg-white`).

---

## 4. Identified Gaps & Recommended Test Utilities

| Capability | Current Status | Recommendation for M3 |
|---|---|---|
| Domain Unit Testing | Fully supported (`vitest run`) | Maintain existing `src/lib/__tests__/` suites |
| CSS & Token Verification | Done via file parsing in `printable_area_isolation.test.ts` & `empirical_theme_isolation_stress.test.ts` | Expand to cover full Champagne Gold & Deep Navy palette verification |
| UI Component Token Verification | No component tests exist in `src/components/__tests__/` | Create `src/components/__tests__/` using `react-dom/server` (`renderToString`) to verify rendered component token classes |
| Interactive Theme Switching | Requires DOM emulation if testing live DOM events | Add `jsdom` or lightweight DOM mock if runtime `document.documentElement` `data-theme` attribute mutation tests are needed |

---

## 5. Verification Commands Baseline
- `npm run lint` — Pass (0 errors).
- `npm test` — Pass (10/10 test files, 93/93 tests).
- `npm run build` — Pass (Valid client & server bundles).
