import React from 'react';
import { LucideIcon, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

/** Shown when a list/panel has no data yet — always offers the next action. */
export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}>
    <div className="w-14 h-14 rounded-2xl bg-sunken border border-line flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-subtle" />
    </div>
    <h3 className="text-[15px] font-bold text-ink">{title}</h3>
    {description && (
      <p className="text-sm text-muted mt-1.5 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const ALERT_STYLES = {
  info: { wrap: 'bg-brand-soft border-brand-500/25 text-brand-fg', icon: Info },
  success: { wrap: 'bg-success-soft border-success-500/25 text-success-fg', icon: CheckCircle2 },
  warning: { wrap: 'bg-warning-soft border-warning-500/25 text-warning-fg', icon: AlertTriangle },
  danger: { wrap: 'bg-danger-soft border-danger-500/25 text-danger-fg', icon: XCircle },
};

export const Alert: React.FC<{
  variant?: keyof typeof ALERT_STYLES;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}> = ({ variant = 'info', title, children, className = '' }) => {
  const { wrap, icon: Icon } = ALERT_STYLES[variant];
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${wrap} ${className}`}>
      <Icon className="w-[18px] h-[18px] shrink-0 mt-px" />
      <div className="min-w-0 text-sm leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={title ? 'mt-1 opacity-90' : ''}>{children}</div>}
      </div>
    </div>
  );
};

/** Horizontal meter. Colour follows the value so a weak score reads as weak at a glance. */
export const ProgressBar: React.FC<{
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  tone?: 'auto' | 'brand';
  className?: string;
}> = ({ value, max = 100, label, showValue = true, tone = 'auto', className = '' }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    tone === 'brand'
      ? 'bg-brand-500'
      : pct >= 75
        ? 'bg-success-500'
        : pct >= 45
          ? 'bg-warning-500'
          : 'bg-danger-500';

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-semibold text-muted">{label}</span>}
          {showValue && (
            <span className="text-xs font-bold text-ink sv-tnum">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className="h-2 rounded-full bg-sunken overflow-hidden border border-line">
        <div
          className={`h-full rounded-full ${color} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

/** Circular score gauge for the headline ATS number. */
export const ScoreRing: React.FC<{
  value: number;
  size?: number;
  label?: string;
  className?: string;
}> = ({ value, size = 120, label, className = '' }) => {
  const pct = Math.max(0, Math.min(100, value));
  const stroke = size >= 100 ? 9 : 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const color = pct >= 75 ? 'var(--color-success-500)' : pct >= 45 ? 'var(--color-warning-500)' : 'var(--color-danger-500)';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sv-sunken)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-ink sv-tnum leading-none">{Math.round(pct)}</span>
        {label && <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider mt-1">{label}</span>}
      </div>
    </div>
  );
};

/** Compact KPI tile for stat rows. */
export const StatTile: React.FC<{
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
}> = ({ icon: Icon, label, value, hint, accent = 'neutral' }) => {
  const accents = {
    brand: 'text-brand-fg bg-brand-soft',
    success: 'text-success-fg bg-success-soft',
    warning: 'text-warning-fg bg-warning-soft',
    danger: 'text-danger-fg bg-danger-soft',
    neutral: 'text-muted bg-sunken',
  };
  return (
    <div className="bg-surface border border-line rounded-xl p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && (
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${accents[accent]}`}>
            <Icon className="w-3.5 h-3.5" />
          </span>
        )}
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wide truncate">{label}</span>
      </div>
      <div className="text-xl font-extrabold text-ink sv-tnum leading-none">{value}</div>
      {hint && <p className="text-[11px] text-subtle mt-1.5">{hint}</p>}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`sv-skeleton rounded-lg ${className}`} />
);
