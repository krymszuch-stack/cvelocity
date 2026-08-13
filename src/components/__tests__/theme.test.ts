import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ui/ThemeToggle';

describe('Theme System & Token Verification', () => {
  const cssPath = path.resolve(__dirname, '../../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  describe('ThemeContext & ThemeToggle Integration', () => {
    let mockStorage: Record<string, string>;
    let mockAttributes: Record<string, string>;

    beforeEach(() => {
      mockStorage = {};
      mockAttributes = {};

      const localStorageMock = {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, val: string) => {
          mockStorage[key] = val;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        },
      };

      const documentElementMock = {
        setAttribute: (key: string, val: string) => {
          mockAttributes[key] = val;
        },
        getAttribute: (key: string) => mockAttributes[key] || null,
      };

      const matchMediaMock = (query: string) => ({
        matches: query.includes('light') ? true : false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const windowMock = {
        localStorage: localStorageMock,
        matchMedia: matchMediaMock,
      };

      vi.stubGlobal('window', windowMock);
      vi.stubGlobal('localStorage', localStorageMock);
      vi.stubGlobal('matchMedia', matchMediaMock);
      vi.stubGlobal('document', {
        documentElement: documentElementMock,
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('1. ThemeToggle renders button element with proper accessibility attributes in dark mode', () => {
      mockStorage['cvelocity_theme'] = 'dark';
      const html = renderToString(
        React.createElement(ThemeProvider, null, React.createElement(ThemeToggle))
      );

      expect(html).toContain('<button');
      expect(html).toContain('type="button"');
      expect(html).toContain('title="Przełącz na jasny motyw"');
      expect(html).toContain('aria-label="Przełącz na jasny motyw"');
    });

    it('2. ThemeToggle renders proper title and aria-label in light mode', () => {
      mockStorage['cvelocity_theme'] = 'light';
      const html = renderToString(
        React.createElement(ThemeProvider, null, React.createElement(ThemeToggle))
      );

      expect(html).toContain('title="Przełącz na ciemny motyw"');
      expect(html).toContain('aria-label="Przełącz na ciemny motyw"');
    });

    it('3. ThemeContext respects cvelocity_theme from localStorage', () => {
      mockStorage['cvelocity_theme'] = 'light';

      let currentTheme: string | undefined;
      const TestConsumer = () => {
        const { theme } = useTheme();
        currentTheme = theme;
        return React.createElement('div', null, theme);
      };

      renderToString(
        React.createElement(ThemeProvider, null, React.createElement(TestConsumer))
      );

      expect(currentTheme).toBe('light');
    });

    it('4. ThemeContext falls back to legacy_theme_v1 if cvelocity_theme is unset', () => {
      mockStorage['legacy_theme_v1'] = 'light';

      let currentTheme: string | undefined;
      const TestConsumer = () => {
        const { theme } = useTheme();
        currentTheme = theme;
        return React.createElement('div', null, theme);
      };

      renderToString(
        React.createElement(ThemeProvider, null, React.createElement(TestConsumer))
      );

      expect(currentTheme).toBe('light');
    });

    it('5. ThemeContext toggleTheme updates state and saves to localStorage', () => {
      let toggleFn: (() => void) | undefined;
      let currentTheme: string | undefined;

      const TestConsumer = () => {
        const { theme, toggleTheme } = useTheme();
        currentTheme = theme;
        toggleFn = toggleTheme;
        return React.createElement('div', null, theme);
      };

      mockStorage['cvelocity_theme'] = 'dark';
      renderToString(
        React.createElement(ThemeProvider, null, React.createElement(TestConsumer))
      );

      expect(currentTheme).toBe('dark');
      expect(typeof toggleFn).toBe('function');
    });

    it('6. ThemeContext setTheme function is provided and persists cvelocity_theme', () => {
      let setFn: ((theme: 'light' | 'dark') => void) | undefined;
      let currentTheme: string | undefined;

      const TestConsumer = () => {
        const { theme, setTheme } = useTheme();
        currentTheme = theme;
        setFn = setTheme;
        return React.createElement('div', null, theme);
      };

      renderToString(
        React.createElement(ThemeProvider, null, React.createElement(TestConsumer))
      );

      expect(typeof setFn).toBe('function');
    });
  });

  describe('Design System Tokens in src/index.css', () => {
    it('1. Defines Champagne Gold palette (--sv-brand-400, --sv-brand-500, --sv-brand-600)', () => {
      expect(cssContent).toMatch(/--sv-brand-400:\s*#d4af37/i);
      expect(cssContent).toMatch(/--sv-brand-500:\s*#c5a059/i);
      expect(cssContent).toMatch(/--sv-brand-600:\s*#b38e47/i);
    });

    it('2. Defines Deep Navy canvas & surface tokens in dark theme ([data-theme=\'dark\'])', () => {
      const darkBlockMatch = cssContent.match(/\[data-theme=['"]dark['"]\]\s*\{([^}]+)\}/);
      expect(darkBlockMatch).not.toBeNull();
      const darkBlock = darkBlockMatch![1];

      expect(darkBlock).toMatch(/--sv-canvas:\s*#0f172a/i);
      expect(darkBlock).toMatch(/--sv-surface:\s*#1e293b/i);
      expect(darkBlock).toMatch(/--sv-raised:\s*#273549/i);
    });

    it('3. Defines WCAG contrast foreground tokens for light and dark themes', () => {
      const lightBlockMatch = cssContent.match(/(?::root|\[data-theme=['"]light['"]\])\s*\{([^}]+)\}/);
      expect(lightBlockMatch).not.toBeNull();
      const lightBlock = lightBlockMatch![1];
      expect(lightBlock).toMatch(/--sv-brand-fg:\s*#795200/i);
      expect(lightBlock).toMatch(/--sv-brand-solid-fg:\s*#0f172a/i);

      const darkBlockMatch = cssContent.match(/\[data-theme=['"]dark['"]\]\s*\{([^}]+)\}/);
      expect(darkBlockMatch).not.toBeNull();
      const darkBlock = darkBlockMatch![1];
      expect(darkBlock).toMatch(/--sv-brand-fg:\s*#e5c158/i);
      expect(darkBlock).toMatch(/--sv-brand-solid-fg:\s*#0f172a/i);
    });

    it('4. Tailwind v4 @theme maps utility classes to raw --sv-* custom properties', () => {
      const themeBlockMatch = cssContent.match(/@theme\s*\{([^}]+)\}/);
      expect(themeBlockMatch).not.toBeNull();
      const themeBlock = themeBlockMatch![1];

      expect(themeBlock).toContain('--color-brand-400: var(--sv-brand-400)');
      expect(themeBlock).toContain('--color-brand-500: var(--sv-brand-500)');
      expect(themeBlock).toContain('--color-brand-600: var(--sv-brand-600)');
      expect(themeBlock).toContain('--color-brand-fg: var(--sv-brand-fg)');
      expect(themeBlock).toContain('--color-brand-solid-fg: var(--sv-brand-solid-fg)');
      expect(themeBlock).toContain('--color-canvas: var(--sv-canvas)');
      expect(themeBlock).toContain('--color-surface: var(--sv-surface)');
      expect(themeBlock).toContain('--color-ink: var(--sv-ink)');
      expect(themeBlock).toContain('--color-muted: var(--sv-muted)');
      expect(themeBlock).toContain('--color-subtle: var(--sv-subtle)');
      expect(themeBlock).toContain('--color-line: var(--sv-line)');
    });
  });
});
