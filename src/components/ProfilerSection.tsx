import React from 'react';
import { FlagCategory, ExperienceLevel, ProfilerState, LanguageProficiency } from '../types';
import { Settings, MapPin, Globe, Award, Shield, Check, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader } from './ui/Card';
import { Input, Select, Toggle } from './ui/Field';
import { Button, IconButton } from './ui/Button';

interface ProfilerSectionProps {
  profiler: ProfilerState;
  onChange: (updated: ProfilerState) => void;
}

const ALL_FLAGS: { id: FlagCategory; label: string; desc: string }[] = [
  { id: 'PHYSICAL', label: 'Praca Fizyczna / Operacyjna', desc: 'Stanowiska produkcyjne, logistyczne, terenowe lub wymagające dyspozycji fizycznej' },
  { id: 'OFFICE_IT', label: 'Biuro / IT / Inżynieria', desc: 'Praca biurowa, rozwój oprogramowania, architektura danych, zarządzenie' },
  { id: 'CASUAL', label: 'Casual / Elastyczna', desc: 'Praca projektowa, zlecenia, praca sezonowa lub elastyczne godziny' },
  { id: 'REMOTE', label: 'Zdalna / Remote Only', desc: 'Pełna praca zdalna z dowolnego miejsca bez konieczności stawiennictwa w biurze' },
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'ENTRY', label: 'Entry Level (0-2 lata)', desc: 'Początek ścieżki zawodowej, staże, pierwsze samodzielne projekty' },
  { id: 'MID', label: 'Mid Level (2-5 lat)', desc: 'Samodzielny specjalista, realizacja komercyjnych wdrożeń' },
  { id: 'SENIOR', label: 'Senior Level (5+ lat)', desc: 'Ekspert, architektura rozwiązań, prowadzenie zespołów' },
  { id: 'PIVOT', label: 'Przebranżowienie (Pivot)', desc: 'Zmiana branży, transfer umiejętności uniwersalnych i miękkich' },
];

export const ProfilerSection: React.FC<ProfilerSectionProps> = ({ profiler, onChange }) => {
  const toggleFlag = (flag: FlagCategory) => {
    const exists = profiler.flags.includes(flag);
    const updatedFlags = exists
      ? profiler.flags.filter((f) => f !== flag)
      : [...profiler.flags, flag];
    onChange({ ...profiler, flags: updatedFlags });
  };

  const handleLevelChange = (level: ExperienceLevel) => {
    onChange({ ...profiler, experienceLevel: level });
  };

  const handleLocationChange = (field: string, value: any) => {
    onChange({
      ...profiler,
      location: { ...profiler.location, [field]: value },
    });
  };

  const addLanguage = () => {
    const newLang: LanguageProficiency = {
      id: 'lang_' + Date.now(),
      language: '',
      level: 'B2',
      context: 'Komunikacja zawodowa i dokumentacja',
    };
    onChange({ ...profiler, languages: [...profiler.languages, newLang] });
  };

  const updateLanguage = (id: string, field: string, value: string) => {
    const updated = profiler.languages.map((l) =>
      l.id === id ? { ...l, [field]: value } : l
    );
    onChange({ ...profiler, languages: updated });
  };

  const removeLanguage = (id: string) => {
    const updated = profiler.languages.filter((l) => l.id !== id);
    onChange({ ...profiler, languages: updated });
  };

  return (
    <Card className="space-y-8">
      {/* Header */}
      <CardHeader
        icon={Settings}
        title="Matryca Profilu & Ingestion Flags"
        subtitle="Wielokryterialne flagi preferencji (bitmask) i parametry kandydata"
        accent="brand"
        className="border-b border-line pb-4"
      />

      {/* 1. Flag Matrix */}
      <div>
        <label className="block text-xs font-bold text-ink mb-1 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-brand-fg" />
          <span>Matryca Flag Preferencji: Wielokrotny Wybór</span>
        </label>
        <p className="text-xs text-muted mb-4">
          Flagi nie wykluczają się wzajemnie – system używa ich do filtrowania i akcentowania fraz w CV.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_FLAGS.map((flag) => {
            const isSelected = profiler.flags.includes(flag.id);
            return (
              <div
                key={flag.id}
                onClick={() => toggleFlag(flag.id)}
                className={`cursor-pointer p-4 rounded-xl border transition-all flex items-start space-x-3 ${
                  isSelected
                    ? 'bg-brand-soft border-brand-500 shadow-2xs ring-1 ring-brand-500/30'
                    : 'bg-sunken border-line hover:border-line-strong'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                    isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-line-strong bg-surface'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">{flag.label}</h4>
                  <p className="text-xs text-muted mt-1">{flag.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Experience Level */}
      <div>
        <label className="block text-xs font-bold text-ink mb-2 flex items-center space-x-2">
          <Award className="w-4 h-4 text-warning-fg" />
          <span>Poziom Doświadczenia</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EXPERIENCE_LEVELS.map((lvl) => {
            const isSelected = profiler.experienceLevel === lvl.id;
            return (
              <div
                key={lvl.id}
                onClick={() => handleLevelChange(lvl.id)}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-warning-soft border-warning-500 ring-1 ring-warning-500/30'
                    : 'bg-sunken border-line hover:border-line-strong'
                }`}
              >
                <div className="text-xs font-bold text-ink">{lvl.label}</div>
                <div className="text-[11px] text-muted mt-1">{lvl.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Location Preferences */}
      <div className="bg-sunken p-5 rounded-xl border border-line space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-ink">
          <MapPin className="w-4 h-4 text-brand-fg" />
          <span>Lokalizacja & Mobilność Zawodowa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Główne Miasto / Region"
              value={profiler.location.city}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              placeholder="np. Warszawa, Kraków"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Promień Dojazdów: <span className="text-brand-fg font-bold sv-tnum">{profiler.location.radiusKm} km</span>
            </span>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={profiler.location.radiusKm}
              onChange={(e) => handleLocationChange('radiusKm', parseInt(e.target.value))}
              className="w-full accent-brand-600 h-2 bg-line-strong rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Toggle
            checked={profiler.location.willingnessToTravel}
            onChange={(checked) => handleLocationChange('willingnessToTravel', checked)}
            label="Wyjazdy służbowe"
            description="Gotowość do podróży służbowych"
          />

          <Toggle
            checked={profiler.location.hybridWork}
            onChange={(checked) => handleLocationChange('hybridWork', checked)}
            label="Praca hybrydowa"
            description="Częściowo z biura, częściowo zdalnie"
          />

          <Toggle
            checked={profiler.location.remoteOnly}
            onChange={(checked) => handleLocationChange('remoteOnly', checked)}
            label="Wyłącznie zdalnie"
            description="100% pracy zdalnej bez dojazdów"
          />
        </div>
      </div>

      {/* 4. Languages Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-ink flex items-center space-x-2">
            <Globe className="w-4 h-4 text-brand-fg" />
            <span>Języki Obce & Kontekst Stosowania CEFR</span>
          </label>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={addLanguage}
          >
            Dodaj Język
          </Button>
        </div>

        <div className="space-y-3">
          {profiler.languages.map((lang) => (
            <div
              key={lang.id}
              className="bg-sunken border border-line p-3.5 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
            >
              <div className="md:col-span-3">
                <Input
                  value={lang.language}
                  onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                  placeholder="np. Angielski, Niemiecki"
                />
              </div>

              <div className="md:col-span-3">
                <Select
                  value={lang.level}
                  onChange={(e) => updateLanguage(lang.id, 'level', e.target.value)}
                >
                  <option value="A1">A1 (Początkujący)</option>
                  <option value="A2">A2 (Podstawowy)</option>
                  <option value="B1">B1 (Średniozaawansowany)</option>
                  <option value="B2">B2 (Zaawansowany)</option>
                  <option value="C1">C1 (Biegły)</option>
                  <option value="C2">C2 (Mastery)</option>
                  <option value="Native">Ojczysty (Native)</option>
                </Select>
              </div>

              <div className="md:col-span-5">
                <Input
                  value={lang.context}
                  onChange={(e) => updateLanguage(lang.id, 'context', e.target.value)}
                  placeholder="Kontekst: np. Dokumentacja, rozmowy"
                />
              </div>

              <div className="md:col-span-1 flex justify-end">
                <IconButton
                  icon={Trash2}
                  title="Usuń język"
                  variant="ghost"
                  size="sm"
                  className="text-subtle hover:text-danger-fg"
                  onClick={() => removeLanguage(lang.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
