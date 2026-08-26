import { MasterVault, ElevatorPitchOutput } from '../types';
import { selectVariantIndex } from './phrasingVariations';

/**
 * Szacuje czas trwania wypowiedzi w sekundach przy średnim tempie mówienia w języku polskim (~130 słów/minutę).
 */
export function estimateSpeakingDurationSec(text: string, wordsPerMinute = 130): number {
  if (!text) return 0;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 0;
  return Math.max(1, Math.round((wordCount / wordsPerMinute) * 60));
}

/**
 * Pobiera kluczowe metryki z historii i projektów kandydata
 */
export function extractTopMetrics(vault: MasterVault | undefined | null): string[] {
  if (!vault) return [];
  const metrics: string[] = [];

  for (const exp of vault.history || []) {
    for (const rawHl of exp?.highlights || []) {
      const hl = rawHl as unknown;
      if (typeof hl === 'object' && hl !== null && 'metric' in hl && typeof (hl as { metric: unknown }).metric === 'string') {
        const m = (hl as { metric: string }).metric.trim();
        if (m) metrics.push(m);
      } else if (typeof hl === 'string') {
        const trimmed = hl.trim();
        if (trimmed) {
          const match = trimmed.match(/\d+[%kKmM+xX]?/);
          if (match) metrics.push(match[0]);
        }
      }
    }
  }

  for (const proj of vault.projects || []) {
    if (typeof proj === 'object' && proj !== null && typeof proj.metrics === 'string' && proj.metrics.trim()) {
      metrics.push(proj.metrics.trim());
    }
  }

  for (const claim of vault.claims || []) {
    if (typeof claim === 'object' && claim !== null && typeof claim.metric === 'string' && claim.metric.trim()) {
      metrics.push(claim.metric.trim());
    }
  }

  return Array.from(new Set(metrics));
}

/**
 * Czy pitch da się zbudować z faktów użytkownika, czy z szablonów zastępczych.
 *
 * Generator nigdy nie zwraca pustego tekstu — przy pustym profilu wpada
 * w zapasowe frazy („Specjalista", „wymierną poprawę efektywności"). Etykiety
 * typu „100% Vault Verified" muszą więc móc rozróżnić oba przypadki, zamiast
 * świecić zawsze (reguły 1–2).
 */
export function hasVaultEvidence(vault: MasterVault | Partial<MasterVault> | undefined | null): boolean {
  const safeVault = vault || ({} as MasterVault);
  const hasMetric = extractTopMetrics(safeVault as MasterVault).length > 0;
  const hasSummary = Boolean(safeVault.personalInfo?.summary?.trim());
  const hasSkills = (safeVault.skillsMatrix?.hardSkills || []).length > 0;
  return hasMetric || hasSummary || hasSkills;
}

/**
 * Generator 3 wariantów Elevator Pitch (1-liner, 30s, 90s) na podstawie MasterVault
 * Obsługuje opcjonalny `variantIndex` dla rotacji i eliminacji powtarzalności.
 */
export function generateElevatorPitch(
  vault: MasterVault | Partial<MasterVault> | undefined | null,
  targetRoleOverride?: string,
  variantIndex?: number
): ElevatorPitchOutput {
  const safeVault = vault || ({} as MasterVault);
  const candidateName = safeVault.personalInfo?.fullName || 'Specjalista';
  const roleTitle =
    targetRoleOverride ||
    safeVault.personalInfo?.title ||
    safeVault.history?.[0]?.role ||
    'Doświadczony Specjalista';

  const summary = safeVault.personalInfo?.summary || '';
  const hardSkills = safeVault.skillsMatrix?.hardSkills || [];
  const tools = safeVault.skillsMatrix?.toolsAndTech || [];
  const allSkills = [...hardSkills, ...tools];
  const topSkillsStr = allSkills.slice(0, 3).join(', ') || 'kluczowe kompetencje techniczne';

  const metrics = extractTopMetrics(safeVault as MasterVault);
  const topMetric = metrics[0] || 'wymierną poprawę efektywności i stabilności procesów';
  const secondMetric = metrics[1] || 'wysoki standard jakościowy i zgodność ze standardami';

  const latestExp = safeVault.history?.[0];
  const companyContext = latestExp?.company ? `w ${latestExp.company}` : 'w ostatnich projektach';
  const roleContext = latestExp?.role || roleTitle;

  const idx = selectVariantIndex(variantIndex ?? candidateName + roleTitle, 4);

  // 1. Wariant 1-Liner (~10-15s / ~15-20 słów) - 4 zróżnicowane formuły
  let oneLiner: string;
  if (summary && idx === 0) {
    oneLiner = `${summary.split('.')[0]}.`;
  } else {
    const oneLinerTemplates = [
      `Jestem ${roleTitle}, który łączy ekspertyzę w ${topSkillsStr}, dostarczając ${topMetric}.`,
      `Jako ${roleTitle} specjalizuję się w ${topSkillsStr}, przekładając wiedzę inżynierską na ${topMetric}.`,
      `Nazywam się ${candidateName} — w roli ${roleTitle} buduję stabilne rozwiązania oparte na ${topSkillsStr} z wynikiem ${topMetric}.`,
      `Jestem ${roleTitle} skoncentrowanym na ${topSkillsStr} i mierzalnym dowożeniu rezultatów operacyjnych.`,
    ];
    oneLiner = oneLinerTemplates[idx % oneLinerTemplates.length];
  }

  // 2. Wariant 30-Sekundowy (~30-35s / ~65-75 słów) - 4 zróżnicowane style narracji
  const thirtySecondsTemplates = [
    // Wariant 1: Sprawdzony & Rezultatowy
    `Jestem ${candidateName} — specjalizuję się jako ${roleTitle}. ` +
      `W ${companyContext} jako ${roleContext} odpowiadałem za kluczowe zadania z wykorzystaniem ${topSkillsStr}. ` +
      `Moje działania pozwoliły m.in. na osiągnięcie ${topMetric}. ` +
      `W kolejnym kroku chcę wykorzystać to doświadczenie na stanowisku ${roleTitle}, aby natychmiast wesprzeć zespół w realizacji celów operacyjnych.`,

    // Wariant 2: Ekspercki & Narzędziowy
    `Nazywam się ${candidateName} i od lat rozwijam warsztat jako ${roleTitle}. ` +
      `Mój profil opiera się na biegłej znajomości ${topSkillsStr} oraz precyzyjnym podejściu do wdrożeń. ` +
      `W dotychczasowej pracy, m.in. ${companyContext}, przełożyło się to na ${topMetric}. ` +
      `Aplikuję, aby wnieść do Państwa projektów sprawdzoną wiedzę praktyczną i samodzielność od pierwszego dnia.`,

    // Wariant 3: Problem Solver & Biznesowy
    `Dzień dobry, z tej strony ${candidateName}. Jako ${roleTitle} łączę kompetencje techniczne z orientacją na mierzalne cele. ` +
      `W ramach roli ${roleContext} ${companyContext} zoptymalizowałem kluczowe procesy, osiągając ${topMetric}. ` +
      `Środowisko ${topSkillsStr} to moja codzienna domena, a w nowej roli chcę pomóc zespołowi w osiąganiu przewagi jakościowej.`,

    // Wariant 4: Bezpośredni & Gotowy do wdrożeń
    `Jestem ${candidateName} — w pracy na stanowisku ${roleTitle} stawiam na bezawaryjność, standardy i wymierne wskaźniki. ` +
      `Wykorzystując ${topSkillsStr} ${companyContext}, zrealizowałem projekty przynoszące ${topMetric}. ` +
      `Szukam roli ${roleTitle}, w której moje przygotowanie techniczne natychmiast odciąży zespół w najbardziej wymagających zadaniach.`,
  ];
  const thirtySeconds = thirtySecondsTemplates[idx % thirtySecondsTemplates.length];

  // 3. Wariant 90-Sekundowy (~80-90s / ~170-190 słów) - 3 zróżnicowane rozbudowane autoprezentacje
  const ninetySecondsTemplates = [
    // Wariant A: Pełna ścieżka osiągnięć
    `Dzień dobry, nazywam się ${candidateName} i od lat rozwijam się jako ${roleTitle}. ` +
      `Moja ekspertyza koncentruje się wokół ${topSkillsStr}, ze szczególnym naciskiem na jakość wykonania i mierzalne rezultaty biznesowe.\n\n` +
      `W mojej dotychczasowej karierze, m.in. ${companyContext}, odpowiadałem za realizację złożonych zadań inżynieryjnych i procesowych. ` +
      `Jednym z moich kluczowych wdrożeń była optymalizacja procesów, w ramach której zidentyfikowałem wąskie gardła i wdrożyłem usprawnienia oparte na sprawdzonych standardach. ` +
      `Dzięki temu projekt przyniósł ${topMetric} oraz ${secondMetric}.\n\n` +
      `W pracy wyróżnia mnie systematyczność, dbałość o szczegóły oraz umiejętność sprawnego rozwiązywania problemów pod presją czasu. ` +
      `Aplikuję na to stanowisko, ponieważ Wasze wyzwania idealnie wpisują się w profil moich umiejętności i chcę wnieść bezpośrednią wartość od pierwszych tygodni współpracy.`,

    // Wariant B: Inżynieria, architektura i ciągłe doskonalenie
    `Dzień dobry, z tej strony ${candidateName}. Na co dzień pracuję jako ${roleTitle}, gdzie łączę wiedzę techniczną z zakresu ${topSkillsStr} z dyscypliną wykonawczą.\n\n` +
      `W dotychczasowych projektach, m.in. pełniąc rolę ${roleContext} ${companyContext}, skupiałem się na budowie trwałych i bezpiecznych rozwiązań. ` +
      `Przełożyło się to na konkretne sukcesy operacyjne – w tym udokumentowane ${topMetric}, a także ${secondMetric}. ` +
      `Każde zadanie traktuję jako okazję do eliminacji powtarzalnych błędów i podnoszenia efektywności całego zespołu.\n\n` +
      `Śledzę bieżące trendy i standardy branżowe, dzięki czemu potrafię dobrać optymalne narzędzia do konkretnego problemu biznesowego. ` +
      `Jestem przekonany, że moje zaangażowanie i profil kompetencji okażą się realnym wsparciem w Państwa bieżących projektach.`,

    // Wariant C: Zespołowość, sprawczość i orientacja na cele
    `Dzień dobry! Nazywam się ${candidateName} i kandyduję na stanowisko ${roleTitle}. ` +
      `Moje doświadczenie zawodowe opiera się na wieloletniej praktyce z technologiami ${topSkillsStr}, gdzie zawsze priorytetem jest dla mnie wysoka kultura techniczna.\n\n` +
      `Do moich najważniejszych doświadczeń należy praca ${companyContext}, gdzie jako ${roleContext} z sukcesem przeprowadziłem wdrożenia skutkujące ${topMetric}. ` +
      `Równolegle dbałem o stabilność bieżących operacji, co pozwoliło zapewnić ${secondMetric}.\n\n` +
      `W relacjach zawodowych cenię klarowną komunikację, odpowiedzialność za powierzony obszar oraz otwartość na poszukiwanie nieszablonowych rozwiązań. ` +
      `Bardzo chętnie wniosę tę energię i know-how do Państwa organizacji.`,
  ];
  const ninetySeconds = ninetySecondsTemplates[idx % ninetySecondsTemplates.length];

  return {
    oneLiner,
    thirtySeconds,
    ninetySeconds,
    metricsUsed: metrics.slice(0, 3),
    targetRole: roleTitle,
    estimatedDurationSec: {
      oneLiner: estimateSpeakingDurationSec(oneLiner),
      thirtySeconds: estimateSpeakingDurationSec(thirtySeconds),
      ninetySeconds: estimateSpeakingDurationSec(ninetySeconds),
    },
  };
}
