import React from 'react';
import { Menu, BarChart3, LogIn, ChevronDown } from 'lucide-react';
import { AppTab, TokenStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NAV_ITEMS } from './Sidebar';

interface TopbarProps {
  activeTab: AppTab;
  tokenStats: TokenStats;
  onOpenTokenStats: () => void;
  onOpenAuthModal: () => void;
  onOpenMobileNav: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  tokenStats,
  onOpenTokenStats,
  onOpenAuthModal,
  onOpenMobileNav,
}) => {
  const { user, isAuthenticated } = useAuth();
  const current = NAV_ITEMS.find((i) => i.id === activeTab);

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 sv-glass border-b border-line">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Context: where the user is */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:bg-sunken hover:text-ink transition-colors shrink-0"
            aria-label="Otwórz menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {current && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-ink leading-tight truncate">{current.label}</h1>
              <p className="text-[11px] text-subtle truncate hidden sm:block">{current.description}</p>
            </div>
          )}
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenTokenStats}
            title="Statystyki oszczędności tokenów API"
            className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-[10px] bg-surface border border-line
                       hover:border-line-strong transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-brand-fg" />
            <span className="text-xs font-bold text-ink sv-tnum">
              {tokenStats.totalTokensSaved.toLocaleString('pl-PL')}
            </span>
            <span className="text-[10px] text-subtle font-semibold">tk</span>
          </button>

          <ThemeToggle />

          <button
            onClick={onOpenAuthModal}
            title={isAuthenticated ? 'Mój profil i bezpieczeństwo' : 'Zaloguj się do Vaulta'}
            className="flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-[10px] bg-surface border border-line
                       hover:border-line-strong transition-colors"
          >
            {isAuthenticated && user ? (
              <>
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white
                                 text-[11px] font-bold flex items-center justify-center shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-semibold text-ink hidden md:inline max-w-[110px] truncate">
                  {user.fullName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-subtle hidden md:inline" />
              </>
            ) : (
              <>
                <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                  <LogIn className="w-3.5 h-3.5 text-brand-fg" />
                </span>
                <span className="text-xs font-bold text-ink hidden sm:inline">Zaloguj</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
