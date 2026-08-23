import mockDrillModePrompt from './prompts/mock-drill-mode.prompt';
import { AntigravitySkill, createSkillFromPrompt, ag } from './liveHudSkill';
import {
  DrillQuestion,
  DrillAttemptRecord,
  DEFAULT_DRILL_QUESTIONS,
  getRandomDrillQuestion,
  analyzeDrillResponse,
  loadDrillHistory,
  saveDrillAttempt,
} from '../lib/drillEngine';

export const MockDrillMode: AntigravitySkill = createSkillFromPrompt({
  id: mockDrillModePrompt.id,
  name: mockDrillModePrompt.name,
  version: mockDrillModePrompt.version,
  description: mockDrillModePrompt.description,
  dependencies: [...mockDrillModePrompt.dependencies],
  ui: 'DrillModeModal',
  activation: {
    hotkey: mockDrillModePrompt.activation.hotkey,
    events: [...mockDrillModePrompt.activation.events],
    clickAction: mockDrillModePrompt.activation.clickAction,
  },
  permissions: [...mockDrillModePrompt.permissions],
  systemPrompt: mockDrillModePrompt.systemPrompt,
});

// Rejestracja skilla w globalnym rejestrze ag
ag.registerSkill(MockDrillMode);

// Bindowanie skrótów klawiszowych Cmd+D i Ctrl+D
ag.bindShortcut('Cmd+D', () => ag.invokeSkill('mock-drill-mode-v1'));
ag.bindShortcut('Ctrl+D', () => ag.invokeSkill('mock-drill-mode-v1'));

export interface MockDrillInvocationPayload {
  action?: 'randomQuestion' | 'evaluate' | 'history' | 'save';
  question?: DrillQuestion;
  transcript?: string;
  durationSec?: number;
  pool?: DrillQuestion[];
  attempt?: DrillAttemptRecord;
}

/**
 * Obsługa wywołania skilla Mock Drill Mode
 */
export function invokeMockDrillMode(payload?: MockDrillInvocationPayload): unknown {
  if (payload?.action === 'randomQuestion') {
    return getRandomDrillQuestion(payload.pool || DEFAULT_DRILL_QUESTIONS);
  }

  if (payload?.action === 'evaluate' && payload.transcript) {
    return analyzeDrillResponse(payload.transcript, payload.question?.referenceNotes);
  }

  if (payload?.action === 'save' && payload.attempt) {
    saveDrillAttempt(payload.attempt);
    return loadDrillHistory();
  }

  return loadDrillHistory();
}
