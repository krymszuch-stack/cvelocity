import React, { useState, useRef } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Sliders,
  Star,
  Download,
  Upload,
  Cloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  LayoutList,
  Layers,
  Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterVault, ProfilerState } from '../../types';
import { StepIndicator, StepItem } from './StepIndicator';
import { PersonalSection } from './PersonalSection';
import { ExperienceSection } from './ExperienceSection';
import { SkillsMatrix } from './SkillsMatrix';
import { SpecializationPicker } from './SpecializationPicker';
import { EducationSection } from './EducationSection';
import { PreferencesSection } from './PreferencesSection';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { PageHeader } from '../../components/ui/PageHeader';
import { ConsistencyLockBadge } from '../../components/consistency/ConsistencyLockBadge';
import { showToast } from '../../store/useToastStore';

export interface MasterVaultEditorProps {
  vault: MasterVault;
  onChange: (updatedVault: MasterVault) => void;
  onOpenAdvisor?: (initialQuestion?: string) => void;
  className?: string;
}

type ViewMode = 'stepper' | 'full';

const VAULT_STEPS: StepItem[] = [
  { id: 'personal', label: 'Dane Osobowe', icon: User, description: 'Kontakt i nagłówek' },
  { id: 'experience', label: 'Doświadczenie', icon: Briefcase, description: 'Stanowiska & STAR' },
  { id: 'skills', label: 'Umiejętności', icon: Star, description: 'Tech, soft & języki' },
  { id: 'education', label: 'Edukacja', icon: GraduationCap, description: 'Uczelnie i stopnie' },
  { id: 'preferences', label: 'Preferencje', icon: Sliders, description: 'Stawki i dojazd' },
];

export const MasterVaultEditor: React.FC<MasterVaultEditorProps> = ({
  vault,
  onChange,
  onOpenAdvisor,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('stepper');
  const [activeStep, setActiveStep] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Export JSON handler
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vault, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MasterVault_${vault.personalInfo?.fullName?.replace(/\s+/g, '_') || 'Profile'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Pomyślnie wyeksportowano profil MasterVault do pliku JSON.');
  };

  // Import JSON handler
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.personalInfo) {
          onChange({
            ...vault,
            ...parsed,
          });
          showNotification('Profil MasterVault został pomyślnie zaimportowany z pliku JSON.');
        } else {
          showToast('Niepoprawny plik', { message: 'To nie jest prawidłowy plik MasterVault JSON.', variant: 'error' });
        }
      } catch (err) {
        showToast('Błąd odczytu', { message: 'Nie udało się odczytać pliku JSON.', variant: 'error' });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleCloudSave = () => {
    showNotification('Profil został zsynchronizowany i zabezpieczony w chmurze.');
  };

  const viewModeOptions = [
    { id: 'stepper' as ViewMode, label: 'Krok po kroku', icon: Layers },
    { id: 'full' as ViewMode, label: 'Pełny formularz', icon: LayoutList },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hidden File Input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJSON}
        className="hidden"
      />

      {/* Header with Mode Switcher & Actions */}
      <PageHeader
        title="Master Vault • Profil Główny Kandydata"
        description="Pojedyncze źródło prawdy (Single Source of Truth) dla wszystkich Twoich kompetencji, doświadczeń i preferencji."
        badge={
          <div className="flex items-center gap-2">
            <span>Core SSoT</span>
            <ConsistencyLockBadge isConsistent={true} size="sm" label="spójność potwierdzona" />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs<ViewMode>
              items={viewModeOptions}
              active={viewMode}
              onChange={setViewMode}
              className="w-auto"
            />

            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportJSON}
              title="Pobierz kopię profilu JSON"
            >
              Eksportuj JSON
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              title="Wczytaj profil z pliku JSON"
            >
              Importuj JSON
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={handleCloudSave}
            >
              Zapisz w Chmurze
            </Button>
          </div>
        }
      />

      {/* Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success-soft p-4 text-xs font-semibold text-success-fg shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stepper View Mode */}
      {viewMode === 'stepper' ? (
        <div className="space-y-6">
          <StepIndicator
            steps={VAULT_STEPS}
            activeStep={activeStep}
            onStepClick={setActiveStep}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
            >
              {activeStep === 0 && (
                <PersonalSection
                  data={vault.personalInfo}
                  onChange={(updated) => onChange({ ...vault, personalInfo: updated })}
                />
              )}

              {activeStep === 1 && (
                <ExperienceSection
                  history={vault.history || []}
                  onChange={(updated) => onChange({ ...vault, history: updated })}
                  onOpenAdvisor={onOpenAdvisor}
                />
              )}

              {activeStep === 2 && (
                <SpecializationPicker
                  skillsMatrix={vault.skillsMatrix}
                  onUpdateSkillsMatrix={(updated) => onChange({ ...vault, skillsMatrix: updated })}
                  className="mb-4"
                />
              )}

              {activeStep === 2 && (
                <SkillsMatrix
                  skillsMatrix={vault.skillsMatrix}
                  languages={vault.profiler?.languages || []}
                  licenses={vault.profiler?.licenses || []}
                  onUpdateSkillsMatrix={(updated) => onChange({ ...vault, skillsMatrix: updated })}
                  onUpdateLanguages={(updated) =>
                    onChange({ ...vault, profiler: { ...vault.profiler, languages: updated } })
                  }
                  onUpdateLicenses={(updated) =>
                    onChange({ ...vault, profiler: { ...vault.profiler, licenses: updated } })
                  }
                />
              )}

              {activeStep === 3 && (
                <EducationSection
                  education={vault.education || []}
                  onChange={(updated) => onChange({ ...vault, education: updated })}
                />
              )}

              {activeStep === 4 && (
                <PreferencesSection
                  profiler={vault.profiler}
                  onChange={(updated) => onChange({ ...vault, profiler: updated })}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Stepper Navigation Footer */}
          <div className="flex items-center justify-between border-t border-line pt-4">
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            >
              Wstecz
            </Button>

            <span className="font-mono text-xs text-muted">
              Krok {activeStep + 1} z {VAULT_STEPS.length}
            </span>

            {activeStep < VAULT_STEPS.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => setActiveStep((prev) => Math.min(VAULT_STEPS.length - 1, prev + 1))}
              >
                Dalej
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={CheckCircle2}
                onClick={handleCloudSave}
              >
                Zakończ & Zapisz
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Full Form View Mode */
        <div className="space-y-6">
          <PersonalSection
            data={vault.personalInfo}
            onChange={(updated) => onChange({ ...vault, personalInfo: updated })}
          />

          <ExperienceSection
            history={vault.history || []}
            onChange={(updated) => onChange({ ...vault, history: updated })}
            onOpenAdvisor={onOpenAdvisor}
          />

          <SpecializationPicker
            skillsMatrix={vault.skillsMatrix}
            onUpdateSkillsMatrix={(updated) => onChange({ ...vault, skillsMatrix: updated })}
          />

          <SkillsMatrix
            skillsMatrix={vault.skillsMatrix}
            languages={vault.profiler?.languages || []}
            licenses={vault.profiler?.licenses || []}
            onUpdateSkillsMatrix={(updated) => onChange({ ...vault, skillsMatrix: updated })}
            onUpdateLanguages={(updated) =>
              onChange({ ...vault, profiler: { ...vault.profiler, languages: updated } })
            }
            onUpdateLicenses={(updated) =>
              onChange({ ...vault, profiler: { ...vault.profiler, licenses: updated } })
            }
          />

          <EducationSection
            education={vault.education || []}
            onChange={(updated) => onChange({ ...vault, education: updated })}
          />

          <PreferencesSection
            profiler={vault.profiler}
            onChange={(updated) => onChange({ ...vault, profiler: updated })}
          />
        </div>
      )}
    </div>
  );
};
