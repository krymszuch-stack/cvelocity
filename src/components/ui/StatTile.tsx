import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export interface StatTileProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
      className={`rounded-2xl border border-line bg-elevated p-4 sm:p-5 shadow-raised ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted truncate">
          {label}
        </span>
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-black text-ink tracking-tight">
          {value}
        </span>

        {trend && (
          <span
            className={`flex items-center gap-0.5 font-mono text-[11px] font-bold ${
              trend.isPositive ? 'text-success-fg' : 'text-danger-fg'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 font-mono text-[10px] text-subtle truncate">
          {subtext}
        </p>
      )}
    </motion.div>
  );
};
