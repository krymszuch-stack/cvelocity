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
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export interface LicenseItem {
  id: string;
  label: string;
  category: 'Kierowca' | 'Techniczne' | 'Sanitarne' | 'IT / Zarządzanie';
  icon: React.ElementType;
}

const ALL_LICENSES: LicenseItem[] = [
  { id: 'b_license', label: 'Prawo Jazdy Kat. B', category: 'Kierowca', icon: Car },
  { id: 'a_license', label: 'Prawo Jazdy Kat. A (Motocykl)', category: 'Kierowca', icon: Car },
  { id: 'c_license', label: 'Prawo Jazdy Kat. C / C+E', category: 'Kierowca', icon: Truck },
  { id: 'd_license', label: 'Prawo Jazdy Kat. D (Autobusy)', category: 'Kierowca', icon: Truck },
  { id: 'udt_forklift', label: 'Uprawnienia UDT (Wózki Widłowe)', category: 'Techniczne', icon: HardHat },
  { id: 'udt_crane', label: 'Uprawnienia UDT (Suwnice / Dźwigi)', category: 'Techniczne', icon: HardHat },
  { id: 'sep_1kv', label: 'Uprawnienia SEP (Grupa 1 do 1kV)', category: 'Techniczne', icon: Zap },
  { id: 'welding_tig_mig', label: 'Certyfikat Spawalniczy TIG/MAG', category: 'Techniczne', icon: Flame },
  { id: 'sanepid', label: 'Orzeczenie Sanepid', category: 'Sanitarne', icon: ShieldCheck },
  { id: 'haccp', label: 'Certyfikat HACCP / GMP', category: 'Sanitarne', icon: ShieldCheck },
  { id: 'cloud_cert', label: 'Certyfikat AWS / GCP / Azure', category: 'IT / Zarządzanie', icon: Award },
  { id: 'scrum_master', label: 'Scrum Master (PSM I / CSM)', category: 'IT / Zarządzanie', icon: Sparkles },
  { id: 'cisco_ccna', label: 'Certyfikat Cisco CCNA', category: 'IT / Zarządzanie', icon: Network },
];

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

  const categories = ['Wszystkie', 'Kierowca', 'Techniczne', 'Sanitarne', 'IT / Zarządzanie'];

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
            {isDense ? 'Widok standardowy' : 'Widok zwarty (Dense)'}
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
          const Icon = lic.icon;

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
