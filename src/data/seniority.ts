import { ExperienceLevel } from '../types';

/**
 * Poziomy seniority — jedno źródło prawdy.
 *
 * Wcześniej dwie niezgodne listy opisywały ten sam wybór: `PreferencesSection`
 * mówił „Senior / Lead" i „Przebranżowienie", `ProfilerSection` „Senior"
 * i „Lead / Pivot", a zakresy mieszały dywiz z półpauzą. Użytkownik widział
 * różne nazwy tego samego poziomu na dwóch ekranach (reguła 3).
 */
export interface SeniorityLevel {
  id: ExperienceLevel;
  label: string;
  /** Zakres doświadczenia z półpauzą („0–2 lata"); poziomy bez zakresu go nie mają. */
  range?: string;
  /** Pełniejszy opis do formularzy wyboru. */
  description: string;
}

export const SENIORITY_LEVELS: SeniorityLevel[] = [
  {
    id: 'ENTRY',
    label: 'Junior (Entry)',
    range: '0–2 lata',
    description: 'Stanowiska startowe i juniorskie',
  },
  {
    id: 'MID',
    label: 'Mid Specialist',
    range: '2–5 lat',
    description: 'Samodzielny specjalista z doświadczeniem komercyjnym',
  },
  {
    id: 'SENIOR',
    label: 'Senior / Lead',
    range: '5+ lat',
    description: 'Ekspert dziedzinowy, architektura, decyzje techniczne',
  },
  {
    id: 'PIVOT',
    label: 'Przebranżowienie',
    description: 'Zmiana profilu lub ścieżki specjalizacji',
  },
];

/** Etykieta poziomu do wyświetlenia; nieznanemu enumowi nie udajemy niczego. */
export function seniorityLabel(id: ExperienceLevel): string {
  return SENIORITY_LEVELS.find((level) => level.id === id)?.label ?? id;
}
