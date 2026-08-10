import { AtsCheckResult, MasterVault, TailoredResume, LemmatizedMatch } from '../types';

/**
 * Polish Stemming & Lemmatization helper.
 * Strips Polish inflectional suffixes so "zarządzanie", "zarządzałem", "zarządzania" all stem to "zarzą".
 * Works seamlessly for Polish words and English technical terms.
 */
export function getPolishStem(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length <= 3) return w;

  // Preserve short English tech terms (e.g. sql, aws, gcp, git)
  if (/^[a-z0-9#+.-]+$/i.test(w) && !/[ąćęłńóśźż]/.test(w) && w.length <= 6) {
    return w;
  }

  return w
    .replace(/(nościami|nościach|nością|ności|stwem|stwach|stwu)$/i, '')
    .replace(/(eniach|eniom|eniem|enie|enia|eniu)$/i, '')
    .replace(/(aniach|aniom|aniem|anie|ania|aniu)$/i, '')
    .replace(/(owałem|owałeś|owaliśmy|owali|ować|uję|ujesz|ują)$/i, '')
    .replace(/(ałem|ałeś|aliśmy|ałam|ałaś)$/i, '')
    .replace(/(owali|owały|owało)$/i, '')
    .replace(/(ami|ach|owi|ego|emu|ich|ych|iej|iem|ym)$/i, '')
    .replace(/(em|ie|om|ów|ej|ey)$/i, '')
    .replace(/(a|e|i|o|u|y|ę|ą)$/i, '');
}

/**
 * Checks if phraseA matches phraseB taking inflection and Polish stems into account.
 */
export function isLemmatizedMatch(phraseA: string, phraseB: string): boolean {
  const normA = phraseA.toLowerCase().trim();
  const normB = phraseB.toLowerCase().trim();

  if (normA === normB || normB.includes(normA) || normA.includes(normB)) {
    return true;
  }

  const wordsA = normA.split(/[\s,./()]+/).filter((w) => w.length > 2).map(getPolishStem);
  const wordsB = normB.split(/[\s,./()]+/).filter((w) => w.length > 2).map(getPolishStem);

  if (wordsA.length === 0 || wordsB.length === 0) return false;

  return wordsA.every((stemA) => wordsB.some((stemB) => stemB.startsWith(stemA) || stemA.startsWith(stemB)));
}

/**
 * Known stop words, HR boilerplate terms, section headers, prepositions and filler words
 * that should NEVER be flagged as missing skills in ATS parsing when standalone.
 */
export const HR_AND_COMMON_STOP_WORDS = new Set([
  // Organizational Verbs (Czasowniki organizacyjne)
  'potrzebujemy', 'szukamy', 'poszukujemy', 'poszukuje', 'oczekujemy', 'oczekuje', 'oferujemy', 'oferuje',
  'dołącz', 'zapewniamy', 'wymagamy', 'wymaga', 'doceniamy', 'zatrudnimy', 'zatrudni', 'rekrutujemy',
  'tworzymy', 'prowadzimy', 'chcemy', 'zapraszamy', 'gwarantujemy', 'zastrzegamy', 'kontaktujemy',

  // Framing Nouns / Meta-language of Job Ads (Rzeczowniki ramowe)
  'oprogramowanie', 'oprogramowania', 'znajomość', 'znajomości', 'doświadczenie', 'doświadczenia',
  'umiejętność', 'umiejętności', 'praca', 'pracy', 'zespół', 'zespołu', 'kandydat', 'kandydata',
  'wymagania', 'wymagań', 'obowiązki', 'obowiązków', 'zakres', 'zakresie', 'zadań', 'zadania',
  'profil', 'zapewniamy', 'opis', 'stanowisko', 'stanowisku', 'firma', 'firmy', 'klient', 'klienta',
  'pracownik', 'pracownika', 'aplikacja', 'aplikacji', 'poziom', 'poziomu', 'tytuł', 'dyplom',
  'projekty', 'projektów', 'rozwój', 'rozwoju', 'osoba', 'osoby', 'materiały', 'materiałów',
  'działań', 'działania', 'grupa', 'obszar', 'obszarze', 'system', 'systemy', 'rozwiązania',
  'potrzeby', 'potrzeb', 'wyzwania', 'wyzwań', 'miejsce', 'miejscu', 'rekrutacja', 'rekrutacji',
  'kontakt', 'zgoda', 'zgody', 'lokalizacja', 'oferta', 'oferty', 'rodo', 'znajomo', 'umiej',

  // Frame Adjectives & Filler Words (Przymiotniki i zapychacze)
  'mile', 'widziane', 'widziana', 'dodatkowy', 'atut', 'atutem', 'niezbędne', 'dobra', 'bardzo',
  'praktyczna', 'praktycznej', 'płynna', 'biegła', 'biegłość', 'wysoka', 'min', 'minimum',
  'max', 'maksimum', 'lat', 'lata', 'roku', 'roczne', 'miesięcy', 'bieżącej', 'przyszłych',
  'wybranych', 'zgodnie', 'art', 'klauzula', 'klauzuli', 'danych', 'osobowych',

  // Prepositions, Conjunctions & Grammar (Spójniki, zaimki, przyimki)
  'i', 'w', 'z', 'na', 'do', 'dla', 'o', 'ze', 'za', 'po', 'od', 'pod', 'nad', 'oraz', 'lub', 'albo',
  'czy', 'ale', 'lecz', 'jak', 'tak', 'co', 'to', 'jest', 'są', 'być', 'może', 'móc', 'musi', 'powinien',
  'naszego', 'naszej', 'naszym', 'swoim', 'twojego', 'twojej', 'twój', 'nasz', 'każdy', 'wszystkie', 'innych', 'inne',

  // English Job Ad Boilerplate & Grammar
  'requirements', 'requirement', 'job', 'description', 'position', 'role', 'company', 'team',
  'candidate', 'responsibilities', 'duties', 'qualifications', 'experience', 'skills', 'skill',
  'knowledge', 'understanding', 'ability', 'abilities', 'minimum', 'maximum', 'years', 'year',
  'preferred', 'nice', 'plus', 'benefit', 'benefits', 'offer', 'offers', 'about', 'looking',
  'seeking', 'join', 'work', 'working', 'location', 'contact', 'apply', 'application', 'and', 'or',
  'for', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'from', 'with', 'by', 'of', 'is', 'are', 'be',
  'will', 'must', 'should', 'have', 'has', 'more', 'less', 'high', 'strong', 'good', 'great',
  'excellent', 'proven', 'track', 'record'
]);

/**
 * Valid multi-word compound skill phrases (N-Grams bi-grams / tri-grams)
 * where a frame noun (e.g., "oprogramowania") is part of a real competence phrase.
 */
const KNOWN_COMPOUND_SKILLS = [
  // Engineering & IT
  'testowanie oprogramowania', 'tworzenie oprogramowania', 'rozwój oprogramowania', 'architektura oprogramowania',
  'inżynieria oprogramowania', 'jakość oprogramowania', 'projektowanie oprogramowania',
  'bazy danych', 'baza danych', 'zarządzanie bazami danych', 'baza danych sql',
  'przetwarzanie danych', 'inżynieria danych', 'analiza danych', 'hurtownie danych',
  'bezpieczeństwo sieci', 'bezpieczeństwo informacji', 'cyberbezpieczeństwo',
  'uczenie maszynowe', 'sztuczna inteligencja', 'przetwarzanie języka naturalnego',

  // Business, Project Management & HR
  'zarządzanie projektem', 'zarządzanie projektami', 'zarządzanie zespołem', 'zarządzanie czasem',
  'zarządzanie budżetem', 'zarządzanie produktem', 'zarządzanie jakością', 'zarządzanie ryzykami',
  'analiza biznesowa', 'analiza systemowa', 'analiza finansowa', 'analiza rynku',
  'rekrutacja i selekcja', 'kadry i płace', 'prawo pracy', 'prawo jazdy',
  'obsługa klienta', 'budowanie relacji', 'negocjacje handlowe', 'badanie rynku',
  'lead generation', 'key account management', 'growth hacking', 'content marketing',

  // Finance & Accounting
  'pełna księgowość', 'rachunkowość zarządcza', 'sprawozdawczość finansowa',
  'kontroling finansowy', 'modelowanie finansowe', 'rozliczenia podatkowe'
];

/**
 * Known tech & domain dictionary for N-Gram extraction across domains
 */
const KNOWN_HARD_SKILLS = [
  // IT & Cloud Stack
  'typescript', 'javascript', 'react', 'react.js', 'next.js', 'vue', 'angular',
  'node.js', 'express', 'nest.js', 'python', 'django', 'fastapi', 'c#', '.net',
  // 'go' omitted deliberately: it is also an everyday Polish pronoun, so it matched
  // ordinary prose. 'golang' covers the language unambiguously.
  'java', 'spring', 'spring boot', 'golang', 'rust', 'php', 'laravel',
  'html', 'css', 'tailwind', 'tailwind css', 'sass', 'redux', 'zustand', 'graphql',
  'rest api', 'websockets', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis',
  'elasticsearch', 'prisma', 'drizzle', 'docker', 'kubernetes', 'aws', 'gcp',
  'google cloud', 'azure', 'ci/cd', 'github actions', 'jenkins', 'terraform',
  // 'jest' omitted deliberately: it is the Polish word for "is", so every Polish ad
  // matched it as the testing framework. 'unit testing' still covers the intent.
  'linux', 'bash', 'microservices', 'system design', 'unit testing',
  'cypress', 'playwright', 'agile', 'scrum', 'jira', 'git', 'github', 'figma',
  'clean code', 'solid', 'security', 'oauth', 'seo', 'ats', 'analytics', 'etl',
  'kafka', 'rabbitmq', 'prometheus', 'grafana', 'opentelemetry', 'c++', 'swift', 'flutter',

  // Business, Finance, Controlling & Accounting
  'excel', 'power bi', 'tableau', 'vba', 'power query', 'spss', 'sap', 'sap erp',
  'salesforce', 'hubspot', 'księgowość', 'mssf', 'ifrs', 'budżetowanie', 'p&l',
  'analiza finansowa', 'controlling', 'audyt', 'vat', 'cit', 'pit', 'us gaap',

  // Marketing, Sales & E-commerce
  'sem', 'google ads', 'meta ads', 'ga4', 'google analytics', 'copywriting',
  'content marketing', 'e-mail marketing', 'growth hacking', 'klaviyo', 'b2b sales',
  'lead generation', 'key account management', 'crm', 'e-commerce',

  // Management, Operations, Engineering & Legal
  'prince2', 'pmp', 'lean', 'kaizen', 'six sigma', 'kanban', 'rodo', 'gdpr',
  'iso 9001', 'prawo pracy', 'kadry i płace', 'direct search', 'supply chain',
  'logistyka', 'procurement', 'autocad', 'cad', 'solidworks', 'plc'
];

/**
 * All-caps tokens that pass the acronym shape test but are never skills:
 * currencies, legal-entity suffixes, document and registry abbreviations.
 */
const NON_SKILL_ACRONYMS = new Set([
  'pln', 'eur', 'usd', 'gbp', 'chf', 'brutto', 'netto',
  's.a', 'sa', 'spzoo', 'zoo', 'gmbh', 'ltd', 'inc',
  'nip', 'krs', 'regon', 'cv', 'rodo', 'gdpr', 'ue', 'onz', 'uodo',
  'ul', 'al', 'nr', 'tel', 'pon', 'pt',
]);

const FORMAL_REQ_KEYWORDS = [
  'wykształcenie wyższe', 'studia', 'licencjat', 'magister', 'inżynier',
  'prawo jazdy', 'certyfikat', 'b2', 'c1', 'c2', 'angielski'
];

const SOFT_SKILLS_NOISE = [
  'komunikatywność', 'przywództwo', 'praca w zespole', 'zarządzanie czasem',
  'problem solving', 'leadership', 'teamwork', 'mentoring', 'odporność na stres',
  'kreatywność', 'dynamiczny', 'samodzielność', 'odpowiedzialność'
];

/**
 * 4-Stage Advanced NLP N-Gram extraction from Job Description:
 * Stage 1: HR Blacklist filtering
 * Stage 2: POS / Verbal filtering (rejects organizational verbs, filler numbers)
 * Stage 3: Compound N-Grams detection (preserves bi-grams/tri-grams like "testowanie oprogramowania")
 * Stage 4: TF-IDF Rarity Weighting (low weight for generic terms, high for domain/tech skills)
 */
export function extractDynamicJdPhrases(jdText: string): {
  hardSkills: { phrase: string; weight: number }[];
  formalReqs: { phrase: string; weight: number }[];
  softSkills: { phrase: string; weight: number }[];
  allExtractedCount: number;
} {
  const normalized = jdText.toLowerCase();
  const hardSkills: { phrase: string; weight: number }[] = [];
  const formalReqs: { phrase: string; weight: number }[] = [];
  const softSkills: { phrase: string; weight: number }[] = [];

  // 1. Stage 3 Compound N-Gram Check (Multi-word skills)
  for (const compound of KNOWN_COMPOUND_SKILLS) {
    if (normalized.includes(compound)) {
      hardSkills.push({ phrase: compound, weight: 3.0 });
    }
  }

  // 2. Stage 4 Known Hard Skills Dictionary Check
  for (const skill of KNOWN_HARD_SKILLS) {
    if (normalized.includes(skill)) {
      // Avoid adding single word if already covered in a compound
      if (!hardSkills.some((h) => h.phrase.includes(skill) && h.phrase !== skill)) {
        hardSkills.push({ phrase: skill, weight: 3.0 });
      }
    }
  }

  // 3. Stage 4 Formal Requirements Check
  for (const req of FORMAL_REQ_KEYWORDS) {
    if (normalized.includes(req)) {
      formalReqs.push({ phrase: req, weight: 2.0 });
    }
  }

  // 4. Soft Skills Check
  for (const soft of SOFT_SKILLS_NOISE) {
    if (normalized.includes(soft)) {
      softSkills.push({ phrase: soft, weight: 0.5 });
    }
  }

  // 5. Acronym & known-term extractor.
  //
  // This used to accept EVERY capitalised phrase, which turned street names, city
  // names and RODO boilerplate into "hard skills" — a welding ad yielded
  // "Stalmacha", "Siemianowicach", "Administratorem", "Benefity". Worse, the
  // ASCII-only character class cut Polish words at the first diacritic, so
  // "Osprzętu" surfaced to the user as the skill "Osprz".
  //
  // A token is now kept only when it is a genuine all-caps acronym (MIG, MAG, MMA,
  // SQL, UDT, SEP, HACCP) or a term the dictionary already knows.
  const tokens = jdText.split(/[^A-Za-z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ#+.-]+/);

  for (const rawToken of tokens) {
    const token = rawToken.replace(/^[.\-+#]+/, '').replace(/[.\-+#]+$/, '');
    if (token.length < 2 || /^\d+$/.test(token)) continue;

    const lower = token.toLowerCase();
    if (HR_AND_COMMON_STOP_WORDS.has(lower) || NON_SKILL_ACRONYMS.has(lower)) continue;

    const isAcronym = /^[A-Z0-9#+.]{2,6}$/.test(token);
    const isKnownTerm = KNOWN_HARD_SKILLS.includes(lower);
    if (!isAcronym && !isKnownTerm) continue;

    if (!hardSkills.some((h) => h.phrase === lower)) {
      hardSkills.push({ phrase: lower, weight: 3.0 });
    }
  }

  // Final Strict Stage 1 Blacklist Purge: Remove any standalone junk word
  const uniqueHard = Array.from(new Map(hardSkills.map((item) => [item.phrase, item])).values())
    .filter((item) => {
      // If it's a single word, it MUST NOT be in the HR stop words blacklist
      const words = item.phrase.split(/\s+/);
      if (words.length === 1 && HR_AND_COMMON_STOP_WORDS.has(words[0])) {
        return false;
      }
      return item.phrase.length >= 3;
    });

  const uniqueFormal = Array.from(new Map(formalReqs.map((item) => [item.phrase, item])).values())
    .filter((item) => item.phrase.length >= 3);

  const uniqueSoft = Array.from(new Map(softSkills.map((item) => [item.phrase, item])).values());

  return {
    hardSkills: uniqueHard,
    formalReqs: uniqueFormal,
    softSkills: uniqueSoft,
    allExtractedCount: uniqueHard.length + uniqueFormal.length + uniqueSoft.length,
  };
}

/**
 * Simulates 3-Layer ATS parser check on the generated CV & Master Vault against Job Description.
 */
export function simulateAtsCheck(
  resume: TailoredResume,
  vault: MasterVault,
  jobDescription: string
): AtsCheckResult {
  const dynamicJd = extractDynamicJdPhrases(jobDescription);

  // Aggregate full CV text with structural metadata
  const summaryText = resume.summary || vault.personalInfo.summary || '';
  const highlightTexts = resume.selectedHighlights.map((h) => h.optimizedText);
  const skillsList = [
    ...resume.skillsMatched.hardSkills,
    ...resume.skillsMatched.toolsAndTech,
    ...resume.skillsMatched.softSkills,
    ...vault.skillsMatrix.hardSkills,
    ...vault.skillsMatrix.toolsAndTech,
  ];

  const fullCvTextParts = [
    summaryText,
    ...highlightTexts,
    ...skillsList,
    vault.personalInfo.fullName,
    vault.personalInfo.email,
    vault.personalInfo.phone,
    vault.personalInfo.location,
    vault.personalInfo.title,
    ...vault.history.flatMap((h) => [h.company, h.role, ...h.highlights.map((hl) => hl.text)]),
    ...vault.education.flatMap((e) => [e.institution, e.degree, e.fieldOfStudy]),
    ...vault.projects.flatMap((p) => [p.name, p.description, ...p.techStack]),
  ];

  const fullCvText = fullCvTextParts.filter(Boolean).join(' ').toLowerCase();

  // ==================== LAYER 1: STRUCTURE & LAYOUT DIAGNOSTICS ====================
  const detectedSections: string[] = [];
  const unparsableElementsWarnings: string[] = [];
  const badDateFormats: string[] = [];
  const ocrWarnings: string[] = [];

  // Check Standard Section Headers
  const standardHeaders = [
    { key: 'EXPERIENCE', name: 'Doświadczenie zawodowe', aliases: ['doświadczenie', 'historia zatrudnienia', 'work experience'] },
    { key: 'EDUCATION', name: 'Wykształcenie', aliases: ['wykształcenie', 'edukacja', 'education'] },
    { key: 'SKILLS', name: 'Umiejętności', aliases: ['umiejętności', 'kompetencje', 'skills', 'technologie'] },
    { key: 'CERTS', name: 'Certyfikaty', aliases: ['certyfikaty', 'uprawnienia', 'certifications'] },
    { key: 'CONTACT', name: 'Dane kontaktowe', aliases: ['kontakt', 'dane osobowe', 'contact'] },
  ];

  const missingStandardSections: string[] = [];

  for (const std of standardHeaders) {
    const hasHeader = std.aliases.some((alias) => fullCvText.includes(alias));
    if (hasHeader) {
      detectedSections.push(std.name);
    } else if (std.key === 'EXPERIENCE' || std.key === 'SKILLS' || std.key === 'CONTACT') {
      missingStandardSections.push(std.name);
    }
  }

  // Non-standard headers warning check
  if (fullCvText.includes('moja ścieżka') || fullCvText.includes('gdzie byłem') || fullCvText.includes('o mnie krótko')) {
    unparsableElementsWarnings.push('Wykryto niestandardowe nagłówki sekcji (np. "Moja ścieżka"). Używaj standardowych: "Doświadczenie Zawodowe", "Umiejętności".');
  }

  // Graphical elements without text equivalent
  if (fullCvText.includes('★★★') || fullCvText.includes('●●●') || fullCvText.includes('10/10') || fullCvText.includes('90%')) {
    unparsableElementsWarnings.push('Wykryto wizualne wskaźniki umiejętności (gwiazdki/paski postępu %). ATS nie potrafi ich odczytać – opisz poziom słownie (np. "Zaawansowany", "B2").');
  }

  // Date format checking
  for (const exp of vault.history) {
    if (!exp.startDate) continue;
    const dateRegex = /^(\d{2}\/\d{4}|\d{4}|Obecnie|Present)$/i;
    if (!dateRegex.test(exp.startDate.trim())) {
      badDateFormats.push(`Niestandardowy format daty początkowej w "${exp.company}": "${exp.startDate}". Zalecany format MM/YYYY.`);
    }
    if (exp.endDate && !dateRegex.test(exp.endDate.trim())) {
      badDateFormats.push(`Niestandardowy format daty końcowej w "${exp.company}": "${exp.endDate}". Zalecany format MM/YYYY lub "Obecnie".`);
    }
  }

  // Contact Info completeness
  if (!vault.personalInfo.email || !vault.personalInfo.email.includes('@')) {
    ocrWarnings.push('Brak prawidłowego adresu e-mail w sekcji danych osobowych.');
  }
  if (!vault.personalInfo.phone || vault.personalInfo.phone.trim().length < 6) {
    ocrWarnings.push('Brak podanego numeru telefonu kontaktowego.');
  }

  const headerNormalizationScore = missingStandardSections.length === 0 ? 100 : Math.max(50, 100 - missingStandardSections.length * 25);
  const layoutScore = unparsableElementsWarnings.length === 0 ? 100 : Math.max(60, 100 - unparsableElementsWarnings.length * 20);
  const isSingleColumnCompliant = unparsableElementsWarnings.length === 0 && missingStandardSections.length === 0;

  const structureScore = Math.round((headerNormalizationScore + layoutScore) / 2);
  const formattingScore = ocrWarnings.length === 0 && badDateFormats.length === 0 ? 100 : Math.max(50, 100 - (ocrWarnings.length + badDateFormats.length) * 12);

  // ==================== LAYER 2: NLP & LEMMATIZED MATCHING ====================
  const lemmatizedMatches: LemmatizedMatch[] = [];
  const matchedKeywords: string[] = [];
  const missingHardSkills: string[] = [];
  const missingSoftSkills: string[] = [];

  // Match Hard Skills with Polish Stemmer / Lemmatization
  let matchedHardWeight = 0;
  let totalHardWeight = 0;

  for (const hard of dynamicJd.hardSkills) {
    totalHardWeight += hard.weight;
    const isMatched = isLemmatizedMatch(hard.phrase, fullCvText);

    if (isMatched) {
      matchedHardWeight += hard.weight;
      matchedKeywords.push(hard.phrase);
      lemmatizedMatches.push({
        keywordFromJD: hard.phrase,
        matchedInCv: hard.phrase,
        category: 'HARD_SKILL',
        weight: hard.weight,
      });
    } else {
      missingHardSkills.push(hard.phrase);
    }
  }

  // Match Formal Requirements
  let matchedFormalWeight = 0;
  let totalFormalWeight = 0;

  for (const formal of dynamicJd.formalReqs) {
    totalFormalWeight += formal.weight;
    const isMatched = isLemmatizedMatch(formal.phrase, fullCvText);

    if (isMatched) {
      matchedFormalWeight += formal.weight;
      matchedKeywords.push(formal.phrase);
      lemmatizedMatches.push({
        keywordFromJD: formal.phrase,
        matchedInCv: formal.phrase,
        category: 'FORMAL_REQUIREMENT',
        weight: formal.weight,
      });
    }
  }

  // Filter Soft Skills (down-weighted noise)
  for (const soft of dynamicJd.softSkills) {
    const isMatched = isLemmatizedMatch(soft.phrase, fullCvText);
    if (!isMatched) {
      missingSoftSkills.push(soft.phrase);
    }
  }

  const hardSkillsCoverage = totalHardWeight > 0 ? Math.round((matchedHardWeight / totalHardWeight) * 100) : 100;
  const formalReqsCoverage = totalFormalWeight > 0 ? Math.round((matchedFormalWeight / totalFormalWeight) * 100) : 100;

  // ==================== LAYER 3: SCORING ALGEBRA (RECENCY & TITLE DENSITY) ====================
  
  // Calculate Recency Bias Score (Sr)
  // Keywords in current role = 100%, role 1-2 = 70%, older = 40%
  let recencyScoreSum = 0;
  let recencyCount = 0;

  for (const match of lemmatizedMatches) {
    const kw = match.keywordFromJD;
    recencyCount++;

    // Check current/most recent role (index 0)
    const currentRoleText = vault.history[0]
      ? `${vault.history[0].role} ${vault.history[0].company} ${vault.history[0].highlights.map((h) => h.text).join(' ')}`
      : '';

    // Check recent roles (index 1-2)
    const midRoleText = vault.history.slice(1, 3)
      .map((h) => `${h.role} ${h.company} ${h.highlights.map((hl) => hl.text).join(' ')}`)
      .join(' ');

    if (isLemmatizedMatch(kw, currentRoleText)) {
      recencyScoreSum += 100;
    } else if (isLemmatizedMatch(kw, midRoleText)) {
      recencyScoreSum += 70;
    } else {
      recencyScoreSum += 40; // Only in old roles, skills matrix, or education
    }
  }

  const recencyScore = recencyCount > 0 ? Math.round(recencyScoreSum / recencyCount) : 80;

  // Calculate Job Title Match / Density Score (St)
  const targetTitle = resume.targetJobTitle || vault.personalInfo.title || '';
  const currentCvTitle = vault.personalInfo.title || '';
  const pastRolesTitles = vault.history.map((h) => h.role).join(' ');

  let titleMatchScore = 50; // base
  if (targetTitle && currentCvTitle) {
    if (isLemmatizedMatch(targetTitle, currentCvTitle)) {
      titleMatchScore = 100;
    } else if (isLemmatizedMatch(targetTitle, pastRolesTitles)) {
      titleMatchScore = 75;
    } else {
      titleMatchScore = 45;
    }
  }

  // Algebra Score calculation: Score = (W_h * S_h) + (W_r * S_r) + (W_t * S_t)
  const hardSkillScore = hardSkillsCoverage; // S_h
  const weightedAlgebraScore = Math.round(
    (hardSkillScore * 3.0 + recencyScore * 1.5 + titleMatchScore * 1.5) / 6.0
  );

  // Apply layout / structure penalty
  const structurePenalty = (100 - structureScore) * 0.15 + (100 - formattingScore) * 0.10;
  const overallScore = Math.max(0, Math.min(100, Math.round(weightedAlgebraScore - structurePenalty)));

  const formulaBreakdown = `Algebra: Score = (3.0 × ${hardSkillScore}% [Hard Skills]) + (1.5 × ${recencyScore}% [Świeżość/Recency]) + (1.5 × ${titleMatchScore}% [Tytuł Stanowiska]) ÷ 6.0 - ${Math.round(structurePenalty)}% (Kara Układu)`;

  // Coverage score for legacy display
  const keywordCoverageScore = Math.round((hardSkillsCoverage + formalReqsCoverage) / 2);

  // Gap Analysis & Actionable Recommendations
  const gapAnalysis: string[] = [];
  const recommendations: string[] = [];

  if (missingHardSkills.length > 0) {
    gapAnalysis.push(
      `Brakujące wymagania twarde z ogłoszenia: ${missingHardSkills.slice(0, 6).join(', ')}.`
    );
    recommendations.push(
      `Słowa twarde (waga 3x): Uzupełnij w Master Vault doświadczenie powiązane z: ${missingHardSkills.slice(0, 3).join(', ')}.`
    );
  } else {
    gapAnalysis.push('100% kluczowych wymagań technicznych i formalnych z ogłoszenia znajduje się w Twoim profilu!');
  }

  if (recencyScore < 70) {
    recommendations.push('Świeżość umiejętności (Recency Bias): Przenieś kluczowe technologie do opisu Twojego najnowszego stanowiska, aby ATS przyznał pełną wagę (100%).');
  }

  if (titleMatchScore < 75) {
    recommendations.push(`Gęstość Tytułu Stanowiska: Dostosuj nagłówek profilu ("${currentCvTitle}") tak, aby zawierał szukaną frazę stanowiska ("${targetTitle}").`);
  }

  if (unparsableElementsWarnings.length > 0) {
    recommendations.push('Struktura PDF: Zastąp elementy graficzne (paski postępu, ikonki) opisem tekstowym, aby nie gubić danych w parserze OCR.');
  }

  return {
    overallScore,
    keywordCoverageScore,
    structureScore,
    formattingScore,
    layer1Structure: {
      layoutScore,
      headerNormalizationScore,
      detectedSections,
      missingStandardSections,
      unparsableElementsWarnings,
      isSingleColumnCompliant,
    },
    layer2Nlp: {
      hardSkillsCoverage,
      formalReqsCoverage,
      softSkillsFilterCount: dynamicJd.softSkills.length,
      extractedJdPhrasesCount: dynamicJd.allExtractedCount,
      lemmatizedMatches,
    },
    layer3Scoring: {
      hardSkillScore,
      recencyScore,
      titleMatchScore,
      formulaBreakdown,
    },
    matchedKeywords: Array.from(new Set(matchedKeywords)),
    missingHardSkills: Array.from(new Set(missingHardSkills)),
    missingSoftSkills: Array.from(new Set(missingSoftSkills)),
    ocrWarnings,
    badDateFormats,
    gapAnalysis,
    recommendations,
  };
}


