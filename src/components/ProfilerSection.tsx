import React from 'react';
import { FlagCategory, ExperienceLevel, ProfilerState, LanguageProficiency } from '../types';
import { Settings, MapPin, Globe, Award, Shield, Check, Plus, Trash2 } from 'lucide-react';

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
    <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-900 space-y-8 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 shadow-2xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Matryca Profilu & Ingestion Flags</h2>
            <p className="text-xs text-slate-500">
              Wielokryterialne flagi preferencji (bitmask) i parametry kandydata
            </p>
          </div>
        </div>
      </div>

      {/* 1. Flag Matrix */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Matryca Flag Preferencji: Wielokrotny Wybór</span>
        </label>
        <p className="text-xs text-slate-500 mb-4">
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
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-2xs ring-1 ring-emerald-500/30'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                    isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{flag.label}</h4>
                  <p className="text-xs text-slate-500 mt-1">{flag.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Experience Level */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-600" />
          <span>Poziom Doświadczenia</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EXPERIENCE_LEVELS.map((lvl) => {
            const isSelected = profiler.experienceLevel === lvl.id;
            return (
              <div
                key={lvl.id}
                onClick={() => handleLevelChange(lvl.id)}
                className={`cursor-pointer p-3.5 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500/30'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{lvl.label}</div>
                <div className="text-[11px] text-slate-500 mt-1">{lvl.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Location Preferences */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <span>Lokalizacja & Mobilność Zawodowa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Główne Miasto / Region</label>
            <input
              type="text"
              value={profiler.location.city}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              placeholder="np. Warszawa, Kraków"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Promień Dojazdów: <span className="text-indigo-600 font-bold">{profiler.location.radiusKm} km</span>
            </label>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={profiler.location.radiusKm}
              onChange={(e) => handleLocationChange('radiusKm', parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-700">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profiler.location.willingnessToTravel}
              onChange={(e) => handleLocationChange('willingnessToTravel', e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Gotowość do wyjazdów służbowych</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profiler.location.hybridWork}
              onChange={(e) => handleLocationChange('hybridWork', e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Praca hybrydowa</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profiler.location.remoteOnly}
              onChange={(e) => handleLocationChange('remoteOnly', e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Wyłącznie praca zdalna Remote</span>
          </label>
        </div>
      </div>

      {/* 4. Languages Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-slate-900 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Języki Obce & Kontekst Stosowania CEFR</span>
          </label>
          <button
            onClick={addLanguage}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj Język</span>
          </button>
        </div>

        <div className="space-y-3">
          {profiler.languages.map((lang) => (
            <div
              key={lang.id}
              className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
            >
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                  placeholder="np. Angielski, Niemiecki"
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <select
                  value={lang.level}
                  onChange={(e) => updateLanguage(lang.id, 'level', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
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
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="md:col-span-1 flex justify-end">
                <button
                  onClick={() => removeLanguage(lang.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
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
