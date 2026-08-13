import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Printable Area White Paper Isolation Component & CSS Verification', () => {
  const cssPath = path.resolve(__dirname, '../../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  const docRendererPath = path.resolve(__dirname, '../../components/DocumentRenderer.tsx');
  const docRendererContent = fs.readFileSync(docRendererPath, 'utf-8');

  const cvWordBuilderPath = path.resolve(__dirname, '../../components/CVWordBuilder.tsx');
  const cvWordBuilderContent = fs.readFileSync(cvWordBuilderPath, 'utf-8');

  describe('CSS Rule Integrity in src/index.css', () => {
    it('1. .printable-area base rule hard-locks background-color to #ffffff and text color to #0f172a !important', () => {
      const printableBlockMatch = cssContent.match(/\.printable-area\s*\{([^}]+)\}/);
      expect(printableBlockMatch).not.toBeNull();
      const block = printableBlockMatch![1];

      expect(block).toMatch(/background-color:\s*#ffffff/i);
      expect(block).toMatch(/color:\s*#0f172a\s*!important/i);
      expect(block).toMatch(/color-scheme:\s*light\s*!important/i);
    });

    it('2. [data-theme="dark"] .printable-area override enforces background-color: #ffffff !important and color: #0f172a !important', () => {
      const darkPrintableBlockMatch = cssContent.match(/\[data-theme=['"]dark['"]\]\s+\.printable-area\s*\{([^}]+)\}/);
      expect(darkPrintableBlockMatch).not.toBeNull();
      const darkBlock = darkPrintableBlockMatch![1];

      expect(darkBlock).toMatch(/background-color:\s*#ffffff\s*!important/i);
      expect(darkBlock).toMatch(/color:\s*#0f172a\s*!important/i);
    });

    it('3. .printable-area re-scopes all core semantic palette tokens to light mode values', () => {
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

    it('4. Universal border locking rule targets .printable-area and all descendant elements (*)', () => {
      expect(cssContent).toMatch(/\.printable-area,\s*\.printable-area\s+\*\s*\{[^}]*border-color:\s*#cbd5e1/i);
    });
  });

  describe('Component Structural Isolation Verification', () => {
    it('1. DocumentRenderer.tsx renders printable-area container with fixed A4 dimensions', () => {
      expect(docRendererContent).toContain('printable-area');
      const printableMatch = docRendererContent.match(/<div[^>]*className=\{`[^`]*printable-area[^`]*`\}[^>]*>/);
      expect(printableMatch).not.toBeNull();

      const classAttr = printableMatch![0];
      expect(classAttr).toContain('w-[210mm]');
      expect(classAttr).toContain('min-h-[297mm]');
      expect(classAttr).toContain('shadow-2xl');
    });

    it('2. CVWordBuilder.tsx renders printable-area container with white paper styling and A4 dimensions', () => {
      expect(cvWordBuilderContent).toContain('printable-area');
      const printableMatch = cvWordBuilderContent.match(/<div[^>]*className="[^"]*printable-area[^"]*"[^>]*>/);
      expect(printableMatch).not.toBeNull();

      const classAttr = printableMatch![0];
      expect(classAttr).toContain('w-[210mm]');
      expect(classAttr).toContain('min-h-[297mm]');
      expect(classAttr).toContain('bg-white');
      expect(classAttr).toContain('text-slate-900');
    });

    it('3. DocumentRenderer.tsx printable-area container does not leak dark mode utility classes (dark:)', () => {
      const printableStartIndex = docRendererContent.indexOf('printable-area');
      expect(printableStartIndex).toBeGreaterThan(-1);

      const renderBlock = docRendererContent.slice(printableStartIndex, printableStartIndex + 5000);
      expect(renderBlock).not.toMatch(/\bdark:[a-zA-Z0-9_-]+/);
    });

    it('4. CVWordBuilder.tsx printable-area container does not leak dark mode utility classes (dark:)', () => {
      const printableStartIndex = cvWordBuilderContent.indexOf('printable-area');
      expect(printableStartIndex).toBeGreaterThan(-1);

      const renderBlock = cvWordBuilderContent.slice(printableStartIndex, printableStartIndex + 5000);
      expect(renderBlock).not.toMatch(/\bdark:[a-zA-Z0-9_-]+/);
    });
  });
});
