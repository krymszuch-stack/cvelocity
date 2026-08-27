export type AudioCategory =
  | 'QUEST_BEHAVIORAL'
  | 'QUEST_TECHNICAL'
  | 'QUEST_SPECIALIST'
  | 'QUEST_LEADERSHIP'
  | 'FILLER_ACK'
  | 'FILLER_THINK'
  | 'FILLER_CONTINUE'
  | 'FILLER_REACTION'
  | 'FILLER_TRANSITION'
  | 'DRILL_STAR'
  | 'DRILL_SKEPTIC'
  | 'FLOW_BARGEIN'
  | 'FLOW_ERROR'
  | 'FLOW_TIMING'
  | 'FLOW_CLOSING';

export interface AudioManifestItem {
  id: string;
  file: string;
  category: AudioCategory;
  intent: string;
  transcript: string;
}

export interface AudioManifest {
  manifest_version: string;
  total_items: number;
  items: AudioManifestItem[];
}

export type RecruiterDecisionKind =
  | 'PLAY_ACK_BACKGROUND' // Wtrącenie w tle podczas mowy kandydata (> 2s)
  | 'DRILL_DEEPER'        // Kandydat odpowiedział za krótko (< 15 słów) -> CLR / DBT
  | 'PROCEED_NEXT'        // Kandydat odpowiedział wyczerpująco -> TRS + nowe pytanie
  | 'HANDLE_AUDIO_ERROR'  // Za cicho / brak mowy / szum -> ERR
  | 'BARGE_IN'            // Kandydat mówi za długo (> 75s) -> BAR
  | 'NOTIFY_TIMING'       // Kończy się czas wywiadu -> TIM
  | 'CLOSE_INTERVIEW';    // Wszystkie pytania wyczerpane -> END

export interface VadSignalInput {
  isSpeaking: boolean;
  speechDurationSec: number;
  silenceDurationSec: number;
  audioRmsLevel?: number; // 0.0 - 1.0 (poziom głośności)
  snrDb?: number;         // Signal-to-Noise ratio
}

export interface CandidateAnswerInput {
  transcript: string;
  wordCount?: number;
  durationSec: number;
  vad: VadSignalInput;
  detectedMetricsCount?: number;
  hasStarStructure?: boolean;
}

export interface RecruiterDecisionResult {
  decision: RecruiterDecisionKind;
  reason: string;
  selectedAudio: AudioManifestItem;
  secondaryAudio?: AudioManifestItem; // np. TRS (transition) + nowe pytanie QUEST
  audioVolume: number; // np. 1.0 lub 0.35 dla wtrąceń ACK
  shouldAdvanceQuestionIndex: boolean;
  metrics: {
    wordCount: number;
    durationSec: number;
    speechDurationSec: number;
    silenceDurationSec: number;
  };
}

export interface RecruiterSessionState {
  currentQuestionIndex: number;
  agendaQuestions: AudioManifestItem[];
  completedQuestionIds: string[];
  drillCountForCurrentQuestion: number;
  maxDrillsPerQuestion: number;
  totalInterviewElapsedSec: number;
  totalInterviewTimeLimitSec: number;
  lastPlayedAudioId?: string;
  recentAckIds: string[];
}
