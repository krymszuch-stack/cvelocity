import { liveHudPrompt } from './prompts/live-hud.prompt';
import { elevatorPitchPrompt } from './prompts/elevator-pitch-gen.prompt';
import { skillBridgePrompt } from './prompts/skill-bridge-matrix.prompt';
import { interviewLoopManagerPrompt } from './prompts/interview-loop-manager.prompt';
import { mockDrillModePrompt } from './prompts/mock-drill-mode.prompt';
import { claimConsistencyGuardPrompt } from './prompts/claim-consistency-guard.prompt';
import { SkillPromptConfig } from './liveHudSkill';

export {
  liveHudPrompt,
  elevatorPitchPrompt,
  skillBridgePrompt,
  interviewLoopManagerPrompt,
  mockDrillModePrompt,
  claimConsistencyGuardPrompt,
};

/**
 * Rejestr wszystkich bloków promptów skilli w ekosystemie CVelocity
 */
export const skills: SkillPromptConfig[] = [
  liveHudPrompt as SkillPromptConfig,
  elevatorPitchPrompt as SkillPromptConfig,
  skillBridgePrompt as SkillPromptConfig,
  interviewLoopManagerPrompt as SkillPromptConfig,
  mockDrillModePrompt as SkillPromptConfig,
  claimConsistencyGuardPrompt as SkillPromptConfig,
];

export default skills;
