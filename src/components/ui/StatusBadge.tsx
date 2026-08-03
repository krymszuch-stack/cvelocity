import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Circle, LucideIcon } from 'lucide-react';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'brand';

const VARIANT_STYLES: Record<StatusBadgeVariant, string> = {
  success: 'bg-success-soft text-success-fg border-success-500/25',
  warning: 'bg-warning-soft text-warning-fg border-warning-500/25',
  danger: 'bg-danger-soft text-danger-fg border-danger-500/25',
  brand: 'bg-brand-soft text-brand-fg border-brand-500/25',
  neutral: 'bg-sunken text-muted border-line',
};

const VARIANT_ICONS: Record<StatusBadgeVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  brand: Circle,
  neutral: Circle,
};

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  children,
  className = '',
  showIcon = true,
  size = 'md',
}) => {
  const Icon = VARIANT_ICONS[variant];
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${sizing} ${VARIANT_STYLES[variant]} ${className}`}
    >
      {showIcon && <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0`} />}
      {children}
    </span>
  );
};

/** Neutral, icon-less chip for keywords, skills and tags. */
export const Chip: React.FC<{
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: StatusBadgeVariant;
  className?: string;
}> = ({ children, onRemove, variant = 'neutral', className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 pl-2.5 ${onRemove ? 'pr-1' : 'pr-2.5'} py-1
                rounded-lg border text-xs font-medium ${VARIANT_STYLES[variant]} ${className}`}
  >
    {children}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="w-4 h-4 rounded flex items-center justify-center hover:bg-ink/10 transition-colors"
        aria-label="Usuń"
      >
        <XCircle className="w-3 h-3" />
      </button>
    )}
  </span>
);
