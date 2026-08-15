import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { IconMoon, IconSun } from './ui/icons/ModernIcons';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('cvelocity-theme');
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
      localStorage.setItem('cvelocity-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
      localStorage.setItem('cvelocity-theme', 'light');
    }
  }, [isDark]);

  // Listen for system theme changes if user hasn't explicitly set preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('cvelocity-theme');
      if (!stored) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-elevated text-ink transition-colors hover:bg-brand-50 hover:text-brand-fg focus-visible:outline-none ${className}`}
      aria-label={`Przełącz motyw na ${isDark ? 'jasny' : 'ciemny'}`}
      title={`Przełącz motyw na ${isDark ? 'jasny' : 'ciemny'}`}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <IconSun className="h-4 w-4 text-warning-fg" />
        ) : (
          <IconMoon className="h-4 w-4 text-brand-600" />
        )}
      </motion.div>
    </motion.button>
  );
}
