import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  CornerDownLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../providers/ThemeProvider';
import { NavTabId } from './GlobalShell';

import {
  IconHome,
  IconMatcher,
  IconApplications,
  IconVault,
  IconParser,
  IconProfiler,
  IconPricing,
  IconSparkles,
  IconZap,
  IconPalette,
  IconSun,
  IconMoon,
} from './ui/icons/ModernIcons';

interface CommandItem {
  id: string;
  label: string;
  category: 'Nawigacja' | 'Narzędzia' | 'Ustawienia';
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    setActiveTab,
    setAdvisorOpen,
    setTokenModalOpen,
    setDesignTokensOpen,
  } = useAppStore();

  const { theme, setTheme } = useTheme();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'nav-home',
      label: 'Przejdź do: Strona Główna (Blog Karierowy)',
      category: 'Nawigacja',
      icon: IconHome,
      action: () => setActiveTab('home'),
    },
    {
      id: 'nav-matcher',
      label: 'Przejdź do: Agregator Ofert & Dopasowanie ATS',
      category: 'Nawigacja',
      icon: IconMatcher,
      action: () => setActiveTab('matcher'),
    },
    {
      id: 'nav-tracker',
      label: 'Przejdź do: Pipeline Aplikacji (CRM)',
      category: 'Nawigacja',
      icon: IconApplications,
      action: () => setActiveTab('applications'),
    },
    {
      id: 'nav-vault',
      label: 'Przejdź do: Master Vault (Profil & Doświadczenie)',
      category: 'Nawigacja',
      icon: IconVault,
      action: () => setActiveTab('vault'),
    },
    {
      id: 'nav-parser',
      label: 'Przejdź do: Wczytaj i Scal CV (Parser & Diff)',
      category: 'Nawigacja',
      icon: IconParser,
      action: () => setActiveTab('parser'),
    },
    {
      id: 'nav-profiler',
      label: 'Przejdź do: Filtry, Uprawnienia & Dealbreakery',
      category: 'Nawigacja',
      icon: IconProfiler,
      action: () => setActiveTab('profiler'),
    },
    {
      id: 'nav-pricing',
      label: 'Przejdź do: Cennik & Pakiety Pro',
      category: 'Nawigacja',
      icon: IconPricing,
      action: () => setActiveTab('pricing'),
    },
    {
      id: 'act-advisor',
      label: 'Otwórz Okienko Doradcy AI (Gemini Advisor)',
      category: 'Narzędzia',
      icon: IconSparkles,
      action: () => setAdvisorOpen(true),
    },
    {
      id: 'act-stats',
      label: 'Pokaż Telemetrię i Zaoszczędzone Tokeny AI',
      category: 'Narzędzia',
      icon: IconZap,
      action: () => setTokenModalOpen(true),
    },
    {
      id: 'act-tokens',
      label: 'Pokaż Paletę Tokenów Design System',
      category: 'Narzędzia',
      icon: IconPalette,
      action: () => setDesignTokensOpen(true),
    },
    {
      id: 'act-theme',
      label: `Przełącz Motyw (Aktualny: ${theme === 'dark' ? 'Ciemny' : 'Jasny'})`,
      category: 'Ustawienia',
      icon: theme === 'dark' ? IconSun : IconMoon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleExecute = (item: CommandItem) => {
    item.action();
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleExecute(filtered[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-floating"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search className="h-4 w-4 text-muted" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownList}
                placeholder="Wpisz polecenie lub szukaj modułu (np. matcher, vault, doradca)..."
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-subtle focus:outline-none"
              />
              <span className="rounded-md border border-line bg-sunken px-1.5 py-0.5 font-mono text-[10px] text-muted">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">
                  Nie znaleziono żadnych pasujących poleceń.
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleExecute(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none ${
                          isSelected
                            ? 'bg-brand-600 text-on-brand shadow-xs'
                            : 'text-ink hover:bg-elevated'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-on-brand' : 'text-muted'}`} />
                          <span className="truncate font-medium">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`rounded-md px-1.5 py-px font-mono text-[10px] uppercase ${
                              isSelected ? 'bg-on-brand/20 text-on-brand' : 'bg-sunken text-muted border border-line/60'
                            }`}
                          >
                            {item.category}
                          </span>
                          {isSelected && <CornerDownLeft className="h-3 w-3 text-on-brand/80" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="flex items-center justify-between border-t border-line/60 bg-sunken/50 px-4 py-2 text-[10px] text-muted font-mono">
              <div className="flex items-center gap-3">
                <span>↑↓ Nawigacja</span>
                <span>↵ Wybierz</span>
              </div>
              <span>Cmd+K / Ctrl+K</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
