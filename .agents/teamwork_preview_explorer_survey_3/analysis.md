# CVELOCITY Test, Lint, Build & E2E Quality Architecture Analysis

**Agent:** `teamwork_preview_explorer_survey_3`  
**Date:** 2026-08-12  
**Target Project:** CVELOCITY (SkillVault) — `krymszuch-stack/skillvault`  
**Working Directory:** `c:\Users\Adrian\Documents\GitHub\skillvault\.agents\teamwork_preview_explorer_survey_3\`  

---

## 1. Executive Summary & Verification Matrix

An exhaustive investigation of the CVELOCITY codebase was conducted to evaluate current test, linter, and build pipeline health, map existing test coverage across domain logic vs. UI/rendering/branding components, and establish a rigorous structure for R3 (Quality & Build Verification) and End-to-End (E2E) testing.

### Executive Findings
1. **Current Pipeline Health**: All 3 automated validation gates (`npm run lint`, `npm test`, `npm run build`) currently pass 100% cleanly without errors.
2. **Test Scope Disparity**: The existing test suite (8 test files, 81 tests) exclusively covers **backend and domain logic** (`src/lib/__tests__/`). There is **zero test coverage** for UI components, React rendering, `DocumentRenderer` A4 paper preservation, theme toggling, design system tokens, or brand logo rendering.
3. **UI Integrity Risk**: `DocumentRenderer.tsx` and `CVWordBuilder.tsx` contain a hard contractual rule (`AGENTS.md` §5): the CV document page (`printable-area`) must remain white with dark text in both Light and Dark themes. Because zero unit or E2E tests currently inspect DOM style rendering or theme attributes, visual regressions in document rendering or theme toggles cannot be caught by the existing CI setup alone.

### Verification Matrix

| Area | Current Setup / Tool | Covered Target | Coverage Status | Deficiencies / Risks |
|---|---|---|---|---|
| **Linter Setup** | `tsc --noEmit` via `npm run lint` | TypeScript type checking (`server.ts`, `src/**/*.ts`, `src/**/*.tsx`) | **100% Type Checked** | No ESLint configuration; linting checks type correctness only, not code style/formatting rules. |
| **Domain Tests** | Vitest v4.1.10 (`environment: 'node'`) | Parsers, ATS security, URL validation, slot filling, ranking, auth | **81 tests passing** | Excellent coverage for domain logic, but 0 React component tests. |
| **Build Process** | `vite build` + `esbuild server.ts` | Frontend client assets (`dist/`) + backend Node bundle (`build-server/server.cjs`) | **Clean Pass** | Large chunk warnings (>500KB) for pdf.js, jspdf, html2canvas; single entry bundle. |
| **DocumentRenderer** | None | Document preview, paper background, print CSS, `printable-area` class | **0% Covered** | High risk of theme leaks into printed/PDF CV page in dark mode. |
| **Theme Toggles** | None | `ThemeContext.tsx`, `ThemeToggle.tsx`, `data-theme` DOM attribute, `localStorage` | **0% Covered** | Theme toggle regressions must be manually inspected. |
| **UI Components** | None | `src/components/ui/` (`Button`, `Card`, `Modal`, `Tabs`, `StatusBadge`, `Field`) | **0% Covered** | Token class compliance and variant rendering are unverified by tests. |
| **Brand Identity** | None | Champagne Gold (`#D4AF37`/`#C5A059`) & Deep Navy (`#0F172A`/`#1E293B`) tokens | **0% Covered** | Logo emblem and brand accent colors are not verified by test assertions. |
| **E2E / Integration** | None | End-to-end user flows, theme switching, PDF export rendering | **0% Covered** | No Playwright/Cypress setup configured in `package.json`. |

---

## 2. Comprehensive System Investigation Findings

### 2.1 Linter Setup (`npm run lint`)
- **Command**: `npm run lint` -> `tsc --noEmit`
- **Configuration**: `tsconfig.json`
  - Target: `ES2022`, Module: `ESNext`, JSX: `react-jsx`, Module Resolution: `bundler`.
  - Exclusions: `semantic-work-graph`, `node_modules`, `dist`, `build-server`.
  - Path alias: `@/*` mapped to `./*`.
- **Execution Observation**: `tsc --noEmit` completes cleanly with exit code 0.
- **Analysis**: The repository relies on the TypeScript compiler to catch syntax errors, missing properties, invalid prop types, and broken module imports. No ESLint config file (`eslint.config.js` or `.eslintrc`) or ESLint package is defined in `package.json`.

### 2.2 Test Suite Architecture (`npm test`)
- **Command**: `npm test` -> `vitest run`
- **Configuration**: Defined in `vite.config.ts`:
  ```ts
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  }
  ```
- **Execution Observation**:
  - Environment: `node` (1ms duration).
  - Total Duration: ~517ms.
  - Test Files: 8 passed (out of 8).
  - Individual Tests: 81 passed (out of 81).
- **Detailed File Breakdown**:
  1. `src/lib/__tests__/outbound_url_validation.test.ts` (22 tests): Verifies SSRF protection, IP range blocking (127.0.0.1, 10.x, 192.168.x, metadata endpoints), protocol enforcement (`http:`, `https:`).
  2. `src/lib/__tests__/cv_parser.test.ts` (1 test): Verifies text-to-MasterVault parsing for contact details, skills, and work history.
  3. `src/lib/__tests__/slot_filling_determinism.test.ts` (3 tests): Verifies FNV-1a hash determinism in `fillSlotSentence`, ensuring ATS score doesn't jump randomly between re-renders.
  4. `src/lib/__tests__/relevance_ranking.test.ts` (4 tests): Verifies keyword relevance scoring and section ranking algorithms.
  5. `src/lib/__tests__/interview_cheat_sheet_engine.test.ts` (10 tests): Verifies interview glossary generation, red flag checklists, STAR seeds, emergency phrases, and Gemini AI enrichment merging.
  6. `src/lib/__tests__/two_factor_auth.test.ts` (5 tests): Verifies 2FA TOTP secret generation, QR URI format, and verification code matching.
  7. `src/lib/__tests__/security_ats.test.ts` (5 tests): Verifies prompt injection detection, ATS formatting security, and forbidden keyword filtering.
  8. `src/lib/__tests__/jd_parser_real_offers.test.ts` (31 tests): Verifies parsing accuracy against real job offer fixtures (IT, non-IT, Polish, English).

### 2.3 Build Pipeline (`npm run build`)
- **Command**: `npm run build` -> `npm run build:client && npm run build:server`
- **Client Build (`build:client`)**: `vite build`
  - Vite v6.4.3 transforms 2,482 modules and produces static output in `dist/`.
  - Bundles `@tailwindcss/vite` v4.1.14 CSS rules (`dist/assets/index-C1gAq1IR.css`, 88.08 kB) and JavaScript chunks.
  - Generates `dist/index.html` with inline pre-paint theme script (`index.html`).
- **Server Build (`build:server`)**: `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=build-server/server.cjs`
  - Bundles Express server code into single CommonJS file `build-server/server.cjs` (54.9 kB) with sourcemap (90.9 kB).
- **Execution Observation**: Both client and server builds complete cleanly with exit code 0 in ~7.1s.

---

## 3. UI, Rendering, Theme, and Brand Test Coverage Analysis

### 3.1 `DocumentRenderer.tsx` & `CVWordBuilder.tsx` Integrity
- **Hard Rule (`AGENTS.md` §5 & `REDESIGN_HANDOFF.md` §4)**: The printable CV document page (`printable-area`) **must remain a white page with dark text** in both Light and Dark themes. Converting interior document styling to dynamic theme tokens like `bg-surface` or `text-ink` causes the dark mode to render light text on white paper, destroying readability and ruining exported PDF/Word files.
- **Current Coverage**: **0 tests**. No test file imports or mounts `DocumentRenderer.tsx` or `CVWordBuilder.tsx`.
- **Target Elements to Verify**:
  - `DocumentRenderer.tsx:740` — Outer printable sheet container (`printable-area w-[210mm] min-h-[297mm]`).
  - `DocumentRenderer.tsx` lines ~484, ~616, ~688, ~1233, ~1290 — Outer chrome toolbar and controls (must use `bg-surface`, `text-ink`, `border-line`).
  - `CVWordBuilder.tsx:652` — Document card container (`printable-area bg-white`).

### 3.2 Theme System (`ThemeContext.tsx` & `ThemeToggle.tsx`)
- **Theme Contract (`src/index.css` & `ThemeContext.tsx`)**:
  - Raw color palette defined under `--sv-*` variables in `src/index.css`.
  - Primitives toggled via `[data-theme='light']` and `[data-theme='dark']` on `document.documentElement`.
  - Tailwind v4 `@theme` aliases point to raw `--sv-*` variables (`bg-surface`, `bg-sunken`, `bg-raised`, `bg-canvas`, `text-ink`, `text-muted`, `text-subtle`, `border-line`, `brand-*`).
  - Active theme saved in `localStorage['skillvault_theme']`.
  - Inline `<script>` in `index.html` sets `data-theme` prior to initial paint.
- **Current Coverage**: **0 tests**. Neither `ThemeContext.tsx` nor `ThemeToggle.tsx` is covered by Vitest.

### 3.3 Base UI Components (`src/components/ui/`)
- Base components (`Button`, `Card`, `Field`, `Modal`, `Tabs`, `Feedback`, `StatusBadge`, `ThemeToggle`, `AdvisorButton`) are designed as reusable theme-aware primitives.
- **Current Coverage**: **0 tests**.

### 3.4 Brand Branding Alignment
- R1 requirement dictates aligning brand tokens to Champagne Gold (`#D4AF37` / `#C5A059`) and Deep Navy (`#0F172A` / `#1E293B`).
- **Current Coverage**: **0 tests**. No automated check validates that `--sv-brand-primary` maps to `#D4AF37` or `#C5A059`, or that brand contrast ratios meet accessibility standards.

---

## 4. R3 Quality & Build Verification Structure

R3 mandates that all lints, tests, and production builds pass cleanly without breaking existing slot filling, ATS scoring, or PDF rendering logic.

### 4.1 R3 Execution Procedure
To guarantee R3 quality enforcement before opening any Pull Request or completing any wave, the following 4-step verification pipeline must be executed sequentially:

```bash
# Step 1: Static Type Check (Linter)
npm run lint

# Step 2: Automated Unit & Regression Test Suite
npm test

# Step 3: Production Client & Server Bundling
npm run build

# Step 4: Verification of Output Artifacts & Gate Rules
node -e "if (!require('fs').existsSync('dist/index.html') || !require('fs').existsSync('build-server/server.cjs')) process.exit(1);"
```

### 4.2 Gate Rules & Non-Bypass Directives (`AGENTS.md` §8.2)
1. **Zero Suppression Annotations**: No `@ts-ignore`, `@ts-expect-error`, `as any`, or `eslint-disable` comments may be added to bypass type checking.
2. **Zero Test Suppression**: No `.skip()`, `.todo()`, or test deletions are permitted to make test suites pass.
3. **No Softened Assertions**: Assertion bounds in domain regression tests (`slot_filling_determinism`, `security_ats`, `outbound_url_validation`) must remain strict.
4. **Build Output Validity**: Both `dist/index.html` (client) and `build-server/server.cjs` (server) must exist and be non-empty after `npm run build`.

---

## 5. Detailed E2E and UI Component Testing Architecture

To bridge the gap between domain-only testing and full UI/rendering confidence, we propose a two-tiered testing architecture: **Tier A (Vitest React Component Tests)** and **Tier B (Playwright End-to-End Tests)**.

### 5.1 Tier A: Vitest DOM Component Testing

#### 5.1.1 Environment Setup
Add DOM testing utilities to Vitest by installing `jsdom` (or `happy-dom`), `@testing-library/react`, and `@testing-library/jest-dom` as devDependencies, and configuring a DOM test setup file:

```ts
// vite.config.ts (Test Extension)
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environmentMatchglobs: [
      ['src/components/**/__tests__/**/*.test.tsx', 'jsdom'],
      ['src/context/**/__tests__/**/*.test.tsx', 'jsdom'],
    ],
  },
});
```

#### 5.1.2 Test Suite Specifications

##### 1. `src/components/__tests__/DocumentRenderer.test.tsx`
- **Objective**: Prevent dark theme styles from polluting the CV document paper page.
- **Key Test Cases**:
  - `it('renders printable-area with white background or explicit paper color in dark mode')`:
    Mount `<DocumentRenderer resume={mockResume} vault={mockVault} />` inside a container with `data-theme="dark"`. Assert `.printable-area` does NOT inherit `bg-surface` or dark text classes, and retains `bg-white` or custom paper background inline styles.
  - `it('uses theme-aware token classes for outer preview chrome')`:
    Assert toolbar container contains `bg-surface`, `border-line`, and `text-ink` classes.

##### 2. `src/context/__tests__/ThemeContext.test.tsx`
- **Objective**: Verify theme toggling logic and DOM attribute synchronization.
- **Key Test Cases**:
  - `it('initializes with default theme and updates document.documentElement data-theme attribute on toggle')`:
    Mount `<ThemeProvider><ThemeTestConsumer /></ThemeProvider>`. Call `toggleTheme()`. Verify `document.documentElement.getAttribute('data-theme')` changes between `'light'` and `'dark'`.
  - `it('persists theme selection to localStorage under skillvault_theme key')`:
    Verify `localStorage.getItem('skillvault_vault_theme')` or `'skillvault_theme'` matches active theme state.

##### 3. `src/components/ui/__tests__/ThemeToggle.test.tsx` & `Sidebar.test.tsx`
- **Objective**: Verify brand logo emblem and toggle controls.
- **Key Test Cases**:
  - `it('renders ThemeToggle button with accessible aria label')`:
    Verify icon switches between Sun/Moon and updates theme state.
  - `it('renders Sidebar logo emblem with Champagne Gold brand accent classes')`:
    Verify Sidebar logo SVG/emblem utilizes `text-brand-gold` or `brand-*` accent tokens.

---

### 5.2 Tier B: Playwright End-to-End (E2E) Testing Architecture

#### 5.2.1 Tooling & Configuration
- **Tool**: Playwright (`@playwright/test`)
- **Config File**: `playwright.config.ts`
- **Target URL**: `http://localhost:3000` (spun up via `npm run dev` or `npm run start`).

#### 5.2.2 Core E2E Test Scenarios

##### Scenario 1: Theme Switching & Contrast Integrity
- **Steps**:
  1. Launch headless Chromium/Firefox/WebKit.
  2. Navigate to root application URL `http://localhost:3000`.
  3. Inspect `<html>` element attribute `data-theme` (default: `dark` or `light`).
  4. Click `ThemeToggle` button in Topbar.
  5. Verify `data-theme` attribute toggles to opposite mode.
  6. Compute background color of `<aside>` (Sidebar) and `<header>` (Topbar) via `window.getComputedStyle()`.
  7. Verify background color matches defined design system token values (`--sv-surface` / `--sv-canvas`).
  8. Reload browser page -> Assert theme state is preserved from `localStorage`.

##### Scenario 2: CV Preview & Printable Document Isolation (`DocumentRenderer`)
- **Steps**:
  1. Navigate to Live CV Preview tab (`RealtimeLivePreview`).
  2. Toggle theme to `dark`.
  3. Locate `.printable-area` DOM node representing the A4 CV page.
  4. Assert computed CSS `background-color` of `.printable-area` is strictly `#FFFFFF` (`rgb(255, 255, 255)`) or selected paper palette.
  5. Assert computed CSS `color` of headings/paragraphs inside `.printable-area` is dark (`rgb(15, 23, 42)` / `rgb(0, 0, 0)`).
  6. Assert computed CSS `background-color` of outer controls container (`main` wrapper) is dark surface (`rgb(15, 23, 42)` / `rgb(30, 41, 59)`).
  7. Emulate print media (`page.emulateMedia({ media: 'print' })`). Verify printable area retains 100% white background and sharp black text for PDF generation.

##### Scenario 3: Brand Logo & Emblem Polish
- **Steps**:
  1. Inspect Sidebar header emblem (`Sidebar.tsx`).
  2. Verify logo SVG emblem renders Champagne Gold (`#D4AF37` / `#C5A059`) accent gradient.
  3. Verify Topbar title and section badges consume `--color-brand-*` tokens without fallback legacy colors (`indigo-600`).

##### Scenario 4: Core Domain Workflow & 0-Hallucination Gate
- **Steps**:
  1. Load sample CV into Master Vault.
  2. Paste job description into JD Parser modal.
  3. Run ATS score simulation (`AtsSimulatorView`).
  4. Verify score ring and progress bar compute deterministically.
  5. Generate reframed CV -> Verify no placeholder/default technologies (e.g. forced React on welder job) were inserted.

---

## 6. Recommendations & Action Plan

1. **Immediate Execution Strategy for R3**:
   - Maintain mandatory check before every PR submission: `npm run lint && npm test && npm run build`.
   - Never modify `server.ts`, domain parsers, or A4 printable paper styles without human authorization (`AGENTS.md` §5, `JULES_PLAYBOOK.md` §4).
2. **Short-Term Test Suite Expansion (Tier A)**:
   - Add `jsdom` and `@testing-library/react` to devDependencies.
   - Create `src/components/__tests__/DocumentRenderer.test.tsx` to lock down `printable-area` white page constraint.
   - Create `src/context/__tests__/ThemeContext.test.tsx` to verify theme attribute toggles.
3. **Long-Term E2E Setup (Tier B)**:
   - Set up Playwright configuration in `playwright.config.ts`.
   - Add `e2e/theme_and_document.spec.ts` to GitHub Actions workflow (`ci.yml`) to run on every Pull Request.
