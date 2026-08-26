import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/40 p-8 sm:p-12 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sunken text-muted mb-4 shadow-xs">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>

      <h4 className="text-sm font-bold text-ink sm:text-base">{title}</h4>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-muted leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
