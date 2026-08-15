import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Circle, LucideIcon } from 'lucide-react';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'brand';

const VARIANT_STYLES: Record<StatusBadgeVariant, string> = {
  success: 'bg-success-soft text-success-fg border-success/30',
  warning: 'bg-warning-soft text-warning-fg border-warning/30',
  danger: 'bg-danger-soft text-danger-fg border-danger/30',
  neutral: 'bg-elevated text-muted border-line',
  brand: 'bg-brand-50 text-brand-fg border-brand-200',
};

const VARIANT_ICONS: Record<StatusBadgeVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  neutral: Circle,
  brand: CheckCircle2,
};

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, children, className = '', showIcon = true }) => {
  const Icon = VARIANT_ICONS[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${VARIANT_STYLES[variant]} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </span>
  );
};
