import skillBridgePrompt from './prompts/skill-bridge-matrix.prompt';
import { AntigravitySkill, createSkillFromPrompt, ag } from './liveHudSkill';
import { SkillBridge, MasterVault } from '../types';
import { findSkillBridgeForGap, generateSkillBridges } from '../lib/skillBridgeEngine';

export const SkillBridgeMatrix: AntigravitySkill = createSkillFromPrompt({
  id: skillBridgePrompt.id,
  name: skillBridgePrompt.name,
  version: skillBridgePrompt.version,
  description: skillBridgePrompt.description,
  dependencies: [...skillBridgePrompt.dependencies],
  ui: 'SkillBridgeMatrixModal',
  activation: {
    hotkey: skillBridgePrompt.activation.hotkey,
    events: [...skillBridgePrompt.activation.events],
    clickAction: skillBridgePrompt.activation.clickAction,
  },
  permissions: [...skillBridgePrompt.permissions],
  systemPrompt: skillBridgePrompt.systemPrompt,
});

// Rejestracja skilla w globalnym rejestrze ag
ag.registerSkill(SkillBridgeMatrix);

export interface BridgeInvocationPayload {
  missingSkill?: string;
  missingSkills?: string[];
  vault?: MasterVault;
}

/**
 * Obsługa zdarzeń i wywołań skilla
 */
export function invokeSkillBridgeMatrix(
  payload: BridgeInvocationPayload
): SkillBridge[] | SkillBridge | undefined {
  if (!payload.vault) return undefined;

  if (payload.missingSkill) {
    return findSkillBridgeForGap(payload.missingSkill, payload.vault);
  }

  if (payload.missingSkills && payload.missingSkills.length > 0) {
    return generateSkillBridges(payload.missingSkills, payload.vault);
  }

  return undefined;
}
