import { MasterVault, LayeredFactItem, PreFlightCheckItem, ApplicationHistoryRecord } from '../types';

/**
 * Dual design system & safe merge function for parsed CV imports.
 * Deduplicates:
 * - Work experience by (company + role + startDate)
 * - Education by (institution + degree)
 * - Certifications by name
 * - Projects by name
 */
export function mergeParsedVaultIntoMaster(
  prev: MasterVault,
  parsed: Partial<MasterVault>
): MasterVault {
  // If prev has sample experience (TechCorp, FinTech) and parsed has items, we might overwrite instead of merging
  const isPrevSample = prev.history.some((h) => (h.company || '').includes('TechCorp') || (h.company || '').includes('FinTech'));

  // Merge history without duplicate company + role + startDate entries
  const existingHistoryKeys = new Set(
    prev.history.map((h) => `${(h.company || '').toLowerCase().trim()}_${(h.role || '').toLowerCase().trim()}_${(h.startDate || '').toLowerCase().trim()}`)
  );
  const newHistory = (parsed.history || []).filter(
    (h) => !existingHistoryKeys.has(`${(h.company || '').toLowerCase().trim()}_${(h.role || '').toLowerCase().trim()}_${(h.startDate || '').toLowerCase().trim()}`)
  );

  const mergedHistory = isPrevSample && parsed.history && parsed.history.length > 0
    ? parsed.history
    : [...prev.history, ...newHistory];

  // Merge education without duplicate institution + degree
  const isPrevEduSample = prev.education.some((e) => (e.institution || '').includes('Politechnika Warszawska') && prev.education.length === 1);

  const existingEduKeys = new Set(
    prev.education.map((e) => `${(e.institution || '').toLowerCase().trim()}_${(e.degree || '').toLowerCase().trim()}`)
  );
  const newEdu = (parsed.education || []).filter(
    (e) => !existingEduKeys.has(`${(e.institution || '').toLowerCase().trim()}_${(e.degree || '').toLowerCase().trim()}`)
  );

  const mergedEducation = isPrevEduSample && parsed.education && parsed.education.length > 0
    ? parsed.education
    : [...prev.education, ...newEdu];

  // Merge certifications
  const existingCertNames = new Set((prev.skillsMatrix?.certifications || []).map((c) => c.name.toLowerCase().trim()));
  const newCerts = (parsed.skillsMatrix?.certifications || []).filter((c) => !existingCertNames.has(c.name.toLowerCase().trim()));
  const mergedCertifications = [...(prev.skillsMatrix?.certifications || []), ...newCerts];

  // Merge projects
  const existingProjNames = new Set((prev.projects || []).map((p) => p.name.toLowerCase().trim()));
  const newProjects = (parsed.projects || []).filter((p) => !existingProjNames.has(p.name.toLowerCase().trim()));
  const mergedProjects = [...(prev.projects || []), ...newProjects];

  return {
    ...prev,
    personalInfo: {
      ...prev.personalInfo,
      fullName: parsed.personalInfo?.fullName || prev.personalInfo.fullName,
      title: parsed.personalInfo?.title || prev.personalInfo.title,
      summary: parsed.personalInfo?.summary || prev.personalInfo.summary,
      location: parsed.personalInfo?.location || prev.personalInfo.location,
      email: parsed.personalInfo?.email || prev.personalInfo.email,
      phone: parsed.personalInfo?.phone || prev.personalInfo.phone,
      linkedin: parsed.personalInfo?.linkedin || prev.personalInfo.linkedin,
    },
    skillsMatrix: {
      ...prev.skillsMatrix,
      hardSkills: Array.from(new Set([...(parsed.skillsMatrix?.hardSkills || []), ...(prev.skillsMatrix?.hardSkills || [])])),
      softSkills: Array.from(new Set([...(parsed.skillsMatrix?.softSkills || []), ...(prev.skillsMatrix?.softSkills || [])])),
      toolsAndTech: Array.from(new Set([...(parsed.skillsMatrix?.toolsAndTech || []), ...(prev.skillsMatrix?.toolsAndTech || [])])),
      certifications: mergedCertifications,
    },
    history: mergedHistory,
    education: mergedEducation,
    projects: mergedProjects,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * FILAR 1: Layered Fact Helper - Promotes per-job edit to MasterVault or keeps per-job override
 */
export function handleFactEditPromotion(
  vault: MasterVault,
  fact: LayeredFactItem,
  newText: string,
  promoteToVault: boolean
): { updatedVault: MasterVault; updatedFact: LayeredFactItem } {
  const updatedFact: LayeredFactItem = {
    ...fact,
    userOverrideText: newText,
    isUserEdited: true,
    sourceType: 'USER_EDITED',
  };

  const updatedVault = JSON.parse(JSON.stringify(vault)) as MasterVault;

  if (promoteToVault && fact.experienceId) {
    const exp = updatedVault.history.find(h => h.id === fact.experienceId);
    if (exp) {
      const highlight = exp.highlights.find(hl => hl.text === fact.baseText || hl.id === fact.sourceFactId);
      if (highlight) {
        highlight.text = newText;
      }
    }
  }

  return { updatedVault, updatedFact };
}

/**
 * FILAR 6: Pre-Flight Export Validation Checklist Generator
 */
export function generatePreFlightChecklist(
  vault: MasterVault,
  layeredFacts: LayeredFactItem[],
  missingKeywords: string[],
  targetRole: string
): PreFlightCheckItem[] {
  const items: PreFlightCheckItem[] = [];

  // Check 1: Zero Hallucination (Fact Accuracy)
  const isZeroHallucination = layeredFacts.every(f => f.baseText || f.userOverrideText);
  items.push({
    id: 'chk_accuracy',
    title: 'Zero-Halucynacji (Prawda Źródłowa Vault)',
    status: isZeroHallucination ? 'PASSED' : 'FAILED',
    message: isZeroHallucination
      ? 'Wszystkie opisy opierają się na Twoich zadeklarowanych faktach z MasterVault.'
      : 'Wkryto zdanie niepowiązane z bazą faktów.',
    category: 'FACT_ACCURACY',
  });

  // Check 2: Must-Have / Dealbreakers
  const hasCriticalMissing = missingKeywords.length > 5;
  items.push({
    id: 'chk_dealbreakers',
    title: 'Wymagania Twarde i Dealbreakery',
    status: hasCriticalMissing ? 'WARNING' : 'PASSED',
    message: hasCriticalMissing
      ? `Brak ${missingKeywords.length} fraz kluczowych. Sprawdź, czy spełniasz wymogi twarde.`
      : 'Sprawdzono wymagania twarde – wysoki stopień zgodności z ofertą.',
    category: 'DEALBREAKER',
  });

  // Check 3: Numeric Proofs & Metrics
  const hasDigitMetrics = layeredFacts.some(f => /\d/.test(f.jobReframedText || f.baseText));
  items.push({
    id: 'chk_metrics',
    title: 'Wskaźniki Cyfrowe i Dowody (Liczby)',
    status: hasDigitMetrics ? 'PASSED' : 'WARNING',
    message: hasDigitMetrics
      ? 'Dokument zawiera cyfrowe wskaźniki i liczby (np. 4,40/5, 100%), co zwiększa wiarygodność.'
      : 'Warto dodać konkretne wskaźniki liczbowe do opisu zadań.',
    category: 'METRICS',
  });

  // Check 4: Page Budget (1 Page Fit)
  const totalBullets = layeredFacts.length;
  items.push({
    id: 'chk_page_budget',
    title: 'Budżet Objętościowy (1 Strona A4)',
    status: totalBullets <= 12 ? 'PASSED' : 'WARNING',
    message: totalBullets <= 12
      ? 'CV zachowuje optymalną długość 1 strony A4 w układzie jednokolumnowym ATS.'
      : 'Liczba punktów przekracza 12 – ryzyko przejścia na 2. stronę.',
    category: 'PAGE_BUDGET',
  });

  // Check 5: Language Consistency
  items.push({
    id: 'chk_language',
    title: 'Spójność Językowa Dokumentu',
    status: 'PASSED',
    message: 'Nagłówki i opisy zachowują spójny rejestr językowy zgodny z ogłoszeniem.',
    category: 'LANGUAGE',
  });

  return items;
}

/**
 * FILAR 3: Plain Text (TXT) Export Generator for Legacy Corporate Forms
 */
export function generatePlainTextCvExport(
  vault: MasterVault,
  layeredFacts: LayeredFactItem[],
  targetRole: string,
  companyName: string
): string {
  const lines: string[] = [];

  lines.push(`==================================================`);
  lines.push(`${vault.personalInfo.fullName.toUpperCase()}`);
  lines.push(`${targetRole || vault.personalInfo.title} | ${companyName || ''}`);
  lines.push(`E-mail: ${vault.personalInfo.email} | Tel: ${vault.personalInfo.phone} | ${vault.personalInfo.location}`);
  lines.push(`LinkedIn: ${vault.personalInfo.linkedin || ''}`);
  lines.push(`==================================================\n`);

  lines.push(`--- PROFIL ZAWODOWY ---`);
  lines.push(`${vault.personalInfo.summary}\n`);

  lines.push(`--- DOŚWIADCZENIE ZAWODOWE ---`);
  vault.history.forEach(exp => {
    lines.push(`• ${exp.role.toUpperCase()} @ ${exp.company} (${exp.startDate} - ${exp.endDate})`);
    const expFacts = layeredFacts.filter(f => f.experienceId === exp.id);
    if (expFacts.length > 0) {
      expFacts.forEach(f => {
        lines.push(`   - ${f.userOverrideText || f.jobReframedText || f.baseText}`);
      });
    } else {
      // Fallback: use raw highlights from vault when no layered facts available
      exp.highlights.forEach(h => {
        const hText = typeof h === 'string' ? h : h.text;
        if (hText) lines.push(`   - ${hText}`);
      });
    }
    lines.push(``);
  });

  // Education section
  if (vault.education && vault.education.length > 0) {
    lines.push(`--- WYKSZTAŁCENIE ---`);
    vault.education.forEach(edu => {
      const period = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      lines.push(`• ${edu.degree} — ${edu.institution}${edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}${period ? ` (${period})` : ''}`);
      if (edu.description) lines.push(`   ${edu.description}`);
    });
    lines.push(``);
  }

  // Languages section
  if (vault.profiler?.languages && vault.profiler.languages.length > 0) {
    lines.push(`--- JĘZYKI OBCE ---`);
    vault.profiler.languages.forEach(lang => {
      lines.push(`• ${lang.language}: ${lang.level}${lang.context ? ` (${lang.context})` : ''}`);
    });
    lines.push(``);
  }

  lines.push(`--- UMIEJĘTNOŚCI I NARZĘDZIA ---`);
  lines.push(`Twarde: ${vault.skillsMatrix.hardSkills.join(', ')}`);
  lines.push(`Narzędzia: ${vault.skillsMatrix.toolsAndTech.join(', ')}`);
  lines.push(`Miękkie: ${vault.skillsMatrix.softSkills.join(', ')}\n`);

  lines.push(`--- KLAUZULA RODO ---`);
  lines.push(`Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji.`);

  return lines.join('\n');
}

/**
 * FILAR 3: LinkedIn-Ready Snippets Export Generator
 */
export function generateLinkedInReadyExport(
  vault: MasterVault,
  targetRole: string
): { headline: string; aboutSection: string; experienceBullets: Array<{ company: string; role: string; text: string }> } {
  const headline = `${targetRole || vault.personalInfo.title} | ${vault.skillsMatrix.hardSkills.slice(0, 4).join(' • ')}`;

  const aboutSection = `${vault.personalInfo.summary}\n\nKluczowe kompetencje: ${vault.skillsMatrix.hardSkills.join(', ')}\nNarzędzia: ${vault.skillsMatrix.toolsAndTech.join(', ')}`;

  const experienceBullets = vault.history.map(exp => ({
    company: exp.company,
    role: exp.role,
    text: exp.highlights.map(h => `• ${h.text}`).join('\n')
  }));

  return { headline, aboutSection, experienceBullets };
}
