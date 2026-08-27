export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead';

export interface ExtractedProfileData {
  title: string;
  yearsOfExperience: number;
  location: string;
  topSkills: string[];
  domain: string;
  seniority: SeniorityLevel;
  industry: 'it' | 'trades' | 'medical' | 'sales' | 'general';
}

export interface SummarySuggestion {
  id: string;
  styleId?: string;
  styleName: 'Mocne Osiągnięcia' | 'Specjalistyczny' | 'Zorientowany na Wyniki' | 'Kompaktowy' | 'Menedżerski';
  text: string;
  wordCount: number;
  sentenceCount: number;
  highlightedKeywords: string[];
  usedLexemes?: {
    verb?: string;
    impact?: string;
    adj?: string;
  };
  weight?: number;
}
