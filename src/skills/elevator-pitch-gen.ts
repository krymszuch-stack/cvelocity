import elevatorPitchPrompt from './prompts/elevator-pitch-gen.prompt';
import { AntigravitySkill, createSkillFromPrompt, ag } from './liveHudSkill';
import { MasterVault, ElevatorPitchOutput } from '../types';
import { generateElevatorPitch } from '../lib/elevatorPitchEngine';

export const ElevatorPitchGen: AntigravitySkill = createSkillFromPrompt({
  id: elevatorPitchPrompt.id,
  name: elevatorPitchPrompt.name,
  version: elevatorPitchPrompt.version,
  description: elevatorPitchPrompt.description,
  dependencies: [...elevatorPitchPrompt.dependencies],
  ui: elevatorPitchPrompt.ui,
  activation: {
    hotkey: elevatorPitchPrompt.activation.hotkey,
    events: [...elevatorPitchPrompt.activation.events],
    clickAction: elevatorPitchPrompt.activation.clickAction,
  },
  permissions: [...elevatorPitchPrompt.permissions],
  systemPrompt: elevatorPitchPrompt.systemPrompt,
});

// Rejestracja skilla w globalnym rejestrze ag
ag.registerSkill(ElevatorPitchGen);

// Powiązanie skrótu Ctrl+P
ag.bindShortcut('Ctrl+P', () => {
  ag.invokeSkill('elevator-pitch-gen-v1');
});

export interface PitchInvocationPayload {
  vault?: MasterVault;
  targetRoleOverride?: string;
}

/**
 * Obsługa wywołania skilla generowania pitcha
 */
export function invokeElevatorPitchGen(
  payload: PitchInvocationPayload
): ElevatorPitchOutput | undefined {
  if (!payload.vault) return undefined;
  return generateElevatorPitch(payload.vault, payload.targetRoleOverride);
}
