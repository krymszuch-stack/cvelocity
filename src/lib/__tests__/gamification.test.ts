import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS,
  awardXp,
  emptyGamificationState,
  hasFeatureAccess,
  levelForXp,
  levelProgress,
  normalizeGamificationState,
  privilegesForLevel,
  xpRequiredForFeature,
  XP_EVENTS,
} from '../gamification';

/**
 * Ekonomia punktów to obietnice wobec użytkownika: progi rang, zniżki i
 * odblokowania muszą się zgadzać między Centrum Kariery, bramką funkcji
 * i kasą. Ten plik pilnuje ich spójności w jednym miejscu.
 */

describe('poziomy i progi XP', () => {
  it('nowe konto startuje na poziomie 1 z zerem punktów', () => {
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(0).name).toBe('Aplikant');
  });

  it('próg jest inkluzywny — dokładnie 500 XP to już drugi poziom', () => {
    expect(levelForXp(499).level).toBe(1);
    expect(levelForXp(500).level).toBe(2);
    expect(levelForXp(1499).level).toBe(2);
    expect(levelForXp(1500).level).toBe(3);
    expect(levelForXp(3500).level).toBe(4);
    expect(levelForXp(7000).level).toBe(5);
  });

  it('postęp liczy ile brakuje do awansu', () => {
    const progress = levelProgress(300);
    expect(progress.next?.from).toBe(500);
    expect(progress.toNext).toBe(200);
    expect(progress.percent).toBe(60);
  });

  it('ostatni poziom jest zawsze wypełniony w stu procentach', () => {
    const progress = levelProgress(99_999);
    expect(progress.next).toBeNull();
    expect(progress.percent).toBe(100);
    expect(progress.toNext).toBe(0);
  });
});

describe('przywileje rang', () => {
  it('zniżki rosną z rangą i nigdy jej nie przekraczają', () => {
    expect(privilegesForLevel(1).discountPercent).toBeNull();
    expect(privilegesForLevel(2).discountPercent).toBe(15);
    expect(privilegesForLevel(3).discountPercent).toBe(30);
    expect(privilegesForLevel(5).discountPercent).toBe(30);
  });

  it('przywileje kumulują się — wyższa ranga zawiera funkcje niższych', () => {
    const level5 = privilegesForLevel(5).features;
    for (const feature of privilegesForLevel(3).features) {
      expect(level5).toContain(feature);
    }
  });

  it('każda funkcja ma próg punktowy wynikający z rangi, która ją dokłada', () => {
    // Teleprompter obiecuje „beta od poziomu 3”, więc próg musi być równy
    // wejściu w trzecią rangę — rozjazd tu oznaczałby obietnicę bez pokrycia.
    expect(xpRequiredForFeature('LIVE_HUD_TELEPROMPTER')).toBe(1500);
    expect(xpRequiredForFeature('BASIC_TEMPLATES')).toBe(0);
  });
});

describe('dostęp do funkcji', () => {
  it('ranga poniżej progu zamyka funkcję', () => {
    expect(hasFeatureAccess(1400, 'LIVE_HUD_TELEPROMPTER')).toBe(false);
  });

  it('ranga na progu otwiera funkcję', () => {
    expect(hasFeatureAccess(1500, 'LIVE_HUD_TELEPROMPTER')).toBe(true);
  });

  it('karnet kupiony za pieniądze przechodzi obok progu rangi', () => {
    // Karnet wyklikany nie może być lepszy od kupionego.
    expect(hasFeatureAccess(0, 'LIVE_HUD_TELEPROMPTER', { hasPaidPass: true })).toBe(true);
  });
});

describe('awardXp', () => {
  it('dokłada punkty zdarzenia i zwiększa jego licznik', () => {
    const result = awardXp(emptyGamificationState(), 'application_added');
    expect(result.points).toBe(XP_EVENTS.application_added.points);
    expect(result.state.counters.application_added).toBe(1);
  });

  it('zgłasza awans jako różnicę, nie jako stan', () => {
    const state = { ...emptyGamificationState(), xp: 450 };
    const result = awardXp(state, 'jd_ingested');
    expect(result.leveledUpTo?.level).toBe(2);
    expect(result.state.xp).toBe(600);
  });

  it('odblokowane osiągnięcie nie wraca drugi raz', () => {
    let state = emptyGamificationState();
    const first = awardXp(state, 'ats_high_score');
    state = first.state;

    expect(first.newAchievements.map((a) => a.id)).toContain('ats_snajper');

    const second = awardXp(state, 'ats_high_score');
    expect(second.state.unlockedAchievements.filter((id) => id === 'ats_snajper')).toHaveLength(1);
  });

  it('osiągnięcie progowe odpala się dopiero po spełnieniu warunku', () => {
    const state = emptyGamificationState();
    // Pierwsza aplikacja: licznik = 1, próg „piątek” jeszcze nieobecny.
    const below = awardXp(state, 'application_added');
    expect(below.newAchievements).toHaveLength(0);

    let next = below.state;
    for (let i = 0; i < 3; i += 1) next = awardXp(next, 'application_added').state;

    // Piąta aplikacja domyka próg.
    const fifth = awardXp(next, 'application_added');
    expect(fifth.newAchievements.map((a) => a.id)).toContain('pipeline_piatka');
  });

  it('definicje osiągnięć są spójne z licznikami zdarzeń', () => {
    // Warunek sprawdzany na liczniku, który nie istnieje, nigdy by się nie
    // odpalił — a literówka w identyfikatorze nie zapala się nigdzie w UI.
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.isUnlocked(emptyGamificationState().counters)).toBe(false);
    }
  });
});

describe('normalizeGamificationState', () => {
  it('śmieci ze schowka zamienia na pusty stan zamiast wybuchać', () => {
    expect(normalizeGamificationState(null)).toEqual(emptyGamificationState());
    expect(normalizeGamificationState('tekst')).toEqual(emptyGamificationState());
    expect(normalizeGamificationState({ xp: -50 })).toEqual(emptyGamificationState());
  });

  it('akceptuje poprawny kształt i odcina pola ujemne oraz nieskończone', () => {
    const normalized = normalizeGamificationState({
      xp: 1200.7,
      counters: { jd_ingested: 2.9, application_added: -3 },
      unlockedAchievements: ['pierwsza_oferta', 42],
    });

    expect(normalized.xp).toBe(1200);
    expect(normalized.counters.jd_ingested).toBe(2);
    expect(normalized.counters.application_added).toBe(0);
    expect(normalized.unlockedAchievements).toEqual(['pierwsza_oferta']);
  });
});
