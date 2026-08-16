import React from 'react';

export interface TrustChipProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Small monospace marker for payment/security signals shown near a checkout CTA
 * (VISA, Blik, SSL…). Deliberately low-contrast — it reassures without competing
 * with the price or the button.
 */
export const TrustChip: React.FC<TrustChipProps> = ({ children, className = '' }) => (
  <span
    className={`rounded-[5px] border border-line bg-sunken px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.05em] text-subtle ${className}`}
  >
    {children}
  </span>
);

export const TrustRow: React.FC<{ items: string[]; className?: string }> = ({
  items,
  className = '',
}) => (
  <div className={`flex flex-wrap gap-1.5 ${className}`}>
    {items.map((item) => (
      <TrustChip key={item}>{item}</TrustChip>
    ))}
  </div>
);
