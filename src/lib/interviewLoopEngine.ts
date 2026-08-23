import {
  InterviewLoopSession,
  PreCallChecklistItem,
  InterviewStage,
  LiveNoteItem,
  PostCallDebrief,
} from '../types';
import { StorageKeys } from './storage';

export const DEFAULT_PRE_CALL_CHECKLIST: Omit<PreCallChecklistItem, 'completed'>[] = [
  // Techniczne
  {
    id: 'chk_mic',
    category: 'TECHNICAL',
    label: 'Test mikrofonu i redukcji szumów',
  },
  {
    id: 'chk_cam',
    category: 'TECHNICAL',
    label: 'Kamera na wysokości oczu i neutralne tło',
  },
  {
    id: 'chk_net',
    category: 'TECHNICAL',
    label: 'Stabilne łącze internetowe i wyciszone powiadomienia',
  },
  // Przygotowanie merytoryczne
  {
    id: 'chk_pitch',
    category: 'RESEARCH',
    label: 'Kluczowy Elevator Pitch (30s) przećwiczony i gotowy',
  },
  {
    id: 'chk_company',
    category: 'RESEARCH',
    label: 'Przejrzany profil firmy, produkty i model biznesowy',
  },
  {
    id: 'chk_star',
    category: 'RESEARCH',
    label: 'Przygotowane 2-3 historie STAR z twardymi metrykami',
  },
  // Otoczenie
  {
    id: 'chk_water',
    category: 'ENVIRONMENT',
    label: 'Szklanka wody w zasięgu ręki',
  },
  {
    id: 'chk_notes',
    category: 'ENVIRONMENT',
    label: 'Otwarty Live HUD / notatnik z pytaniami do pracodawcy',
  },
];

export const STAGE_LABELS: Record<InterviewStage, { label: string; description: string }> = {
  INTRO: {
    label: 'Wstęp & Rozgrzewka (Intro)',
    description: 'Small talk, autoprezentacja (Elevator Pitch 30s) i przedstawienie agendy spotkania.',
  },
  TECHNICAL: {
    label: 'Pytania Techniczne & Narzędzia',
    description: 'Weryfikacja twardych umiejętności, technologii, uprawnień i architektury.',
  },
  SYSTEM_DESIGN: {
    label: 'System Design / Studia Przypadków',
    description: 'Projektowanie rozwiązania, analiza kompromisów technicznych i skalowalności.',
  },
  BEHAVIORAL: {
    label: 'Pytania Behawioralne (STAR)',
    description: 'Praca zespołowa, rozwiązywanie konfliktów, reakcja na awarie i trudne sytuacje.',
  },
  CANDIDATE_QA: {
    label: 'Pytania Kandydata do Rekrutera',
    description: 'Zadawanie strategicznych pytań o zespół, architekturę, roadmapę i kulturę.',
  },
  WRAP_UP: {
    label: 'Podsumowanie & Kolejne Kroki',
    description: 'Ustalenie timeline rekrutacji, widełek i terminu kolejnego kontaktu.',
  },
};

/**
 * Tworzy nową sesję pętli rekrutacyjnej (Interview Loop)
 */
export function createInterviewSession(
  companyName: string,
  roleTitle: string,
  scheduledAt = new Date().toISOString(),
  jobOfferId?: string,
  jdText?: string,
  tags: string[] = []
): InterviewLoopSession {
  return {
    id: `loop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    jobOfferId,
    companyName: companyName.trim() || 'Firma',
    roleTitle: roleTitle.trim() || 'Stanowisko',
    jdText,
    scheduledAt,
    status: 'UPCOMING',
    tags,
    selectedStories: [],
    selectedBridges: [],
    preCallChecklist: DEFAULT_PRE_CALL_CHECKLIST.map((item) => ({
      ...item,
      completed: false,
    })),
    liveTracker: {
      currentStage: 'INTRO',
      notes: [],
      interviewerQuestions: [],
      stageDurations: {},
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Przełącza etap w trakcie trwania rozmowy na żywo
 */
export function advanceInterviewStage(
  session: InterviewLoopSession,
  nextStage: InterviewStage
): InterviewLoopSession {
  return {
    ...session,
    status: 'IN_PROGRESS',
    liveTracker: {
      ...session.liveTracker,
      currentStage: nextStage,
      startedAt: session.liveTracker.startedAt || new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Dodaje notatkę ze spotkania na żywo
 */
export function addLiveNote(
  session: InterviewLoopSession,
  text: string,
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'CHALLENGING' = 'NEUTRAL'
): InterviewLoopSession {
  const trimmed = text.trim();
  if (!trimmed) return session;

  const newNote: LiveNoteItem = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
    stage: session.liveTracker.currentStage,
    text: trimmed,
    sentiment,
  };

  return {
    ...session,
    liveTracker: {
      ...session.liveTracker,
      notes: [...session.liveTracker.notes, newNote],
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generuje profesjonalnego maila z podziękowaniem (Follow-Up Email)
 * Szablon: "Dziękuję za rozmowę o [stanowisko]. Szczególnie podobało mi się [1 punkt z rozmowy]. Potwierdzam zainteresowanie i proszę o info nt. następnego kroku."
 */
export function generateFollowUpEmail(
  session: InterviewLoopSession,
  candidateName = 'Kandydat',
  debriefData?: Partial<PostCallDebrief>
): string {
  const role = session.roleTitle;
  const highlightPoint =
    debriefData?.whatWentWell?.trim() ||
    session.liveTracker.notes[0]?.text ||
    'omówienie wyzwań architektonicznych i planów rozwojowych zespołu';

  return (
    `Dzień dobry,\n\n` +
    `Dziękuję za rozmowę o ${role}. Szczególnie podobało mi się ${highlightPoint}. ` +
    `Potwierdzam zainteresowanie i proszę o info nt. następnego kroku.\n\n` +
    `Z poważaniem,\n` +
    `${candidateName}`
  );
}

/**
 * Zapis i odczyt z pamięci lokalnej (StorageKeys.interviewLoops)
 */
export function loadInterviewSessions(): InterviewLoopSession[] {
  try {
    const raw = localStorage.getItem(StorageKeys.interviewLoops);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInterviewSession(session: InterviewLoopSession): void {
  try {
    const existing = loadInterviewSessions();
    const idx = existing.findIndex((s) => s.id === session.id);
    const updated =
      idx >= 0
        ? existing.map((s, i) => (i === idx ? session : s))
        : [session, ...existing];
    localStorage.setItem(StorageKeys.interviewLoops, JSON.stringify(updated));
  } catch {
    // Ignoruj błędy zapisu
  }
}

export function deleteInterviewSession(sessionId: string): void {
  try {
    const existing = loadInterviewSessions();
    const filtered = existing.filter((s) => s.id !== sessionId);
    localStorage.setItem(StorageKeys.interviewLoops, JSON.stringify(filtered));
  } catch {
    // Ignoruj błędy usuwania
  }
}
