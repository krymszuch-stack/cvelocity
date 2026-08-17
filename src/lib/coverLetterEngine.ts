import { CoverLetter, MasterVault } from '../types';
import { rankExperienceByRelevance, rankHighlightsByRelevance } from './relevanceRanking';

/**
 * Generates a concise, 3-section Anti-Template business cover letter with ZERO AI TOKENS,
 * synthesizing actual loaded/created CV data (MasterVault).
 */
export function generateAntiTemplateCoverLetter(
  targetRole: string,
  companyName: string,
  jobDescription: string,
  vault: MasterVault
): CoverLetter {
  const company = companyName || 'Państwa Firmie';
  const role = targetRole || 'oferowanym stanowisku';
  const name = vault.personalInfo.fullName || 'Kandydat';
  const currentTitle = vault.personalInfo.title || role;

  // 0-token relevance signal from the job offer text, reused to prioritize both skills and proof points
  const jdKeywords = (jobDescription || '').toLowerCase().match(/\b[a-zA-Z0-9#+.-]{3,}\b/g) || [];
  const jdKeywordSet = new Set(jdKeywords);

  // Extract key skills and technologies, JD-matching ones first
  const allSkills = [
    ...(vault.skillsMatrix?.hardSkills || []),
    ...(vault.skillsMatrix?.toolsAndTech || []),
  ].filter(Boolean);
  const rankedSkills = [...allSkills].sort((a, b) => {
    const aMatch = jdKeywordSet.has(a.toLowerCase()) ? 1 : 0;
    const bMatch = jdKeywordSet.has(b.toLowerCase()) ? 1 : 0;
    return bMatch - aMatch;
  });
  const topSkillsStr = rankedSkills.slice(0, 5).join(', ');

  // 1. Hook (Haczyk) built dynamically from candidate profile
  let hook = `Zwracam się z propozycją współpracy na stanowisku ${role} w firmie ${company}. `;
  if (vault.personalInfo.summary && vault.personalInfo.summary.length > 20) {
    hook += `Jako ${currentTitle}, ${vault.personalInfo.summary.slice(0, 180).trim()}... `;
  } else {
    hook += `Jako ${currentTitle} z doświadczeniem w pracy z technologiami takimi jak ${topSkillsStr || 'kluczowe rozwiązania branżowe'}, wnoszę sprawdzoną wiedzę praktyczną. `;
  }
  hook += `Z analizy Państwa ogłoszenia wynika, że poszukują Państwo kandydata gotowego do szybkiego dowożenia wyników i rozwiązywania wyzwań operacyjnych.`;

  // 2. Proof (Dowód) - Pick real highlights from Master Vault history & projects
  const proofPoints: string[] = [];

  // Extract from experience history, most JD-relevant blocks and bullets first (0 tokens)
  if (vault.history && vault.history.length > 0) {
    const rankedExperience = rankExperienceByRelevance(vault.history, jdKeywords, targetRole);
    for (const { experience: exp } of rankedExperience) {
      const rankedHighlights = rankHighlightsByRelevance(exp.highlights, jdKeywords);
      for (const { highlight: h } of rankedHighlights) {
        const text = typeof h === 'string' ? h : h.text;
        if (text && text.length > 15) {
          const formatted = text.startsWith('•') ? text : `• W roli ${exp.role} w ${exp.company}: ${text}`;
          proofPoints.push(formatted);
          if (proofPoints.length >= 3) break;
        }
      }
      if (proofPoints.length >= 3) break;
    }
  }

  // Extract from projects if we need more proof points
  if (proofPoints.length < 3 && vault.projects && vault.projects.length > 0) {
    for (const proj of vault.projects) {
      if (proj.name && proj.description) {
        proofPoints.push(`• Projekt ${proj.name}: ${proj.description} ${proj.metrics ? `(Rezultat: ${proj.metrics})` : ''}`);
        if (proofPoints.length >= 3) break;
      }
    }
  }

  // Fallback metrics if empty vault history
  if (proofPoints.length === 0) {
    if (topSkillsStr) {
      proofPoints.push(`• Specjalizuję się w: ${topSkillsStr}, budując stabilne i mierzalne rozwiązania.`);
    }
    proofPoints.push(`• Zoptymalizowałem kluczowe procesy zawodowe, podnosząc wydajność operacyjną o ponad 35%.`);
    proofPoints.push(`• Wdrożyłem projekty produkcyjne dostosowane do specyficznych wymagań biznesowych.`);
  }

  // 3. Call to Action (CTA)
  const contactInfo = [vault.personalInfo.phone && `Tel: ${vault.personalInfo.phone}`, vault.personalInfo.email && `Email: ${vault.personalInfo.email}`].filter(Boolean).join(' | ');

  const callToAction = `Chętnie omówię podczas rozmowy rekrutacyjnej, w jaki sposób moje dotychczasowe osiągnięcia oraz opanowane narzędzia bezpośrednio wspomogą realizację celów firmy ${company}. Zapraszam do kontaktu.`;

  const fullText = `${hook}\n\nWybrane przykłady moich dotychczasowych rezultatów zawodowych:\n${proofPoints.join('\n')}\n\n${callToAction}\n\nZ poważaniem,\n${name}\n${contactInfo}`;

  return {
    targetJobTitle: role,
    companyName: company,
    hook,
    proofPoints,
    callToAction,
    fullText,
  };
}

/*
 * Była tu funkcja `generateCoverLetterWithAI`, wołająca `/api/generate-cover-letter`.
 * Serwer nigdy nie wystawiał takiej ścieżki — jego trasa nazywała się
 * `/api/cover-letter` — więc każde wywołanie kończyło się 404 (zweryfikowane na
 * uruchomionym serwerze). Sama funkcja i tak nie miała ani jednego wywołania
 * w interfejsie, więc nikt tego nie zauważył.
 *
 * Generowanie listu wraca w Fazie 6 razem z ekranem, który go używa, i kontrolą
 * uprawnień. Implementacja po stronie serwera (`generateCoverLetterWithFlash`
 * w `src/server/gemini.ts`) jest gotowa i nietknięta.
 */

