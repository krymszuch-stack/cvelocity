import React from 'react';

export interface ChipProps {
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  variant = 'neutral',
  size = 'sm',
  className = '',
  title,
  onClick,
  children,
}) => {
  const variantStyles = {
    brand: 'border-brand-200 bg-brand-50 text-brand-fg',
    neutral: 'border-line bg-sunken text-muted',
    success: 'border-success/30 bg-success-soft text-success-fg',
    warning: 'border-warning/30 bg-warning-soft text-warning-fg',
    danger: 'border-danger/30 bg-danger-soft text-danger-fg',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] rounded-md',
    md: 'px-2.5 py-1 text-xs rounded-lg',
  };

  const interactiveStyles = onClick
    ? 'cursor-pointer hover:border-brand-500 transition-colors'
    : '';

  return (
    <span
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1 border font-mono font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${interactiveStyles} ${className}`}
    >
      {children}
    </span>
  );
};
