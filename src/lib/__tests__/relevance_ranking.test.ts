import { describe, it, expect } from 'vitest';
import { rankHighlightsByRelevance, rankExperienceByRelevance, getRelevanceOrderedExperienceIds } from '../relevanceRanking';
import { WorkExperience } from '../../types';

const jdKeywords = ['react', 'typescript', 'docker', 'kubernetes'];

function highlight(id: string, text: string): any {
  return { id, text, action: '', target: '', tool: '', metric: '', keywords: [] };
}

describe('relevanceRanking (0-token block/bullet reordering)', () => {
  it('sortuje punkty wg pokrycia słów kluczowych z ogłoszenia, malejąco', () => {
    const highlights = [
      highlight('h1', 'Obsługa klientów i wsparcie telefoniczne'),
      highlight('h2', 'Rozwój aplikacji w React i TypeScript'),
      highlight('h3', 'Wdrożenie React, TypeScript, Dockera i Kubernetes na produkcji'),
    ];

    const ranked = rankHighlightsByRelevance(highlights, jdKeywords);

    expect(ranked[0].highlight.id).toBe('h3');
    expect(ranked[0].score).toBeGreaterThan(ranked[2].score);
    expect(ranked.map((r) => r.highlight.id)).toContain('h1');
    expect(ranked[ranked.length - 1].highlight.id).toBe('h1');
  });

  it('zachowuje oryginalną kolejność przy remisie (stabilne sortowanie)', () => {
    const highlights = [highlight('a', 'Ogólne zadania'), highlight('b', 'Inne ogólne zadania')];
    const ranked = rankHighlightsByRelevance(highlights, jdKeywords);
    expect(ranked.map((r) => r.highlight.id)).toEqual(['a', 'b']);
  });

  it('sortuje doświadczenia wg trafności i faworyzuje zgodność tytułu stanowiska', () => {
    const history: WorkExperience[] = [
      {
        id: 'exp_old',
        company: 'Call Center Sp. z o.o.',
        role: 'Konsultant Telefoniczny',
        location: '',
        startDate: '2018',
        endDate: '2020',
        isCurrent: false,
        highlights: [highlight('h1', 'Obsługa klientów, deeskalacja problemów')],
      },
      {
        id: 'exp_recent',
        company: 'TechCorp',
        role: 'React Developer',
        location: '',
        startDate: '2021',
        endDate: 'Obecnie',
        isCurrent: true,
        highlights: [highlight('h2', 'Budowa interfejsów w React i TypeScript, konteneryzacja Docker')],
      },
    ];

    const ranked = rankExperienceByRelevance(history, jdKeywords, 'React Developer');
    expect(ranked[0].experience.id).toBe('exp_recent');

    const orderedIds = getRelevanceOrderedExperienceIds(history, jdKeywords, 'React Developer');
    expect(orderedIds).toEqual(['exp_recent', 'exp_old']);
  });

  it('nie mutuje oryginalnej tablicy historii wejściowej', () => {
    const history: WorkExperience[] = [
      { id: 'a', company: 'A', role: 'X', location: '', startDate: '', endDate: '', isCurrent: false, highlights: [] },
      { id: 'b', company: 'B', role: 'Y', location: '', startDate: '', endDate: '', isCurrent: false, highlights: [] },
    ];
    const original = [...history];
    rankExperienceByRelevance(history, jdKeywords, 'Y');
    expect(history).toEqual(original);
  });
});
