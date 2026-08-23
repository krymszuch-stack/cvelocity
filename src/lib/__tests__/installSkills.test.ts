import { describe, it, expect, vi } from 'vitest';
import { AntigravityRuntime } from '../../skills/liveHudSkill';
import { installAllSkills } from '../../skills/install-skills';
import { skills } from '../../skills/skill-prompts';

describe('Skill Installer (install-skills.ts)', () => {
  it('posiada 6 zdefiniowanych promptów skilli', () => {
    expect(skills.length).toBe(6);
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('live-hud-v1');
    expect(ids).toContain('elevator-pitch-gen-v1');
    expect(ids).toContain('skill-bridge-matrix-v1');
    expect(ids).toContain('interview-loop-manager-v1');
    expect(ids).toContain('mock-drill-mode-v1');
    expect(ids).toContain('claim-consistency-guard-v1');
  });

  it('instaluje, rejestruje i aktywuje wszystkie skille w runtime', async () => {
    const runtime = new AntigravityRuntime();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await installAllSkills(runtime);

    // Sprawdzenie listy zainstalowanych skilli
    const installed = runtime.listSkills();
    expect(installed.length).toBe(6);

    // Sprawdzenie aktywnych skilli
    const activeSkills = runtime.getActiveSkills();
    expect(activeSkills).toContain('live-hud-v1');
    expect(activeSkills).toContain('elevator-pitch-gen-v1');
    expect(activeSkills).toContain('skill-bridge-matrix-v1');
    expect(activeSkills).toContain('interview-loop-manager-v1');
    expect(activeSkills).toContain('mock-drill-mode-v1');
    expect(activeSkills).toContain('claim-consistency-guard-v1');

    logSpy.mockRestore();
  });

  it('obsługuje wywołanie skrótów i aktywację zdarzeń', async () => {
    const runtime = new AntigravityRuntime();
    let hudInvoked = false;

    runtime.listen('skill-invoked:live-hud-v1', () => {
      hudInvoked = true;
    });

    await installAllSkills(runtime);

    const res = runtime.invokeSkill('live-hud-v1') as { executedAt: string; skill: { id: string } };
    expect(res).toBeDefined();
    expect(res.skill.id).toBe('live-hud-v1');
    expect(hudInvoked).toBe(true);
  });
});
