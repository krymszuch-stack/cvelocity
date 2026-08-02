import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Circle, LucideIcon } from 'lucide-react';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

const VARIANT_STYLES: Record<StatusBadgeVariant, string> = {
  success: 'bg-success-50 text-success-700 border-success-500/30',
  warning: 'bg-warning-50 text-warning-700 border-warning-500/30',
  danger: 'bg-danger-50 text-danger-700 border-danger-500/30',
  neutral: 'bg-slate-100 text-slate-700 border-slate-300',
};

const VARIANT_ICONS: Record<StatusBadgeVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  neutral: Circle,
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
