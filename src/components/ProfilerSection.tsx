import React from 'react';
import { FlagCategory, ExperienceLevel, ProfilerState, LanguageProficiency } from '../types';
import { Settings, MapPin, Globe, Award, Shield, Check, Plus, Trash2, Sparkles } from 'lucide-react';

interface ProfilerSectionProps {
  profiler: ProfilerState;
  onChange: (updated: ProfilerState) => void;
}

const ALL_FLAGS: { id: FlagCategory; label: string; desc: string; icon: string; accent: string }[] = [
  { id: 'PHYSICAL', label: 'Praca operacyjna', desc: 'Logistyka, produkcja, teren i wymagania fizyczne.', icon: '🏭', accent: 'from-amber-500/15 via-orange-500/5 to-transparent' },
  { id: 'OFFICE_IT', label: 'Biuro i technologie', desc: 'IT, doradztwo, analityka, projektowanie i zarządzanie.', icon: '💼', accent: 'from-brand-500/15 via-indigo-500/5 to-transparent' },
  { id: 'CASUAL', label: 'Elastyczna / projektowa', desc: 'Freelance, sezonowość, elastyczne godziny i zlecenia.', icon: '✨', accent: 'from-emerald-500/15 via-teal-500/5 to-transparent' },
  { id: 'REMOTE', label: 'Praca zdalna', desc: 'Pełny remote, hybryda lub globalna współpraca online.', icon: '🌍', accent: 'from-sky-500/15 via-brand-500/5 to-transparent' },
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; desc: string; icon: string; accent: string }[] = [
  { id: 'ENTRY', label: 'Entry (0-2 lata)', desc: 'Początek kariery, staże i pierwsze projekty.', icon: '🚀', accent: 'from-brand-500/15 to-brand-500/5' },
  { id: 'MID', label: 'Mid (2-5 lat)', desc: 'Samodzielne wdrożenia i niezależna realizacja.', icon: '🧭', accent: 'from-emerald-500/15 to-teal-500/5' },
  { id: 'SENIOR', label: 'Senior (5+ lat)', desc: 'Ekspercki poziom, architektura i przewodzenie zespołowi.', icon: '🏆', accent: 'from-amber-500/15 to-orange-500/5' },
  { id: 'PIVOT', label: 'Przebranżowienie', desc: 'Transfer kompetencji i zmiana ścieżki zawodowej.', icon: '🔄', accent: 'from-sky-500/15 to-brand-500/5' },
];

const PROFILE_PRESETS: { id: string; label: string; description: string; icon: string; accent: string; flags: FlagCategory[] }[] = [
  { id: 'remote', label: 'Remote-ready', description: 'Zdalna współpraca, elastyczne godziny i hybryda.', icon: '🌍', accent: 'from-sky-500/15 via-brand-500/10 to-transparent', flags: ['REMOTE'] },
  { id: 'office-it', label: 'Biuro / IT', description: 'Praca z klientem, analityka, product i projektowanie.', icon: '💻', accent: 'from-brand-500/15 via-indigo-500/10 to-transparent', flags: ['OFFICE_IT'] },
  { id: 'physical', label: 'Operacyjnie', description: 'Teren, produkcja, logistyka i szybkie realizacje.', icon: '🏭', accent: 'from-amber-500/15 via-orange-500/10 to-transparent', flags: ['PHYSICAL'] },
  { id: 'flex', label: 'Elastycznie', description: 'Freelance, projekty i różnorodne ścieżki zawodowe.', icon: '✨', accent: 'from-emerald-500/15 via-teal-500/10 to-transparent', flags: ['CASUAL'] },
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

  const applyPreset = (presetFlags: FlagCategory[]) => {
    onChange({
      ...profiler,
      flags: Array.from(new Set([...profiler.flags, ...presetFlags])),
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
    <div className="bg-surface border border-line rounded-2xl p-6 text-ink space-y-8 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-soft border border-brand-200 rounded-xl text-brand-fg shadow-2xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Profil kandydata</h2>
            <p className="text-xs text-muted">
              Wybór stylu pracy, mobilności i priorytetów dopasowania do ofert
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <label className="block text-xs font-bold text-ink flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-fg" />
            <span>Szybkie predefiniowane profile</span>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PROFILE_PRESETS.map((preset) => {
            const isSelected = preset.flags.every((flag) => profiler.flags.includes(flag));
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.flags)}
                className={`relative overflow-hidden text-left rounded-2xl border p-3.5 transition-all duration-200 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-soft ring-1 ring-brand-500/30'
                    : 'border-line bg-sunken hover:border-line-strong hover:-translate-y-0.5'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${preset.accent} opacity-90`} />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/30 text-xl shadow-sm">
                    {preset.icon}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-brand-fg" />}
                </div>
                <div className="relative mt-3">
                  <div className="text-sm font-bold text-ink">{preset.label}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
              <button
                type="button"
                key={flag.id}
                onClick={() => toggleFlag(flag.id)}
                className={`relative overflow-hidden text-left p-4 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-brand-soft border-brand-500 shadow-2xs ring-1 ring-brand-500/30'
                    : 'bg-sunken border-line hover:border-line-strong hover:-translate-y-0.5'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${flag.accent} opacity-80`} />
                <div className="relative flex items-start space-x-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                      isSelected ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'border-line-strong bg-surface text-ink'
                    }`}
                  >
                    {flag.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-ink">{flag.label}</h4>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-line-strong bg-surface'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{flag.desc}</p>
                  </div>
                </div>
              </button>
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
              <button
                type="button"
                key={lvl.id}
                onClick={() => handleLevelChange(lvl.id)}
                className={`relative overflow-hidden text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-warning-soft border-warning-500 ring-1 ring-warning-500/30'
                    : 'bg-sunken border-line hover:border-line-strong hover:-translate-y-0.5'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${lvl.accent}`} />
                <div className="relative">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xl">{lvl.icon}</span>
                    {isSelected && <Check className="w-4 h-4 text-warning-fg" />}
                  </div>
                  <div className="text-xs font-bold text-ink mt-2">{lvl.label}</div>
                  <div className="text-[11px] text-muted mt-1 leading-relaxed">{lvl.desc}</div>
                </div>
              </button>
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
            <label className="block text-xs font-semibold text-muted mb-1">Główne Miasto / Region</label>
            <input
              type="text"
              value={profiler.location.city}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              placeholder="np. Warszawa, Kraków"
              className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              Promień Dojazdów: <span className="text-brand-fg font-bold sv-tnum">{profiler.location.radiusKm} km</span>
            </label>
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

        <div className="flex flex-wrap gap-4 pt-2 text-xs text-ink">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profiler.location.willingnessToTravel}
              onChange={(e) => handleLocationChange('willingnessToTravel', e.target.checked)}
              className="rounded border-line-strong text-brand-600 focus:ring-brand-500"
            />
            <span>Gotowość do wyjazdów służbowych</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profiler.location.hybridWork}
              onChange={(e) => handleLocationChange('hybridWork', e.target.checked)}
              className="rounded border-line-strong text-brand-600 focus:ring-brand-500"
            />
            <span>Praca hybrydowa</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profiler.location.remoteOnly}
              onChange={(e) => handleLocationChange('remoteOnly', e.target.checked)}
              className="rounded border-line-strong text-brand-600 focus:ring-brand-500"
            />
            <span>Wyłącznie praca zdalna Remote</span>
          </label>
        </div>
      </div>

      {/* 4. Languages Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-ink flex items-center space-x-2">
            <Globe className="w-4 h-4 text-brand-fg" />
            <span>Języki Obce & Kontekst Stosowania CEFR</span>
          </label>
          <button
            onClick={addLanguage}
            className="flex items-center space-x-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj Język</span>
          </button>
        </div>

        <div className="space-y-3">
          {profiler.languages.map((lang) => (
            <div
              key={lang.id}
              className="bg-sunken border border-line p-3.5 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
            >
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                  placeholder="np. Angielski, Niemiecki"
                  className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="md:col-span-2">
                <select
                  value={lang.level}
                  onChange={(e) => updateLanguage(lang.id, 'level', e.target.value)}
                  className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-brand-500"
                >
                  <option value="A1">A1 (Początkujący)</option>
                  <option value="A2">A2 (Podstawowy)</option>
                  <option value="B1">B1 (Średniozaawansowany)</option>
                  <option value="B2">B2 (Zaawansowany)</option>
                  <option value="C1">C1 (Biegły)</option>
                  <option value="C2">C2 (Mastery)</option>
                  <option value="Native">Ojczysty (Native)</option>
                </select>
              </div>

              <div className="md:col-span-6">
                <input
                  type="text"
                  value={lang.context}
                  onChange={(e) => updateLanguage(lang.id, 'context', e.target.value)}
                  placeholder="Kontekst: np. Dokumentacja techniczna, rozmowy biznesowe"
                  className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="md:col-span-1 flex justify-end">
                <button
                  onClick={() => removeLanguage(lang.id)}
                  className="p-1.5 text-subtle hover:text-danger-fg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

