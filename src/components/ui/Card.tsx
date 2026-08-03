import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `raised` lifts off the canvas, `flat` sits in it, `glass` frosts what's behind. */
  tone?: 'raised' | 'flat' | 'glass';
  padded?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  tone = 'raised',
  padded = true,
  interactive = false,
  className = '',
  children,
  ...rest
}) => {
  const tones = {
    raised: 'bg-surface border border-line shadow-sm',
    flat: 'bg-sunken border border-line',
    glass: 'sv-glass border border-line shadow-md',
  };
  return (
    <div
      className={[
        'rounded-card',
        tones[tone],
        padded ? 'p-5' : '',
        interactive
          ? 'transition-all duration-200 hover:shadow-md hover:border-line-strong hover:-translate-y-0.5 cursor-pointer'
          : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Tints the icon chip to signal the section's semantic role. */
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

const ACCENTS = {
  brand: 'bg-brand-soft text-brand-fg',
  success: 'bg-success-soft text-success-fg',
  warning: 'bg-warning-soft text-warning-fg',
  danger: 'bg-danger-soft text-danger-fg',
  neutral: 'bg-sunken text-muted',
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  actions,
  accent = 'brand',
  className = '',
}) => (
  <div className={`flex items-start justify-between gap-4 ${className}`}>
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${ACCENTS[accent]}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold text-ink leading-tight truncate">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

/** Page-level title block. Sits above the content grid, not inside a Card. */
export const PageHeader: React.FC<{
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ icon: Icon, title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
    <div className="flex items-center gap-3.5 min-w-0">
      {Icon && (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-md shadow-brand-600/25">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight truncate">{title}</h1>
        {description && <p className="text-sm text-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
