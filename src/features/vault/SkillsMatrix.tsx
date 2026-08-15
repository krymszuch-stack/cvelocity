import React, { useState } from 'react';
import {
  Star,
  Plus,
  Trash2,
  Globe,
  Award,
  ShieldCheck,
  CheckCircle2,
  Car,
  HardHat,
  Zap,
  Sparkles,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SkillsMatrix as SkillsMatrixType, LanguageProficiency } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Chip } from '../../components/ui/Chip';
import { ProgressBar } from '../../components/ui/ProgressBar';

export interface SkillsMatrixProps {
  skillsMatrix: SkillsMatrixType;
  languages: LanguageProficiency[];
  licenses?: string[];
  onUpdateSkillsMatrix: (updated: SkillsMatrixType) => void;
  onUpdateLanguages: (updated: LanguageProficiency[]) => void;
  onUpdateLicenses: (updated: string[]) => void;
  className?: string;
}

const CEFR_PROGRESS: Record<LanguageProficiency['level'], number> = {
  A1: 17,
  A2: 33,
  B1: 50,
  B2: 67,
  C1: 83,
  C2: 100,
  Native: 100,
};

const COMMON_LICENSES = [
  { id: 'b_license', label: 'Prawo Jazdy Kat. B', icon: Car },
  { id: 'udt_forklift', label: 'Uprawnienia UDT (Wózki)', icon: HardHat },
  { id: 'sep_1kv', label: 'Uprawnienia SEP (do 1kV)', icon: Zap },
  { id: 'sanepid', label: 'Badania Sanepid', icon: ShieldCheck },
  { id: 'cloud_cert', label: 'Certyfikat AWS / GCP / Azure', icon: Award },
  { id: 'scrum_master', label: 'Scrum Master (PSM / CSM)', icon: Sparkles },
  { id: 'first_aid', label: 'Kurs Pierwszej Pomocy', icon: ShieldCheck },
  { id: 'c_license', label: 'Prawo Jazdy Kat. C / C+E', icon: Car },
];

export const SkillsMatrix: React.FC<SkillsMatrixProps> = ({
  skillsMatrix,
  languages,
  licenses = [],
  onUpdateSkillsMatrix,
  onUpdateLanguages,
  onUpdateLicenses,
  className = '',
}) => {
  const [hardSkillInput, setHardSkillInput] = useState('');
  const [softSkillInput, setSoftSkillInput] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [newLangLevel, setNewLangLevel] = useState<LanguageProficiency['level']>('B2');

  // Add Hard Skill
  const handleAddHardSkill = () => {
    if (!hardSkillInput.trim()) return;
    const exists = (skillsMatrix.hardSkills || []).some(
      (s) => s.toLowerCase() === hardSkillInput.trim().toLowerCase()
    );
    if (!exists) {
      onUpdateSkillsMatrix({
        ...skillsMatrix,
        hardSkills: [...(skillsMatrix.hardSkills || []), hardSkillInput.trim()],
      });
    }
    setHardSkillInput('');
  };

  // Remove Hard Skill
  const handleRemoveHardSkill = (skill: string) => {
    onUpdateSkillsMatrix({
      ...skillsMatrix,
      hardSkills: (skillsMatrix.hardSkills || []).filter((s) => s !== skill),
    });
  };

  // Add Soft Skill
  const handleAddSoftSkill = () => {
    if (!softSkillInput.trim()) return;
    const exists = (skillsMatrix.softSkills || []).some(
      (s) => s.toLowerCase() === softSkillInput.trim().toLowerCase()
    );
    if (!exists) {
      onUpdateSkillsMatrix({
        ...skillsMatrix,
        softSkills: [...(skillsMatrix.softSkills || []), softSkillInput.trim()],
      });
    }
    setSoftSkillInput('');
  };

  // Remove Soft Skill
  const handleRemoveSoftSkill = (skill: string) => {
    onUpdateSkillsMatrix({
      ...skillsMatrix,
      softSkills: (skillsMatrix.softSkills || []).filter((s) => s !== skill),
    });
  };

  // Add Language
  const handleAddLanguage = () => {
    if (!newLangName.trim()) return;
    const newLang: LanguageProficiency = {
      id: `lang-${Date.now()}`,
      language: newLangName.trim(),
      level: newLangLevel,
      context: 'Komunikacja biznesowa i techniczna',
    };
    onUpdateLanguages([...languages, newLang]);
    setNewLangName('');
  };

  // Remove Language
  const handleRemoveLanguage = (id: string) => {
    onUpdateLanguages(languages.filter((l) => l.id !== id));
  };

  // Toggle License
  const handleToggleLicense = (licenseId: string) => {
    const isChecked = licenses.includes(licenseId);
    if (isChecked) {
      onUpdateLicenses(licenses.filter((l) => l !== licenseId));
    } else {
      onUpdateLicenses([...licenses, licenseId]);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hard Skills Section */}
      <Card tone="raised" className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-ink">Umiejętności Twarde & Technologie</h3>
          <p className="text-xs text-muted">
            Języki programowania, frameworki, narzędzia bazodanowe i technologie chmurowe.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={hardSkillInput}
            onChange={(e) => setHardSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddHardSkill();
              }
            }}
            placeholder="Wpisz technologię (np. React, TypeScript, Docker, PostgreSQL) i naciśnij Enter..."
            containerClassName="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={Plus}
            onClick={handleAddHardSkill}
          >
            Dodaj
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {(skillsMatrix.hardSkills || []).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-fg shadow-xs"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveHardSkill(skill)}
                className="rounded-full p-0.5 hover:bg-brand-200/50 focus-visible:outline-none"
                aria-label={`Usuń ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </Card>

      {/* Soft Skills Section */}
      <Card tone="raised" className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-ink">Kompetencje Miękkie & Przywódcze</h3>
          <p className="text-xs text-muted">
            Umiejętności komunikacyjne, współpraca w zespole, zarządzanie czasem i rozwiązywanie problemów.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={softSkillInput}
            onChange={(e) => setSoftSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSoftSkill();
              }
            }}
            placeholder="Wpisz umiejętność miękką (np. Mentoring, Code Review, Negocjacje) i naciśnij Enter..."
            containerClassName="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={Plus}
            onClick={handleAddSoftSkill}
          >
            Dodaj
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {(skillsMatrix.softSkills || []).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-xs"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveSoftSkill(skill)}
                className="rounded-full p-0.5 hover:bg-sunken focus-visible:outline-none"
                aria-label={`Usuń ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </Card>

      {/* Languages Section */}
      <Card tone="raised" className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-ink">Języki Obce (Skala CEFR)</h3>
          <p className="text-xs text-muted">
            Poziomy biegłości językowej według Europejskiego Systemu Opisu Kształcenia Językowego.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Input
            label="Język Obcy"
            value={newLangName}
            onChange={(e) => setNewLangName(e.target.value)}
            placeholder="np. Angielski, Niemiecki"
            containerClassName="flex-1 min-w-[180px]"
          />

          <Select
            label="Poziom Biegłości (CEFR)"
            value={newLangLevel}
            onChange={(e) => setNewLangLevel(e.target.value as LanguageProficiency['level'])}
            options={[
              { value: 'A1', label: 'A1 - Początkujący' },
              { value: 'A2', label: 'A2 - Podstawowy' },
              { value: 'B1', label: 'B1 - Średniozaawansowany' },
              { value: 'B2', label: 'B2 - Wyższy średniozaawansowany' },
              { value: 'C1', label: 'C1 - Zaawansowany' },
              { value: 'C2', label: 'C2 - Biegły' },
              { value: 'Native', label: 'Native - Język ojczysty' },
            ]}
            containerClassName="w-64"
          />

          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={Plus}
            onClick={handleAddLanguage}
            className="mb-1"
          >
            Dodaj Język
          </Button>
        </div>

        {/* Languages Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 pt-2">
          {languages.map((lang) => {
            const progress = CEFR_PROGRESS[lang.level] || 50;

            return (
              <div
                key={lang.id}
                className="rounded-2xl border border-line bg-surface p-4 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-brand-600" />
                    <span className="text-xs font-bold text-ink">{lang.language}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-brand-fg">
                      {lang.level}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang.id)}
                      className="text-muted hover:text-danger-fg p-1"
                      aria-label="Usuń język"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <ProgressBar value={progress} max={100} showLabel={false} barColor="bg-brand-600" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Formal Licenses & Certifications Grid */}
      <Card tone="raised" className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-ink">Uprawnienia Formalne & Certyfikaty</h3>
          <p className="text-xs text-muted">
            Kluczowe certyfikaty i uprawnienia wymagane na stanowiskach technicznych.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COMMON_LICENSES.map((lic) => {
            const isChecked = licenses.includes(lic.id);
            const Icon = lic.icon;

            return (
              <motion.button
                key={lic.id}
                type="button"
                onClick={() => handleToggleLicense(lic.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none ${
                  isChecked
                    ? 'border-brand-200 bg-brand-50 text-brand-fg shadow-raised ring-2 ring-brand-500/20'
                    : 'border-line bg-surface text-muted hover:border-brand-200/50 hover:text-ink'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    isChecked ? 'bg-brand-600 text-white' : 'bg-sunken text-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div>
                  <span className="block text-xs font-bold leading-tight">
                    {lic.label}
                  </span>
                  <span className="font-mono text-[10px] opacity-75">
                    {isChecked ? 'Zaznaczone' : 'Brak'}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
