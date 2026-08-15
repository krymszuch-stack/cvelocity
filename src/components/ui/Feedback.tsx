import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  LucideIcon,
} from 'lucide-react';

export interface AlertProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon: CustomIcon,
  className = '',
}) => {
  const variantConfig = {
    success: {
      Icon: CheckCircle2,
      container: 'border-success/30 bg-success-soft text-success-fg',
      iconColor: 'text-success-fg',
    },
    warning: {
      Icon: AlertTriangle,
      container: 'border-warning/30 bg-warning-soft text-warning-fg',
      iconColor: 'text-warning-fg',
    },
    danger: {
      Icon: AlertCircle,
      container: 'border-danger/30 bg-danger-soft text-danger-fg',
      iconColor: 'text-danger-fg',
    },
    info: {
      Icon: Info,
      container: 'border-brand-200 bg-brand-50 text-brand-fg',
      iconColor: 'text-brand-600',
    },
  };

  const config = variantConfig[variant];
  const IconComponent = CustomIcon || config.Icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed ${config.container} ${className}`}
    >
      <IconComponent className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconColor}`} />
      <div className="flex-1">
        {title && <div className="mb-0.5 font-bold">{title}</div>}
        <div className="opacity-95">{children}</div>
      </div>
    </div>
  );
};
