# Handoff Report — Printable CV Paper Theme Isolation & Hard-Lock Analysis

**Author:** explorer_m1_3  
**Working Directory:** `c:\Users\Adrian\Documents\GitHub\skillvault\.agents\explorer_m1_3\`  
**Target Architecture:** Milestone 1 — Printable CV Paper Theme Isolation (`.printable-area`)  
**Date:** 2026-08-12  

---

## 1. Observation

### 1.1 Existing CSS Rules in `src/index.css`
Inspection of `src/index.css` (lines 175–179) reveals the current CSS rule for `.printable-area`:

```css
/* Hard override to prevent dark theme borders leaking onto white A4 printable CV sheet (ADR-95, AGENTS.md §5) */
.printable-area,
.printable-area * {
  border-color: #cbd5e1;
}
```
**Finding:** Currently, `src/index.css` ONLY overrides `border-color`. It lacks explicit declarations for `background-color`, `color`, `color-scheme`, or local scoping of theme variables (`--sv-ink`, `--sv-surface`, `--sv-muted`, etc.).

### 1.2 Document Rendering Components Inspection

1. **`src/components/DocumentRenderer.tsx`** (line 787):
   ```tsx
   <div
     ref={docRef}
     className={`w-[210mm] min-h-[297mm] p-10 shadow-2xl printable-area transition-all ${activeFont.cssClass} ${activePaper.bgClass}`}
     style={{ boxSizing: 'border-box' }}
   >
   ```
   **Observation:** `DocumentRenderer.tsx` correctly applies the `printable-area` class to the A4 document container (`w-[210mm] min-h-[297mm]`). Inside this container, element text styles rely on Tailwind slate colors (e.g. `text-slate-900`, `text-slate-800`, `text-slate-700`, `text-slate-600`) and custom active palette inline styles (`activePalette.primaryBg`, `activePalette.textColor`).

2. **`src/components/CVWordBuilder.tsx`** (line 573):
   ```tsx
   <div className="w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl rounded-sm font-sans text-xs text-slate-900 space-y-6">
   ```
   **Observation:** `CVWordBuilder.tsx` renders an A4 document page container (`w-[210mm] min-h-[297mm]`) with `bg-white` and `text-slate-900`, but **currently lacks the `printable-area` class** in its `className` attribute.

3. **`src/components/InterviewCheatSheetView.tsx`** (line 78):
   ```tsx
   <div className="space-y-4 cheatsheet-printable-area">
   ```
   **Observation:** Uses `cheatsheet-printable-area` for printing the cheat sheet, which is an app view component that follows standard theme reactive tokens rather than A4 white paper rules.

### 1.3 Requirements Confirmation (`AGENTS.md` §5 & `PROJECT.md`)
- `AGENTS.md` §5 explicitly states:
  > **Kartka CV musi zostać biała w obu motywach.**
  > `DocumentRenderer.tsx` i `CVWordBuilder.tsx` renderują dokument A4 (`w-[210mm] min-h-[297mm]`, klasa `printable-area`), który jest **drukowany przez `window.print()` i eksportowany do PDF**. Zamiana kolorów wewnątrz kartki na tokeny motywu da w trybie ciemnym jasny tekst na białym papierze — nieczytelne CV i zepsuty eksport. Zmieniaj wyłącznie chrome dookoła kartki.
- `PROJECT.md` § Feature 4 & SCOPE.md:
  > `.printable-area` CSS rule hard-locking white background (`#FFFFFF`) and dark text (`#0F172A`), immune to `[data-theme="dark"]` property cascades.

---

## 2. Logic Chain

1. **Dark Theme Cascade Vulnerability**:
   - In `src/index.css`, `[data-theme="dark"]` sets `--sv-canvas: #0a0b10;`, `--sv-surface: #121319;`, `--sv-ink: #f2f3f7;` on root/body.
   - If an inner element or sub-component inside the CV document container uses theme utility classes (such as `text-ink`, `text-muted`, `bg-surface`, `border-line`) or relies on un-styled text inheritance, it inherits `--sv-ink` (`#f2f3f7` - white text).
   - In Dark mode, white text on white paper (`#FFFFFF`) makes text completely invisible and corrupts print/PDF exports (`window.print()`).

2. **Cascading Variable Re-scoping Solution**:
   - By declaring `color: #0f172a !important;` and `background-color: #ffffff !important;` on `.printable-area`, the base container is guaranteed to be white paper with Deep Navy text under all themes.
   - Re-defining custom CSS variables (`--sv-ink`, `--sv-surface`, `--sv-muted`, `--sv-subtle`, `--sv-canvas`, `--sv-line`) within `.printable-area` scope guarantees that even if a child component references Tailwind theme tokens (`bg-surface`, `text-ink`), those tokens resolve to light-mode values inside the document paper.
   - Keeping `color: #0f172a !important;` on `.printable-area` (the container selector, rather than `.printable-area *`) ensures that specific child elements with intentional inline styles (e.g. colored badge headers with `text-white` on primary palette backgrounds) are preserved without being forcefully overwritten by universal wildcards.

3. **Alignment of `CVWordBuilder.tsx`**:
   - `CVWordBuilder.tsx` line 573 is an A4 document preview container (`w-[210mm] min-h-[297mm]`).
   - Adding `printable-area` to line 573 ensures both document rendering components share the identical theme protection lock.

---

## 3. Caveats

- **Paper Tint Customizations**: `DocumentRenderer.tsx` provides paper background tint options (`white` `#ffffff`, `cream` `#fdfbf7`, `cool` `#f8fafc`, `warm` `#faf8f5`). Using `background-color: #ffffff !important;` on `.printable-area` directly could override subtle paper choices like cream `#fdfbf7` if applied via inline style vs class specificity. To preserve light paper tints while hard-locking against dark mode:
  - Setting `background-color: #ffffff;` in `.printable-area` allows Tailwind utility background classes (such as `bg-[#fdfbf7]`) to take precedence in light mode.
  - Adding `[data-theme='dark'] .printable-area { background-color: #ffffff !important; }` (or re-scoping `--sv-surface: #ffffff`) guarantees dark mode canvas (`#0a0b10`) NEVER infects CV paper.
- **No Direct Source Editing**: As an explorer agent, no code changes in `src/` were executed. The proposed CSS rule and component class addition are documented in Section 4 below for implementation.

---

## 4. Conclusion & Proposed Implementation

### 4.1 Proposed CSS Replacement for `src/index.css` (lines 175–195)

Replace existing lines 175–179 in `src/index.css`:

```css
/* ============================================================================
   CV Printable Paper Hard-Lock (AGENTS.md §5, ADR-95)
   ----------------------------------------------------------------------------
   Guarantees that CV document paper in DocumentRenderer & CVWordBuilder
   remains white paper (#FFFFFF) with dark ink (#0F172A) under both Light and
   Dark modes. Prevents dark theme cascades from rendering light text on white paper.
   ========================================================================== */
.printable-area {
  background-color: #ffffff;
  color: #0f172a !important;
  color-scheme: light !important;

  /* Scoped Light-Theme Variables for CV Paper */
  --sv-canvas: #ffffff;
  --sv-surface: #ffffff;
  --sv-raised: #ffffff;
  --sv-sunken: #f8fafc;
  --sv-overlay: rgba(15, 23, 42, 0.4);

  --sv-line: #cbd5e1;
  --sv-line-strong: #94a3b8;

  --sv-ink: #0f172a;
  --sv-muted: #475569;
  --sv-subtle: #64748b;
  --sv-inverse: #ffffff;
}

[data-theme='dark'] .printable-area {
  background-color: #ffffff !important;
  color: #0f172a !important;
}

.printable-area,
.printable-area * {
  border-color: #cbd5e1;
}
```

### 4.2 Proposed Component Modification (`src/components/CVWordBuilder.tsx` line 573)

Update line 573 in `src/components/CVWordBuilder.tsx`:

```tsx
// BEFORE:
<div className="w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl rounded-sm font-sans text-xs text-slate-900 space-y-6">

// AFTER:
<div className="w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl rounded-sm font-sans text-xs text-slate-900 space-y-6 printable-area">
```

---

## 5. Verification Method

To verify these changes after implementation:

1. **Lint & Build Verification**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
2. **Visual & Theme Switching Verification**:
   - Open CV Preview (`DocumentRenderer`) and CV Word Builder (`CVWordBuilder`).
   - Toggle theme switch between Light Mode (`[data-theme="light"]`) and Dark Mode (`[data-theme="dark"]`).
   - Confirm that while the application chrome (topbar, sidebar, background canvas, modals) shifts smoothly to Deep Navy dark colors, the A4 CV page remains pure white paper (`#FFFFFF`) with dark text (`#0F172A`).
3. **Print Preview Verification**:
   - Trigger `window.print()` / click "Drukuj" button in Dark mode.
   - Confirm that the print dialog preview displays a clean white document with dark text and light slate borders.
