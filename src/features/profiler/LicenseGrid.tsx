import React, { useState } from 'react';
import {
  Car,
  HardHat,
  Zap,
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  Sliders,
  Flame,
  Network,
  Truck,
  Check,
  Wind,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ALL_LICENSES, LICENSE_CATEGORIES } from '../../data/licenses';

/**
 * Ikony rozwiązywane po nazwie z katalogu (`src/data/licenses.ts`).
 *
 * Sam katalog jest modułem danych i nie wciąga `lucide-react` — dzięki temu
 * silnik knock-outów może z niego korzystać po stronie logiki, bez zależności
 * od warstwy widoku.
 */
const LICENSE_ICONS: Record<string, React.ElementType> = {
  Car,
  Truck,
  HardHat,
  Zap,
  Flame,
  ShieldCheck,
  Award,
  Sparkles,
  Network,
  Wind,
  Sliders,
};

export interface LicenseGridProps {
  selectedLicenses: string[];
  onToggleLicense: (id: string) => void;
  className?: string;
}

export const LicenseGrid: React.FC<LicenseGridProps> = ({
  selectedLicenses,
  onToggleLicense,
  className = '',
}) => {
  const [isDense, setIsDense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');

  const categories = ['Wszystkie', ...LICENSE_CATEGORIES];

  const filteredLicenses = selectedCategory === 'Wszystkie'
    ? ALL_LICENSES
    : ALL_LICENSES.filter((l) => l.category === selectedCategory);

  return (
    <Card tone="raised" className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3">
        <div>
          <h3 className="text-base font-bold text-ink">Uprawnienia Formalne i Kwalifikacje</h3>
          <p className="text-xs text-muted">
            Twarde kryteria selekcyjne (Must-have dla wielu ogłoszeń technicznych i logistycznych).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDense(!isDense)}
            className="text-xs"
          >
            {isDense ? 'Widok standardowy' : 'Widok zwarty'}
          </Button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-brand-600 text-on-brand'
                : 'border border-line bg-surface text-muted hover:text-ink'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* License Grid */}
      <div
        className={`grid gap-2.5 ${
          isDense
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {filteredLicenses.map((lic) => {
          const isSelected = selectedLicenses.includes(lic.id);
          const Icon = LICENSE_ICONS[lic.iconName] ?? ShieldCheck;

          return (
            <motion.button
              key={lic.id}
              type="button"
              onClick={() => onToggleLicense(lic.id)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none ${
                isSelected
                  ? 'border-brand-200 bg-brand-50 text-brand-fg shadow-raised ring-2 ring-brand-500/20'
                  : 'border-line bg-surface text-muted hover:border-brand-200/60 hover:text-ink'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isSelected ? 'bg-brand-600 text-on-brand' : 'bg-sunken text-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold leading-tight text-ink">
                  {lic.label}
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {lic.category}
                </span>
              </div>

              {isSelected && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-on-brand">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
};
