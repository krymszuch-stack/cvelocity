// install-skills.ts
import { AntigravityRuntime, ag as defaultAg } from './liveHudSkill';
import { skills } from './skill-prompts';

export const ag = defaultAg instanceof AntigravityRuntime ? defaultAg : new AntigravityRuntime();

/**
 * Instaluje i aktywuje wszystkie skille w środowisku Antigravity runtime
 */
export async function installAllSkills(
  runtime: AntigravityRuntime = ag as AntigravityRuntime
): Promise<void> {
  for (const skillPrompt of skills) {
    const skill = await runtime.createSkillFromPrompt(skillPrompt);
    runtime.registerSkill(skill);
    console.log(`✅ Installed: ${skill.id}`);
  }

  // Aktywuj podstawowe skille
  runtime.activateSkill('live-hud-v1');
  runtime.activateSkill('elevator-pitch-gen-v1');
  runtime.activateSkill('skill-bridge-matrix-v1');
  runtime.activateSkill('interview-loop-manager-v1');
  runtime.activateSkill('mock-drill-mode-v1');
  runtime.activateSkill('claim-consistency-guard-v1');

  // Ustaw globalne skróty
  runtime.bindShortcut('Ctrl+H', () => runtime.invokeSkill('live-hud-v1'));
  runtime.bindShortcut('Ctrl+P', () => runtime.invokeSkill('elevator-pitch-gen-v1'));
  runtime.bindShortcut('Ctrl+B', () => runtime.invokeSkill('skill-bridge-matrix-v1'));
  runtime.bindShortcut('Ctrl+L', () => runtime.invokeSkill('interview-loop-manager-v1'));
  runtime.bindShortcut('Cmd+D', () => runtime.invokeSkill('mock-drill-mode-v1'));

  console.log('🚀 All core skills installed and activated!');
}

export default installAllSkills;
