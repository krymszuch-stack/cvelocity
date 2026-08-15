import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: string | number;
  badgeVariant?: 'brand' | 'success' | 'warning';
  onClick?: () => void;
  className?: string;
}

export function SidebarItem({
  icon: Icon,
  label,
  isActive = false,
  isCollapsed = false,
  badge,
  badgeVariant = 'brand',
  onClick,
  className = '',
}: SidebarItemProps) {
  const badgeStyles = {
    brand: 'bg-brand-500/15 text-brand-fg border-brand-200',
    success: 'bg-success-soft text-success-fg border-success/30',
    warning: 'bg-warning-soft text-warning-fg border-warning/30',
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      title={isCollapsed ? label : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none ${
        isActive
          ? 'border-brand-200 bg-brand-50 text-brand-fg shadow-sm'
          : 'border-transparent text-muted hover:border-line hover:bg-surface hover:text-ink'
      } ${isCollapsed ? 'justify-center px-2' : ''} ${className}`}
    >
      <motion.div
        whileHover={{ scale: 1.15 }}
        transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
        className="flex shrink-0 items-center justify-center"
      >
        <Icon
          className={`h-4 w-4 transition-colors duration-200 ${
            isActive
              ? 'text-brand-600'
              : 'text-muted group-hover:text-brand-500'
          }`}
          aria-hidden="true"
        />
      </motion.div>

      {!isCollapsed && (
        <span className="flex-1 truncate text-left text-[13px]">{label}</span>
      )}

      {!isCollapsed && badge !== undefined && (
        <span
          className={`ml-auto flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${badgeStyles[badgeVariant]}`}
        >
          {badge}
        </span>
      )}

      {/* Collapsed Tooltip Indicator */}
      {isCollapsed && (
        <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md border border-line bg-elevated px-2.5 py-1 text-xs font-medium text-ink shadow-raised group-hover:block z-50 whitespace-nowrap">
          {label}
          {badge !== undefined && (
            <span className="ml-1.5 font-mono text-[10px] text-muted">
              ({badge})
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}
