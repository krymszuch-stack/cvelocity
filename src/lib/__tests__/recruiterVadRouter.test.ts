import { describe, expect, it } from 'vitest';
import {
  AUDIO_ITEMS_BY_CATEGORY,
  AUDIO_ITEMS_BY_ID,
  RECRUITER_AUDIO_MANIFEST,
  countWords,
  createRecruiterSession,
  evaluateRecruiterCandidateAnswer,
  evaluateRecruiterVadSignal,
  resolveAudioFilePath,
} from '../recruiterAudio';

describe('Recruiter Audio Manifest & VAD Deterministic Router', () => {
  // =========================================================================
  // 1. Spójność manifestu audio (180 nagrań)
  // =========================================================================
  it('zawiera dokładnie 180 zweryfikowanych plików audio ze spójnymi ID i kategoriami', () => {
    expect(RECRUITER_AUDIO_MANIFEST.total_items).toBe(180);
    expect(RECRUITER_AUDIO_MANIFEST.items.length).toBe(180);

    const ids = new Set<string>();
    for (const item of RECRUITER_AUDIO_MANIFEST.items) {
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);

      expect(item.file).toMatch(/\.mp3$/);
      expect(item.transcript.length).toBeGreaterThan(0);
      expect(item.intent.length).toBeGreaterThan(0);
      expect(AUDIO_ITEMS_BY_ID.get(item.id)).toBeDefined();
    }
  });

  it('poprawnie kategoryzuje wszystkie 15 grup tematycznych', () => {
    expect(AUDIO_ITEMS_BY_CATEGORY.get('QUEST_BEHAVIORAL')?.length).toBe(10);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('QUEST_TECHNICAL')?.length).toBe(10);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('QUEST_SPECIALIST')?.length).toBe(8);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('QUEST_LEADERSHIP')?.length).toBe(7);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FILLER_ACK')?.length).toBe(25);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FILLER_THINK')?.length).toBe(15);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FILLER_CONTINUE')?.length).toBe(15);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FILLER_REACTION')?.length).toBe(15);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FILLER_TRANSITION')?.length).toBe(15);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('DRILL_STAR')?.length).toBe(10);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('DRILL_SKEPTIC')?.length).toBe(10);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FLOW_BARGEIN')?.length).toBe(10);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FLOW_ERROR')?.length).toBe(10);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FLOW_TIMING')?.length).toBe(10);
    expect(AUDIO_ITEMS_BY_CATEGORY.get('FLOW_CLOSING')?.length).toBe(10);
  });

  // =========================================================================
  // 2. Detekcja sygnału VAD i wtrącenia ACK w tle
  // =========================================================================
  it('wykrywa mowę > 2s i losuje wtrącenie ACK na niskiej głośności (0.35)', () => {
    const session = createRecruiterSession();

    // Mowa krótka (< 2s) -> brak wtrącenia
    const shortVad = evaluateRecruiterVadSignal(session, {
      isSpeaking: true,
      speechDurationSec: 1.4,
      silenceDurationSec: 0,
    });
    expect(shortVad.shouldPlayAck).toBe(false);

    // Mowa ciągła (>= 2s) -> wtrącenie ACK w tle
    const continuousVad = evaluateRecruiterVadSignal(session, {
      isSpeaking: true,
      speechDurationSec: 2.3,
      silenceDurationSec: 0,
    });
    expect(continuousVad.shouldPlayAck).toBe(true);
    expect(continuousVad.audioVolume).toBe(0.35);
    expect(continuousVad.ackAudio?.category).toBe('FILLER_ACK');
    expect(session.recentAckIds.length).toBe(1);
  });

  // =========================================================================
  // 3. Router intencji po zakończeniu wypowiedzi (cisza > 1.2s)
  // =========================================================================
  it('krótka odpowiedź (< 15 słów) uruchamia drążenie STAR (CLR/DBT) bez zmiany pytania', () => {
    const session = createRecruiterSession();

    const decision = evaluateRecruiterCandidateAnswer(session, {
      transcript: 'Tak, opanowałem tę awarię bardzo szybko z kolegą.',
      durationSec: 4.5,
      vad: {
        isSpeaking: false,
        speechDurationSec: 4.5,
        silenceDurationSec: 1.3,
      },
    });

    expect(decision.decision).toBe('DRILL_DEEPER');
    expect(['DRILL_STAR', 'DRILL_SKEPTIC']).toContain(decision.selectedAudio.category);
    expect(decision.shouldAdvanceQuestionIndex).toBe(false);
    expect(decision.audioVolume).toBe(1.0);
    expect(session.drillCountForCurrentQuestion).toBe(1);
  });

  it('wyczerpująca odpowiedź (>= 15 słów) uruchamia przejście TRS i następne pytanie z agendy', () => {
    const session = createRecruiterSession();

    const longAnswer =
      'Gdy doszło do wycieku na rurociągu, natychmiast odciąłem zawór sekcyjny, ' +
      'zabezpieczyłem strefę taśmami ostrzegawczymi, a następnie przygotowałem złącze do spawania metodą TIG 141 ' +
      'i wykonałem próbę szczelności z wynikiem 100% pozytywnym.';

    expect(countWords(longAnswer)).toBeGreaterThan(15);

    const decision = evaluateRecruiterCandidateAnswer(session, {
      transcript: longAnswer,
      durationSec: 25.0,
      vad: {
        isSpeaking: false,
        speechDurationSec: 25.0,
        silenceDurationSec: 1.4,
      },
    });

    expect(decision.decision).toBe('PROCEED_NEXT');
    expect(decision.selectedAudio.category).toBe('FILLER_TRANSITION');
    expect(decision.secondaryAudio).toBeDefined();
    expect(decision.secondaryAudio?.category.startsWith('QUEST_')).toBe(true);
    expect(decision.shouldAdvanceQuestionIndex).toBe(true);
    expect(session.completedQuestionIds.length).toBe(1);
  });

  it('obsługuje błędy jakości audio / brak sygnału mikrofonu (ERR)', () => {
    const session = createRecruiterSession();

    const decision = evaluateRecruiterCandidateAnswer(session, {
      transcript: '',
      durationSec: 2.0,
      vad: {
        isSpeaking: false,
        speechDurationSec: 0.1,
        silenceDurationSec: 2.0,
        audioRmsLevel: 0.002, // Wyciszony mikrofon
      },
    });

    expect(decision.decision).toBe('HANDLE_AUDIO_ERROR');
    expect(decision.selectedAudio.category).toBe('FLOW_ERROR');
    expect(decision.shouldAdvanceQuestionIndex).toBe(false);
  });

  it('przerywa zbyt długi monolog kandydata (> 75s / > 150 słów) za pomocą Barge-In (BAR)', () => {
    const session = createRecruiterSession();

    const decision = evaluateRecruiterCandidateAnswer(session, {
      transcript: 'Opis sytuacji...'.repeat(80),
      durationSec: 82.0,
      vad: {
        isSpeaking: false,
        speechDurationSec: 82.0,
        silenceDurationSec: 1.3,
      },
    });

    expect(decision.decision).toBe('BARGE_IN');
    expect(decision.selectedAudio.category).toBe('FLOW_BARGEIN');
    expect(decision.shouldAdvanceQuestionIndex).toBe(false);
  });

  it('zamyka wywiad (END) po wyczerpaniu wszystkich pytań z agendy', () => {
    const session = createRecruiterSession({ agendaQuestionIds: ['A01', 'B01'] });

    // Pytanie 1 (długa odpowiedź >= 15 słów)
    evaluateRecruiterCandidateAnswer(session, {
      transcript:
        'To była bardzo długa i wyczerpująca odpowiedź na pierwsze pytanie rekrutacyjne o poważną awarię, ' +
        'zastosowane metody Root Cause Analysis oraz wdrożone procedury naprawcze.',
      durationSec: 20.0,
      vad: { isSpeaking: false, speechDurationSec: 20.0, silenceDurationSec: 1.3 },
    });

    // Pytanie 2 (ostatnie z agendy, długa odpowiedź >= 15 słów)
    const finalDecision = evaluateRecruiterCandidateAnswer(session, {
      transcript:
        'Druga wyczerpująca i niezwykle szczegółowa odpowiedź dotycząca pełnej procedury diagnozy ' +
        'oraz skutecznej lokalizacji usterki instalacji technicznej w reżimie ciągłej pracy.',
      durationSec: 22.0,
      vad: { isSpeaking: false, speechDurationSec: 22.0, silenceDurationSec: 1.3 },
    });

    expect(finalDecision.decision).toBe('CLOSE_INTERVIEW');
    expect(finalDecision.selectedAudio.category).toBe('FLOW_CLOSING');
  });

  it('generuje prawidłowe ścieżki i URLe do plików mp3', () => {
    const item = AUDIO_ITEMS_BY_ID.get('A01')!;
    expect(resolveAudioFilePath(item)).toBe('/audio/A/A01_najpowazniejszy_blad.mp3');
    expect(resolveAudioFilePath(item, 'D:/Pobrane/audio_out')).toBe('D:/Pobrane/audio_out/A/A01_najpowazniejszy_blad.mp3');
  });
});
