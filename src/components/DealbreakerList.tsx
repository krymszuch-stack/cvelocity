import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Plus,
  Check,
  Zap,
  Globe,
  Award,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';

export interface DealbreakerItem {
  id: string;
  label: string;
  category: 'FORMAL' | 'HARD_SKILL' | 'LANGUAGE';
  severity: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  reason?: string;
}

interface DealbreakerListProps {
  missingSkills: string[];
  matchedSkills: string[];
  formalDealbreakers?: string[];
  languageRequirements?: string[];
  onAddSkillToVault: (skill: string) => void;
  addedSkills?: string[];
  className?: string;
}

export const DealbreakerList: React.FC<DealbreakerListProps> = ({
  missingSkills = [],
  matchedSkills = [],
  formalDealbreakers = [],
  languageRequirements = [],
  onAddSkillToVault,
  addedSkills = [],
  className = '',
}) => {
  const [justAdded, setJustAdded] = useState<string[]>([]);

  const handleAdd = (skill: string) => {
    onAddSkillToVault(skill);
    setJustAdded((prev) => [...prev, skill]);
  };

  const isAdded = (skill: string) =>
    addedSkills.includes(skill) || justAdded.includes(skill);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Formal Dealbreakers Section */}
      <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-danger-fg" />
            <h3 className="text-sm font-bold text-ink">
              Wymogi Formalne & Dealbreakery
            </h3>
          </div>
          <span className="font-mono text-[11px] font-semibold text-subtle">
            Kryteria bezwzględne
          </span>
        </div>

        {formalDealbreakers.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success-soft p-3 text-xs text-success-fg">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Brak krytycznych dealbreakerów formalnych. Twój profil spełnia bazowe kryteria prawne i lokalizacyjne.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {formalDealbreakers.map((item, idx) => {
              const added = isAdded(item);
              return (
                <motion.div
                  key={idx}
                  initial={{ x: -4 }}
                  animate={{ x: [0, -3, 3, -2, 2, 0] }}
                  transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-2 text-xs font-semibold text-danger-fg">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <span>{item}</span>
                      <p className="text-[11px] font-normal opacity-90">
                        Wymóg formalny w ogłoszeniu. Brak w CV może spowodować automatyczne odrzucenie.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={added ? 'secondary' : 'danger'}
                    size="sm"
                    icon={added ? Check : Plus}
                    disabled={added}
                    onClick={() => handleAdd(item)}
                    className="shrink-0"
                  >
                    {added ? 'Potwierdzono w Vault' : 'Potwierdź w Vault'}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Missing Hard Skills (ATS Weight 3.0x) */}
      <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning-fg" />
            <h3 className="text-sm font-bold text-ink">
              Brakujące Technologie Twarde (Waga ATS: 3.0x)
            </h3>
          </div>
          <span className="font-mono text-[11px] font-semibold text-warning-fg">
            {missingSkills.length} brakujących
          </span>
        </div>

        <p className="mb-3 text-xs text-muted">
          Kliknij umiejętność, którą posiadasz, aby 1 kliknięciem dodać ją do Master Vault i podnieść wynik ATS.
        </p>

        {missingSkills.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft p-3 text-xs text-success-fg">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Wszystkie wymagane technologie z ogłoszenia znajdują się w Twoim Master Vault!</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => {
              const added = isAdded(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => !added && handleAdd(skill)}
                  disabled={added}
                  className={`group inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-all focus-visible:outline-none ${
                    added
                      ? 'border-success/30 bg-success-soft text-success-fg cursor-default'
                      : 'border-warning/30 bg-warning-soft text-warning-fg hover:border-warning-fg hover:scale-[1.03] active:scale-95'
                  }`}
                  title={added ? 'Dodano do Vault' : `Kliknij, aby dodać ${skill} do Master Vault`}
                >
                  {added ? (
                    <Check className="h-3.5 w-3.5 text-success-fg" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-warning-fg group-hover:rotate-90 transition-transform duration-200" />
                  )}
                  <span>{skill}</span>
                  {added && <span className="text-[10px] opacity-80">(w Vault)</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Matched Skills (Transparent Proof of Coverage) */}
      <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success-fg" />
            <h3 className="text-sm font-bold text-ink">
              Spełnione Wymagania z Ogłoszenia
            </h3>
          </div>
          <span className="font-mono text-[11px] font-semibold text-success-fg">
            {matchedSkills.length} zgodnych
          </span>
        </div>

        {matchedSkills.length === 0 ? (
          <p className="text-xs text-subtle">Brak bezpośrednich dopasowań słów kluczowych.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((skill) => (
              <Chip key={skill} variant="success" size="sm">
                ✓ {skill}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
