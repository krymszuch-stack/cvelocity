import { MasterVault, JobOffer, TokenStats } from './index';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface JobsQueryParams {
  keywords?: string;
  location?: string;
  remoteOnly?: string | boolean;
  portal?: string;
  seniority?: string;
}

export interface FetchJdUrlRequest {
  url: string;
}

export interface FetchJdUrlResponse {
  title: string;
  company: string;
  descriptionRaw: string;
  sourceUrl: string;
}

export interface ParsedJobDescription {
  title: string;
  company: string;
  requirements: string[];
  niceToHave: string[];
  seniorityLevel: string;
  techStack: string[];
  languages: string[];
  experienceYears?: number;
  salary?: string;
}

export interface DeltaOptimizeRequest {
  originalBullet: string;
  targetRole?: string;
  keywords?: string[];
  metricFocus?: string;
}

export interface DeltaOptimizeResponse {
  optimizedBullet: string;
  tokensSaved: number;
  method: 'SLOT_FILLING' | 'SEMANTIC_CACHE' | 'GEMINI_DELTA';
}

export interface CoverLetterRequest {
  targetRole: string;
  companyName: string;
  jobDescription: string;
  vault: MasterVault;
}

export interface InterviewPrepRequest {
  targetRole: string;
  companyName: string;
  jobDescription: string;
  vault: MasterVault;
}

export interface InterviewPrepResponse {
  questions: Array<{
    question: string;
    difficulty: 'Łatwe' | 'Średnie' | 'Wymagające';
    category: string;
    answerTip: string;
  }>;
  starSuggestions: Array<{
    situation: string;
    task: string;
    action: string;
    result: string;
  }>;
  glossary: Array<{
    term: string;
    definition: string;
  }>;
}

export interface UsageStatsResponse {
  totalTokensSaved: number;
  estimatedCostSavedUSD: number;
  localSlotHits: number;
  cacheHits: number;
  geminiDeltaCalls: number;
}
