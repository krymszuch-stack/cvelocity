import React from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Calendar,
  Building2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkExperience, HighlightMetric } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import { Combobox } from '../../components/ui/Combobox';
import type { SuggestFn } from '../../hooks/useFieldSuggestions';
import { Toggle } from '../../components/ui/Toggle';
import { AchievementEditor } from './AchievementEditor';

export interface ExperienceSectionProps {
  history: WorkExperience[];
  onChange: (updated: WorkExperience[]) => void;
  onOpenAdvisor?: (initialQuestion?: string) => void;
  /**
   * Podpowiedzi do nazwy firmy i stanowiska. Opcjonalne — bez nich `Combobox`
   * dostaje pustą listę i zachowuje się jak zwykły `Input`.
   */
  suggest?: SuggestFn;
  className?: string;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  history,
  onChange,
  onOpenAdvisor,
  suggest,
  className = '',
}) => {
  const handleAddExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      highlights: [],
    };
    onChange([newExp, ...history]);
  };

  const handleUpdateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    onChange(
      history.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveExperience = (id: string) => {
    onChange(history.filter((item) => item.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= history.length) return;

    const updated = [...history];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  return (
    <Card tone="raised" className={`space-y-6 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">Doświadczenie Zawodowe</h3>
          <p className="text-xs text-muted">
            Historia zatrudnienia, pełnione role oraz kluczowe osiągnięcia zrealizowane w projektach.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={handleAddExperience}
        >
          Dodaj Stanowisko
        </Button>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-8 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-subtle mb-2" />
              <p className="text-xs font-semibold text-muted">
                Brak dodanych pozycji doświadczenia zawodowego.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={Plus}
                onClick={handleAddExperience}
                className="mt-3"
              >
                Dodaj pierwsze stanowisko
              </Button>
            </div>
          ) : (
            history.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
                className="rounded-2xl border border-line bg-surface p-4 sm:p-6 space-y-4 shadow-sm"
              >
                {/* Header & Reorder Controls */}
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 font-mono text-xs font-bold text-brand-fg">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-ink">
                      {item.role || 'Nowe Stanowisko'} {item.company ? `w ${item.company}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      aria-label="Przesuń wyżej"
                      className="p-1 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === history.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      aria-label="Przesuń niżej"
                      className="p-1 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleRemoveExperience(item.id)}
                      className="text-danger-fg hover:bg-danger-soft ml-2"
                      title="Usuń stanowisko"
                    >
                      Usuń
                    </Button>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <Combobox
                    label="Nazwa Firmy / Organizacji"
                    icon={Building2}
                    value={item.company}
                    onChange={(value) => handleUpdateExperience(item.id, 'company', value)}
                    suggestions={suggest?.('company', item.company) ?? []}
                    placeholder="np. Allegro, TechCorp"
                    required
                  />

                  <Combobox
                    label="Nazwa Stanowiska"
                    icon={Briefcase}
                    value={item.role}
                    onChange={(value) => handleUpdateExperience(item.id, 'role', value)}
                    suggestions={suggest?.('jobTitle', item.role) ?? []}
                    placeholder="np. Senior Frontend Engineer"
                    required
                  />

                  <div className="flex flex-col justify-end pb-1">
                    <Toggle
                      checked={item.isCurrent || false}
                      onChange={(checked) => handleUpdateExperience(item.id, 'isCurrent', checked)}
                      label="Obecnie tu pracuję"
                    />
                  </div>

                  <Input
                    label="Data Rozpoczęcia"
                    icon={Calendar}
                    type="month"
                    value={item.startDate}
                    onChange={(e) => handleUpdateExperience(item.id, 'startDate', e.target.value)}
                  />

                  {!item.isCurrent && (
                    <Input
                      label="Data Zakończenia"
                      icon={Calendar}
                      type="month"
                      value={item.endDate}
                      onChange={(e) => handleUpdateExperience(item.id, 'endDate', e.target.value)}
                    />
                  )}
                </div>

                {/* Description */}
                <Textarea
                  label="Ogólny Opis Roli i Odpowiedzialności"
                  rows={2}
                  value={item.description}
                  onChange={(e) => handleUpdateExperience(item.id, 'description', e.target.value)}
                  placeholder="Krótki zarys projektu, wielkość zespołu oraz zakres odpowiedzialności..."
                />

                {/* STAR Achievements Editor */}
                <div className="border-t border-line/60 pt-4">
                  <AchievementEditor
                    highlights={item.highlights || []}
                    onChange={(hl) => handleUpdateExperience(item.id, 'highlights', hl)}
                    onOpenAdvisor={onOpenAdvisor}
                  />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};
