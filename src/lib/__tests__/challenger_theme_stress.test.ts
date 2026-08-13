import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

describe('Challenger 1 Empirical Stress Test: Theme Resolution & Toggling Edge Cases', () => {
  let mockStorage: Record<string, string>;
  let mockAttributes: Record<string, string>;
  let mockMatchMediaMatches: boolean;

  beforeEach(() => {
    mockStorage = {};
    mockAttributes = {};
    mockMatchMediaMatches = false;

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
      matches: query.includes('light') ? mockMatchMediaMatches : !mockMatchMediaMatches,
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

  describe('Theme Storage Resolution Priority & Fallbacks', () => {
    it('1. prefers cvelocity_theme over legacy_theme_v1 when both are set', () => {
      mockStorage['cvelocity_theme'] = 'dark';
      mockStorage['legacy_theme_v1'] = 'light';

      let currentTheme: string | undefined;
      const Consumer = () => {
        const { theme } = useTheme();
        currentTheme = theme;
        return React.createElement('div', null, theme);
      };

      renderToString(React.createElement(ThemeProvider, null, React.createElement(Consumer)));
      expect(currentTheme).toBe('dark');
    });

    it('2. falls back to legacy_theme_v1 if cvelocity_theme is missing', () => {
      mockStorage['legacy_theme_v1'] = 'light';

      let currentTheme: string | undefined;
      const Consumer = () => {
        const { theme } = useTheme();
        currentTheme = theme;
        return React.createElement('div', null, theme);
      };

      renderToString(React.createElement(ThemeProvider, null, React.createElement(Consumer)));
      expect(currentTheme).toBe('light');
    });

    it('3. falls back to OS light theme preference when no storage key exists', () => {
      mockMatchMediaMatches = true; // prefers light mode

      let currentTheme: string | undefined;
      const Consumer = () => {
        const { theme } = useTheme();
        currentTheme = theme;
        return React.createElement('div', null, theme);
      };

      renderToString(React.createElement(ThemeProvider, null, React.createElement(Consumer)));
      expect(currentTheme).toBe('light');
    });

    it('4. falls back to OS dark theme preference when matchMedia matches false', () => {
      mockMatchMediaMatches = false; // prefers dark mode

      let currentTheme: string | undefined;
      const Consumer = () => {
        const { theme } = useTheme();
        currentTheme = theme;
        return React.createElement('div', null, theme);
      };

      renderToString(React.createElement(ThemeProvider, null, React.createElement(Consumer)));
      expect(currentTheme).toBe('dark');
    });

    it('5. ignores invalid storage values and falls back to OS preference', () => {
      mockStorage['cvelocity_theme'] = 'invalid_theme_value';
      mockMatchMediaMatches = true;

      let currentTheme: string | undefined;
      const Consumer = () => {
        const { theme } = useTheme();
        currentTheme = theme;
        return React.createElement('div', null, theme);
      };

      renderToString(React.createElement(ThemeProvider, null, React.createElement(Consumer)));
      expect(currentTheme).toBe('light');
    });
  });

  describe('Theme Storage Persistence & Attribute Integration', () => {
    it('6. setTheme updates cvelocity_theme in localStorage directly', () => {
      let setThemeFn: ((theme: 'light' | 'dark') => void) | undefined;
      let currentTheme: string | undefined;

      const Consumer = () => {
        const { theme, setTheme } = useTheme();
        currentTheme = theme;
        setThemeFn = setTheme;
        return React.createElement('div', null, theme);
      };

      mockStorage['cvelocity_theme'] = 'dark';
      renderToString(React.createElement(ThemeProvider, null, React.createElement(Consumer)));

      expect(currentTheme).toBe('dark');

      setThemeFn!('light');
      expect(mockStorage['cvelocity_theme']).toBe('light');
    });

    it('7. toggleTheme is a valid function provided by ThemeContext', () => {
      let toggleThemeFn: (() => void) | undefined;
      let currentTheme: string | undefined;

      const Consumer = () => {
        const { theme, toggleTheme } = useTheme();
        currentTheme = theme;
        toggleThemeFn = toggleTheme;
        return React.createElement('div', null, theme);
      };

      mockStorage['cvelocity_theme'] = 'dark';
      renderToString(React.createElement(ThemeProvider, null, React.createElement(Consumer)));

      expect(currentTheme).toBe('dark');
      expect(typeof toggleThemeFn).toBe('function');
    });
  });

  describe('ThemeToggle UI Representation & Icon Transits', () => {
    it('8. renders ThemeToggle in dark mode with dark styling, title, aria-label, translateX(24px) and Moon opacity 1', () => {
      mockStorage['cvelocity_theme'] = 'dark';
      const html = renderToString(React.createElement(ThemeProvider, null, React.createElement(ThemeToggle)));

      expect(html).toContain('title="Przełącz na jasny motyw"');
      expect(html).toContain('aria-label="Przełącz na jasny motyw"');
      expect(html).toContain('transform:translateX(24px)');
      expect(html).toContain('opacity:0'); // Sun opacity
      expect(html).toContain('opacity:1'); // Moon opacity
    });

    it('9. renders ThemeToggle in light mode with light styling, title, aria-label, translateX(0) and Sun opacity 1', () => {
      mockStorage['cvelocity_theme'] = 'light';
      const html = renderToString(React.createElement(ThemeProvider, null, React.createElement(ThemeToggle)));

      expect(html).toContain('title="Przełącz na ciemny motyw"');
      expect(html).toContain('aria-label="Przełącz na ciemny motyw"');
      expect(html).toContain('transform:translateX(0)');
      expect(html).toContain('opacity:1'); // Sun opacity
      expect(html).toContain('opacity:0'); // Moon opacity
    });
  });
});
