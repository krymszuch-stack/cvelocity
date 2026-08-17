import { MasterVault, TailoredResume, AtsCheckResult } from '../types';
import { parseTextToMasterVault, type ParsedCVResult } from './cvUniversalParser';
import { createEmptyVault } from './sampleVault';
import { simulateAtsCheck } from './atsSimulator';

/**
 * Szybkie sprawdzenie CV pod kątem oferty — bez konta, bez serwera.
 *
 * To jest logika klina wejściowego: użytkownik wkleja CV i ogłoszenie, dostaje
 * wynik w kilka sekund i nie zakłada po drodze żadnego konta. Cała ścieżka jest
 * **czysto lokalna** — żadne z tych wywołań nie sięga do sieci, więc dokument
 * nie opuszcza urządzenia. To jedyna rzecz, której portal pracy nie może
 * skopiować, bo jego model wymaga dokładnie odwrotnego.
 *
 * Funkcja jest wydzielona z komponentu celowo: dzięki temu da się ją przetestować
 * bez renderowania interfejsu i bez atrapy przeglądarki.
 */

export interface QuickCheckResult {
  ats: AtsCheckResult;
  vault: MasterVault;
  parsed: ParsedCVResult;
  /** Braki wypisane wprost — to jest ta wartość, którą użytkownik pokazuje dalej. */
  missingSkills: string[];
}

/**
 * Odsiewa z listy braków fragmenty zdań, które nie są umiejętnościami.
 *
 * `extractDynamicJdPhrases` wyciąga z ogłoszenia frazy, więc obok „Kubernetes"
 * trafiają się resztki w rodzaju „senior backend developera." — z kropką na
 * końcu. Na stronie wejściowej to jest szczególnie kosztowne: lista braków jest
 * całą wartością tego ekranu, a jedna bzdura w niej podważa cały wynik.
 *
 * Filtrujemy przy prezentacji, a nie w `atsSimulator` — sam scoring działa
 * dobrze i nie ma powodu ruszać go dla kosmetyki wyświetlania.
 */
function looksLikeSkill(phrase: string): boolean {
  const value = phrase.trim();
  if (value.length < 2 || value.length > 32) return false;

  // Zdania kończą się kropką; nazwy technologii (Node.js, ASP.NET) nie.
  if (/[.!?;:]$/.test(value)) return false;

  // Umiejętność to zwykle jedno–trzy słowa. Dłuższe ciągi to fragmenty zdań.
  if (value.split(/\s+/).length > 3) return false;

  // Musi zawierać litery — same liczby albo znaki interpunkcyjne to szum.
  return /\p{L}/u.test(value);
}

export function meaningfulMissingSkills(
  missingHard: string[] = [],
  missingSoft: string[] = []
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const phrase of [...missingHard, ...missingSoft]) {
    const value = (phrase ?? '').trim();
    if (!looksLikeSkill(value)) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

export class QuickCheckError extends Error {
  constructor(
    message: string,
    readonly field: 'cv' | 'jd'
  ) {
    super(message);
    this.name = 'QuickCheckError';
  }
}

/** Poniżej tylu znaków nie ma z czego liczyć sensownego wyniku. */
export const MIN_CV_CHARS = 120;
export const MIN_JD_CHARS = 80;

/** Buduje profil z surowego tekstu CV, nie dopisując niczego, czego w nim nie ma. */
export function vaultFromParsedCv(parsed: ParsedCVResult): MasterVault {
  const vault = createEmptyVault(parsed.personalInfo.fullName, parsed.personalInfo.email);

  return {
    ...vault,
    personalInfo: { ...vault.personalInfo, ...parsed.personalInfo },
    skillsMatrix: {
      ...vault.skillsMatrix,
      hardSkills: parsed.hardSkills,
      softSkills: parsed.softSkills,
      toolsAndTech: parsed.toolsAndTech,
      certifications: parsed.certifications,
    },
    history: parsed.history,
    education: parsed.education,
    rawText: parsed.rawText,
  } as MasterVault;
}

/**
 * Składa „życiorys pod ofertę" wyłącznie z tego, co jest w profilu.
 *
 * `atsScore` startuje z zera, a nie z optymistycznej wartości — właściwy wynik
 * nadpisuje je zaraz po symulacji. Wstawienie tu liczby w rodzaju 92 sprawiłoby,
 * że przy błędzie symulacji użytkownik zobaczyłby wysoką ocenę wziętą z powietrza.
 */
function tailoredFromVault(vault: MasterVault, jobTitle: string): TailoredResume {
  return {
    targetJobTitle: jobTitle,
    companyName: '',
    summary: vault.personalInfo.summary || '',
    selectedHighlights: vault.history.flatMap((experience) =>
      experience.highlights.map((highlight) => ({
        experienceId: experience.id,
        role: experience.role,
        company: experience.company,
        originalText: highlight.text,
        optimizedText: highlight.text,
        source: 'SLOT_FILLING' as const,
        keywordsMatched: highlight.keywords || [],
      }))
    ),
    skillsMatched: {
      hardSkills: vault.skillsMatrix?.hardSkills || [],
      toolsAndTech: vault.skillsMatrix?.toolsAndTech || [],
      softSkills: vault.skillsMatrix?.softSkills || [],
    },
    atsScore: 0,
  };
}

/**
 * Pełna ścieżka: surowy tekst CV + treść ogłoszenia → wynik ATS.
 *
 * Świadomie **nie** zwracamy `gapAnalysis` (analizy przerw w zatrudnieniu).
 * Wnioskowanie z luk w historii zawodowej może pośrednio dotykać zdrowia albo
 * macierzyństwa, więc nie jest to rzecz, którą eksponuje się na stronie
 * wejściowej. Zostaje w pełnym raporcie, po stronie klienta, i nigdzie się
 * nie zapisuje — zgodnie z decyzją zapisaną w rejestrze czynności.
 */
export function runQuickAtsCheck(
  cvText: string,
  jdText: string,
  options: { format?: string; jobTitle?: string } = {}
): QuickCheckResult {
  const cv = (cvText ?? '').trim();
  const jd = (jdText ?? '').trim();

  if (cv.length < MIN_CV_CHARS) {
    throw new QuickCheckError(
      'Wklej pełną treść CV — na tak krótkim fragmencie nie da się policzyć rzetelnego wyniku.',
      'cv'
    );
  }

  if (jd.length < MIN_JD_CHARS) {
    throw new QuickCheckError('Wklej treść ogłoszenia, do którego chcesz się dopasować.', 'jd');
  }

  const parsed = parseTextToMasterVault(cv, options.format || 'TXT');
  const vault = vaultFromParsedCv(parsed);
  const ats = simulateAtsCheck(tailoredFromVault(vault, options.jobTitle || ''), vault, jd);

  return {
    ats,
    vault,
    parsed,
    missingSkills: meaningfulMissingSkills(ats.missingHardSkills, ats.missingSoftSkills),
  };
}
