import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateInterviewReadiness,
  getDailyChallenges,
  getCockpitBadges,
  getNegotiationTrapScripts,
  getRedFlagQuestions,
  loadCockpitProgress,
  toggleLessonCompletion,
  toggleChallengeCompletion,
} from '../interviewCockpitEngine';
import { createEmptyVault } from '../sampleVault';
import { MasterVault } from '../../types';
import { MemoryStorage } from './helpers/memoryStorage';

describe('Interview Cockpit Engine', () => {
  beforeEach(() => {
    // Podstawienie atrapy localStorage
    const memory = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: memory,
      configurable: true,
      writable: true,
    });
  });

  const createMockVault = (): MasterVault => {
    const vault = createEmptyVault('Jan Kowalski', 'jan@example.com');
    vault.personalInfo.title = 'Senior Cloud Architect';
    vault.skillsMatrix.hardSkills = ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'];
    vault.history = [
      {
        id: 'exp_1',
        company: 'Cloud Corp',
        role: 'Senior Developer',
        location: 'Warszawa',
        startDate: '2021-01',
        endDate: '2023-01',
        isCurrent: false,
        highlights: [
          {
            id: 'hl_1',
            text: 'Wzrost wydajności API o 40% w architekturze mikroserwisowej.',
            action: 'Wdrożenie',
            target: 'API',
            tool: 'Node.js',
            metric: '+40% TPS',
            keywords: ['TypeScript', 'Node.js'],
          },
        ],
      },
    ];
    return vault;
  };

  it('oblicza poziom gotowości do rozmowy bazując na MasterVault i postępach', () => {
    const vault = createMockVault();
    const initialScore = calculateInterviewReadiness(vault);

    expect(initialScore).toBeGreaterThanOrEqual(50);
    expect(initialScore).toBeLessThanOrEqual(100);

    const progressWithLessons = {
      completedLessons: ['pitch_completed', 'bridging_completed', 'traps_completed'],
      completedChallenges: ['daily_pitch'],
      notes: {},
    };

    const advancedScore = calculateInterviewReadiness(vault, progressWithLessons);
    expect(advancedScore).toBeGreaterThan(initialScore);
  });

  it('zwraca bazę skryptów na trudne pytania rekrutacyjne i pułapki', () => {
    const traps = getNegotiationTrapScripts();
    expect(traps.length).toBeGreaterThanOrEqual(3);

    const salaryTrap = traps.find((t) => t.id === 'trap_salary');
    expect(salaryTrap).toBeDefined();
    expect(salaryTrap?.variants.length).toBeGreaterThanOrEqual(2);
    expect(salaryTrap?.proTip).toBeTruthy();
  });

  it('zwraca bazę pytań do rekrutera z analizą Red Flags', () => {
    const redFlags = getRedFlagQuestions();
    expect(redFlags.length).toBeGreaterThanOrEqual(4);

    const techDebt = redFlags.find((q) => q.category === 'TECH_DEBT');
    expect(techDebt).toBeDefined();
    expect(techDebt?.greenFlagAnswer).toBeTruthy();
    expect(techDebt?.redFlagWarning).toBeTruthy();
  });

  it('generuje odznaki taktyczne z poprawnym stanem odblokowania', () => {
    const vault = createMockVault();
    const progress = {
      completedLessons: ['pitch_completed'],
      completedChallenges: [],
      notes: {},
    };

    const badges = getCockpitBadges(vault, progress);
    expect(badges.length).toBe(6);

    const pitchBadge = badges.find((b) => b.id === 'badge_pitch_master');
    expect(pitchBadge?.unlocked).toBe(true);

    const bridgeBadge = badges.find((b) => b.id === 'badge_bridge_architect');
    expect(bridgeBadge?.unlocked).toBe(false);
  });

  it('zarządza utrwalaniem postępów i wyzwań w LocalStorage', () => {
    const initial = loadCockpitProgress();
    expect(initial.completedLessons).toHaveLength(0);

    const updated = toggleLessonCompletion('pitch_completed');
    expect(updated.completedLessons).toContain('pitch_completed');

    const reloaded = loadCockpitProgress();
    expect(reloaded.completedLessons).toContain('pitch_completed');

    const challengeState = toggleChallengeCompletion('daily_pitch');
    expect(challengeState.completedChallenges).toContain('daily_pitch');

    const dailyList = getDailyChallenges(challengeState);
    expect(dailyList.find((d) => d.id === 'daily_pitch')?.completed).toBe(true);
  });
});
