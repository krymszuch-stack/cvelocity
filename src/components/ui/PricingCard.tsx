import React from 'react';
import { Check, Minus } from 'lucide-react';
import { Button } from './Button';

export interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  description?: string;
  features: string[];
  excluded?: string[];
  isPopular?: boolean;
  ctaLabel?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period,
  description,
  features,
  excluded = [],
  isPopular = false,
  ctaLabel = 'Odblokuj',
  disabled = false,
  onSelect,
}) => {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
        isPopular
          ? 'border-brand-600 bg-surface shadow-raised ring-1 ring-brand-600'
          : 'border-line bg-elevated hover:-translate-y-0.5 hover:shadow-raised'
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
          Najczęściej wybierany
        </span>
      )}

      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 text-xs text-muted leading-relaxed">{description}</p>}

      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-mono text-3xl font-bold tracking-tight text-ink">
          {price}
        </span>
        <span className="text-xs text-subtle">{period}</span>
      </div>

      <ul className="mt-5 flex flex-col gap-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-ink">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-fg" />
            <span>{f}</span>
          </li>
        ))}
        {excluded.map((e, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-subtle">
            <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{e}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isPopular ? 'primary' : 'secondary'}
        className="mt-6 w-full"
        onClick={onSelect}
        disabled={disabled}
        aria-label={`${ctaLabel}: ${title}, ${price} ${period}`}
      >
        {disabled ? 'Twój obecny plan' : ctaLabel}
      </Button>
    </div>
  );
};
