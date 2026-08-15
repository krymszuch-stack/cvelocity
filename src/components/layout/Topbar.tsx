import React from 'react';
import {
  Menu,
  Zap,
  Palette,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeToggle } from '../ThemeToggle';
import { AdvisorButton } from '../ui/AdvisorButton';
import { TokenStats } from '../../types';
import { NavTabId } from '../GlobalShell';

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

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
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

        {/* Profile / Auth Button */}
        <motion.button
          type="button"
          onClick={onOpenAuthModal}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-brand-500/30 hover:bg-brand-500/5 focus-visible:outline-none"
          title={isAuthenticated ? userEmail : 'Zaloguj się'}
        >
          {isAuthenticated ? (
            <>
              <ShieldCheck className="h-4 w-4 text-success-fg" />
              <span className="hidden sm:inline font-mono text-[11px] truncate max-w-[100px]">
                {userEmail?.split('@')[0]}
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
    </header>
  );
};
