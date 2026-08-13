import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Challenger M2-1 Empirical Stress Test:
 * Deep verification of Theme Toggling and .printable-area White Paper Isolation
 */
describe('Challenger M2-1 Empirical Theme Isolation & White Paper Lock', () => {
  const cssPath = path.resolve(__dirname, '../../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  const docRendererPath = path.resolve(__dirname, '../../components/DocumentRenderer.tsx');
  const docRendererContent = fs.readFileSync(docRendererPath, 'utf-8');

  const cvWordBuilderPath = path.resolve(__dirname, '../../components/CVWordBuilder.tsx');
  const cvWordBuilderContent = fs.readFileSync(cvWordBuilderPath, 'utf-8');

  it('1. CSS Rule Specificity: verifies [data-theme="dark"] .printable-area enforces background #ffffff !important and color #0f172a !important', () => {
    // Check dark theme printable area override block
    const darkPrintableBlock = cssContent.match(/\[data-theme=['"]dark['"]\]\s+\.printable-area\s*\{([^}]+)\}/);
    expect(darkPrintableBlock).not.toBeNull();
    const darkBlockBody = darkPrintableBlock![1];
    
    expect(darkBlockBody).toMatch(/background-color:\s*#ffffff\s*!important/i);
    expect(darkBlockBody).toMatch(/color:\s*#0f172a\s*!important/i);
  });

  it('2. Default .printable-area rule enforces background #ffffff, color #0f172a !important, color-scheme light !important', () => {
    const printableBlockMatch = cssContent.match(/\.printable-area\s*\{([^}]+)\}/);
    expect(printableBlockMatch).not.toBeNull();
    const blockBody = printableBlockMatch![1];

    expect(blockBody).toMatch(/background-color:\s*#ffffff/i);
    expect(blockBody).toMatch(/color:\s*#0f172a\s*!important/i);
    expect(blockBody).toMatch(/color-scheme:\s*light\s*!important/i);
  });

  it('3. Rescoped Light Theme Variables in .printable-area match exact light theme specs', () => {
    const printableBlockMatch = cssContent.match(/\.printable-area\s*\{([^}]+)\}/);
    expect(printableBlockMatch).not.toBeNull();
    const blockBody = printableBlockMatch![1];

    // Read light theme values from index.css
    const lightBlockMatch = cssContent.match(/(?::root|\[data-theme=['"]light['"]\])\s*\{([^}]+)\}/);
    expect(lightBlockMatch).not.toBeNull();
    const lightBlockBody = lightBlockMatch![1];

    const getVar = (content: string, name: string) => {
      const m = content.match(new RegExp(`${name}:\\s*([^;]+);`));
      return m ? m[1].trim() : null;
    };

    expect(getVar(blockBody, '--sv-canvas')).toBe('#ffffff');
    expect(getVar(blockBody, '--sv-surface')).toBe('#ffffff');
    expect(getVar(blockBody, '--sv-ink')).toBe('#0f172a');
    expect(getVar(blockBody, '--sv-muted')).toBe('#475569');
    expect(getVar(blockBody, '--sv-subtle')).toBe('#64748b');
    expect(getVar(blockBody, '--sv-line')).toBe('#cbd5e1');
    expect(getVar(blockBody, '--sv-line-strong')).toBe('#94a3b8');

    // Confirm that --sv-ink inside printable-area matches --sv-ink in light root mode (#0f172a)
    expect(getVar(blockBody, '--sv-ink')).toBe(getVar(lightBlockBody, '--sv-ink'));
  });

  it('4. Universal border-color override for .printable-area and all children', () => {
    expect(cssContent).toMatch(/\.printable-area,\s*\.printable-area\s+\*\s*\{[^}]*border-color:\s*#cbd5e1/i);
  });

  it('5. JSX Structural Integrity: DocumentRenderer.tsx printable-area container', () => {
    // Locate printable-area tag in DocumentRenderer.tsx
    const printableMatch = docRendererContent.match(/<div[^>]*className=\{`[^`]*printable-area[^`]*`\}[^>]*>/);
    expect(printableMatch).not.toBeNull();
    
    // Ensure the container maintains fixed white paper dimensions and classes
    expect(printableMatch![0]).toContain('w-[210mm]');
    expect(printableMatch![0]).toContain('min-h-[297mm]');
    expect(printableMatch![0]).toContain('printable-area');
  });

  it('6. JSX Structural Integrity: CVWordBuilder.tsx printable-area container', () => {
    // Locate printable-area tag in CVWordBuilder.tsx
    const printableMatch = cvWordBuilderContent.match(/<div[^>]*className="[^"]*printable-area[^"]*"[^>]*>/);
    expect(printableMatch).not.toBeNull();
    
    // Ensure the container maintains white background and fixed dimensions
    expect(printableMatch![0]).toContain('w-[210mm]');
    expect(printableMatch![0]).toContain('min-h-[297mm]');
    expect(printableMatch![0]).toContain('bg-white');
    expect(printableMatch![0]).toContain('text-slate-900');
  });

  it('7. No Dark Mode Specific Classes (dark:) inside printable-area JSX blocks', () => {
    // Extract contents inside printable-area in DocumentRenderer.tsx
    const docRendererPrintableArea = docRendererContent.slice(
      docRendererContent.indexOf('printable-area'),
      docRendererContent.indexOf('/* ========================================================', docRendererContent.indexOf('printable-area'))
    );
    expect(docRendererPrintableArea).not.toMatch(/\bdark:/);

    // Extract contents inside printable-area in CVWordBuilder.tsx
    const cvBuilderPrintableStart = cvWordBuilderContent.indexOf('printable-area');
    const cvBuilderPrintableEnd = cvWordBuilderContent.indexOf('</div>\n        </div>', cvBuilderPrintableStart);
    const cvBuilderPrintableArea = cvWordBuilderContent.slice(cvBuilderPrintableStart, cvBuilderPrintableEnd > 0 ? cvBuilderPrintableEnd : undefined);
    expect(cvBuilderPrintableArea).not.toMatch(/\bdark:/);
  });
});
