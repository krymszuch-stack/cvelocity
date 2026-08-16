import React from 'react';
import { Sparkles } from 'lucide-react';

export interface PremiumBadgeProps {
  children?: React.ReactNode;
  /** `chip` is the smaller variant meant to sit inside a button or card header. */
  size?: 'badge' | 'chip';
  icon?: boolean;
  className?: string;
}

/**
 * Gradient-filled marker for Pro-only features. Uses the canonical brand gradient
 * plus the violet glow, so it reads as the single "premium" signal across the app.
 */
export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  children = 'Pro',
  size = 'badge',
  icon = true,
  className = '',
}) => {
  const sizeStyles =
    size === 'chip'
      ? 'gap-1.5 px-2.5 py-1 text-[10.5px]'
      : 'gap-1.5 px-2 py-[3px] text-[11px]';

  return (
    <span
      className={`bg-brand-grad shadow-brand-glow inline-flex items-center whitespace-nowrap rounded-full font-bold leading-snug text-on-brand ${sizeStyles} ${className}`}
    >
      {icon && <Sparkles className={size === 'chip' ? 'h-[11px] w-[11px]' : 'h-3 w-3'} />}
      {children}
    </span>
  );
};
