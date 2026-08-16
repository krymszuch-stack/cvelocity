import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
}

export interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  layout?: 'grid' | 'stack';
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  options,
  layout = 'grid',
  className = '',
}) => {
  const containerClasses =
    layout === 'grid'
      ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'
      : 'flex flex-col gap-2.5';

  return (
    <div
      role="radiogroup"
      className={`${containerClasses} ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <motion.div
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onChange(opt.value);
              }
            }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
            className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              isSelected
                ? 'border-brand-200 bg-brand-50 text-brand-fg shadow-xs'
                : 'border-line bg-surface text-ink hover:border-brand-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-bold text-ink">{opt.label}</div>
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-on-brand'
                    : 'border-line bg-surface text-transparent'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
            </div>

            {opt.description && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                {opt.description}
              </p>
            )}

            {opt.badge && (
              <div className="mt-2">
                <span className="rounded-md border border-line bg-elevated px-2 py-0.5 font-mono text-[9px] font-bold text-subtle">
                  {opt.badge}
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
