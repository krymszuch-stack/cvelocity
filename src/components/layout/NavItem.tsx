import React from 'react';
import { Lock, LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

export interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: string;
  badgeVariant?: 'brand' | 'success' | 'warning';
  /**
   * Pozycja widoczna, ale jeszcze niedostępna. `lockedReason` mówi, co ją
   * odblokuje — bez tego wyszarzony przycisk jest tylko frustracją.
   */
  isLocked?: boolean;
  lockedReason?: string;
  /** Podpowiedź przy rozwiniętym pasku. Krótkie „co tu robię". */
  hint?: string;
  onClick?: () => void;
  className?: string;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  isActive = false,
  isCollapsed = false,
  badge,
  badgeVariant = 'brand',
  isLocked = false,
  lockedReason,
  hint,
  onClick,
  className = '',
}) => {
  const badgeStyles = {
    brand: 'bg-brand-50 text-brand-fg border-brand-200',
    success: 'bg-success-soft text-success-fg border-success/30',
    warning: 'bg-warning-soft text-warning-fg border-warning/30',
  };

  // Zablokowana pozycja zostaje przyciskiem, a nie zmienia się w `div`:
  // czytnik ekranu ma ją ogłosić razem z powodem, zamiast pominąć jak dekorację.
  const title = isLocked ? lockedReason : isCollapsed ? label : hint;

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
        isCollapsed ? 'justify-center px-2' : ''
      } ${
        isLocked
          ? 'cursor-not-allowed text-muted'
          : isActive
            ? 'text-brand-fg font-bold'
            : 'text-muted hover:bg-brand-500/5 hover:text-ink'
      } ${className}`}
      title={title}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={isLocked || undefined}
    >
      {/* Active Indicator & Background with Framer Motion layoutId */}
      {isActive && !isLocked && (
        <motion.div
          layoutId="activeNav"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute inset-0 rounded-xl border-l-2 border-brand-600 bg-brand-500/10 shadow-xs"
        />
      )}

      {/* Icon */}
      <span className="relative z-10 flex shrink-0 items-center justify-center">
        <Icon
          className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
            isActive ? 'text-brand-600' : 'text-subtle group-hover:text-ink'
          }`}
        />
      </span>

      {/* Label & Badge */}
      {!isCollapsed && (
        <div className="relative z-10 flex min-w-0 flex-1 items-center justify-between">
          <span className="truncate">{label}</span>
          {isLocked && <Lock className="ml-2 h-3 w-3 shrink-0 text-subtle" aria-hidden="true" />}
          {!isLocked && badge && (
            <span
              className={`ml-2 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                badgeStyles[badgeVariant]
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </button>
  );
};
