import { MasterVault, JobApplication } from '../types';
import { getPolishStem } from './atsSimulator';
import {
  diversifiedSample,
  SUGGESTED_HARD_SKILLS,
  SUGGESTED_JOB_TITLES,
  SUGGESTED_LOCATIONS,
  SUGGESTED_SOFT_SKILLS,
  SUGGESTED_TOOLS_AND_TECH,
} from './autocompleteSuggestions';
import { getSuggestionsForSubRole, matchSubRoles } from './specializationIndex';

/**
 * Podpowiedzi do pól formularzy — z własnej historii, z katalogu branż
 * i ze słowników. Deterministycznie, bez sieci i bez tokenów.
 *
 * Trzy warstwy, świadomie w tej kolejności:
 *
 * 1. **Własne wpisy** — firmy i stanowiska, które ta osoba już gdzieś w
 *    aplikacji wpisała. To jedyna warstwa, o której wiadomo, że jest prawdziwa
 *    *dla niej*; reszta to zgadywanie o rynku.
 * 2. **Katalog branż** — `specializationIndex`, czyli rozpoznanie zawodu
 *    z tytułu stanowiska. Mówi o zawodzie, więc bije listę pisaną ręcznie.
 * 3. **Słowniki** — `autocompleteSuggestions.ts`, 304 linie, które do tej pory
 *    nie miały ani jednego importu w repozytorium.
 *
 * Czwarta warstwa (zbiorczy korpus firm z Supabase) dochodzi tu jako
 * `context.corpus`, gdy pojawi się logowanie. Do tego czasu jest pusta
 * i **to jest poprawne zachowanie**: pusty korpus nie generuje żadnych
 * podpowiedzi zamiast produkować wypełniacz (reguła 1).
 *
 * **Ten moduł nigdy niczego nie wpisuje.** Zwraca kandydatów; jedyną drogą do
 * pola jest świadomy wybór użytkownika. Zasada jest zapisana wprost
 * w `SpecializationPicker.tsx:21-25` i obowiązuje tu tak samo: podstawienie
 * komuś „Analiza spalin analizatorem Testo" dlatego, że wpisał nazwę firmy,
 * byłoby kłamstwem w dokumencie, którym szuka pracy.
 */

export type SuggestionField =
  | 'company'
  | 'jobTitle'
  | 'location'
  | 'hardSkill'
  | 'softSkill'
  | 'tool';

export type SuggestionSource = 'own' | 'corpus' | 'catalog' | 'dictionary';

export interface FormSuggestion {
  /** Wartość wstawiana po wyborze — dokładnie ta, nieprzetworzona. */
  value: string;
  source: SuggestionSource;
  /** Dlaczego jest na liście. Pokazywane przy pozycji, nie schowane w kodzie. */
  reason: string;
  score: number;
}

export interface SuggestionContext {
  vault: MasterVault;
  applications: readonly JobApplication[];
  /** Zbiorczy korpus — warstwa chmurowa. Pusty, dopóki nie ma logowania. */
  corpus?: readonly string[];
  /** Wartości już wybrane w tym polu — nie proponujemy ich drugi raz. */
  excluded?: readonly string[];
  limit?: number;
}

/**
 * Waga źródła — **tie-breaker**, nie główne kryterium.
 *
 * Kolejność rozstrzyga najpierw klasa trafienia (patrz `matchScore`), a dopiero
 * w jej obrębie źródło. Odwrotnie być nie może: przy dominującym źródle własny
 * „Zakład Warsztatowy" wygrywałby ze słownikowym „Warszawa" na frazie „Warsz",
 * mimo że użytkownik wyraźnie celuje w to drugie. Własne wpisy i tak wygrywają
 * wszędzie tam, gdzie trafiają równie dobrze — a to jest ta sytuacja, o którą
 * chodzi.
 */
const SOURCE_TIER: Record<SuggestionSource, number> = {
  own: 300,
  corpus: 150,
  catalog: 200,
  dictionary: 100,
};

const SOURCE_REASON: Record<SuggestionSource, string> = {
  own: 'Z Twojej historii',
  corpus: 'Częste na rynku',
  catalog: 'Z Twojej branży',
  dictionary: 'Ze słownika',
};

/** Ile podpowiedzi pokazujemy naraz. Lista dłuższa niż ekran przestaje pomagać. */
export const DEFAULT_SUGGESTION_LIMIT = 8;

/**
 * Porównanie bez wielkości liter i bez zwielokrotnionych spacji.
 * Diakrytyki zostają: „Łódź" i „Lodz" to dla użytkownika dwa różne zapisy
 * i sklejanie ich tutaj ukrywałoby literówkę zamiast ją pokazać.
 */
function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Jakość dopasowania frazy do tego, co użytkownik zdążył wpisać.
 * Zwraca `0`, gdy nie pasuje w ogóle — wtedy pozycja nie trafia na listę.
 */
function matchScore(value: string, query: string): number {
  const haystack = normalizeKey(value);
  const needle = normalizeKey(query);
  if (!needle) return 1; // pusta fraza: wszystko pasuje tak samo słabo

  if (haystack.startsWith(needle)) return 60;
  if (haystack.split(' ').some((word) => word.startsWith(needle))) return 40;
  if (haystack.includes(needle)) return 20;

  // Ostatnia szansa: rdzeń. „magazyn" ma trafiać w „magazynier”, bo inaczej
  // podpowiedzi milkną dokładnie tam, gdzie polska odmiana jest najgęstsza.
  const needleStem = getPolishStem(needle);
  if (needleStem.length > 2 && haystack.split(' ').some((word) => getPolishStem(word) === needleStem)) {
    return 10;
  }

  return 0;
}

/** Wpisy, które użytkownik sam gdzieś w aplikacji podał. */
export function ownEntriesFor(
  field: SuggestionField,
  vault: MasterVault,
  applications: readonly JobApplication[]
): string[] {
  const values: string[] = [];

  switch (field) {
    case 'company':
      values.push(...vault.history.map((job) => job.company));
      values.push(...applications.map((application) => application.company));
      break;
    case 'jobTitle':
      values.push(vault.personalInfo.title);
      values.push(...vault.history.map((job) => job.role));
      values.push(...applications.map((application) => application.position));
      break;
    case 'location':
      values.push(vault.personalInfo.location);
      values.push(vault.profiler.location.city);
      values.push(...vault.history.map((job) => job.location));
      break;
    case 'hardSkill':
      values.push(...vault.skillsMatrix.hardSkills);
      break;
    case 'softSkill':
      values.push(...vault.skillsMatrix.softSkills);
      break;
    case 'tool':
      values.push(...vault.skillsMatrix.toolsAndTech);
      break;
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const trimmed = (value ?? '').trim();
    if (!trimmed) continue;
    const key = normalizeKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }
  return unique;
}

const DICTIONARIES: Record<SuggestionField, readonly string[]> = {
  company: [], // firm nie ma skąd wziąć ze słownika — to zawsze dane własne albo korpus
  jobTitle: SUGGESTED_JOB_TITLES,
  location: SUGGESTED_LOCATIONS,
  hardSkill: SUGGESTED_HARD_SKILLS,
  softSkill: SUGGESTED_SOFT_SKILLS,
  tool: SUGGESTED_TOOLS_AND_TECH,
};

/**
 * Propozycje z katalogu branż dla rozpoznanego zawodu.
 *
 * Sięgamy wyłącznie przez `getSuggestionsForSubRole`, nigdy przez `subRole`
 * bezpośrednio: `ProfessionSubRole` niesie też `sampleCompany`, `samplePeriod`
 * i `sampleMetrics`, czyli dane **przykładowe**. Wstawienie ich do CV byłoby
 * wpisaniem komuś zmyślonego pracodawcy (reguła 1), więc do tego modułu nie
 * mają wstępu nawet przypadkiem.
 */
function catalogEntriesFor(field: SuggestionField, vault: MasterVault): string[] {
  const signal = [
    vault.personalInfo.title,
    vault.history[0]?.role ?? '',
    vault.history[0]?.company ?? '',
    ...vault.skillsMatrix.hardSkills.slice(0, 5),
  ]
    .filter(Boolean)
    .join(' ');

  const [match] = matchSubRoles(signal, 1);
  if (!match) return [];

  const suggestions = getSuggestionsForSubRole(match.subRole.id);
  if (!suggestions) return [];

  switch (field) {
    case 'hardSkill':
      return [...suggestions.hardSkills, ...suggestions.certifications];
    case 'tool':
      return suggestions.tools;
    case 'softSkill':
      return suggestions.softSkills;
    case 'jobTitle':
      return [match.subRole.title];
    default:
      return [];
  }
}

/**
 * Podpowiedzi dla jednego pola, posortowane malejąco.
 *
 * Kolejność rozstrzyga najpierw jakość dopasowania, a dopiero w jej obrębie
 * źródło. Użytkownik, który wpisał „Warsz", celuje w „Warszawa" ze słownika,
 * a nie w „Zakład Warsztatowy" ze swojej historii — mimo że własne wpisy są
 * co do zasady cenniejsze. Przy trafieniu tej samej klasy własny wpis wygrywa.
 */
export function suggestForField(
  field: SuggestionField,
  query: string,
  context: SuggestionContext
): FormSuggestion[] {
  const { vault, applications, corpus = [], excluded = [], limit = DEFAULT_SUGGESTION_LIMIT } = context;

  const groups: Array<[SuggestionSource, readonly string[]]> = [
    ['own', ownEntriesFor(field, vault, applications)],
    ['catalog', catalogEntriesFor(field, vault)],
    ['corpus', corpus],
    ['dictionary', DICTIONARIES[field]],
  ];

  const excludedKeys = new Set(excluded.map(normalizeKey));
  // Wartość, którą użytkownik właśnie w całości wpisał, też jest „już wybrana" —
  // podpowiadanie mu tego, co ma przed oczami, to szum.
  excludedKeys.add(normalizeKey(query));

  const best = new Map<string, FormSuggestion>();

  for (const [source, values] of groups) {
    for (const value of values) {
      const trimmed = (value ?? '').trim();
      if (!trimmed) continue;

      const key = normalizeKey(trimmed);
      if (excludedKeys.has(key)) continue;

      const match = matchScore(trimmed, query);
      if (match === 0) continue;

      const candidate: FormSuggestion = {
        value: trimmed,
        source,
        reason: SOURCE_REASON[source],
        // Klasa trafienia mnożona, źródło dodawane: dzięki temu lepsze
        // dopasowanie zawsze wyprzedza gorsze, a źródło rozstrzyga remisy.
        score: match * 1000 + SOURCE_TIER[source],
      };

      // Ta sama wartość z dwóch źródeł zostaje raz, z wyższym wynikiem.
      const existing = best.get(key);
      if (!existing || candidate.score > existing.score) best.set(key, candidate);
    }
  }

  const ranked = [...best.values()].sort(
    (a, b) => b.score - a.score || a.value.localeCompare(b.value, 'pl')
  );

  // Pusta fraza to lista startowa, a nie „pierwsze osiem ze słownika". Bez
  // przekroju po branżach każdy — monter i księgowa tak samo — zobaczyłby na
  // starcie sam blok IT, bo tak są ułożone tablice źródłowe.
  if (!query.trim()) {
    const own = ranked.filter((item) => item.source !== 'dictionary');
    const dictionary = ranked.filter((item) => item.source === 'dictionary');
    return [...own, ...diversifiedSample(dictionary, Math.max(0, limit - own.length))].slice(0, limit);
  }

  return ranked.slice(0, limit);
}
