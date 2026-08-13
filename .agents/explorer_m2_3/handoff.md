# M2.3 Handoff Report: Chrome Views & Document Renderers Investigation

## 1. Observation

Direct observations and evidence collected during filesystem and codebase analysis:

### 1.1 Target File Locations & Baseline Metrics
- `src/components/MasterVaultEditor.tsx` (3,029 lines)
  - Git grep count: **270 matching lines** containing hardcoded legacy color classes (`bg-white`, `bg-slate-*`, `text-slate-*`, `border-slate-*`, `indigo-*`, `bg-emerald-*`, `bg-amber-*`, etc.).
- `src/components/DocumentRenderer.tsx` (1,477 lines)
  - Git grep count: **132 matching lines** containing legacy color classes in surrounding chrome, action bars, option menus, style mixer, canvas wrapper, and modals.
- `src/components/CVWordBuilder.tsx` (899 lines)
  - Git grep count: **61 matching lines** containing legacy color classes in top control banner, main canvas wrapper, sticky MS Word toolbar, and promotion modal.

### 1.2 Surrounding Chrome Wrappers & Toolbars (Outside Printable Paper)
- **`DocumentRenderer.tsx` Chrome & Canvas**:
  - Line 525: Outer chrome container `<div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">`
  - Lines 527–550: Auto-Tailor Summary Banner `<div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white ... border border-indigo-500/30">` with `text-indigo-300`, `text-indigo-400`, `bg-indigo-950 text-indigo-300 border-indigo-700/60`.
  - Lines 553–608: Render Variant Selector Header & Buttons `border-b border-slate-200`, `text-slate-700`, `text-indigo-600`, `bg-slate-100 border border-slate-200`, active variants using `bg-indigo-600`, `bg-blue-600`, `bg-slate-900`.
  - Lines 613–718: Action Buttons (Pre-Flight `bg-amber-50 border-amber-300 text-amber-900`, Compare `bg-indigo-50 border-indigo-300 text-indigo-900`, Copy/Print `bg-slate-100 border-slate-200 text-slate-800`, Export Trigger `bg-emerald-600 text-white`, Export Dropdown Menu `bg-white border-slate-200 shadow-xl`, menu badges `bg-emerald-100 text-emerald-800`, `bg-indigo-100 text-indigo-800`, `bg-blue-100 text-blue-800`, `bg-sky-100 text-sky-800`).
  - Lines 722–781: Style Mixer / Randomizer Bottom Bar `bg-slate-50 border-slate-200`, Randomize button `bg-gradient-to-r from-emerald-600 to-teal-700`, Photo button `bg-white hover:bg-slate-100 border-slate-300 text-slate-800`, badges `bg-slate-200 text-slate-800`.
  - Line 784: Outer Canvas Container `<div className="bg-slate-300/60 p-4 sm:p-8 rounded-2xl border border-slate-300 overflow-x-auto flex justify-center">`.
  - Lines 1278–1473: External Modals (Photo Modal `bg-white border-slate-200`, `bg-indigo-50 border-indigo-200 text-indigo-600`, `bg-slate-50 border-slate-200`, `bg-indigo-600 text-white`; Pre-Flight Validation Modal `bg-white border-slate-200`, `bg-amber-50 border-amber-200 text-amber-600`, checklist cards `bg-emerald-50/60 border-emerald-200 text-emerald-950`, `bg-amber-50/60 border-amber-200 text-amber-950`, `bg-rose-50/60 border-rose-200 text-rose-950`; Side-by-Side Compare Modal `bg-white border-slate-200`, `bg-indigo-50 border-indigo-200 text-indigo-600`, item cards `bg-slate-50 border-slate-200`, `bg-white border-indigo-100`).

- **`CVWordBuilder.tsx` Chrome & Canvas**:
  - Lines 418–483: Control Banner (Track Changes Mode) `<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">`, icon box `bg-blue-50 border-blue-200 text-blue-600`, badge `bg-blue-100 text-blue-800`, Accept All `bg-emerald-600 hover:bg-emerald-500`, Refresh `bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300`, stats bar `bg-slate-50 border-slate-200 text-slate-700`, info badge `bg-amber-50 border-amber-200 text-slate-600`.
  - Line 486: Main Canvas Container `<div className="bg-slate-200/80 p-4 sm:p-8 rounded-2xl border border-slate-300 flex flex-col items-center overflow-x-auto space-y-4">`.
  - Lines 488–571: Sticky MS Word Ribbon Toolbar `<div className="sticky top-4 z-30 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-slate-700 shadow-2xl ...">`, title `text-indigo-400`, buttons `hover:bg-slate-800 text-slate-200 hover:text-white`, A4 format badge `bg-emerald-950/60 border-emerald-800/80 text-emerald-400`.
  - Lines 857–895: Promotion to MasterVault Modal `bg-white border-slate-200 text-slate-900`, header `text-amber-600 text-amber-500`, description `text-slate-600`, preview `bg-amber-50 border-amber-200 text-amber-900`, buttons `bg-slate-100 hover:bg-slate-200 text-slate-700` and `bg-success-500 hover:bg-success-700 text-white`.

- **`MasterVaultEditor.tsx` Chrome & Panels**:
  - Line 802: Main Card Container `<div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-900 shadow-xs space-y-6 relative">`.
  - Lines 829–899: Vault Header Bar `border-b border-slate-100`, icon box `bg-emerald-50 border-emerald-200 text-emerald-700`, title `text-slate-900`, badge `bg-emerald-50 text-emerald-700 border-emerald-200`, score text `text-slate-500`, `text-slate-700`, `text-emerald-600`, track `bg-slate-100 border-slate-200`, progress fill `bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400`, timestamp `text-slate-400`, save button `bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400` / `bg-slate-100 text-slate-400 border-slate-200`, export JSON `bg-slate-900 hover:bg-black text-white`.
  - Lines 902–976: Sub-tabs Bar `border-b border-slate-200`, active tab `border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg`, inactive tab `border-transparent text-slate-500 hover:text-slate-800`.
  - Lines 978–2900: Quiz, Personal Info, Skills, Experience, Education, Security Panels with hardcoded `bg-white`, `bg-slate-50`, `bg-slate-100`, `text-slate-900`, `text-slate-700`, `border-slate-200`, `indigo-*`.

### 1.3 M1 CSS Protection & Printable Area Locking Rules
- `src/index.css` (lines 196–218):
  ```css
  /* Hard override to prevent dark theme borders leaking onto white A4 printable CV sheet (ADR-95, AGENTS.md §5) */
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

  [data-theme='dark'] .printable-area {
    background-color: #ffffff !important;
    color: #0f172a !important;
  }

  .printable-area,
  .printable-area * {
    border-color: #cbd5e1;
  }
  ```
- Vitest Empirical Test `src/lib/__tests__/printable_area_isolation.test.ts` passes 5/5 assertions, confirming CSS isolation and re-scoping of `--sv-*` variables inside `.printable-area`.
- Document paper containers:
  - `DocumentRenderer.tsx:787`: `<div ref={docRef} className={`w-[210mm] min-h-[297mm] p-10 shadow-2xl printable-area transition-all ${activeFont.cssClass} ${activePaper.bgClass}`} style={{ boxSizing: 'border-box' }}>`
  - `CVWordBuilder.tsx:573`: `<div className="w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl rounded-sm font-sans text-xs text-slate-900 space-y-6 printable-area">`

---

## 2. Logic Chain

1. **Observation**: Chrome wrappers, toolbars, action bars, canvas backgrounds outside `.printable-area`, and modals in `MasterVaultEditor.tsx`, `DocumentRenderer.tsx`, and `CVWordBuilder.tsx` use hardcoded Tailwind v3 palette classes (`bg-white`, `bg-slate-*`, `text-slate-*`, `border-slate-*`, `indigo-*`).
   - **Reasoning**: When the application switches to Dark theme (`[data-theme="dark"]`), these surrounding chrome containers retain white or light slate backgrounds and dark text, creating glaring contrast mismatch against the dark canvas (`#0F172A`) and dark shell navigation.
   - **Conclusion**: All chrome elements, toolbars, action bars, modals, and outer canvas backgrounds surrounding `.printable-area` must be migrated to semantic theme tokens defined in `src/index.css` `@theme` (`bg-surface`, `bg-sunken`, `bg-raised`, `bg-canvas`, `text-ink`, `text-muted`, `text-subtle`, `border-line`, `border-line-strong`, `brand-*`, `success-*`, `warning-*`, `danger-*`).

2. **Observation**: `DocumentRenderer.tsx` (line 787) and `CVWordBuilder.tsx` (line 573) both attach the `.printable-area` class to the A4 document paper sheet container (`w-[210mm] min-h-[297mm]`).
   - **Reasoning**: `src/index.css` explicitly forces `.printable-area` to `#FFFFFF` background, `#0F172A` text, and re-scopes `--sv-canvas`, `--sv-surface`, `--sv-ink` locally to light values.
   - **Reasoning**: AGENTS.md §5 explicitly mandates that the CV paper sheet MUST stay white (`#FFFFFF`) with dark text (`#0F172A`) across both Light and Dark themes to ensure clean `window.print()` rendering and vector PDF exports.
   - **Conclusion**: The document contents and paper styling inside `.printable-area` MUST NOT be converted to theme-reactive tokens (`bg-surface`, `text-ink`). Internal document paper styling must remain strictly locked to light paper output.

3. **Observation**: Standardized token mapping rules are defined in `REDESIGN_HANDOFF.md` §4 and `PROJECT.md` contract.
   - `bg-white` -> `bg-surface`
   - `bg-slate-50`, `bg-slate-100` -> `bg-sunken`
   - `bg-slate-200`, `bg-slate-300`, `bg-slate-800` -> `bg-raised`
   - `bg-slate-900`, `bg-slate-950` -> `bg-canvas` / `.sv-glass` (for sticky toolbars/modals)
   - `bg-slate-900/60` -> `bg-overlay`
   - `text-slate-900`, `text-slate-800` -> `text-ink`
   - `text-slate-700`, `text-slate-600` -> `text-muted`
   - `text-slate-500`, `text-slate-400` -> `text-subtle`
   - `border-slate-100`, `border-slate-200` -> `border-line`
   - `border-slate-300`, `border-slate-700` -> `border-line-strong` / `border-line`
   - `indigo-*`, `blue-*`, `cyan-*` -> `brand-*` (`bg-brand-500`, `text-brand-fg`, `bg-brand-soft`, `border-brand-border`, `text-brand-solid-fg`)
   - `emerald-*` (status success) -> `success-*` (`bg-success-soft`, `text-success-fg`)
   - `amber-*` (status warning) -> `warning-*` (`bg-warning-soft`, `text-warning-fg`)
   - `rose-*`, `red-*` (status danger) -> `danger-*` (`bg-danger-soft`, `text-danger-fg`)

---

## 3. Caveats

- **Scope Limit**: Investigation was strictly read-only. No source files under `src/components/` were modified by this agent.
- **Printed Document Exception**: In `DocumentRenderer.tsx`, the `PALETTES` array and `PAPER_BACKGROUNDS` array define document themes selectable by the user for the CV paper. These hex values (`#ffffff`, `#fdfbf7`, `#f8fafc`, `#faf8f5`, `#059669`, `#4f46e5`, etc.) are part of the rendered paper design and must remain untouched.
- **Sticky Word Toolbar**: In `CVWordBuilder.tsx` (line 488), the sticky Word ribbon toolbar currently uses `bg-slate-900/95`. Replacing it with `bg-surface/95` or `.sv-glass bg-surface/90 text-ink border border-line` ensures it seamlessly responds to both Light and Dark mode while retaining high contrast.

---

## 4. Conclusion & Proposed Token Replacements

### 4.1 `src/components/DocumentRenderer.tsx` Replacements

```tsx
// 1. Outer Chrome Container (Line 525)
// BEFORE:
<div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
// AFTER:
<div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">

// 2. Auto-Tailor Banner (Lines 527–549)
// BEFORE:
<div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-3.5 border border-indigo-500/30 text-xs space-y-1.5 shadow-md">
  <div className="flex items-center justify-between font-bold text-indigo-300">
    <span className="flex items-center space-x-1.5">
      <Sparkles className="w-4 h-4 text-indigo-400" />
      ...
    </span>
    <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/60 font-mono">
// AFTER:
<div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-xl p-3.5 border border-brand-500/30 text-xs space-y-1.5 shadow-md">
  <div className="flex items-center justify-between font-bold text-brand-300">
    <span className="flex items-center space-x-1.5">
      <Sparkles className="w-4 h-4 text-brand-400" />
      ...
    </span>
    <span className="text-[10px] bg-brand-950 text-brand-300 px-2 py-0.5 rounded border border-brand-700/60 font-mono">

// 3. Render Variant Selector Bar (Lines 553–608)
// BEFORE:
<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
  <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
    <Layout className="w-4 h-4 text-indigo-600" />
  ...
  <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1">
// AFTER:
<div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
  <span className="text-xs font-bold text-muted flex items-center space-x-1">
    <Layout className="w-4 h-4 text-brand-500" />
  ...
  <div className="bg-sunken p-1 rounded-xl border border-line flex flex-wrap gap-1">

// Variant Option Buttons:
// ATS_SAFE inactive: 'text-muted hover:text-ink'
// ATS_VISUAL_PHOTO active: 'bg-brand-500 text-brand-solid-fg shadow-2xs'
// PRINT_READY active: 'bg-brand-600 text-white shadow-2xs'
// EXECUTIVE_MODERN active: 'bg-raised text-ink shadow-2xs'

// 4. Action Buttons (Lines 613–718)
// Pre-Flight Validation Button (Line 615):
// BEFORE: className="flex items-center space-x-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
// AFTER:  className="flex items-center space-x-1 px-3 py-1.5 bg-warning-soft hover:bg-warning-soft/80 text-warning-fg border border-warning-500/30 rounded-lg text-xs font-bold transition-colors shadow-2xs"

// Compare Button (Line 624):
// BEFORE: className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
// AFTER:  className="flex items-center space-x-1 px-3 py-1.5 bg-brand-soft hover:bg-brand-soft/80 text-brand-fg border border-brand-border rounded-lg text-xs font-bold transition-colors shadow-2xs"

// Copy & Print Buttons (Lines 632, 640):
// BEFORE: className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
// AFTER:  className="flex items-center space-x-1 px-3 py-1.5 bg-sunken hover:bg-raised text-ink border border-line rounded-lg text-xs font-bold transition-colors"

// Export Dropdown Trigger (Line 650):
// BEFORE: className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
// AFTER:  className="flex items-center space-x-1.5 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-brand-solid-fg rounded-lg text-xs font-bold shadow-2xs transition-colors"

// Export Dropdown Menu Card (Line 657):
// BEFORE: className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1"
// AFTER:  className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-xl shadow-xl z-50 p-2 space-y-1"
// Menu Items: className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-sunken rounded-lg flex items-center justify-between text-ink"

// 5. Style Mixer Bottom Bar (Lines 722–781)
// BEFORE:
<div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
  ...
  <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white ...">
  ...
  <button className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 ...">
// AFTER:
<div className="flex flex-wrap items-center justify-between gap-3 bg-sunken p-3 rounded-xl border border-line">
  ...
  <button className="px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-brand-solid-fg font-extrabold text-xs rounded-xl shadow-md ...">
  ...
  <button className="px-3 py-1.5 bg-surface hover:bg-raised border border-line-strong text-ink ...">

// 6. Outer Canvas Container (Line 784)
// BEFORE:
<div className="bg-slate-300/60 p-4 sm:p-8 rounded-2xl border border-slate-300 overflow-x-auto flex justify-center">
// AFTER:
<div className="bg-canvas p-4 sm:p-8 rounded-2xl border border-line overflow-x-auto flex justify-center">

// 7. Modals Outside Printable Area (Lines 1278–1473)
// Photo Modal Backdrop: 'bg-overlay'
// Photo Modal Card: 'bg-surface border border-line text-ink'
// Photo Modal Icon Box: 'bg-brand-soft border border-brand-border text-brand-fg'
// Photo Modal Input: 'bg-sunken border border-line text-ink focus:border-brand-500'
// Photo Modal Save Button: 'bg-brand-500 hover:bg-brand-600 text-brand-solid-fg'
// Pre-Flight Modal Backdrop: 'bg-overlay', Card: 'bg-surface border border-line text-ink'
// Pre-Flight Checklist Cards: Passed 'bg-success-soft border border-success-500/30 text-success-fg', Warning 'bg-warning-soft border border-warning-500/30 text-warning-fg', Danger 'bg-danger-soft border border-danger-500/30 text-danger-fg'
// Compare Modal Backdrop: 'bg-overlay', Card: 'bg-surface border border-line text-ink'
// Compare Item Cards: 'bg-sunken border border-line', Original Box 'bg-raised text-muted', Reframed Box 'bg-surface border border-brand-border'
```

### 4.2 `src/components/CVWordBuilder.tsx` Replacements

```tsx
// 1. Track Changes Control Banner (Lines 418–483)
// BEFORE:
<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
    <div className="flex items-center space-x-3">
      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shrink-0">
      ...
      <h2 className="text-base font-bold text-slate-900">
      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
// AFTER:
<div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-4">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
    <div className="flex items-center space-x-3">
      <div className="p-2.5 bg-brand-soft border border-brand-border rounded-xl text-brand-fg shrink-0">
      ...
      <h2 className="text-base font-bold text-ink">
      <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-fg font-bold text-[10px] uppercase">

// Accept All Button (Line 447):
// BEFORE: className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 ... text-white"
// AFTER:  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 ... text-brand-solid-fg"

// Refresh Button (Line 455):
// BEFORE: className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl ... border border-slate-300"
// AFTER:  className="p-2 bg-sunken hover:bg-raised text-muted rounded-xl ... border border-line-strong"

// Stats Bar (Line 465):
// BEFORE: className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
// AFTER:  className="flex flex-wrap items-center justify-between gap-3 bg-sunken p-3 rounded-xl border border-line text-xs"
// Labels: 'text-muted', Pending 'text-warning-fg', Accepted 'text-success-fg'
// Info Box (Line 478): className="flex items-center space-x-1 text-[11px] text-warning-fg bg-warning-soft px-2.5 py-1 rounded-lg border border-warning-500/30"

// 2. Main Canvas Container Outside Paper (Line 486)
// BEFORE:
<div className="bg-slate-200/80 p-4 sm:p-8 rounded-2xl border border-slate-300 flex flex-col items-center overflow-x-auto space-y-4">
// AFTER:
<div className="bg-canvas p-4 sm:p-8 rounded-2xl border border-line flex flex-col items-center overflow-x-auto space-y-4">

// 3. Sticky MS Word Ribbon Toolbar (Lines 488–571)
// BEFORE:
<div className="sticky top-4 z-30 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-slate-700 shadow-2xl flex flex-wrap items-center justify-between gap-3 max-w-[210mm] w-full">
  <div className="flex items-center space-x-1 border-r border-slate-700 pr-3">
    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 mr-1 flex items-center gap-1">
// AFTER:
<div className="sticky top-4 z-30 sv-glass bg-surface/90 text-ink px-4 py-2.5 rounded-2xl border border-line shadow-2xl flex flex-wrap items-center justify-between gap-3 max-w-[210mm] w-full">
  <div className="flex items-center space-x-1 border-r border-line pr-3">
    <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-fg mr-1 flex items-center gap-1">

// Toolbar Action Buttons:
// BEFORE: className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
// AFTER:  className="p-1.5 hover:bg-sunken rounded-lg text-muted hover:text-ink transition-colors active:scale-95"

// Format A4 Badge (Line 566):
// BEFORE: className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 text-emerald-400"
// AFTER:  className="text-[11px] font-mono text-brand-fg bg-brand-soft border border-brand-border px-2.5 py-0.5 rounded-md flex items-center space-x-1"

// 4. Promotion Modal (Lines 857–895)
// Backdrop: 'bg-overlay'
// Modal Card: 'bg-surface border border-line text-ink'
// Icon Header: 'text-warning-fg'
// Description: 'text-muted'
// Preview Box: 'bg-warning-soft border border-warning-500/30 text-warning-fg'
// Button 1: 'bg-sunken hover:bg-raised text-ink border border-line'
// Button 2: 'bg-brand-500 hover:bg-brand-600 text-brand-solid-fg shadow-2xs'
```

### 4.3 `src/components/MasterVaultEditor.tsx` Replacements

```tsx
// 1. Outer Main Container Card (Line 802)
// BEFORE: <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-900 shadow-xs space-y-6 relative">
// AFTER:  <div className="bg-surface border border-line rounded-xl p-6 text-ink shadow-xs space-y-6 relative">

// 2. Vault Header Bar & Action Buttons (Lines 829–899)
// BEFORE:
<div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-4">
  <div className="flex items-center space-x-3">
    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 relative shadow-xs">
    ...
    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
    ...
    <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 h-full ...">
// AFTER:
<div className="flex flex-wrap items-center justify-between border-b border-line pb-4 gap-4">
  <div className="flex items-center space-x-3">
    <div className="p-2.5 bg-brand-soft border border-brand-border rounded-xl text-brand-fg relative shadow-xs">
    ...
    <h2 className="text-xl font-extrabold text-ink tracking-tight">
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-fg border border-brand-border font-bold">
    ...
    <div className="w-36 bg-sunken rounded-full h-2 overflow-hidden border border-line">
      <div className="bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600 h-full ...">

// Save Button Active (Line 881):
// BEFORE: 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400'
// AFTER:  'bg-brand-500 hover:bg-brand-600 text-brand-solid-fg ring-2 ring-brand-400'

// Save Button Inactive (Line 884):
// BEFORE: 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed border border-slate-200'
// AFTER:  'bg-sunken text-subtle opacity-60 cursor-not-allowed border border-line'

// Export JSON Button (Line 893):
// BEFORE: 'bg-slate-900 hover:bg-black text-white'
// AFTER:  'bg-raised hover:bg-sunken text-ink border border-line'

// 3. Sub-tabs Navigation Bar (Lines 902–976)
// BEFORE:
<div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1 ...">
  <button className="... border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg">
  <button className="... border-transparent text-slate-500 hover:text-slate-800">
// AFTER:
<div className="flex border-b border-line space-x-2 overflow-x-auto pb-1 ...">
  <button className="... border-brand-500 text-brand-fg bg-brand-soft rounded-t-lg">
  <button className="... border-transparent text-subtle hover:text-ink">

// 4. Form Cards, Inputs, and Section Panels (Lines 978–2900)
// Form Cards: 'bg-surface border border-line' (or Card component)
// Inputs / Textareas: 'bg-sunken border border-line text-ink focus:bg-surface focus:border-brand-500' (or Input / Textarea components)
// Banners: 'bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white border border-brand-border'
// Secondary text: 'text-muted' / 'text-subtle'
```

---

## 5. Verification Method

To independently verify these findings and proposed token replacements:

### 5.1 Verification Commands
Run the mandatory build, test, and lint check pipeline:
```bash
cmd /c "npm run lint && npm test && npm run build"
```

### 5.2 Specific Test Assertions to Inspect
1. `src/lib/__tests__/printable_area_isolation.test.ts`
   - Run `npx vitest run src/lib/__tests__/printable_area_isolation.test.ts`
   - Verify that all 5 CSS isolation tests pass.
2. `git grep -E "bg-white|bg-slate|text-slate|border-slate|indigo-" src/components/DocumentRenderer.tsx src/components/CVWordBuilder.tsx`
   - Verify that all remaining occurrences outside `.printable-area` are 0.

### 5.3 Invalidation Conditions
- If any change inside `DocumentRenderer.tsx` or `CVWordBuilder.tsx` alters class names inside `.printable-area` resulting in white text on white paper during Dark Theme switching.
- If `npm run lint` or `npm test` fails.
- If hardcoded legacy color utility classes (`indigo-*`, `bg-white`, `bg-slate-900`) remain in the surrounding chrome toolbars or modals.
