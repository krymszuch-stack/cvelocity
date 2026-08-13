# Original User Request

## 2026-08-12T20:43:58Z

Align the CVELOCITY web application UI theme, design system tokens, and UI components with the new CVELOCITY logo brand identity (Champagne Gold `#D4AF37`/`#C5A059`, Deep Navy `#0F172A`/`#1E293B`, and sleek modern contrast across both Light and Dark modes).

Working directory: c:\Users\Adrian\Documents\GitHub\skillvault
Integrity mode: development

## Requirements

### R1. UI Color System & Token Alignment
Update the design system tokens in `src/index.css` and Tailwind theme variables so that the primary brand colors (`--sv-brand-*`, `--color-brand-*`) reflect the new CVELOCITY logo palette (Champagne Gold & Deep Navy), while maintaining accessible contrast in both Light and Dark modes.

### R2. Component & Chrome Polish
Ensure all UI components (Sidebar logo emblem, buttons, badges, tabs, modals, card highlights, topbar) consistently consume the updated theme tokens. Preserve the hard rule that the CV document paper remains white in both light and dark themes (`printable-area`).

### R3. Quality & Build Verification
Verify that all lints, tests, and production builds pass cleanly without any breaking changes to existing slot filling, ATS scoring, or PDF rendering logic.

## Acceptance Criteria

### Brand & Palette Alignment
- [ ] Primary brand accent colors in `src/index.css` map to Champagne Gold and Deep Navy accents matching the new CVELOCITY logo.
- [ ] Both Light and Dark themes (`data-theme="light"` and `data-theme="dark"`) present a cohesive, premium, high-contrast appearance.

### Document & Chrome Integrity
- [ ] CV A4 printable document page (`printable-area`) remains white with dark text in both Light and Dark modes.
- [ ] Sidebar logo emblem and topbar branding reflect the new color scheme.

### Automated Checks
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm test` passes 100% of test suites.
- [ ] `npm run build` generates valid client and server bundles.
