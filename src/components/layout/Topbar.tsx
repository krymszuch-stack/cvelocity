import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Zap,
  Palette,
  User,
  ShieldCheck,
  Sparkles,
  Search,
  CreditCard,
  FileText,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from '../ThemeToggle';
import { AdvisorButton } from '../ui/AdvisorButton';
import { TokenStats } from '../../types';
import { NavTabId } from '../GlobalShell';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuth } from '../../context/AuthContext';

export interface TopbarProps {
  activeTab: NavTabId;
  onOpenMobileMenu: () => void;
  onOpenAdvisor: () => void;
  onOpenTokenStats: () => void;
  onOpenAuthModal: () => void;
  onOpenDesignTokens?: () => void;
  tokenStats?: TokenStats;
  isAuthenticated?: boolean;
  userEmail?: string;
  className?: string;
}

const TAB_NAMES: Record<NavTabId, string> = {
  home: 'Strona Główna',
  matcher: 'Agregator Ofert & ATS Simulator',
  applications: 'Pipeline Aplikacji',
  vault: 'Master Vault • Profil Kandydata',
  parser: 'Wczytywanie & Scalanie CV',
  profiler: 'Filtry i Priorytety',
  pricing: 'Cennik & Pakiety',
};

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenAdvisor,
  onOpenTokenStats,
  onOpenAuthModal,
  onOpenDesignTokens,
  tokenStats,
  isAuthenticated = false,
  userEmail,
  className = '',
}) => {
  const { subscription } = useAuthStore();
  const { logout, user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPro = subscription.status === 'active' || subscription.status === 'trialing';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCustomerPortal = () => {
    alert('Otwieranie bezpiecznego panelu klienta Stripe Customer Portal (zarządzanie subskrypcją i faktury)...');
    setIsDropdownOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-line bg-surface/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8 ${className}`}
    >
      {/* Left: Mobile Toggle & Section Name */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Otwórz menu nawigacji"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-elevated text-muted hover:bg-brand-50 hover:text-ink lg:hidden focus-visible:outline-none"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-line bg-elevated px-2.5 py-1 font-mono text-xs font-semibold text-ink">
            {TAB_NAMES[activeTab] || 'CVELOCITY'}
          </span>
        </div>
      </div>

      {/* Right: Actions matching prototyp-monetyzacji.html */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Search Hint (Cmd+K trigger) */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }));
          }}
          className="hidden sm:flex items-center gap-2 rounded-xl border border-line bg-elevated px-2.5 py-1.5 text-xs text-muted hover:border-line-strong hover:text-ink transition-colors"
          title="Otwórz Command Palette (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Szukaj...</span>
          <span className="rounded border border-line bg-sunken px-1.5 py-0.2 font-mono text-[9px] text-muted">
            Ctrl+K
          </span>
        </button>

        {/* Token Savings Mini Card */}
        {tokenStats && (
          <motion.button
            type="button"
            onClick={onOpenTokenStats}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-xs hover:border-brand-500/30 hover:bg-brand-500/5"
            aria-label="Statystyki optymalizacji tokenów"
            title="Kliknij, aby otworzyć statystyki tokenów"
          >
            <Zap className="h-3.5 w-3.5 text-brand-600" />
            <span className="hidden md:inline text-muted text-[11px]">Tokeny:</span>
            <span className="font-mono font-bold text-success-fg">
              {tokenStats.totalTokensSaved.toLocaleString()}
            </span>
          </motion.button>
        )}

        {/* Advisor Button with Ping Indicator */}
        <AdvisorButton onClick={onOpenAdvisor} />

        {/* Design Tokens Showcase Button */}
        {onOpenDesignTokens && (
          <motion.button
            type="button"
            onClick={onOpenDesignTokens}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-elevated text-muted hover:text-brand-fg hover:bg-brand-50 focus-visible:outline-none"
            aria-label="Podgląd Tokenów Design System"
            title="Podgląd Tokenów Design System"
          >
            <Palette className="h-4 w-4" />
          </motion.button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Plan Pill & Profile Avatar matching prototyp-monetyzacji.html */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                isPro
                  ? 'bg-gradient-to-r from-brand-600 to-violet text-white shadow-xs'
                  : 'bg-sunken text-muted border border-line'
              }`}
            >
              {isPro ? 'Pro' : 'Free'}
            </span>

            <motion.button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  setIsDropdownOpen((prev) => !prev);
                } else {
                  onOpenAuthModal();
                }
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-brand-500/30 hover:bg-brand-500/5 focus-visible:outline-none"
              title={isAuthenticated ? userEmail : 'Zaloguj się'}
            >
              {isAuthenticated ? (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-fg">
                    {(user?.fullName || userEmail || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-mono text-[11px] truncate max-w-[90px]">
                    {user?.fullName?.split(' ')[0] || userEmail?.split('@')[0]}
                  </span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-muted" />
                  <span className="hidden sm:inline">Konto</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Profile & Stripe Customer Portal Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.16, ease: [0.19, 1, 0.22, 1] }}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-elevated p-1.5 shadow-floating z-50 text-xs"
              >
                <div className="border-b border-line/60 p-2.5">
                  <div className="font-bold text-ink truncate">{user?.fullName || 'Konto Użytkownika'}</div>
                  <div className="font-mono text-[10px] text-muted truncate">{userEmail}</div>
                  <div className="mt-1.5">
                    <span
                      className={`inline-block rounded-md px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                        isPro ? 'bg-brand-50 text-brand-fg border border-brand-200' : 'bg-sunken text-muted'
                      }`}
                    >
                      Plan: {isPro ? 'CVELOCITY Pro' : 'CVELOCITY Free'}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleOpenCustomerPortal}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-ink hover:bg-brand-50 hover:text-brand-fg transition-colors"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-muted" />
                    <span>Zarządzaj subskrypcją</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-subtle" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCustomerPortal}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-ink hover:bg-brand-50 hover:text-brand-fg transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted" />
                    <span>Faktury i rozliczenia</span>
                  </button>
                </div>

                <div className="border-t border-line/60 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-danger-fg hover:bg-danger-soft transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Wyloguj</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
