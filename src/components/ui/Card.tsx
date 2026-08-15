import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'flat' | 'raised' | 'sunken' | 'elevated' | 'surface';
  tone?: 'flat' | 'raised' | 'sunken';
  hoverEffect?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant,
  tone = 'raised',
  hoverEffect = true,
  className = '',
  children,
  ...props
}) => {
  const resolvedTone = variant === 'flat' || variant === 'surface'
    ? 'flat'
    : variant === 'sunken'
    ? 'sunken'
    : tone;

  const toneStyles = {
    flat: 'bg-surface border-line',
    raised: 'bg-elevated border-line shadow-raised',
    sunken: 'bg-sunken border-line/80',
  };

  const hoverStyles = hoverEffect && resolvedTone === 'raised'
    ? 'hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-200'
    : hoverEffect
    ? 'hover:border-brand-500/30 transition-all duration-200'
    : '';

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, scale: 1.005 } : undefined}
      transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
      className={`rounded-2xl border p-5 ${toneStyles[resolvedTone]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
