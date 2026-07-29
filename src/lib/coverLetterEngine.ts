import { CoverLetter, MasterVault } from '../types';

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

  // Extract key skills and technologies
  const allSkills = [
    ...(vault.skillsMatrix?.hardSkills || []),
    ...(vault.skillsMatrix?.toolsAndTech || []),
  ].filter(Boolean);
  const topSkillsStr = allSkills.slice(0, 5).join(', ');

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

  // Extract from experience history
  if (vault.history && vault.history.length > 0) {
    for (const exp of vault.history) {
      for (const h of exp.highlights) {
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

/**
 * Generates an Anti-Template Cover Letter using the fast Gemini Flash model (/api/generate-cover-letter).
 */
export async function generateCoverLetterWithAI(
  targetRole: string,
  companyName: string,
  jobDescription: string,
  vault: MasterVault
): Promise<CoverLetter> {
  const response = await fetch('/api/generate-cover-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vault,
      targetRole,
      companyName,
      jobDescription,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Nie udało się wygenerować listu przez Gemini Flash.');
  }

  const data = await response.json();
  return data.coverLetter;
}

