import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/** Sliding sun/moon switch — the icons cross-fade so the swap reads as one motion. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'}
      aria-label={isDark ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'}
      className={`relative w-[52px] h-7 rounded-full bg-sunken border border-line
                  hover:border-line-strong transition-colors shrink-0 ${className}`}
    >
      <span
        className="absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full bg-surface
                   border border-line shadow-sm transition-transform duration-300
                   flex items-center justify-center"
        style={{ transform: isDark ? 'translateX(24px)' : 'translateX(0)' }}
      >
        <Sun
          className="w-3.5 h-3.5 text-warning-500 absolute transition-opacity duration-200"
          style={{ opacity: isDark ? 0 : 1 }}
        />
        <Moon
          className="w-3.5 h-3.5 text-brand-400 absolute transition-opacity duration-200"
          style={{ opacity: isDark ? 1 : 0 }}
        />
      </span>
    </button>
  );
};
