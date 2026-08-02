import { MasterVault } from '../types';
import { HR_AND_COMMON_STOP_WORDS, extractDynamicJdPhrases } from './atsSimulator';

export interface ParsedJobDescription {
  jobTitle: string;
  companyName: string;
  seniorityLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  requiredHardSkills: string[];
  requiredSoftSkills: string[];
  toolsAndTech: string[];
  languagesRequired: string[];
  coreResponsibilities: string[];
  keyKeywords: string[];
  // Extended fields for Benefits, Perks & Dealbreakers
  benefits?: string[];
  perksAndPlusy?: string[];
  mandatoryRequirements?: string[];
  salaryRange?: string;
  workModel?: 'REMOTE' | 'HYBRID' | 'ON_SITE' | 'FLEXIBLE' | string;
  recruitmentMode?: 'ATS_CORPORATE' | 'CRAFT_LOCAL' | 'HYBRID';
  recruitmentModeReason?: string;
  sourceUrl?: string;
}

export interface DealbreakerWarning {
  id: string;
  requirement: string;
  type: 'LICENSE' | 'LANGUAGE' | 'EXPERIENCE' | 'CERTIFICATE' | 'SKILL' | 'LOCATION';
  message: string;
  missingInVault: boolean;
  canQuickAdd: boolean;
  quickAddValue: string;
}

export interface JDVaultMatchAnalysis {
  parsedJD: ParsedJobDescription;
  overallMatchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  dealbreakerWarnings: DealbreakerWarning[];
  benefitsList: string[];
  vaultSuggestions: {
    suggestedTitle: string;
    addSkillsToVault: string[];
    highlightAdvice: string[];
  };
}

/**
 * Local client-side smart parser fallback for Job Descriptions
 */
export function parseJobDescriptionLocal(rawJdText: string, defaultTitle = 'Full-Stack Developer'): ParsedJobDescription {
  const text = rawJdText.trim();
  const lower = text.toLowerCase();

  // Extract potential job title from top lines
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let jobTitle = defaultTitle;
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^(poszukujemy|rekrutacja na|stanowisko:?|oferta:?)\s*/i, '');
    if (firstLine.length > 3 && firstLine.length < 80) {
      jobTitle = firstLine;
    }
  }

  // Seniority detection
  let seniorityLevel: ParsedJobDescription['seniorityLevel'] = 'MID';
  if (/senior|główny|lead|principal|architekt|head/i.test(lower)) seniorityLevel = 'SENIOR';
  if (/junior|praktykant|stażysta|entry/i.test(lower)) seniorityLevel = 'ENTRY';
  if (/tech lead|team lead|lead engineer|kierownik/i.test(lower)) seniorityLevel = 'LEAD';

  // Common Tech & Skill Dictionaries
  const knownTech = [
    'TypeScript', 'JavaScript', 'React', 'React.js', 'Node.js', 'Express', 'Python', 'Java', 'C#', '.NET',
    'PostgreSQL', 'SQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'GraphQL', 'REST API', 'CI/CD', 'Git', 'Tailwind', 'Next.js', 'NestJS', 'Microservices', 'Jest', 'Cypress',
    'Linux', 'Agile', 'Scrum', 'Jira', 'Terraform', 'Kafka', 'Elasticsearch'
  ];

  const knownSoft = [
    'Praca zespołowa', 'Komunikatywność', 'Analityczne myślenie', 'Rozwiązywanie problemów',
    'Zarządzanie czasem', 'Przywództwo', 'Elastyczność', 'Inicjatywa', 'Code Review', 'Mentoring'
  ];

  const foundHard: string[] = [];
  const foundTools: string[] = [];
  const foundSoft: string[] = [];

  knownTech.forEach((tech) => {
    const regex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(text)) {
      if (['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'Jira', 'Terraform', 'Kafka', 'Redis', 'Linux'].includes(tech)) {
        foundTools.push(tech);
      } else {
        foundHard.push(tech);
      }
    }
  });

  knownSoft.forEach((soft) => {
    if (new RegExp(soft, 'i').test(text)) {
      foundSoft.push(soft);
    }
  });

  // Languages detection
  const languages: string[] = [];
  if (/angielsk|english|c1|b2|c2/i.test(lower)) languages.push('Angielski (B2/C1)');
  if (/polsk|polish/i.test(lower)) languages.push('Polski (Ojczysty)');
  if (/niemieck|german/i.test(lower)) languages.push('Niemiecki');

  // Extract benefits and perks
  const benefits: string[] = [];
  if (/multisport|karta sport/i.test(lower)) benefits.push('Karta MultiSport / FitProfit');
  if (/luxmed|praktyka medyczna|opieka medyczna|private medical/i.test(lower)) benefits.push('Prywatna Opieka Medyczna (LuxMed/EnelMed)');
  if (/budżet szkoleniowy|szkolenia|kursy|training budget/i.test(lower)) benefits.push('Budżet Szkoleniowy i Konferencyjny');
  if (/elastycz|flexible hours/i.test(lower)) benefits.push('Elastyczne Godziny Pracy');
  if (/sprzęt|macbook|laptop|apple/i.test(lower)) benefits.push('Nowoczesny Sprzęt (Laptop / MacBook)');
  if (/lekcje angielskiego|dofinansowanie nauki/i.test(lower)) benefits.push('Dofinansowanie do Nauki Języków Obcych');
  if (/owocowe|kawa|przekąski/i.test(lower)) benefits.push('Darmowe Przekąski, Kawa i Soki w Biurze');
  if (/bonus|premia/i.test(lower)) benefits.push('Bonus Roczny / Premia za Wyniki');

  // Mandatory requirements / Dealbreakers detection
  const mandatory: string[] = [];
  if (/prawo jazdy|driver'?s license|kat\.?\s*b/i.test(lower)) mandatory.push('Prawo Jazdy Kat. B (Wymóg Konieczny)');
  if (/c1|c2|fluent english|biegły angielski/i.test(lower)) mandatory.push('Język Angielski poziom min. C1');
  if (/studia wyższe|wykształcenie wyższe|bachelor|master degree/i.test(lower)) mandatory.push('Wykształcenie Wyższe (Inżynier / Magister)');
  if (/3\+?\s*lat|5\+?\s*lat|years of experience/i.test(lower)) mandatory.push('Min. 3-5 lat udokumentowanego doświadczenia');
  if (/stacjonarnie|z biura|office only/i.test(lower)) mandatory.push('Praca Stacjonarna z Biura');

  // Work model
  let workModel = 'HYBRID';
  if (/zdaln|remote|100% zdalnie/i.test(lower)) workModel = 'REMOTE';
  else if (/stacjonarn|z biura|in-office/i.test(lower)) workModel = 'ON_SITE';

  // Salary range
  let salaryRange = '';
  const salaryMatch = text.match(/(\d[\d\s\.]+\s*(?:–|-|do)\s*\d[\d\s\.]+\s*(?:PLN|EUR|USD|zl|zł))/i);
  if (salaryMatch) {
    salaryRange = salaryMatch[0];
  }

  // 4-Stage Advanced NLP extraction
  const dynamicNlp = extractDynamicJdPhrases(text);

  dynamicNlp.hardSkills.forEach((hs) => {
    const term = hs.phrase;
    if (['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'jira', 'terraform', 'kafka', 'redis', 'linux'].includes(term)) {
      if (!foundTools.includes(term)) foundTools.push(term);
    } else {
      if (!foundHard.includes(term)) foundHard.push(term);
    }
  });

  dynamicNlp.softSkills.forEach((ss) => {
    if (!foundSoft.includes(ss.phrase)) foundSoft.push(ss.phrase);
  });

  // Extract keywords (filtering out HR stop words)
  const rawWords = (text.match(/\b[a-zA-Z0-9#+.-]{3,}\b/g) || [])
    .map((w) => w.toLowerCase())
    .filter((w) => !HR_AND_COMMON_STOP_WORDS.has(w) && !/^\d+$/.test(w));

  const keywords = Array.from(new Set([
    ...dynamicNlp.hardSkills.map((h) => h.phrase),
    ...dynamicNlp.formalReqs.map((f) => f.phrase),
    ...foundTools,
    ...foundSoft,
    ...rawWords,
  ])).filter((k) => !HR_AND_COMMON_STOP_WORDS.has(k));

  return {
    jobTitle,
    companyName: 'Firma z ogłoszenia',
    seniorityLevel,
    requiredHardSkills: foundHard.length > 0 ? foundHard : ['TypeScript', 'React', 'Node.js'],
    requiredSoftSkills: foundSoft.length > 0 ? foundSoft : ['Komunikatywność', 'Praca w zespole'],
    toolsAndTech: foundTools.length > 0 ? foundTools : ['Git', 'Docker', 'Jira'],
    languagesRequired: languages.length > 0 ? languages : ['Angielski (B2/C1)'],
    coreResponsibilities: lines.slice(1, 6),
    keyKeywords: keywords.slice(0, 15),
    benefits: benefits.length > 0 ? benefits : ['Prywatna Opieka Medyczna', 'Karta MultiSport', 'Budżet Szkoleniowy'],
    perksAndPlusy: ['Elastyczny czas pracy', 'Nowoczesny sprzęt', 'Możliwość pracy zdalnej'],
    mandatoryRequirements: mandatory,
    salaryRange: salaryRange || undefined,
    workModel,
  };
}

/**
 * Compare Parsed Job Description against user's Master Vault
 */
export function analyzeJdMatchWithVault(parsedJd: ParsedJobDescription, vault: MasterVault): JDVaultMatchAnalysis {
  const vaultTextFull = JSON.stringify(vault).toLowerCase();
  const vaultSkillsLower = new Set([
    ...vault.skillsMatrix.hardSkills.map((s) => s.toLowerCase()),
    ...vault.skillsMatrix.toolsAndTech.map((s) => s.toLowerCase()),
    ...vault.skillsMatrix.softSkills.map((s) => s.toLowerCase()),
  ]);

  const allJdSkills = [
    ...parsedJd.requiredHardSkills,
    ...parsedJd.toolsAndTech,
    ...parsedJd.requiredSoftSkills,
  ];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  allJdSkills.forEach((skill) => {
    if (vaultSkillsLower.has(skill.toLowerCase()) || vaultTextFull.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Dealbreaker audit
  const dealbreakerWarnings: DealbreakerWarning[] = [];
  const mandatoryReqs = parsedJd.mandatoryRequirements || [];

  // Check 1: Driver's license / Prawo jazdy
  const requiresLicense = mandatoryReqs.some(m => /prawo jazdy|kat\.?\s*b|driver/i.test(m)) ||
                           /prawo jazdy|kat\.?\s*b/i.test(JSON.stringify(parsedJd));
  if (requiresLicense) {
    const hasLicenseInVault = /prawo jazdy|kat\.?\s*b|driver'?s license/i.test(vaultTextFull);
    dealbreakerWarnings.push({
      id: 'license_b',
      requirement: 'Prawo Jazdy Kat. B',
      type: 'LICENSE',
      message: hasLicenseInVault
        ? 'Wymagane Prawo Jazdy Kat. B (Wykryto w Twoim Master Vault)'
        : 'Oferta wymaga Prawa Jazdy Kat. B! W Twoim profilu nie znaleziono tej informacji.',
      missingInVault: !hasLicenseInVault,
      canQuickAdd: !hasLicenseInVault,
      quickAddValue: 'Prawo Jazdy Kat. B',
    });
  }

  // Check 2: English C1 / Language requirements
  const requiresEnglishC1 = mandatoryReqs.some(m => /c1|c2|fluent/i.test(m)) ||
                            parsedJd.languagesRequired.some(l => /c1|c2|biegły/i.test(l));
  if (requiresEnglishC1) {
    const hasC1InVault = /angielski\s*(?:c1|c2|biegły)|english\s*(?:c1|c2|fluent)/i.test(vaultTextFull);
    if (!hasC1InVault) {
      dealbreakerWarnings.push({
        id: 'english_c1',
        requirement: 'Język Angielski min. C1',
        type: 'LANGUAGE',
        message: 'Ogłoszenie wymaga biegłego języka angielskiego (min. C1). Upewnij się, że masz to zaznaczone w Vault.',
        missingInVault: true,
        canQuickAdd: true,
        quickAddValue: 'Angielski (Biegły C1)',
      });
    }
  }

  // Check 3: Missing key hard skills
  parsedJd.requiredHardSkills.slice(0, 3).forEach((skill, idx) => {
    if (!vaultSkillsLower.has(skill.toLowerCase()) && !vaultTextFull.includes(skill.toLowerCase())) {
      dealbreakerWarnings.push({
        id: `missing_skill_${idx}`,
        requirement: `Kluczowy Skill: ${skill}`,
        type: 'SKILL',
        message: `Brak wymaganej technologii kluczowej: '${skill}'.`,
        missingInVault: true,
        canQuickAdd: true,
        quickAddValue: skill,
      });
    }
  });

  const total = allJdSkills.length || 1;
  const matchRatio = matchedSkills.length / total;
  const overallMatchPercentage = Math.min(100, Math.round(matchRatio * 100));

  const recommendations: string[] = [];
  if (dealbreakerWarnings.some(d => d.missingInVault)) {
    recommendations.push('Wykryto potencjalne krytyczne luki w wymaganiach (np. prawo jazdy, C1, kluczowy skill). Uzupełnij je przed złożeniem aplikacji.');
  }
  if (missingSkills.length > 0) {
    recommendations.push(`Dodaj brakujące słowa kluczowe do sekcji Skills: ${missingSkills.slice(0, 4).join(', ')}.`);
  } else {
    recommendations.push('Twój profil zawiera pełne pokrycie umiejętności z ogłoszenia!');
  }

  if (parsedJd.seniorityLevel === 'SENIOR' && vault.history.length < 2) {
    recommendations.push('Ogłoszenie wymaga poziomu Senior. Zaakcentuj w podsumowaniu i wpisach wskaźniki biznesowe oraz przywództwo.');
  }

  return {
    parsedJD: parsedJd,
    overallMatchPercentage,
    matchedSkills: Array.from(new Set(matchedSkills)),
    missingSkills: Array.from(new Set(missingSkills)),
    recommendations,
    dealbreakerWarnings,
    benefitsList: parsedJd.benefits || ['Prywatna Opieka Medyczna', 'Karta MultiSport', 'Budżet Szkoleniowy'],
    vaultSuggestions: {
      suggestedTitle: parsedJd.jobTitle,
      addSkillsToVault: missingSkills,
      highlightAdvice: [
        `Użyj aktywnego czasownika w pierwszym punkcie historii pod kątem: ${parsedJd.requiredHardSkills[0] || 'Głównych wymagań'}.`,
        `Wzmocnij odniesienie do narzędzia: ${parsedJd.toolsAndTech[0] || 'CI/CD'}.`
      ],
    },
  };
}
