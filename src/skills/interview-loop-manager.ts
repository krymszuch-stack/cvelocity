import interviewLoopManagerPrompt from './prompts/interview-loop-manager.prompt';
import { AntigravitySkill, createSkillFromPrompt, ag } from './liveHudSkill';
import {
  InterviewLoopSession,
  InterviewStage,
} from '../types';
import {
  createInterviewSession,
  advanceInterviewStage,
  addLiveNote,
  generateFollowUpEmail,
  loadInterviewSessions,
  saveInterviewSession,
} from '../lib/interviewLoopEngine';

export const InterviewLoopManager: AntigravitySkill = createSkillFromPrompt({
  id: interviewLoopManagerPrompt.id,
  name: interviewLoopManagerPrompt.name,
  version: interviewLoopManagerPrompt.version,
  description: interviewLoopManagerPrompt.description,
  dependencies: [...interviewLoopManagerPrompt.dependencies],
  ui: 'InterviewLoopModal',
  activation: {
    hotkey: interviewLoopManagerPrompt.activation.hotkey,
    events: [...interviewLoopManagerPrompt.activation.events],
    clickAction: interviewLoopManagerPrompt.activation.clickAction,
  },
  permissions: [...interviewLoopManagerPrompt.permissions],
  systemPrompt: interviewLoopManagerPrompt.systemPrompt,
});

// Rejestracja skilla w globalnym rejestrze ag
ag.registerSkill(InterviewLoopManager);
ag.activateOnRoute('/interview/*');

export interface LoopInvocationPayload {
  companyName?: string;
  roleTitle?: string;
  jobOfferId?: string;
  action?: 'create' | 'advance' | 'addNote' | 'generateEmail';
  session?: InterviewLoopSession;
  nextStage?: InterviewStage;
  noteText?: string;
  candidateName?: string;
}

/**
 * Obsługa wywołania skilla Interview Loop Manager
 */
export function invokeInterviewLoopManager(
  payload: LoopInvocationPayload
): unknown {
  if (payload.action === 'create' && payload.companyName && payload.roleTitle) {
    const session = createInterviewSession(
      payload.companyName,
      payload.roleTitle,
      undefined,
      payload.jobOfferId
    );
    saveInterviewSession(session);
    return session;
  }

  if (payload.action === 'advance' && payload.session && payload.nextStage) {
    const updated = advanceInterviewStage(payload.session, payload.nextStage);
    saveInterviewSession(updated);
    return updated;
  }

  if (payload.action === 'addNote' && payload.session && payload.noteText) {
    const updated = addLiveNote(payload.session, payload.noteText);
    saveInterviewSession(updated);
    return updated;
  }

  if (payload.action === 'generateEmail' && payload.session) {
    return generateFollowUpEmail(payload.session, payload.candidateName);
  }

  return loadInterviewSessions();
}
