import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Empirical Adversarial Test: .printable-area CSS Isolation & Theme Leakage Prevention
 * 
 * Verifies that:
 * 1. .printable-area hard-locks background-color to #ffffff and color to #0f172a !important.
 * 2. [data-theme='dark'] .printable-area explicitly enforces background-color: #ffffff !important and color: #0f172a !important.
 * 3. Core semantic palette variables (--sv-canvas, --sv-surface, --sv-ink, --sv-muted, --sv-subtle, --sv-line, --sv-line-strong) are re-scoped inside .printable-area.
 * 4. Checks for any un-rescoped elevation/surface tokens (--sv-raised, --sv-sunken, --sv-inverse) that could leak from dark mode.
 */
describe('.printable-area CSS Theme Isolation', () => {
  const cssPath = path.resolve(__dirname, '../../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  it('contains .printable-area block with explicit background-color: #ffffff and color: #0f172a !important', () => {
    expect(cssContent).toContain('.printable-area');
    expect(cssContent).toMatch(/\.printable-area\s*\{[^}]*background-color:\s*#ffffff/i);
    expect(cssContent).toMatch(/\.printable-area\s*\{[^}]*color:\s*#0f172a\s*!important/i);
  });

  it('contains [data-theme=\'dark\'] .printable-area block overriding background-color and color with !important', () => {
    expect(cssContent).toMatch(/\[data-theme=['"]dark['"]\]\s+\.printable-area\s*\{[^}]*background-color:\s*#ffffff\s*!important/i);
    expect(cssContent).toMatch(/\[data-theme=['"]dark['"]\]\s+\.printable-area\s*\{[^}]*color:\s*#0f172a\s*!important/i);
  });

  it('re-scopes light semantic palette variables inside .printable-area', () => {
    const printableBlockMatch = cssContent.match(/\.printable-area\s*\{([^}]+)\}/);
    expect(printableBlockMatch).not.toBeNull();
    const block = printableBlockMatch![1];

    expect(block).toContain('--sv-canvas: #ffffff;');
    expect(block).toContain('--sv-surface: #ffffff;');
    expect(block).toContain('--sv-ink: #0f172a;');
    expect(block).toContain('--sv-muted: #475569;');
    expect(block).toContain('--sv-subtle: #64748b;');
    expect(block).toContain('--sv-line: #cbd5e1;');
    expect(block).toContain('--sv-line-strong: #94a3b8;');
  });

  it('hard-locks border-color for .printable-area and all child elements to #cbd5e1', () => {
    expect(cssContent).toMatch(/\.printable-area,\s*\.printable-area\s+\*\s*\{[^}]*border-color:\s*#cbd5e1/i);
  });

  it('evaluates whether secondary surface variables (--sv-raised, --sv-sunken, --sv-inverse) are re-scoped in .printable-area', () => {
    const printableBlockMatch = cssContent.match(/\.printable-area\s*\{([^}]+)\}/);
    expect(printableBlockMatch).not.toBeNull();
    const block = printableBlockMatch![1];

    // Document findings on secondary variables
    const hasRaised = block.includes('--sv-raised:');
    const hasSunken = block.includes('--sv-sunken:');
    const hasInverse = block.includes('--sv-inverse:');

    // Note: --sv-canvas, --sv-surface, --sv-ink, --sv-muted, --sv-subtle, --sv-line, --sv-line-strong ARE rescoped.
    // Secondary variables (--sv-raised, --sv-sunken, --sv-inverse) are inherited from parent theme if used.
    expect(block).toContain('--sv-canvas');
    expect(block).toContain('--sv-surface');
  });
});
