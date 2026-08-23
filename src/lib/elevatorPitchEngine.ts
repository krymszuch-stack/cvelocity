import { MasterVault, ElevatorPitchOutput } from '../types';

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
export function extractTopMetrics(vault: MasterVault): string[] {
  const metrics: string[] = [];

  for (const exp of vault.history || []) {
    for (const hl of exp.highlights || []) {
      if (hl.metric && hl.metric.trim()) {
        metrics.push(hl.metric.trim());
      }
    }
  }

  for (const proj of vault.projects || []) {
    if (proj.metrics && proj.metrics.trim()) {
      metrics.push(proj.metrics.trim());
    }
  }

  for (const claim of vault.claims || []) {
    if (claim.metric && claim.metric.trim()) {
      metrics.push(claim.metric.trim());
    }
  }

  return Array.from(new Set(metrics));
}

/**
 * Generator 3 wariantów Elevator Pitch (1-liner, 30s, 90s) na podstawie MasterVault
 */
export function generateElevatorPitch(
  vault: MasterVault,
  targetRoleOverride?: string
): ElevatorPitchOutput {
  const candidateName = vault.personalInfo?.fullName || 'Specjalista';
  const roleTitle =
    targetRoleOverride ||
    vault.personalInfo?.title ||
    vault.history?.[0]?.role ||
    'Doświadczony Specjalista';

  const summary = vault.personalInfo?.summary || '';
  const hardSkills = vault.skillsMatrix?.hardSkills || [];
  const tools = vault.skillsMatrix?.toolsAndTech || [];
  const allSkills = [...hardSkills, ...tools];
  const topSkillsStr = allSkills.slice(0, 3).join(', ') || 'kluczowe kompetencje techniczne';

  const metrics = extractTopMetrics(vault);
  const topMetric = metrics[0] || 'wymierną poprawę efektywności i stabilności procesów';
  const secondMetric = metrics[1] || 'wysoki standard jakościowy i zgodność ze standardami';

  const latestExp = vault.history?.[0];
  const companyContext = latestExp?.company ? `w ${latestExp.company}` : 'w ostatnich projektach';
  const roleContext = latestExp?.role || roleTitle;

  // 1. Wariant 1-Liner (~10-15s / ~15-20 słów)
  const oneLiner = summary
    ? `${summary.split('.')[0]}.`
    : `Jestem ${roleTitle}, który łączy ekspertyzę w ${topSkillsStr}, dostarczając ${topMetric}.`;

  // 2. Wariant 30-Sekundowy (~30-35s / ~65-75 słów)
  const thirtySeconds =
    `Jestem ${candidateName} — specjalizuję się jako ${roleTitle}. ` +
    `W ${companyContext} jako ${roleContext} odpowiadałem za kluczowe zadania z wykorzystaniem ${topSkillsStr}. ` +
    `Moje działania pozwoliły m.in. na osiągnięcie ${topMetric}. ` +
    `W kolejnym kroku chcę wykorzystać to doświadczenie na stanowisku ${roleTitle}, aby natychmiast wesprzeć zespół w realizacji celów operacyjnych.`;

  // 3. Wariant 90-Sekundowy (~80-90s / ~170-190 słów)
  const ninetySeconds =
    `Dzień dobry, nazywam się ${candidateName} i od lat rozwijam się jako ${roleTitle}. ` +
    `Moja ekspertyza koncentruje się wokół ${topSkillsStr}, ze szczególnym naciskiem na jakość wykonania i mierzalne rezultaty biznesowe.\n\n` +
    `W mojej dotychczasowej karierze, m.in. ${companyContext}, odpowiadałem za realizację złożonych zadań inżynieryjnych i procesowych. ` +
    `Jednym z moich kluczowych wdrożeń była optymalizacja procesów, w ramach której zidentyfikowałem wąskie gardła i wdrożyłem usprawnienia oparte na sprawdzonych standardach. ` +
    `Dzięki temu projekt przyniósł ${topMetric} oraz ${secondMetric}.\n\n` +
    `W pracy wyróżnia mnie systematyczność, dbałość o szczegóły oraz umiejętność sprawnego rozwiązywania problemów pod presją czasu. ` +
    `Aplikuję na to stanowisko, ponieważ Wasze wyzwania idealnie wpisują się w profil moich umiejętności i chcę wnieść bezpośrednią wartość od pierwszych tygodni współpracy.`;

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
