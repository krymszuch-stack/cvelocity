import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Layers,
  Wrench,
  TrendingUp,
  Hash,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  resolveRoleKnowledgeNode,
  generateExperienceVariants,
  getAffinityObjects,
  ExperienceFact,
  GeneratedExperienceVariant,
  GrammarNarrativeStyle,
} from '../../lib/experienceEngine';

export interface ExperienceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleTitle: string;
  userSkills?: string[];
  onApplyDescription: (description: string, bullets: string[]) => void;
}

export const ExperienceWizardModal: React.FC<ExperienceWizardModalProps> = ({
  isOpen,
  onClose,
  roleTitle,
  userSkills = [],
  onApplyDescription,
}) => {
  const roleNode = useMemo(() => {
    return resolveRoleKnowledgeNode(roleTitle);
  }, [roleTitle]);

  const [step, setStep] = useState<number>(0);
  const [narrativeStyle, setNarrativeStyle] = useState<GrammarNarrativeStyle>('impersonal');

  const initialArea = roleNode.areas.length > 0 ? roleNode.areas[0].id : '';
  const initialActions = initialArea ? (roleNode.actions[initialArea] || roleNode.actions[Object.keys(roleNode.actions)[0]] || []) : [];
  const initialAction = initialActions.length > 0 ? initialActions[0] : '';

  // Stan wyboru w kreatorze
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [selectedAction, setSelectedAction] = useState<string>(initialAction);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [customTechInput, setCustomTechInput] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [metricInput, setMetricInput] = useState<string>('');

  // Synchronizacja przy zmianie roli
  const [prevRoleId, setPrevRoleId] = useState(roleNode.roleId);
  if (roleNode.roleId !== prevRoleId) {
    setPrevRoleId(roleNode.roleId);
    setSelectedArea(initialArea);
    setSelectedAction(initialAction);
  }

  // Lista dostępnych czynności dla wybranego obszaru
  const availableActions = useMemo(() => {
    return roleNode.actions[selectedArea] || roleNode.actions[Object.keys(roleNode.actions)[0]] || [];
  }, [roleNode, selectedArea]);

  // Lista dostępnych obiektów
  const availableObjects = useMemo(() => {
    const rawObjects = roleNode.objects[selectedArea] || roleNode.objects[Object.keys(roleNode.objects)[0]] || [];
    return getAffinityObjects(selectedAction, rawObjects);
  }, [roleNode, selectedArea, selectedAction]);

  // Lista dostępnych technologii (połączenie skilli użytkownika + grafu stanowiska)
  const availableTech = useMemo(() => {
    const defaultRoleTech = roleNode.defaultTech[selectedArea] || roleNode.defaultTech.default || [];
    const merged = Array.from(new Set([...userSkills, ...defaultRoleTech]));
    return merged.slice(0, 15);
  }, [roleNode, selectedArea, userSkills]);

  // Lista dostępnych efektów
  const availableOutcomes = useMemo(() => {
    return roleNode.outcomes[selectedArea] || roleNode.outcomes.default || [];
  }, [roleNode, selectedArea]);

  // Złożony fakt doświadczenia
  const currentFact: ExperienceFact = useMemo(() => {
    const areaLabel = roleNode.areas.find((a) => a.id === selectedArea)?.label || selectedArea;
    return {
      role: roleTitle || roleNode.label,
      area: areaLabel,
      action: selectedAction || availableActions[0] || 'rozwijałem',
      objects: selectedObjects.length > 0 ? selectedObjects : [availableObjects[0] || 'projekty i zadania'],
      technologies: selectedTech,
      outcome: selectedOutcome,
      metric: metricInput.trim() || undefined,
      narrativeStyle,
      verifiedByUser: true,
    };
  }, [roleTitle, roleNode, selectedArea, selectedAction, availableActions, selectedObjects, availableObjects, selectedTech, selectedOutcome, metricInput, narrativeStyle]);

  // Wygenerowane warianty
  const generatedVariants: GeneratedExperienceVariant[] = useMemo(() => {
    return generateExperienceVariants(currentFact);
  }, [currentFact]);

  const toggleObject = (obj: string) => {
    setSelectedObjects((prev) =>
      prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj]
    );
  };

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleAddCustomTech = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customTechInput.trim();
    if (clean && !selectedTech.includes(clean)) {
      setSelectedTech((prev) => [...prev, clean]);
      setCustomTechInput('');
    }
  };

  const handleApplyVariant = (variant: GeneratedExperienceVariant) => {
    onApplyDescription(variant.fullParagraph, variant.bulletPoints);
    onClose();
  };

  const resetWizard = () => {
    setStep(0);
    setSelectedObjects([]);
    setSelectedTech([]);
    setSelectedOutcome('');
    setMetricInput('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mikro-Wywiad Doświadczenia (Career Experience Wizard)"
      size="lg"
    >
      <div className="space-y-5">
        {/* Nagłówek ze statusem i krokami */}
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span>Stanowisko: {roleTitle || 'Specjalista'}</span>
            </div>
            <span className="text-[11px] font-mono text-muted">
              Krok {step + 1} z 5
            </span>
          </div>

          {/* Pasek postępu */}
          <div className="h-1.5 w-full bg-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300 rounded-full"
              style={{ width: `${((step + 1) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Treść kroków */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Layers className="h-4 w-4 text-brand-600" />
              <span>1. W jakim głównym obszarze pracowałeś na tym stanowisku?</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roleNode.areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setSelectedArea(area.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                    selectedArea === area.id
                      ? 'border-brand-500 bg-brand-500/10 text-brand-fg ring-1 ring-brand-500/30'
                      : 'border-line bg-surface hover:border-brand-500/30 text-ink'
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Briefcase className="h-4 w-4 text-brand-600" />
              <span>2. Jaka była Twoja główna czynność / rola sprawcza?</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setSelectedAction(action)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    selectedAction === action
                      ? 'border-brand-500 bg-brand-500/10 text-brand-fg ring-1 ring-brand-500/30'
                      : 'border-line bg-surface hover:border-brand-500/30 text-ink'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <Wrench className="h-4 w-4 text-brand-600" />
                <span>3. Czego dokładnie dotyczyła praca? (zaznacz 1–3 elementy)</span>
              </div>
              <span className="text-[10px] text-muted font-mono">
                Wybrano: {selectedObjects.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableObjects.map((obj) => {
                const isSelected = selectedObjects.includes(obj);
                return (
                  <button
                    key={obj}
                    type="button"
                    onClick={() => toggleObject(obj)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-brand-fg font-bold'
                        : 'border-line bg-surface hover:border-brand-500/30 text-ink'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {obj}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <Wrench className="h-4 w-4 text-brand-600" />
                <span>4. Jakich technologii / narzędzi używałeś?</span>
              </div>
              <span className="text-[10px] text-muted font-mono">
                Wybrano: {selectedTech.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTech.map((tech) => {
                const isSelected = selectedTech.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-brand-fg font-bold'
                        : 'border-line bg-surface hover:border-brand-500/30 text-ink'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {tech}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                onKeyDown={handleAddCustomTech}
                placeholder="Dodaj inną technologię lub narzędzie..."
                className="flex-1 rounded-xl border border-line bg-sunken px-3 py-2 text-xs text-ink placeholder:text-subtle focus:border-brand-500/60 focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddCustomTech}
                className="text-xs shrink-0"
              >
                Dodaj
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              <span>5. Jaki był cel lub mierzalny efekt tej pracy?</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableOutcomes.map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setSelectedOutcome(outcome)}
                  className={`px-3.5 py-2 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                    selectedOutcome === outcome
                      ? 'border-brand-500 bg-brand-500/10 text-brand-fg ring-1 ring-brand-500/30'
                      : 'border-line bg-surface hover:border-brand-500/30 text-ink'
                  }`}
                >
                  {outcome}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-line/50">
              <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-brand-600" />
                Opcjonalna liczba / skala (np. „skrócono o 35%”, „100k użytkowników”):
              </label>
              <input
                type="text"
                value={metricInput}
                onChange={(e) => setMetricInput(e.target.value)}
                placeholder="Pozostaw puste, jeśli nie znasz dokładnej liczby (opis będzie jakościowy)"
                className="w-full rounded-xl border border-line bg-sunken px-3.5 py-2 text-xs text-ink placeholder:text-subtle focus:border-brand-500/60 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Podgląd gotowych wariantów generowanych w czasie rzeczywistym */}
        <div className="space-y-3 pt-4 border-t border-line/60">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-600" />
              Propozycje opisu stanowiska (3 warianty):
            </h4>

            {/* Przełącznik stylu narracji */}
            <div className="flex items-center gap-1 bg-sunken p-1 rounded-xl border border-line/60">
              <button
                type="button"
                onClick={() => setNarrativeStyle('impersonal')}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                  narrativeStyle === 'impersonal' ? 'bg-surface text-brand-fg shadow-2xs' : 'text-muted'
                }`}
              >
                Bezosobowy
              </button>
              <button
                type="button"
                onClick={() => setNarrativeStyle('first_person_m')}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                  narrativeStyle === 'first_person_m' ? 'bg-surface text-brand-fg shadow-2xs' : 'text-muted'
                }`}
              >
                1. os. (m)
              </button>
              <button
                type="button"
                onClick={() => setNarrativeStyle('first_person_f')}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                  narrativeStyle === 'first_person_f' ? 'bg-surface text-brand-fg shadow-2xs' : 'text-muted'
                }`}
              >
                1. os. (k)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-1">
            {generatedVariants.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-line bg-surface p-3.5 space-y-2 hover:border-brand-500/40 transition-colors shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-brand-500/10 text-brand-600 px-2 py-0.5 font-mono text-[10px] font-bold">
                      {v.styleName}
                    </span>
                  </div>
                  <p className="text-xs text-ink leading-relaxed font-medium">
                    {v.fullParagraph}
                  </p>
                </div>

                <div className="pt-2 border-t border-line/50 flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={Check}
                    onClick={() => handleApplyVariant(v)}
                    className="text-xs h-7 px-3"
                  >
                    Wstaw do tego stanowiska
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pasek nawigacji kreatora */}
        <div className="flex items-center justify-between pt-2 border-t border-line/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={resetWizard}
            className="text-xs"
          >
            Od nowa
          </Button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setStep((s) => s - 1)}
                className="text-xs"
              >
                Wstecz
              </Button>
            )}

            {step < 4 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                className="text-xs"
              >
                <span>Dalej</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
