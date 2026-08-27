import { AUDIO_ITEMS_BY_CATEGORY, AUDIO_ITEMS_BY_ID, RECRUITER_AUDIO_MANIFEST } from './audioManifestData';
import {
  AudioCategory,
  AudioManifestItem,
  CandidateAnswerInput,
  RecruiterDecisionResult,
  RecruiterSessionState,
  VadSignalInput,
} from './types';

/** Minimalna liczba słów, aby uznać odpowiedź za wyczerpującą. */
export const MIN_EXHAUSTIVE_WORD_COUNT = 15;

/** Próg czasu mowy w sekundach uruchamiający wtrącenie aktywnego słuchania (ACK) w tle. */
export const VAD_SPEECH_ACK_THRESHOLD_SEC = 2.0;

/** Próg ciszy w sekundach oznaczający koniec tury kandydata. */
export const VAD_SILENCE_TURN_END_THRESHOLD_SEC = 1.2;

/** Próg czasu monologu uruchamiający przerwanie wypowiedzi (Barge-In). */
export const MAX_MONOLOGUE_BARGEIN_DURATION_SEC = 75.0;

/** Domyślna agenda pytań (A01, B01, C01, D01, A03, B06, C04, D02) */
export const DEFAULT_AGENDA_QUESTION_IDS: readonly string[] = [
  'A01', // Najpoważniejszy błąd (Behavioral)
  'B01', // Metodologia RCA (Technical)
  'C01', // BHP & zagrożenie (Specialist/Trade)
  'D01', // Konflikt w zespole (Leadership)
  'A03', // Mierzalny sukces (Behavioral)
  'B06', // Optymalizacja wydajności (Technical)
  'C04', // Elektryka i pomiary (Specialist/Trade)
  'D02', // Niezadowolony klient (Leadership/Client)
] as const;

/**
 * Losuje element z listy, unikając natychmiastowego powtórzenia ostatnio użytych ID.
 */
export function pickRandomAudio(
  items: AudioManifestItem[],
  excludeIds: string[] = []
): AudioManifestItem {
  if (items.length === 0) {
    return RECRUITER_AUDIO_MANIFEST.items[0];
  }

  const filtered = items.filter((it) => !excludeIds.includes(it.id));
  const pool = filtered.length > 0 ? filtered : items;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Inicjalizuje nową stanową sesję rekrutera.
 */
export function createRecruiterSession(options?: {
  agendaQuestionIds?: string[];
  maxDrillsPerQuestion?: number;
  totalInterviewTimeLimitSec?: number;
}): RecruiterSessionState {
  const ids = options?.agendaQuestionIds ?? DEFAULT_AGENDA_QUESTION_IDS;
  const agendaQuestions = ids
    .map((id) => AUDIO_ITEMS_BY_ID.get(id))
    .filter((it): it is AudioManifestItem => Boolean(it));

  return {
    currentQuestionIndex: 0,
    agendaQuestions: agendaQuestions.length > 0 ? agendaQuestions : RECRUITER_AUDIO_MANIFEST.items.slice(0, 5),
    completedQuestionIds: [],
    drillCountForCurrentQuestion: 0,
    maxDrillsPerQuestion: options?.maxDrillsPerQuestion ?? 2,
    totalInterviewElapsedSec: 0,
    totalInterviewTimeLimitSec: options?.totalInterviewTimeLimitSec ?? 900, // 15 minut
    recentAckIds: [],
  };
}

/**
 * 1. Ewaluacja sygnału VAD na żywo podczas mowy użytkownika.
 * Jeśli kandydat mówi nieprzerwanie > 2.0s, router losuje krótkie wtrącenie ACK w tle na niskiej głośności.
 */
export function evaluateRecruiterVadSignal(
  session: RecruiterSessionState,
  vad: VadSignalInput
): { shouldPlayAck: boolean; ackAudio?: AudioManifestItem; audioVolume: number } {
  if (vad.isSpeaking && vad.speechDurationSec >= VAD_SPEECH_ACK_THRESHOLD_SEC) {
    const ackItems = AUDIO_ITEMS_BY_CATEGORY.get('FILLER_ACK') || [];
    const selected = pickRandomAudio(ackItems, session.recentAckIds);

    // Zapisz do bufora ostatnich wtrąceń (max 5), aby nie powtarzać tego samego "Mhm"
    session.recentAckIds.push(selected.id);
    if (session.recentAckIds.length > 5) {
      session.recentAckIds.shift();
    }

    return {
      shouldPlayAck: true,
      ackAudio: selected,
      audioVolume: 0.35, // Niska głośność w tle, nie zagłusza kandydata
    };
  }

  return {
    shouldPlayAck: false,
    audioVolume: 0,
  };
}

/**
 * Zlicza słowa w tekście transkrypcji.
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Wykrywa czy transkrypcja lub sygnał audio wykazuje błędy techniczne (szum, brak dźwięku, lag).
 */
export function detectAudioQualityIssue(input: CandidateAnswerInput): { hasIssue: boolean; reason?: string } {
  const words = input.wordCount ?? countWords(input.transcript);

  // Brak mowy przy wykryciu ciszy
  if (words === 0 && input.vad.speechDurationSec < 0.5) {
    return { hasIssue: true, reason: 'Brak wykrytej mowy / cisza w kanale mikrofonu' };
  }

  // Zbyt niski poziom RMS (dźwięk poniżej progu słyszalności)
  if (input.vad.audioRmsLevel !== undefined && input.vad.audioRmsLevel < 0.01 && words === 0) {
    return { hasIssue: true, reason: 'Zbyt niski poziom sygnału audio (mikrofon wyciszony)' };
  }

  // Zbyt niski stosunek sygnału do szumu (SNR < 3dB)
  if (input.vad.snrDb !== undefined && input.vad.snrDb < 3.0 && words <= 2) {
    return { hasIssue: true, reason: 'Duże zakłócenia i szum w tle uniemożliwiające zrozumienie' };
  }

  return { hasIssue: false };
}

/**
 * 2. Deterministyczny Router i Klasyfikator Intencji po zakończeniu wypowiedzi (cisza > 1.2s).
 */
export function evaluateRecruiterCandidateAnswer(
  session: RecruiterSessionState,
  input: CandidateAnswerInput
): RecruiterDecisionResult {
  const words = input.wordCount ?? countWords(input.transcript);
  const duration = input.durationSec || input.vad.speechDurationSec;
  session.totalInterviewElapsedSec += duration;

  const currentQuestion = session.agendaQuestions[session.currentQuestionIndex];

  // =========================================================================
  // WARUNEK 1: Słaba jakość audio / brak mowy / błąd połączenia
  // =========================================================================
  const quality = detectAudioQualityIssue(input);
  if (quality.hasIssue) {
    const errorItems = AUDIO_ITEMS_BY_CATEGORY.get('FLOW_ERROR') || [];
    const selected = pickRandomAudio(errorItems, session.lastPlayedAudioId ? [session.lastPlayedAudioId] : []);
    session.lastPlayedAudioId = selected.id;

    return {
      decision: 'HANDLE_AUDIO_ERROR',
      reason: quality.reason || 'Słaba jakość audio / brak transkrypcji',
      selectedAudio: selected,
      audioVolume: 1.0,
      shouldAdvanceQuestionIndex: false,
      metrics: {
        wordCount: words,
        durationSec: duration,
        speechDurationSec: input.vad.speechDurationSec,
        silenceDurationSec: input.vad.silenceDurationSec,
      },
    };
  }

  // =========================================================================
  // WARUNEK 2: Kandydat mówi za długo (Barge-In / ucięcie monologu > 75s / > 150 słów)
  // =========================================================================
  if (duration > MAX_MONOLOGUE_BARGEIN_DURATION_SEC || words > 150) {
    const bargeItems = AUDIO_ITEMS_BY_CATEGORY.get('FLOW_BARGEIN') || [];
    const selected = pickRandomAudio(bargeItems, session.lastPlayedAudioId ? [session.lastPlayedAudioId] : []);
    session.lastPlayedAudioId = selected.id;

    return {
      decision: 'BARGE_IN',
      reason: `Wypowiedź przekroczyła limit czasu (${duration.toFixed(1)}s / ${words} słów)`,
      selectedAudio: selected,
      audioVolume: 1.0,
      shouldAdvanceQuestionIndex: false,
      metrics: {
        wordCount: words,
        durationSec: duration,
        speechDurationSec: input.vad.speechDurationSec,
        silenceDurationSec: input.vad.silenceDurationSec,
      },
    };
  }

  // =========================================================================
  // WARUNEK 3: Kandydat odpowiedział zbyt krótko (< 15 słów) -> Drążenie (CLR / DBT)
  // =========================================================================
  if (words < MIN_EXHAUSTIVE_WORD_COUNT && session.drillCountForCurrentQuestion < session.maxDrillsPerQuestion) {
    session.drillCountForCurrentQuestion += 1;

    // Wybierz drążenie STAR (CLR) lub drążenie sceptyczne (DBT)
    const category: AudioCategory = session.drillCountForCurrentQuestion % 2 === 1 ? 'DRILL_STAR' : 'DRILL_SKEPTIC';
    const drillItems = AUDIO_ITEMS_BY_CATEGORY.get(category) || AUDIO_ITEMS_BY_CATEGORY.get('DRILL_STAR') || [];
    const selected = pickRandomAudio(drillItems, session.lastPlayedAudioId ? [session.lastPlayedAudioId] : []);
    session.lastPlayedAudioId = selected.id;

    return {
      decision: 'DRILL_DEEPER',
      reason: `Krótka odpowiedź (${words} słów < ${MIN_EXHAUSTIVE_WORD_COUNT}) — pogłębienie STAR (próba ${session.drillCountForCurrentQuestion}/${session.maxDrillsPerQuestion})`,
      selectedAudio: selected,
      audioVolume: 1.0,
      shouldAdvanceQuestionIndex: false,
      metrics: {
        wordCount: words,
        durationSec: duration,
        speechDurationSec: input.vad.speechDurationSec,
        silenceDurationSec: input.vad.silenceDurationSec,
      },
    };
  }

  // =========================================================================
  // WARUNEK 4: Sprawdzenie limitu czasowego wywiadu (Timing constraints)
  // =========================================================================
  const timeProgress = session.totalInterviewElapsedSec / session.totalInterviewTimeLimitSec;
  if (timeProgress >= 0.85 && session.currentQuestionIndex < session.agendaQuestions.length - 1) {
    const timingItems = AUDIO_ITEMS_BY_CATEGORY.get('FLOW_TIMING') || [];
    const timingAudio = pickRandomAudio(timingItems);
    session.lastPlayedAudioId = timingAudio.id;

    // Przeskocz do ostatniego pytania
    session.currentQuestionIndex = session.agendaQuestions.length - 1;
    const finalQuestion = session.agendaQuestions[session.currentQuestionIndex];

    return {
      decision: 'NOTIFY_TIMING',
      reason: `Upływa czas wywiadu (${Math.round(timeProgress * 100)}% limitu) — przejście do ostatniego pytania`,
      selectedAudio: timingAudio,
      secondaryAudio: finalQuestion,
      audioVolume: 1.0,
      shouldAdvanceQuestionIndex: true,
      metrics: {
        wordCount: words,
        durationSec: duration,
        speechDurationSec: input.vad.speechDurationSec,
        silenceDurationSec: input.vad.silenceDurationSec,
      },
    };
  }

  // =========================================================================
  // WARUNEK 5: Kandydat odpowiedział wyczerpująco (>= 15 słów) -> Przejście do nowego pytania
  // =========================================================================
  if (currentQuestion) {
    session.completedQuestionIds.push(currentQuestion.id);
  }
  session.drillCountForCurrentQuestion = 0;
  session.currentQuestionIndex += 1;

  // Czy są jeszcze pytania w agendzie?
  if (session.currentQuestionIndex < session.agendaQuestions.length) {
    const nextQuestion = session.agendaQuestions[session.currentQuestionIndex];

    // Losuj płynne przejście (TRS) lub reakcję (RCT)
    const transitionItems = AUDIO_ITEMS_BY_CATEGORY.get('FILLER_TRANSITION') || [];
    const transitionAudio = pickRandomAudio(transitionItems, session.lastPlayedAudioId ? [session.lastPlayedAudioId] : []);
    session.lastPlayedAudioId = transitionAudio.id;

    return {
      decision: 'PROCEED_NEXT',
      reason: `Wyczerpująca odpowiedź (${words} słów) — przejście do pytania ${session.currentQuestionIndex + 1}/${session.agendaQuestions.length}`,
      selectedAudio: transitionAudio,
      secondaryAudio: nextQuestion,
      audioVolume: 1.0,
      shouldAdvanceQuestionIndex: true,
      metrics: {
        wordCount: words,
        durationSec: duration,
        speechDurationSec: input.vad.speechDurationSec,
        silenceDurationSec: input.vad.silenceDurationSec,
      },
    };
  }

  // =========================================================================
  // WARUNEK 6: Wszystkie pytania wyczerpane -> Zakończenie wywiadu (END)
  // =========================================================================
  const closingItems = AUDIO_ITEMS_BY_CATEGORY.get('FLOW_CLOSING') || [];
  const closingAudio = pickRandomAudio(closingItems, session.lastPlayedAudioId ? [session.lastPlayedAudioId] : []);
  session.lastPlayedAudioId = closingAudio.id;

  return {
    decision: 'CLOSE_INTERVIEW',
    reason: 'Wszystkie zaplanowane pytania z agendy zostały zrealizowane',
    selectedAudio: closingAudio,
    audioVolume: 1.0,
    shouldAdvanceQuestionIndex: false,
    metrics: {
      wordCount: words,
      durationSec: duration,
      speechDurationSec: input.vad.speechDurationSec,
      silenceDurationSec: input.vad.silenceDurationSec,
    },
  };
}

/**
 * Bezpiecznie generuje URL lub ścieżkę do pliku audio.
 */
export function resolveAudioFilePath(
  item: AudioManifestItem,
  basePath = '/audio/'
): string {
  const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${cleanBase}${item.file}`;
}
