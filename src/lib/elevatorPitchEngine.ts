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
  const topMetric = metrics[0];
  const secondMetric = metrics[1];

  const latestExp = safeVault.history?.[0];
  const companyContext = latestExp?.company ? `w firmie ${latestExp.company}` : 'w dotychczasowej praktyce zawodowej';
  const roleContext = latestExp?.role || roleTitle;

  const idx = selectVariantIndex(variantIndex ?? candidateName + roleTitle, 4);

  // 1. Wariant 1-Liner (~10-15s / ~15-20 słów) - 4 zróżnicowane formuły oparte na faktach
  let oneLiner: string;
  if (summary && idx === 0) {
    oneLiner = `${summary.split('.')[0]}.`;
  } else if (topMetric) {
    const oneLinerTemplates = [
      `Jestem ${roleTitle}, który łączy umiejętności w ${topSkillsStr}, osiągając ${topMetric}.`,
      `Jako ${roleTitle} specjalizuję się w ${topSkillsStr}, z udokumentowanym wynikiem ${topMetric}.`,
      `Nazywam się ${candidateName} — w roli ${roleTitle} buduję stabilne rozwiązania oparte na ${topSkillsStr} (${topMetric}).`,
      `Jestem ${roleTitle} skoncentrowanym na ${topSkillsStr} i mierzalnym dowożeniu rezultatów (${topMetric}).`,
    ];
    oneLiner = oneLinerTemplates[idx % oneLinerTemplates.length];
  } else {
    const oneLinerTemplates = [
      `Jestem ${roleTitle}, który łączy praktyczne umiejętności w obszarze: ${topSkillsStr}.`,
      `Jako ${roleTitle} specjalizuję się w ${topSkillsStr}, stawiając na jakość i rzetelność wykonania.`,
      `Nazywam się ${candidateName} — w roli ${roleTitle} buduję stabilne rozwiązania oparte na ${topSkillsStr}.`,
      `Jestem ${roleTitle} skoncentrowanym na ${topSkillsStr} i profesjonalnym dowożeniu celów zawodowych.`,
    ];
    oneLiner = oneLinerTemplates[idx % oneLinerTemplates.length];
  }

  // 2. Wariant 30-Sekundowy (~30-35s / ~65-75 słów) - 4 zróżnicowane style narracji
  const metricSentence1 = topMetric ? `Moje działania pozwoliły m.in. na osiągnięcie ${topMetric}. ` : 'W codziennych zadaniach dbam o terminowość, dokładność i zgodność ze standardami. ';
  const metricSentence2 = topMetric ? `W dotychczasowej pracy przełożyło się to na ${topMetric}. ` : 'W pracy stawiam na samodzielność, rzetelność i ciągłe doskonalenie warsztatu. ';
  const metricSentence3 = topMetric ? `W ramach zrealizowanych zadań osiągnąłem m.in. ${topMetric}. ` : 'W ramach powierzonych obowiązków zawsze dbam o stabilność i wysoki standard wykonania. ';
  const metricSentence4 = topMetric ? `Wykorzystując ${topSkillsStr} ${companyContext}, zrealizowałem zadania przynoszące ${topMetric}. ` : `Pracując z ${topSkillsStr} ${companyContext}, konsekwentnie dowoziłem wyznaczone cele. `;

  const thirtySecondsTemplates = [
    // Wariant 1: Sprawdzony & Rezultatowy
    `Jestem ${candidateName} — specjalizuję się jako ${roleTitle}. ` +
      `${companyContext.charAt(0).toUpperCase() + companyContext.slice(1)} jako ${roleContext} odpowiadałem za kluczowe zadania z wykorzystaniem ${topSkillsStr}. ` +
      metricSentence1 +
      `W kolejnym kroku chcę wykorzystać to doświadczenie na stanowisku ${roleTitle}, aby natychmiast wesprzeć zespół w realizacji celów operacyjnych.`,

    // Wariant 2: Ekspercki & Narzędziowy
    `Nazywam się ${candidateName} i rozwijam warsztat zawodowy jako ${roleTitle}. ` +
      `Mój profil opiera się na znajomości ${topSkillsStr} oraz precyzyjnym podejściu do powierzonych zadań. ` +
      metricSentence2 +
      `Aplikuję, aby wnieść do Państwa projektów sprawdzoną wiedzę praktyczną i samodzielność od pierwszego dnia.`,

    // Wariant 3: Problem Solver & Biznesowy
    `Dzień dobry, z tej strony ${candidateName}. Jako ${roleTitle} łączę kompetencje merytoryczne z orientacją na cele. ` +
      `Pełniąc rolę ${roleContext} ${companyContext}, realizowałem zadania z obszaru ${topSkillsStr}. ` +
      metricSentence3 +
      `Środowisko ${topSkillsStr} to moja codzienna domena, a w nowej roli chcę pomóc zespołowi w osiąganiu wysokiej jakości.`,

    // Wariant 4: Bezpośredni & Gotowy do wdrożeń
    `Jestem ${candidateName} — w pracy na stanowisku ${roleTitle} stawiam na bezawaryjność, standardy i rzetelność. ` +
      metricSentence4 +
      `Szukam roli ${roleTitle}, w której moje przygotowanie zawodowe natychmiast wesprze zespół w bieżących wyzwaniach.`,
  ];
  const thirtySeconds = thirtySecondsTemplates[idx % thirtySecondsTemplates.length];

  // 3. Wariant 90-Sekundowy (~80-90s / ~170-190 słów) - rozbudowane autoprezentacje oparte na faktach
  const metricClause90A = topMetric
    ? `Dzięki systematycznemu podejściu zrealizowane zadania przyniosły m.in. ${topMetric}${secondMetric ? ` oraz ${secondMetric}` : ''}.\n\n`
    : `W codziennej praktyce koncentruję się na eliminacji błędów i utrzymaniu wysokich standardów jakościowych.\n\n`;

  const metricClause90B = topMetric
    ? `Przełożyło się to na konkretne rezultaty – w tym udokumentowane ${topMetric}${secondMetric ? `, a także ${secondMetric}` : ''}.\n\n`
    : `Każde zadanie traktuję jako okazję do podnoszenia efektywności i porządkowania procesów roboczych.\n\n`;

  const metricClause90C = topMetric
    ? `Do moich kluczowych rezultatów należy realizacja zadań skutkujących ${topMetric}${secondMetric ? ` oraz ${secondMetric}` : ''}.\n\n`
    : `W codziennej pracy priorytetem pozostaje dla mnie bezawaryjność i wysoka kultura wykonawcza.\n\n`;

  const ninetySecondsTemplates = [
    // Wariant A: Pełna ścieżka osiągnięć
    `Dzień dobry, nazywam się ${candidateName} i rozwijam się jako ${roleTitle}. ` +
      `Moje kompetencje koncentrują się wokół ${topSkillsStr}, ze szczególnym naciskiem na jakość wykonania i rzetelność.\n\n` +
      `W mojej dotychczasowej karierze, m.in. ${companyContext}, odpowiadałem za realizację zadań w roli ${roleContext}. ` +
      metricClause90A +
      `W pracy wyróżnia mnie systematyczność, dbałość o szczegóły oraz umiejętność sprawnego rozwiązywania problemów. ` +
      `Aplikuję na to stanowisko, ponieważ Państwa wyzwania idealnie wpisują się w profil moich umiejętności i chcę wnieść bezpośrednią wartość do zespołu.`,

    // Wariant B: Praktyka zawodowa i ciągłe doskonalenie
    `Dzień dobry, z tej strony ${candidateName}. Na co dzień pracuję jako ${roleTitle}, gdzie łączę wiedzę z zakresu ${topSkillsStr} z dyscypliną wykonawczą.\n\n` +
      `W dotychczasowej pracy, m.in. pełniąc rolę ${roleContext} ${companyContext}, skupiałem się na budowie trwałych i bezpiecznych rozwiązań. ` +
      metricClause90B +
      `Śledzę bieżące standardy branżowe, dzięki czemu potrafię dobrać optymalne narzędzia do konkretnego zadania. ` +
      `Jestem przekonany, że moje zaangażowanie i profil kompetencji okażą się realnym wsparciem w Państwa projektach.`,

    // Wariant C: Zespołowość, sprawczość i orientacja na cele
    `Dzień dobry! Nazywam się ${candidateName} i kandyduję na stanowisko ${roleTitle}. ` +
      `Moje doświadczenie zawodowe opiera się na praktyce z obszaru ${topSkillsStr}, gdzie zawsze priorytetem jest dla mnie wysoka kultura pracy.\n\n` +
      `Do moich doświadczeń należy praca ${companyContext}, gdzie jako ${roleContext} realizowałem powierzone obowiązki. ` +
      metricClause90C +
      `W relacjach zawodowych cenię klarowną komunikację, odpowiedzialność za powierzony obszar oraz rzetelność. ` +
      `Bardzo chętnie wniosę tę wiedzę i energię do Państwa organizacji.`,
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
