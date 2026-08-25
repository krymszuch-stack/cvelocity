import React, { useMemo, useState } from 'react';
import { Briefcase, Plus, Check, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { SkillsMatrix as SkillsMatrixType } from '../../types';
import {
  getAllSectors,
  getSuggestionsForSubRole,
  findSubRoleById,
} from '../../lib/specializationIndex';

/**
 * Wybór branży i podpowiedzi słownictwa zawodowego.
 *
 * Katalog `src/data/specializations.ts` — 12 sektorów i 20 podról, z markami
 * sprzętu, uprawnieniami i terminologią — leżał w repozytorium nieużywany przez
 * żaden plik. Ten ekran jest brakującym połączeniem: monter, spawacz czy
 * operator wózka mieli tu opisany swój zawód co do szczegółu i nie mieli jak
 * z tego skorzystać.
 *
 * **Nic nie jest wpisywane automatycznie.** Każda propozycja wymaga kliknięcia.
 * Ten projekt raz już usunął fabrykowane dane z parserów, a `SECURITY.md`
 * opiera się na zdaniu, że nic tu niczego nie dopisuje za użytkownika.
 * Wstawienie komuś „Analiza spalin analizatorem Testo" dlatego, że wybrał
 * branżę z listy, byłoby kłamstwem w dokumencie, którym ta osoba szuka pracy.
 */

export interface SpecializationPickerProps {
  skillsMatrix: SkillsMatrixType;
  onUpdateSkillsMatrix: (updated: SkillsMatrixType) => void;
  /** Podrola wykryta wcześniej z ogłoszenia — użyta jako wartość początkowa. */
  initialSubRoleId?: string;
  /**
   * Zapisuje jawny wybór użytkownika (albo jego wyczyszczenie). Bez tego wybór
   * branży żył tylko do wyjścia z widoku i każde kolejne wejście startowało
   * od nowego zgadywania zamiast od decyzji, którą ta osoba już podjęła.
   */
  onSubRoleChange?: (subRoleId: string | undefined) => void;
  className?: string;
}

type SuggestionTarget = 'hardSkills' | 'toolsAndTech';

interface SuggestionGroup {
  label: string;
  hint: string;
  items: string[];
  target: SuggestionTarget;
}

export const SpecializationPicker: React.FC<SpecializationPickerProps> = ({
  skillsMatrix,
  onUpdateSkillsMatrix,
  initialSubRoleId,
  onSubRoleChange,
  className = '',
}) => {
  const sectors = getAllSectors();

  const [sectorId, setSectorId] = useState<string>(
    () => (initialSubRoleId && findSubRoleById(initialSubRoleId)?.sector.id) || ''
  );
  const [subRoleId, setSubRoleId] = useState<string>(initialSubRoleId ?? '');

  const activeSector = sectors.find((sector) => sector.id === sectorId);

  const groups = useMemo<SuggestionGroup[]>(() => {
    const suggestions = subRoleId ? getSuggestionsForSubRole(subRoleId) : null;
    if (!suggestions) return [];

    const built: SuggestionGroup[] = [
      {
        label: 'Umiejętności zawodowe',
        hint: 'Dodaj tylko te, które faktycznie wykonujesz.',
        items: suggestions.hardSkills,
        target: 'hardSkills',
      },
      {
        label: 'Czynności i terminologia branżowa',
        hint: 'Nazwy, których używają rekruterzy i parsery w tej branży.',
        items: suggestions.vocabulary,
        target: 'hardSkills',
      },
      {
        label: 'Sprzęt i narzędzia',
        hint: 'Konkretny sprzęt bywa w ogłoszeniu wymogiem, nie ozdobą.',
        items: suggestions.tools,
        target: 'toolsAndTech',
      },
      {
        label: 'Typowe uprawnienia w tym zawodzie',
        hint: 'Wpisz wyłącznie te, które posiadasz — to są dane weryfikowalne.',
        items: suggestions.certifications,
        target: 'hardSkills',
      },
    ];

    return built.filter((group) => group.items.length > 0);
  }, [subRoleId]);

  const alreadyAdded = useMemo(() => {
    const all = [
      ...skillsMatrix.hardSkills,
      ...skillsMatrix.toolsAndTech,
      ...skillsMatrix.softSkills,
    ];
    return new Set(all.map((entry) => entry.toLowerCase().trim()));
  }, [skillsMatrix]);

  const addSuggestion = (value: string, target: SuggestionTarget) => {
    if (alreadyAdded.has(value.toLowerCase().trim())) return;

    onUpdateSkillsMatrix({
      ...skillsMatrix,
      [target]: [...skillsMatrix[target], value],
    });
  };

  return (
    <Card tone="raised" className={`space-y-4 ${className}`}>
      <div className="border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-brand-fg" aria-hidden="true" />
          <h3 className="text-base font-bold text-ink">Twoja branża</h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          Podpowiemy słownictwo, którego szukają parsery w Twoim zawodzie. Nic nie zostanie
          dodane bez Twojego kliknięcia.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Sektor"
          value={sectorId}
          options={[
            { value: '', label: '— wybierz —' },
            ...sectors.map((sector) => ({ value: sector.id, label: sector.name })),
          ]}
          onChange={(event) => {
            setSectorId(event.target.value);
            // Podrola z poprzedniego sektora nie ma sensu w nowym.
            setSubRoleId('');
            onSubRoleChange?.(undefined);
          }}
        />

        <Select
          label="Stanowisko"
          value={subRoleId}
          disabled={!activeSector}
          options={[
            { value: '', label: '— wybierz —' },
            ...(activeSector?.subRoles ?? []).map((subRole) => ({
              value: subRole.id,
              label: subRole.title,
            })),
          ]}
          onChange={(event) => {
            const next = event.target.value || undefined;
            setSubRoleId(event.target.value);
            onSubRoleChange?.(next);
          }}
        />
      </div>

      {groups.length === 0 ? (
        <div className="flex gap-2.5 rounded-xl border border-line bg-sunken p-3 text-xs text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Wybierz sektor i stanowisko, żeby zobaczyć słownictwo używane w ogłoszeniach z tej
            branży.
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <div>
                <p className="text-xs font-bold text-ink">{group.label}</p>
                <p className="text-[11px] text-subtle">{group.hint}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => {
                  const added = alreadyAdded.has(item.toLowerCase().trim());

                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={added}
                      onClick={() => addSuggestion(item, group.target)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${
                        added
                          ? 'cursor-default border-success/30 bg-success-soft text-success-fg'
                          : 'border-line bg-surface text-muted hover:border-brand-200 hover:text-ink'
                      }`}
                    >
                      {added ? (
                        <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <Plus className="h-3 w-3 shrink-0" aria-hidden="true" />
                      )}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
