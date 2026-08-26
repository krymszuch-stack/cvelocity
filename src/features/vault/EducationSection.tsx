import React from 'react';
import { GraduationCap, Plus, Trash2, Calendar, BookOpen, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Education } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';

export interface EducationSectionProps {
  education: Education[];
  onChange: (updated: Education[]) => void;
  className?: string;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  onChange,
  className = '',
}) => {
  const handleAddEducation = () => {
    const newEntry: Education = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: 'Inżynier',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    onChange([...education, newEntry]);
  };

  const handleUpdateEducation = (id: string, field: keyof Education, value: string) => {
    onChange(
      education.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveEducation = (id: string) => {
    onChange(education.filter((item) => item.id !== id));
  };

  return (
    <Card tone="raised" className={`space-y-6 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">Edukacja i Wykształcenie</h3>
          <p className="text-xs text-muted">
            Ukończone uczelnie, kierunki studiów i uzyskane tytuły naukowe.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={handleAddEducation}
        >
          Dodaj Uczelnię / Szkołę
        </Button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {education.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Brak dodanych pozycji wykształcenia"
              description="Dodaj uczelnię lub szkołę, kierunek studiów i uzyskany tytuł — to podstawa sekcji edukacji w CV."
              action={
                <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddEducation}>
                  Dodaj pierwszy wpis
                </Button>
              }
            />
          ) : (
            education.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
                className="rounded-2xl border border-line bg-surface p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <span className="font-mono text-label font-bold text-brand-fg">
                    Pozycja #{index + 1}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleRemoveEducation(item.id)}
                    className="text-danger-fg hover:bg-danger-soft"
                    title="Usuń wpis edukacji"
                  >
                    Usuń
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {/* Institution */}
                  <Input
                    label="Uczelnia / Szkoła"
                    icon={GraduationCap}
                    value={item.institution}
                    onChange={(e) => handleUpdateEducation(item.id, 'institution', e.target.value)}
                    placeholder="np. Politechnika Warszawska"
                    required
                  />

                  {/* Field of Study */}
                  <Input
                    label="Kierunek Studiów"
                    icon={BookOpen}
                    value={item.fieldOfStudy}
                    onChange={(e) => handleUpdateEducation(item.id, 'fieldOfStudy', e.target.value)}
                    placeholder="np. Informatyka Stosowana"
                    required
                  />

                  {/* Degree */}
                  <Input
                    label="Uzyskany Tytuł / Stopień"
                    icon={Award}
                    value={item.degree}
                    onChange={(e) => handleUpdateEducation(item.id, 'degree', e.target.value)}
                    placeholder="np. Magister Inżynier"
                  />

                  {/* Start Date */}
                  <Input
                    label="Data Rozpoczęcia"
                    icon={Calendar}
                    type="month"
                    value={item.startDate}
                    onChange={(e) => handleUpdateEducation(item.id, 'startDate', e.target.value)}
                  />

                  {/* End Date */}
                  <Input
                    label="Data Ukończenia (lub w trakcie)"
                    icon={Calendar}
                    type="month"
                    value={item.endDate}
                    onChange={(e) => handleUpdateEducation(item.id, 'endDate', e.target.value)}
                  />
                </div>

                {/* Optional description / specialization */}
                <Textarea
                  label="Specjalizacja / Osiągnięcia Akademickie"
                  rows={2}
                  value={item.description || ''}
                  onChange={(e) => handleUpdateEducation(item.id, 'description', e.target.value)}
                  placeholder="np. Praca dyplomowa z zakresu przetwarzania języka naturalnego (NLP)..."
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};
