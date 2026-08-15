import React, { useRef } from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  children,
  onClick,
  ...props
}) => {
  const rippleRef = useRef<HTMLSpanElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const button = e.currentTarget;
    const ripple = rippleRef.current;
    if (ripple) {
      ripple.classList.remove('animate-ripple');
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      void ripple.offsetWidth;
      ripple.classList.add('animate-ripple');
    }
    onClick?.(e);
  };

  const variantStyles = {
    primary:
      'bg-brand-600 text-white shadow-raised hover:bg-brand-700 border border-transparent disabled:opacity-50',
    secondary:
      'border border-line bg-elevated text-ink hover:border-brand-200 hover:bg-brand-50 hover:text-brand-fg disabled:opacity-50',
    ghost:
      'border border-transparent text-muted hover:bg-surface hover:text-ink disabled:opacity-50',
    outline:
      'border border-line text-ink hover:border-brand-200 hover:bg-surface disabled:opacity-50',
    danger:
      'border border-danger/30 bg-danger-soft text-danger-fg hover:bg-danger-soft/80 disabled:opacity-50',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg font-medium',
    md: 'px-3.5 py-2 text-xs font-semibold gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-sm font-semibold gap-2.5 rounded-xl',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-4.5 w-4.5',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
      disabled={isDisabled}
      onClick={handleClick}
      className={`relative overflow-hidden inline-flex items-center justify-center transition-colors focus-visible:outline-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${iconSizes[size]}`} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className={iconSizes[size]} />
      )}

      {children && <span>{children}</span>}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={iconSizes[size]} />
      )}

      {/* Ripple wave span */}
      <span
        ref={rippleRef}
        className="pointer-events-none absolute h-6 w-6 rounded-full bg-white/25"
        style={{ transform: 'translate(-50%, -50%) scale(0)' }}
      />
    </motion.button>
  );
};
