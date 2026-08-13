import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Challenger 2 Empirical Stress Test Suite for Theme & CSS Specificity
 * Focus: Token definitions, fallback values, CSS specificity, WCAG contrast calculations.
 */

describe('Challenger 2 — Empirical Theme & Specificity Verification', () => {
  const cssPath = path.resolve(__dirname, '../../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Helper to convert hex color to relative luminance
  function getLuminance(hex: string): number {
    let cleanHex = hex.trim().replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const aR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const aG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const aB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * aR + 0.7152 * aG + 0.0722 * aB;
  }

  function getContrastRatio(hex1: string, hex2: string): number {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  it('1. Verifies all var(--sv-*) referenced in @theme are defined in :root fallback', () => {
    const themeBlockMatch = cssContent.match(/@theme\s*\{([^}]+)\}/);
    expect(themeBlockMatch).not.toBeNull();
    const themeBlock = themeBlockMatch![1];

    // Extract all var(--sv-*) referenced in @theme
    const varMatches = themeBlock.matchAll(/var\((--sv-[a-zA-Z0-9-]+)\)/g);
    const referencedVars = new Set<string>();
    for (const match of varMatches) {
      referencedVars.add(match[1]);
    }

    expect(referencedVars.size).toBeGreaterThan(0);

    // Extract :root block
    const rootBlockMatch = cssContent.match(/(?::root|\[data-theme=['"]light['"]\])\s*\{([^}]+)\}/);
    expect(rootBlockMatch).not.toBeNull();
    const rootBlock = rootBlockMatch![1];

    // Verify every referenced var is defined in :root
    for (const varName of referencedVars) {
      const isDefined = rootBlock.includes(`${varName}:`);
      expect(isDefined, `Variable ${varName} referenced in @theme must be defined in :root fallback`).toBe(true);
    }
  });

  it('2. Verifies all var(--sv-*) referenced in @theme are defined in dark theme block', () => {
    const themeBlockMatch = cssContent.match(/@theme\s*\{([^}]+)\}/);
    expect(themeBlockMatch).not.toBeNull();
    const themeBlock = themeBlockMatch![1];

    const varMatches = themeBlock.matchAll(/var\((--sv-[a-zA-Z0-9-]+)\)/g);
    const referencedVars = new Set<string>();
    for (const match of varMatches) {
      referencedVars.add(match[1]);
    }

    const darkBlockMatch = cssContent.match(/\[data-theme=['"]dark['"]\]\s*\{([^}]+)\}/);
    expect(darkBlockMatch).not.toBeNull();
    const darkBlock = darkBlockMatch![1];

    for (const varName of referencedVars) {
      const isDefined = darkBlock.includes(`${varName}:`);
      expect(isDefined, `Variable ${varName} referenced in @theme must be defined in dark theme`).toBe(true);
    }
  });

  it('3. Verifies CSS rule order for light vs dark theme declaration specificity', () => {
    const rootPos = cssContent.indexOf(':root');
    const darkPos = cssContent.indexOf("[data-theme='dark']");

    expect(rootPos).toBeGreaterThan(-1);
    expect(darkPos).toBeGreaterThan(-1);

    // [data-theme='dark'] must come AFTER :root in source order so equal specificity rule overrides correctly
    expect(darkPos).toBeGreaterThan(rootPos);
  });

  it('4. Verifies printable-area specificity and !important guards', () => {
    const printablePos = cssContent.indexOf('.printable-area {');
    const darkPrintablePos = cssContent.indexOf("[data-theme='dark'] .printable-area");

    expect(printablePos).toBeGreaterThan(-1);
    expect(darkPrintablePos).toBeGreaterThan(-1);

    // Dark printable area override must come after base printable area
    expect(darkPrintablePos).toBeGreaterThan(printablePos);

    // Check !important declarations
    const baseBlock = cssContent.slice(printablePos, cssContent.indexOf('}', printablePos));
    expect(baseBlock).toContain('color: #0f172a !important');
    expect(baseBlock).toContain('color-scheme: light !important');

    const darkBlock = cssContent.slice(darkPrintablePos, cssContent.indexOf('}', darkPrintablePos));
    expect(darkBlock).toContain('background-color: #ffffff !important');
    expect(darkBlock).toContain('color: #0f172a !important');
  });

  it('5. Empirically calculates WCAG contrast ratios for brand text tokens', () => {
    // Light mode contrast
    const lightBrandFg = '#795200';
    const lightSurface = '#ffffff';
    const lightCanvas = '#f8fafc';

    const lightRatioSurface = getContrastRatio(lightBrandFg, lightSurface);
    const lightRatioCanvas = getContrastRatio(lightBrandFg, lightCanvas);

    // WCAG AA threshold for normal text is 4.5:1, AAA is 7:1
    expect(lightRatioSurface).toBeGreaterThanOrEqual(4.5);
    expect(lightRatioCanvas).toBeGreaterThanOrEqual(4.5);

    // Dark mode contrast
    const darkBrandFg = '#e5c158';
    const darkCanvas = '#0f172a';
    const darkSurface = '#1e293b';

    const darkRatioCanvas = getContrastRatio(darkBrandFg, darkCanvas);
    const darkRatioSurface = getContrastRatio(darkBrandFg, darkSurface);

    expect(darkRatioCanvas).toBeGreaterThanOrEqual(4.5);
    expect(darkRatioSurface).toBeGreaterThanOrEqual(4.5);

    // Solid FG contrast on Gold buttons
    const solidFg = '#0f172a';
    const gold500 = '#c5a059';
    const gold400 = '#d4af37';

    const solidRatio500 = getContrastRatio(solidFg, gold500);
    const solidRatio400 = getContrastRatio(solidFg, gold400);

    expect(solidRatio500).toBeGreaterThanOrEqual(4.5);
    expect(solidRatio400).toBeGreaterThanOrEqual(4.5);
  });

  it('6. Verifies exact Champagne Gold & Deep Navy palette values per PROJECT.md', () => {
    expect(cssContent).toMatch(/--sv-brand-400:\s*#d4af37/i);
    expect(cssContent).toMatch(/--sv-brand-500:\s*#c5a059/i);
    expect(cssContent).toMatch(/--sv-brand-600:\s*#b38e47/i);
    expect(cssContent).toMatch(/--sv-canvas:\s*#0f172a/i);
    expect(cssContent).toMatch(/--sv-surface:\s*#1e293b/i);
  });
});
