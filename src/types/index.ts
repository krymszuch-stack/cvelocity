export type FlagCategory = 'PHYSICAL' | 'OFFICE_IT' | 'CASUAL' | 'REMOTE';

export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'PIVOT';

export interface LocationPreferences {
  city: string;
  radiusKm: number;
  willingnessToTravel: boolean;
  hybridWork: boolean;
  remoteOnly: boolean;
  relocationReady?: boolean;
  commuteRadiusKm?: number;
}

export interface LanguageProficiency {
  id: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native';
  context: string;
}

export interface ProfilerState {
  flags: FlagCategory[];
  experienceLevel: ExperienceLevel;
  location: LocationPreferences;
  languages: LanguageProficiency[];
  licenses?: string[];
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  photoUrl?: string;
  title: string;
  summary: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface SkillsMatrix {
  hardSkills: string[];
  softSkills: string[];
  toolsAndTech: string[];
  certifications: Certification[];
}

export interface HighlightMetric {
  id: string;
  text: string;
  action: string;
  target: string;
  tool: string;
  metric: string;
  keywords: string[];
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description?: string;
  highlights: HighlightMetric[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  description: string;
  techStack: string[];
  metrics?: string;
  link?: string;
}

export interface MasterVault {
  version: string;
  updatedAt: string;
  profiler: ProfilerState;
  personalInfo: PersonalInfo;
  skillsMatrix: SkillsMatrix;
  history: WorkExperience[];
  education: Education[];
  projects: Project[];
}

export interface PhraseSlot {
  template: string;
  action: string;
  target: string;
  tool: string;
  metric: string;
  keywords: string[];
}

export interface CachedPhrase {
  id: string;
  originalText: string;
  optimizedText: string;
  slots: PhraseSlot;
  keywords: string[];
  hitCount: number;
  score: number;
  lastUsed: string;
}

export interface LemmatizedMatch {
  keywordFromJD: string;
  matchedInCv: string;
  category: 'HARD_SKILL' | 'FORMAL_REQUIREMENT' | 'SOFT_SKILL';
  weight: number;
}

export interface AtsCheckResult {
  overallScore: number;
  keywordCoverageScore: number;
  structureScore: number;
  formattingScore: number;

  /**
   * Profil, pod który ułożono zalecenia. Wpływa na ich kolejność, nie na wynik:
   * ta sama treść CV nie może dostawać różnych ocen zależnie od checkboxa.
   */
  appliedProfile: FlagCategory;
  
  // Layer 1: Structure & Layout Diagnostics
  layer1Structure: {
    layoutScore: number;
    headerNormalizationScore: number;
    detectedSections: string[];
    missingStandardSections: string[];
    unparsableElementsWarnings: string[];
    isSingleColumnCompliant: boolean;
  };

  // Layer 2: NLP & Lemmatized Keyword Matching
  layer2Nlp: {
    hardSkillsCoverage: number;
    formalReqsCoverage: number;
    softSkillsFilterCount: number;
    extractedJdPhrasesCount: number;
    lemmatizedMatches: LemmatizedMatch[];
  };

  // Layer 3: Weighted Scoring Algebra
  layer3Scoring: {
    hardSkillScore: number; // Sh (Weight 3.0x)
    recencyScore: number;   // Sr (1.0 for current, 0.7 for mid, 0.4 for old)
    titleMatchScore: number; // St (Job Title Density & Similarity)
    formulaBreakdown: string;
  };

  matchedKeywords: string[];
  missingHardSkills: string[];
  missingSoftSkills: string[];
  ocrWarnings: string[];
  badDateFormats: string[];
  gapAnalysis: string[];
  recommendations: string[];
}

export interface TailoredHighlight {
  experienceId: string;
  role: string;
  company: string;
  originalText: string;
  optimizedText: string;
  source: 'SLOT_FILLING' | 'SEMANTIC_CACHE' | 'GEMINI_DELTA';
  keywordsMatched: string[];
}

export interface TailoredResume {
  targetJobTitle: string;
  companyName: string;
  summary: string;
  selectedHighlights: TailoredHighlight[];
  skillsMatched: {
    hardSkills: string[];
    toolsAndTech: string[];
    softSkills: string[];
  };
  atsScore: number;
  /** Work-experience ids ordered by relevance to this job offer (see lib/relevanceRanking.ts). Falls back to vault order when absent. */
  experienceOrder?: string[];
}

export interface CoverLetter {
  targetJobTitle: string;
  companyName: string;
  hook: string;
  proofPoints: string[];
  callToAction: string;
  fullText: string;
}

export interface ConsistencyCheckIssue {
  type: 'GAP' | 'SLOGAN' | 'UNQUANTIFIED' | 'MISSING_FIELD';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  suggestion: string;
}

export interface LayeredFactItem {
  id: string;
  experienceId: string;
  sourceFactId?: string;
  baseText: string;
  jobReframedText: string;
  userOverrideText?: string;
  isUserEdited: boolean;
  sourceType: 'VAULT_BASE' | 'AI_REFRAMED' | 'USER_EDITED';
  keywordsMatched: string[];
}

export interface PreFlightCheckItem {
  id: string;
  title: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  message: string;
  category: 'FACT_ACCURACY' | 'DEALBREAKER' | 'PAGE_BUDGET' | 'METRICS' | 'LANGUAGE';
}

/**
 * Ściąga na rozmowę kwalifikacyjną.
 *
 * Szkielet (słownik, pytania, checklista, pytania do rekrutera) powstaje lokalnie
 * i deterministycznie z (ParsedJobDescription, MasterVault) — zero tokenów. Model
 * dokłada wyłącznie to, co naprawdę wymaga personalizacji, i podmienia tylko
 * odpowiadające mu pola; stąd `source` przy pozycjach i `generationMode` na całości.
 */
export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: 'HARD_SKILL' | 'TOOL' | 'DOMAIN_CONCEPT' | 'ACRONYM';
  source: 'JD_KEYWORD' | 'JD_TOOL' | 'JD_HARD_SKILL';
}

export interface StarTalkingPoint {
  id: string;
  relatedRequirement: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  sourceExperienceId?: string;
}

export interface InterviewQaItem {
  id: string;
  question: string;
  modelAnswer: string;
  category: 'BEHAVIORAL' | 'TECHNICAL' | 'MOTIVATION' | 'SITUATIONAL';
  source: 'LOCAL_TEMPLATE' | 'GEMINI_PERSONALIZED';
}

export interface RedFlagConceptItem {
  id: string;
  label: string;
  detail: string;
  severity: 'MUST_KNOW' | 'GOOD_TO_KNOW';
  source: 'MANDATORY_REQUIREMENT' | 'CORE_RESPONSIBILITY' | 'SENIORITY_IMPLICATION';
}

export interface EmergencyPhrase {
  id: string;
  scenario: string;
  phrasePL: string;
  phraseEN?: string;
}

export interface QuestionToAsk {
  id: string;
  question: string;
  rationale: string;
  category: 'ROLE_SCOPE' | 'TEAM_CULTURE' | 'GROWTH' | 'BUSINESS_CONTEXT';
}

export interface InterviewCheatSheet {
  targetJobTitle: string;
  companyName: string;
  generatedAt: string;
  glossary: GlossaryTerm[];
  starTalkingPoints: StarTalkingPoint[];
  qaBank: InterviewQaItem[];
  redFlagsChecklist: RedFlagConceptItem[];
  emergencyPhrases: EmergencyPhrase[];
  questionsToAsk: QuestionToAsk[];
  personalizedFraming?: string;
  generationMode: 'LOCAL_SKELETON' | 'GEMINI_ENRICHED';
}

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  description?: string;
  requirements?: string[];
  tags?: string[];
  techStack?: string[];
  remote?: boolean;
  isRemote?: boolean;
  portal?: string;
  level?: string;
  url?: string;
  rawDescription?: string;
}

export interface ApplicationHistoryRecord {
  id: string;
  companyName: string;
  jobTitle: string;
  dateCreated: string;
  recruitmentMode: 'ATS_CORPORATE' | 'CRAFT_LOCAL' | 'HYBRID';
  atsScore: number;
  layeredFacts: LayeredFactItem[];
  exportedFormats: Array<'PDF' | 'DOCX' | 'TXT' | 'LINKEDIN'>;
  jobDescriptionExcerpt: string;
}


