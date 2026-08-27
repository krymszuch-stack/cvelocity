export type QuestionCategory =
  | 'BEHAVIORAL'
  | 'TECHNICAL'
  | 'TRADE'
  | 'SITUATIONAL'
  | 'LEADERSHIP'
  | 'CLIENT';

export type TokenSlotName =
  | 'rola'
  | 'firma'
  | 'narzedzie'
  | 'obiekt'
  | 'luka_kompetencyjna'
  | 'metryka'
  | 'uprawnienie'
  | 'projekt'
  | 'procedura'
  | 'klient'
  | 'czas_reakcji';

export interface QuestionTokenContext {
  rola?: string;
  firma?: string;
  narzedzie?: string;
  obiekt?: string;
  luka_kompetencyjna?: string;
  metryka?: string;
  uprawnienie?: string;
  projekt?: string;
  procedura?: string;
  klient?: string;
  czas_reakcji?: string;
  [key: string]: string | undefined;
}

/** Pytanie prerecorded / stały scenariusz STAR */
export interface PrerecordedInterviewQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  intent: string; // cel rekrutera (co naprawdę bada)
  starHint: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  recommendedDurationSec: number;
  tradeSpecialization?: string; // np. "HVAC", "Spawalnictwo", "Elektryka", "IT", "Logistyka", "Finanse"
  tags: string[];
}

/** Pytanie szablonowe z dynamiczną injekcją tokenów z API/profilu/ogłoszenia */
export interface DynamicTokenInterviewQuestion {
  id: string;
  template: string; // tekst z tokenami {{nazwa_tokenu}}
  requiredTokens: TokenSlotName[];
  category: QuestionCategory;
  intent: string;
  starFrameworkGuide: string;
  fallbackQuestion: string; // wersja awaryjna w razie braku tokenów
  defaultTokens?: Partial<Record<TokenSlotName, string>>;
  tags: string[];
}

export interface InjectedInterviewQuestion {
  id: string;
  resolvedQuestion: string;
  rawTemplate: string;
  category: QuestionCategory;
  intent: string;
  starGuide: string;
  injectedTokens: Partial<Record<TokenSlotName, string>>;
  missingTokens: TokenSlotName[];
  isFullyInjected: boolean;
}
