import React from 'react';
import { MapPin, Globe, Compass, Navigation, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { LocationPreferences } from '../../types';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import { Slider } from '../../components/ui/Slider';
import { Toggle } from '../../components/ui/Toggle';
import { Chip } from '../../components/ui/Chip';

export interface CommuteMapProps {
  location: LocationPreferences;
  onChange: (updated: LocationPreferences) => void;
  className?: string;
}

export const CommuteMap: React.FC<CommuteMapProps> = ({
  location,
  onChange,
  className = '',
}) => {
  const currentRadius = location.commuteRadiusKm || location.radiusKm || 30;

  const handleUpdate = (field: keyof LocationPreferences, value: any) => {
    onChange({
      ...location,
      [field]: value,
    });
  };

  return (
    <Card tone="raised" className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h3 className="text-base font-bold text-ink">Lokalizacja & Strefa Dojazdu</h3>
          <p className="text-xs text-muted">
            Obszar poszukiwania ofert stacjonarnych i hybrydowych.
          </p>
        </div>

        <Chip variant={location.remoteOnly ? 'brand' : 'neutral'}>
          {location.remoteOnly ? '100% Zdalnie' : `≤ ${currentRadius} km`}
        </Chip>
      </div>

      {/* Target City */}
      <Input
        label="Główna Miejscowość Bazowa"
        icon={MapPin}
        value={location.city || ''}
        onChange={(e) => handleUpdate('city', e.target.value)}
        placeholder="np. Warszawa, Kraków, Wrocław, Gdańsk"
      />

      {/* Work Modes Toggles */}
      <div className="space-y-3 pt-1">
        <Toggle
          checked={location.remoteOnly}
          onChange={(val) => handleUpdate('remoteOnly', val)}
          label="Tylko praca w 100% zdalna"
          description="Wyklucz oferty z wymogiem wizyt w biurze"
        />

        <Toggle
          checked={location.hybridWork}
          onChange={(val) => handleUpdate('hybridWork', val)}
          label="Akceptuję model hybrydowy (np. 1-2 dni w biurze)"
        />

        <Toggle
          checked={location.willingnessToTravel}
          onChange={(val) => handleUpdate('willingnessToTravel', val)}
          label="Gotowość do podróży służbowych (delegacje)"
        />

        <Toggle
          checked={location.relocationReady || false}
          onChange={(val) => handleUpdate('relocationReady', val)}
          label="Jestem gotowy na przeprowadzkę (relokacja)"
          description="Uwzględniaj oferty z budżetem relokacyjnym z innych miast i krajów"
        />
      </div>

      {/* Commute Radius Slider with Visual Radar */}
      {!location.remoteOnly && (
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
          <Slider
            label="Maksymalny Dystans Dojazdu"
            value={currentRadius}
            onChange={(val) => {
              handleUpdate('commuteRadiusKm', val);
              handleUpdate('radiusKm', val);
            }}
            min={5}
            max={100}
            step={5}
            unit="km"
          />

          {/* Visual Radar Mockup */}
          <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-line bg-sunken">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Concentric rings */}
              <div className="h-28 w-28 rounded-full border border-brand-500/20" />
              <div className="h-20 w-20 rounded-full border border-brand-500/30" />
              <div className="h-12 w-12 rounded-full border border-brand-500/50" />

              {/* Dynamic radius indicator */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute rounded-full bg-brand-500/10 border border-brand-500/40"
                style={{
                  width: `${Math.max(20, Math.min(110, (currentRadius / 100) * 110))}px`,
                  height: `${Math.max(20, Math.min(110, (currentRadius / 100) * 110))}px`,
                }}
              />

              {/* Center point */}
              <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-raised">
                <MapPin className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="absolute bottom-2 right-2 rounded-md bg-surface/80 px-2 py-0.5 font-mono text-[10px] text-muted backdrop-blur-xs">
              Promień: {currentRadius} km wokół {location.city || 'Centrum'}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
