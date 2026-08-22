import {
  SECTOR_CATEGORIES,
  type ProfessionSubRole,
  type SectorCategory,
} from '../data/specializations';
import { getPolishStem, HR_AND_COMMON_STOP_WORDS } from './atsSimulator';
import type { FlagCategory } from '../types';

/**
 * Dostęp do katalogu zawodów.
 *
 * `src/data/specializations.ts` istniał od dawna — 12 sektorów, 20 podról,
 * z markami sprzętu, uprawnieniami i słownictwem branżowym — i **nie był
 * importowany przez żaden plik w projekcie**. Efekt był taki, że monter kotłów
 * gazowych, spawacz TIG czy operator wózka widłowego byli w tym produkcie
 * opisani co do szczegółu i jednocześnie nieobsłużeni.
 *
 * Ten moduł jest brakującym połączeniem. Działa w całości lokalnie, na
 * dopasowaniu tekstowym — nie kosztuje ani jednego tokenu, więc może stać za
 * funkcją darmową bez limitu.
 */

export interface SubRoleMatch {
  sector: SectorCategory;
  subRole: ProfessionSubRole;
  /** Liczba trafionych sygnałów. Im wyżej, tym pewniejsze dopasowanie. */
  score: number;
  /** Co konkretnie trafiło — pokazywane użytkownikowi zamiast samej liczby. */
  matchedSignals: string[];
}

export function getAllSectors(): SectorCategory[] {
  return SECTOR_CATEGORIES;
}

/**
 * Sektory, w których rekrutacja jest wolumenowa i odsiewa mechanicznie:
 * uprawnienia, kategoria prawa jazdy, orzeczenie, dyspozycyjność zmianowa.
 * W nich czytelność dokumentu dla parsera i wymagania formalne decydują
 * wcześniej niż gęstość słów kluczowych.
 *
 * Medycyna jest tu razem z zawodami technicznymi celowo: pielęgniarka
 * i fizjoterapeuta odpadają na prawie wykonywania zawodu i dyspozycyjności
 * dyżurowej, a nie na tym, jak opisali swoje kompetencje miękkie.
 */
const PHYSICAL_SECTOR_IDS = new Set([
  'hvac_installations',
  'electrical_energy',
  'logistics_ecom',
  'construction_finishing',
  'automotive_repair',
  'production_cnc',
  'medical_healthcare',
]);

/**
 * Profil raportu sugerowany przez branżę.
 *
 * To jest **sugestia**, nie rozstrzygnięcie: `vault.profiler.flags` ustawione
 * ręcznie przez użytkownika ma pierwszeństwo. Wpływa wyłącznie na kolejność
 * zaleceń, nigdy na sam wynik — ta sama treść CV nie może dostawać różnych
 * ocen zależnie od rozpoznanej branży.
 */
export function suggestedProfileForSector(sectorId: string): FlagCategory {
  return PHYSICAL_SECTOR_IDS.has(sectorId) ? 'PHYSICAL' : 'OFFICE_IT';
}

export function findSubRoleById(
  id: string
): { sector: SectorCategory; subRole: ProfessionSubRole } | undefined {
  for (const sector of SECTOR_CATEGORIES) {
    const subRole = sector.subRoles.find((role) => role.id === id);
    if (subRole) return { sector, subRole };
  }
  return undefined;
}

export function findSectorById(id: string): SectorCategory | undefined {
  return SECTOR_CATEGORIES.find((sector) => sector.id === id);
}

/**
 * Waga sygnałów. Marka sprzętu i uprawnienie są mocniejszym dowodem branży niż
 * pojedyncze słowo z tytułu: „Junkers" albo „SEP G3" nie pada przypadkiem,
 * a „technik" pada w połowie ogłoszeń.
 */
const SIGNAL_WEIGHTS = {
  title: 3,
  certification: 4,
  brand: 4,
  vocabulary: 2,
  tool: 2,
  hardSkill: 2,
} as const;

/** Rozbija frazę na rdzenie, odrzucając szum rekrutacyjny i krótkie słowa. */
function toStems(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .split(/[\s,./()\-–—]+/)
    .filter((word) => word.length > 2 && !HR_AND_COMMON_STOP_WORDS.has(word))
    .map(getPolishStem)
    .filter(Boolean);
}

/**
 * Ile rdzeni liczy fraza, której **wszystkie** człony występują w tekście.
 * Zwraca `0`, gdy choć jednego brakuje.
 *
 * Dopasowanie po rdzeniach, a nie po dosłownym ciągu znaków: ogłoszenie pisze
 * „montaż klimatyzatorów", katalog „Montaż Klimatyzatorów Split", a CV
 * „montowałem klimatyzację". Bez stemmera żadna z tych par by się nie spotkała.
 *
 * Zwracamy długość, a nie `true`, bo o sile dowodu decyduje **specyficzność
 * frazy**, nie sama liczba trafień. Pełne trafienie „Montaż Klimatyzatorów
 * Split" mówi o branży znacznie więcej niż trafienie słowa „montaż", które
 * pada w połowie ogłoszeń technicznych.
 */
const MAX_SPECIFICITY = 4;

function phraseSpecificity(phrase: string, textStems: Set<string>): number {
  const stems = toStems(phrase);
  if (stems.length === 0) return 0;
  if (!stems.every((stem) => textStems.has(stem))) return 0;

  // Górne ograniczenie, żeby jedna bardzo długa fraza nie przeważyła całej reszty.
  return Math.min(stems.length, MAX_SPECIFICITY);
}

/**
 * Dopasowuje treść ogłoszenia (albo CV) do podroli z katalogu.
 *
 * Zwraca listę posortowaną malejąco. Wynik zerowy jest odfiltrowany — lepiej
 * nie zaproponować niczego niż zaproponować przypadkową branżę, bo użytkownik
 * nie ma jak zweryfikować, skąd wzięła się sugestia.
 */
export function matchSubRoles(text: string, limit = 3): SubRoleMatch[] {
  const source = (text ?? '').trim();
  if (source.length === 0) return [];

  const textStems = new Set(toStems(source));
  if (textStems.size === 0) return [];

  const matches: SubRoleMatch[] = [];

  for (const sector of SECTOR_CATEGORIES) {
    for (const subRole of sector.subRoles) {
      let score = 0;
      const matchedSignals: string[] = [];

      const signalGroups: Array<[readonly string[] | undefined, number]> = [
        [subRole.title.split(/\s*[&/]\s*/), SIGNAL_WEIGHTS.title],
        [subRole.certificationsAndQualifications, SIGNAL_WEIGHTS.certification],
        [subRole.brandsAndManufacturers, SIGNAL_WEIGHTS.brand],
        [subRole.specializedVocabulary, SIGNAL_WEIGHTS.vocabulary],
        [subRole.suggestedTools, SIGNAL_WEIGHTS.tool],
        [subRole.suggestedHardSkills, SIGNAL_WEIGHTS.hardSkill],
      ];

      for (const [phrases, weight] of signalGroups) {
        for (const phrase of phrases ?? []) {
          const specificity = phraseSpecificity(phrase, textStems);
          if (specificity === 0) continue;
          score += weight * specificity;
          matchedSignals.push(phrase);
        }
      }

      if (score > 0) matches.push({ sector, subRole, score, matchedSignals });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Najlepsze dopasowanie albo `null`, gdy nic nie trafiło wystarczająco pewnie. */
export function bestSubRoleMatch(text: string, minimumScore = 4): SubRoleMatch | null {
  const [best] = matchSubRoles(text, 1);
  return best && best.score >= minimumScore ? best : null;
}

/**
 * Propozycje do uzupełnienia profilu — **nigdy nie wpisywane automatycznie**.
 *
 * To nie jest ostrożność dla samej ostrożności. Ten projekt raz już usunął
 * fabrykowane dane z parserów, a `SECURITY.md` opiera się na zdaniu, że nic tu
 * niczego nie dopisuje za użytkownika. Wstawienie komuś „Analiza spalin
 * analizatorem Testo" dlatego, że wybrał branżę, łamałoby dokładnie tę zasadę —
 * i byłoby kłamstwem w dokumencie, którym ta osoba szuka pracy.
 */
export interface SubRoleSuggestions {
  hardSkills: string[];
  tools: string[];
  vocabulary: string[];
  certifications: string[];
  softSkills: string[];
}

export function getSuggestionsForSubRole(subRoleId: string): SubRoleSuggestions | null {
  const found = findSubRoleById(subRoleId);
  if (!found) return null;

  const { subRole } = found;
  return {
    hardSkills: subRole.suggestedHardSkills ?? [],
    tools: subRole.suggestedTools ?? [],
    vocabulary: subRole.specializedVocabulary ?? [],
    certifications: subRole.certificationsAndQualifications ?? [],
    softSkills: subRole.suggestedSoftSkills ?? [],
  };
}
