import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'success'
  | 'warning';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  // Gradient + inset highlight gives the primary action real depth on both themes.
  primary:
    'bg-gradient-to-b from-brand-500 to-brand-600 text-white border border-brand-600 ' +
    'shadow-sm hover:from-brand-400 hover:to-brand-500 hover:shadow-md ' +
    'shadow-brand-600/25 hover:-translate-y-px',
  secondary:
    'bg-raised text-ink border border-line hover:border-line-strong hover:bg-sunken shadow-xs hover:shadow-sm',
  outline:
    'bg-transparent text-brand-fg border border-brand-500/40 hover:bg-brand-soft hover:border-brand-500/70',
  ghost:
    'bg-transparent text-muted border border-transparent hover:bg-sunken hover:text-ink',
  danger:
    'bg-gradient-to-b from-danger-500 to-danger-600 text-white border border-danger-600 shadow-sm shadow-danger-600/25 hover:-translate-y-px hover:shadow-md',
  success:
    'bg-gradient-to-b from-success-500 to-success-600 text-white border border-success-600 shadow-sm shadow-success-600/25 hover:-translate-y-px hover:shadow-md',
  warning:
    'bg-warning-soft text-warning-fg border border-warning-500/35 hover:border-warning-500/60',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] gap-1.5 rounded-lg',
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-[10px]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[11px]',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl',
};

const ICON_SIZES: Record<ButtonSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-[18px] h-[18px]',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...rest
}) => {
  const iconClass = ICON_SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        'transition-all duration-150 ease-out active:translate-y-0 active:scale-[0.98]',
        'disabled:opacity-45 disabled:pointer-events-none disabled:shadow-none',
        SIZES[size],
        VARIANTS[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className={`${iconClass} animate-spin shrink-0`} />
      ) : (
        Icon && <Icon className={`${iconClass} shrink-0`} />
      )}
      {children}
      {IconRight && !loading && <IconRight className={`${iconClass} shrink-0`} />}
    </button>
  );
};

/** Square icon-only button. Always pass `title` — it is the only label a screen reader gets. */
export const IconButton: React.FC<
  Omit<ButtonProps, 'iconRight' | 'fullWidth' | 'children'> & { icon: LucideIcon; title: string }
> = ({ variant = 'ghost', size = 'md', icon: Icon, className = '', title, loading, ...rest }) => {
  const box = { xs: 'w-7 h-7', sm: 'w-9 h-9', md: 'w-10 h-10', lg: 'w-12 h-12' }[size];
  return (
    <button
      title={title}
      aria-label={title}
      className={[
        'inline-flex items-center justify-center rounded-[10px] shrink-0',
        'transition-all duration-150 active:scale-90',
        'disabled:opacity-45 disabled:pointer-events-none',
        box,
        VARIANTS[variant],
        className,
      ].join(' ')}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <Loader2 className={`${ICON_SIZES[size]} animate-spin`} />
      ) : (
        <Icon className={ICON_SIZES[size]} />
      )}
    </button>
  );
};
