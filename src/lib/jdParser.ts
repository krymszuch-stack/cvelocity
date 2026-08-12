import { MasterVault } from '../types';
import { HR_AND_COMMON_STOP_WORDS, extractDynamicJdPhrases } from './atsSimulator';
import { matchesKeyword } from './keywordMatching';

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
 * Legal boilerplate (RODO/GDPR consent and data-retention clauses) is mandatory in
 * Polish job ads and is NOT part of the employer's requirements. Scanning it for
 * requirements produced fabricated dealbreakers — the retention period
 * "przez okres 3 lat od daty przesłania zgłoszenia" was read as "requires 3 years
 * of experience". Requirement detection must run on the ad body only.
 */
const LEGAL_BOILERPLATE_LINE =
  /rodo|klauzul|przetwarzan|przetwarzamy|dane osobowe|danych osobowych|administrator|inspektor(a)? ochrony danych|art\.\s*\d|uodo|prezesa urzędu|ochrony danych|zgłoszeni(e|a|u) rekrutacyjn|cofnięcia zgody|podstawy przetwarzania|okres przechowywania|udostępnianie danych/i;

export function stripLegalBoilerplate(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => !LEGAL_BOILERPLATE_LINE.test(line))
    .join('\n');
}

/**
 * Guards against the first line of an ad being mistaken for the job title.
 * Real ads open with street addresses, salary ranges, marketing sentences or
 * application instructions far more often than with the position name.
 */
function looksLikeJobTitle(candidate: string): boolean {
  const c = candidate.trim();
  if (c.length <= 3 || c.length >= 80) return false;
  if (/[@]/.test(c)) return false;
  if (/[:?!]$/.test(c)) return false;
  if (/\b(ul|al|os|pl)\.\s/i.test(c)) return false;
  if (/\d[\d\s.,]*\s*(?:-|–|do)\s*\d|PLN|EUR|USD|\bzł\b|brutto|netto|gross/i.test(c)) return false;
  if (/\b(jesteś|jeśli|poszukujemy|szukamy|dołącz|zapraszamy|oferujemy|jesteśmy|zapewniamy|skontaktuj|prześlij|aplikuj|we are|our goal|do naszej|do naszego)\b/i.test(c)) return false;
  if (c.split(/\s+/).length > 8) return false;
  return true;
}

// No trailing \b: it is an ASCII word boundary and fails after Polish letters
// ("Mamy dla Ciebie pracę," would not match with it).
const RESPONSIBILITY_HEADER =
  /^(zakres obowiązków|zakres zadań|zakres pracy|twoje zadania|twoim zadaniem|będziesz odpowiadać|do twoich zadań|obowiązki|zadania|mamy dla ciebie pracę|tasks|responsibilities|your responsibilities|what you will do|your role)/i;

const SECTION_HEADER =
  /^(wymagania|nasze wymagania|oczekujemy|wymagamy|profil kandydata|mile widziane|benefity|benefits|oferujemy|zapewniamy|what we offer|requirements|must have|nice to have|about you|zaaplikuj|aplikuj|szukamy|poszukujemy|employment type|location|office hours|holiday|company size|remote work|monthly salary)/i;

/**
 * Pulls the responsibilities section out of the ad instead of blindly taking
 * lines 2-6, which used to capture section headers, requirements, marketing copy
 * and even the recruiter's email address.
 */
export function extractResponsibilities(lines: string[]): string[] {
  const out: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (RESPONSIBILITY_HEADER.test(line)) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (SECTION_HEADER.test(line)) break;

    const cleaned = line.replace(/^[-•*•\s]+/, '').trim();
    if (cleaned.length < 10) continue;
    if (/[@]|\+?\d{2}[\s-]?\d{3}[\s-]?\d{3}/.test(cleaned)) continue; // e-mail / phone
    if (/:$/.test(cleaned)) continue; // nested header

    out.push(cleaned);
    if (out.length >= 6) break;
  }

  return out;
}

/**
 * Reads the actual required years of experience rather than flagging a fixed
 * "3-5 lat" string whenever any number near "lat" appears anywhere in the text.
 */
export function extractExperienceRequirement(bodyText: string): string | null {
  const patterns = [
    /(?:min\.?|minimum|co najmniej|at least|a minimum of)?\s*(\d{1,2})\s*\+?\s*(?:lat|lata|years?)\s+(?:\w+\s+){0,3}?(?:doświadcz|experience)/i,
    /(?:doświadczeni\w*|experience)\s*(?:\w+\s+){0,3}?(?:min\.?|minimum|co najmniej|at least|of)?\s*(\d{1,2})\s*\+?\s*(?:lat|lata|years?)/i,
  ];

  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match?.[1]) {
      const years = match[1];
      return `Min. ${years} ${Number(years) === 1 ? 'rok' : 'lat'} doświadczenia`;
    }
  }
  return null;
}

/**
 * Local client-side smart parser fallback for Job Descriptions.
 *
 * Contract: every field is derived from the ad text. When something is not found
 * the field stays EMPTY — it is never back-filled with a plausible-looking guess,
 * because a fabricated requirement is worse than a missing one (see "0-Halucynacji"
 * in SYSTEM_ARCHITECTURE_GUIDANCE.md).
 *
 * `defaultTitle` is authoritative when supplied: it is what the user typed, and the
 * parser must not overwrite it with a sniffed line.
 */
export function parseJobDescriptionLocal(rawJdText: string, defaultTitle = ''): ParsedJobDescription {
  const text = rawJdText.trim();
  const lower = text.toLowerCase();

  // Requirements/benefits are read from the ad body only, never from legal clauses.
  const bodyText = stripLegalBoilerplate(text);
  const bodyLower = bodyText.toLowerCase();

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let jobTitle = defaultTitle.trim();
  if (!jobTitle) {
    const firstLine = lines[0]?.replace(/^(poszukujemy|rekrutacja na|stanowisko:?|oferta:?)\s*/i, '') || '';
    if (looksLikeJobTitle(firstLine)) {
      jobTitle = firstLine;
    }
  }

  // Seniority detection. Order matters: the checks are mutually exclusive so a
  // "junior working with senior engineers" ad is not silently promoted to SENIOR.
  // The title is included because that is where seniority is usually stated.
  const seniorityText = `${jobTitle} ${bodyLower}`.toLowerCase();
  let seniorityLevel: ParsedJobDescription['seniorityLevel'] = 'MID';
  if (/\b(junior|praktykant|stażyst\w*|intern|entry[- ]level)\b/i.test(seniorityText)) seniorityLevel = 'ENTRY';
  else if (/\b(tech lead|team lead|lead engineer|kierownik|head of)\b/i.test(seniorityText)) seniorityLevel = 'LEAD';
  else if (/\b(senior|starszy|principal|architekt\w*|ekspert)\b/i.test(seniorityText)) seniorityLevel = 'SENIOR';

  // Common Tech & Skill Dictionaries
  const knownTech = [
    'TypeScript', 'JavaScript', 'React', 'React.js', 'Node.js', 'Express', 'Python', 'Java', 'C#', '.NET',
    'PostgreSQL', 'SQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    // 'Jest' omitted deliberately: it is the Polish word for "is", so it matched the
    // RODO clause ("Administratorem ... jest COGNOR S.A.") on virtually every ad.
    'GraphQL', 'REST API', 'CI/CD', 'Git', 'Tailwind', 'Next.js', 'NestJS', 'Microservices', 'Cypress',
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
    // Matched against the ad body: the legal clause is not a statement of requirements.
    if (regex.test(bodyText)) {
      if (['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'Jira', 'Terraform', 'Kafka', 'Redis', 'Linux'].includes(tech)) {
        foundTools.push(tech);
      } else {
        foundHard.push(tech);
      }
    }
  });

  knownSoft.forEach((soft) => {
    if (new RegExp(soft, 'i').test(bodyText)) {
      foundSoft.push(soft);
    }
  });

  // Languages detection. The declared level is read from the ad instead of being
  // normalised to a fixed "B2/C1" — an ad asking for B1 must not be reported as C1.
  const detectLanguageLevel = (namePattern: string): string => {
    const match = bodyText.match(
      new RegExp(`(?:${namePattern})[^.\\n]{0,60}?\\b([ABC][12])\\b(?:\\s*[-/–]\\s*\\b([ABC][12])\\b)?`, 'i')
    );
    if (!match) return '';
    return match[2]
      ? ` (${match[1].toUpperCase()}-${match[2].toUpperCase()})`
      : ` (${match[1].toUpperCase()})`;
  };

  const languages: string[] = [];
  if (/angielsk|english/i.test(bodyLower)) languages.push(`Angielski${detectLanguageLevel('angielsk\\w*|english')}`);
  if (/niemieck|german/i.test(bodyLower)) languages.push(`Niemiecki${detectLanguageLevel('niemieck\\w*|german')}`);
  if (/rosyjsk|russian/i.test(bodyLower)) languages.push(`Rosyjski${detectLanguageLevel('rosyjsk\\w*|russian')}`);
  if (/polsk|polish/i.test(bodyLower)) languages.push(`Polski${detectLanguageLevel('polsk\\w*|polish')}`);

  // Benefits. Patterns tolerate Polish declension ("opieki medycznej" as well as
  // "opieka medyczna") and labels stay close to what the ad actually says — no
  // invented brand names, no upgrading "kursy i szkolenia" into a training budget.
  const benefits: string[] = [];
  if (/multisport|kart\w* sportow\w*|pakiet\w* sportow\w*/i.test(bodyLower)) benefits.push('Karta / pakiet sportowy');
  if (/opiek\w* medyczn\w*|private medical|luxmed|medicover|enel-?med/i.test(bodyLower)) benefits.push('Prywatna opieka medyczna');
  if (/budżet\w* szkoleniow\w*|training budget/i.test(bodyLower)) benefits.push('Budżet szkoleniowy');
  else if (/szkoleni\w*|kurs\w*|trainings?\b/i.test(bodyLower)) benefits.push('Szkolenia i kursy');
  if (/elastyczn\w*\s+(godzin\w*|czas\w*)|flexible (hours|working)/i.test(bodyLower)) benefits.push('Elastyczne godziny pracy');
  if (/ubezpieczeni\w*|insurance/i.test(bodyLower)) benefits.push('Ubezpieczenie grupowe');
  if (/kart\w* lunchow\w*|bon\w* żywieniow\w*|dofinansowani\w* posiłk\w*/i.test(bodyLower)) benefits.push('Karta lunchowa / dofinansowanie posiłków');
  if (/zfśs|fundusz\w* świadczeń socjalnych/i.test(bodyLower)) benefits.push('Świadczenia z ZFŚS');
  if (/premi\w*|bonus/i.test(bodyLower)) benefits.push('Premia / bonus');
  if (/macbook|laptop|sprzęt\w* służbow\w*|narzędzi\w* do pracy/i.test(bodyLower)) benefits.push('Sprzęt służbowy');

  // Mandatory requirements / dealbreakers, read from the ad body only.
  const mandatory: string[] = [];
  if (/prawo jazdy|driver'?s licen[cs]e/i.test(bodyLower)) {
    const category = bodyText.match(/prawo jazdy[^.\n]{0,30}?kat\w*\.?\s*([A-E]\s*\+?\s*E?)/i);
    mandatory.push(category ? `Prawo jazdy kat. ${category[1].replace(/\s+/g, '').toUpperCase()}` : 'Prawo jazdy');
  }
  const experienceRequirement = extractExperienceRequirement(bodyText);
  if (experienceRequirement) mandatory.push(experienceRequirement);
  if (/wykształceni\w* wyższ\w*|studia wyższe|bachelor'?s degree|master'?s degree/i.test(bodyLower)) mandatory.push('Wykształcenie wyższe');
  if (/wózk\w* widłow\w*|uprawnieni\w*[^.\n]{0,20}wózk|\budt\b/i.test(bodyLower)) mandatory.push('Uprawnienia do obsługi wózka widłowego (UDT)');
  if (/uprawnieni\w* spawalnicz\w*|certyfikat\w* spawalnicz\w*/i.test(bodyLower)) mandatory.push('Uprawnienia spawalnicze');
  if (/uprawnieni\w* sep|\bsep\s*[ed]\b/i.test(bodyLower)) mandatory.push('Uprawnienia SEP');
  if (/\bhaccp\b/i.test(bodyLower)) mandatory.push('HACCP');
  if (/stacjonarn\w*|z biura|office only|on-?site only/i.test(bodyLower)) mandatory.push('Praca stacjonarna z biura');

  // Work model. Left undefined when the ad does not say — defaulting to HYBRID
  // used to invent a remote-work policy for on-site factory jobs.
  let workModel: string | undefined;
  if (/zdaln\w*|remote|100% zdalnie/i.test(bodyLower)) workModel = 'REMOTE';
  else if (/hybrydow\w*|hybrid/i.test(bodyLower)) workModel = 'HYBRID';
  else if (/stacjonarn\w*|z biura|in-office|on-?site/i.test(bodyLower)) workModel = 'ON_SITE';

  // Salary range. "net"/"brutto"/"gross" commonly sits between the amount and the
  // currency, which the previous pattern could not span.
  let salaryRange = '';
  const salaryMatch = bodyText.match(
    /(\d[\d\s.,]*\s*(?:–|-|do)\s*\d[\d\s.,]*\s*(?:net(?:to)?|brutto|gross)?\s*(?:PLN|EUR|USD|zł|zl))/i
  );
  if (salaryMatch) {
    salaryRange = salaryMatch[0].trim();
  }

  // 4-Stage Advanced NLP extraction
  const dynamicNlp = extractDynamicJdPhrases(bodyText);

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

  // Extract keywords. Splitting on non-word runs (instead of an ASCII-only \b match)
  // keeps Polish words intact — the old pattern cut them at every diacritic and
  // produced meaningless stubs like "wym" (from "wymóg") that then surfaced to the
  // user as "key terms" and inflated keyword matching.
  const rawWords = bodyText
    .toLowerCase()
    .split(/[^a-z0-9ąćęłńóśźż#+.-]+/i)
    // Dots and dashes are kept inside tokens for "node.js" / "ci-cd", but trailing
    // sentence punctuation would otherwise leak in as part of the word.
    .map((w) => w.replace(/^[.\-+#]+/, '').replace(/[.\-+#]+$/, ''))
    .filter(
      (w) =>
        w.length >= 4 &&
        !/^\d+$/.test(w) &&
        !HR_AND_COMMON_STOP_WORDS.has(w)
    );

  const keywords = Array.from(new Set([
    ...dynamicNlp.hardSkills.map((h) => h.phrase),
    ...dynamicNlp.formalReqs.map((f) => f.phrase),
    ...foundTools,
    ...foundSoft,
    ...rawWords,
  ])).filter((k) => !HR_AND_COMMON_STOP_WORDS.has(k));

  // Every field below is what the ad actually contains. Nothing is back-filled:
  // an empty array means "the ad does not say", which the UI can show honestly.
  return {
    jobTitle,
    companyName: '',
    seniorityLevel,
    requiredHardSkills: foundHard,
    requiredSoftSkills: foundSoft,
    toolsAndTech: foundTools,
    languagesRequired: languages,
    coreResponsibilities: extractResponsibilities(lines),
    keyKeywords: keywords.slice(0, 15),
    benefits,
    mandatoryRequirements: mandatory,
    salaryRange: salaryRange || undefined,
    workModel,
  };
}

/**
 * Compare Parsed Job Description against user's Master Vault
 */
export function analyzeJdMatchWithVault(parsedJd: ParsedJobDescription, vault: MasterVault): JDVaultMatchAnalysis {
  const vaultTextFull = [
    vault.personalInfo.fullName,
    vault.personalInfo.title,
    vault.personalInfo.summary,
    vault.personalInfo.location,
    ...vault.history.flatMap(h => [h.role, h.company, h.description || '', ...(h.highlights || []).map(hl => hl.text)]),
    ...vault.skillsMatrix.hardSkills,
    ...vault.skillsMatrix.toolsAndTech,
    ...vault.skillsMatrix.softSkills,
    ...(vault.education || []).flatMap(e => [e.degree, e.fieldOfStudy, e.institution]),
    ...(vault.skillsMatrix?.certifications || []).map((c: any) => typeof c === 'string' ? c : c.name),
  ].filter(Boolean).join(' ');

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
    if (vaultSkillsLower.has(skill.toLowerCase()) || matchesKeyword(vaultTextFull, skill)) {
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
        `Wzmocnij odniesienie do narzędzia: ${parsedJd.toolsAndTech[0] || parsedJd.requiredHardSkills[0] || 'wymagań stanowiska'}.`
      ],
    },
  };
}
