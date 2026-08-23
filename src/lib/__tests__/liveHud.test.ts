import { describe, it, expect } from 'vitest';
import { liveHudPrompt } from '../../skills/prompts/live-hud.prompt';
import { createSkillFromPrompt, ag } from '../../skills/liveHudSkill';

describe('Live HUD Teleprompter Skill (live-hud-v1)', () => {
  it('tworzy skill ze wszystkimi wymaganymi metadanymi i zależnościami', () => {
    const skill = createSkillFromPrompt(liveHudPrompt);

    expect(skill.id).toBe('live-hud-v1');
    expect(skill.name).toBe('Live HUD Teleprompter');
    expect(skill.dependencies).toContain('master-vault');
    expect(skill.dependencies).toContain('star-story-bank');
    expect(skill.ui).toBe('ReactFloatingPanel');

    // Aktywacje
    expect(skill.activation.hotkey).toBe('Ctrl+H');
    expect(skill.activation.events).toContain('onZoomStart');
    expect(skill.activation.clickAction).toBe('onClick("HUD")');

    // Uprawnienia
    expect(skill.permissions).toContain('overlay');
    expect(skill.permissions).toContain('keyboard');
    expect(skill.permissions).toContain('screen-detection');
  });

  it('rejestruje skill w globalnym rejestrze ag', () => {
    const retrieved = ag.getSkill('live-hud-v1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('live-hud-v1');
    expect(retrieved?.name).toBe('Live HUD Teleprompter');
  });

  it('zawiera wytyczne dotyczące 3 slotów i strażnika spójności w system prompt', () => {
    const promptText = liveHudPrompt.systemPrompt;

    expect(promptText).toContain('SLOT 1');
    expect(promptText).toContain('SLOT 2');
    expect(promptText).toContain('SLOT 3');
    expect(promptText).toContain('STRAŻNIK SPÓJNOŚCI');
    expect(promptText).toContain('MasterVault');
  });
});
