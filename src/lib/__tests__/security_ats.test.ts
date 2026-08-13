import { describe, it, expect } from 'vitest';
import { sanitizeTextInput, scanProfanity } from '../securityGuardrails';
import { simulateAtsCheck, extractDynamicJdPhrases } from '../atsSimulator';
import { matchesKeyword } from '../keywordMatching';
import { createEmptyVault } from '../sampleVault';
import { TailoredResume } from '../../types';

describe('Security Guardrails & ATS Scoring Suite', () => {
  it('powinien odfiltrować skrypty XSS i niebezpieczne URIs', () => {
    const maliciousInput = '<script>alert("hacked")</script><a href="javascript:alert(1)">Link</a>';
    const clean = sanitizeTextInput(maliciousInput);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('javascript:');
  });

  it('powinien wykrywać i filtrować słowa wulgarne (PL/EN)', () => {
    const vulgarText = 'To jest bardzo kurwa słaby tekst';
    const scan = scanProfanity(vulgarText);

    expect(scan.isVulgar).toBe(true);
    expect(scan.sanitizedText).toContain('***');
  });

  it('powinien precyzyjnie wyliczyć wskaźnik ATS Score dla profilu CV', () => {
    const mockVault = createEmptyVault('Jan Kowalski', 'jan@example.com');
    mockVault.personalInfo.title = 'Senior Frontend Developer';
    mockVault.personalInfo.summary = 'Doświadczony inżynier oprogramowania';
    mockVault.skillsMatrix.hardSkills = ['React', 'TypeScript', 'Tailwind', 'Node.js'];
    mockVault.skillsMatrix.toolsAndTech = ['Git', 'Vite'];
    mockVault.history = [
      {
        id: '1',
        company: 'Tech',
        role: 'Frontend Dev',
        location: 'Warszawa',
        startDate: '01/2022',
        endDate: 'Obecnie',
        isCurrent: true,
        highlights: [
          {
            id: 'h1',
            text: 'Tworzenie aplikacji React i TypeScript',
            action: 'Tworzenie',
            target: 'aplikacji React',
            tool: 'TypeScript',
            metric: 'wysoką jakość',
            keywords: ['react', 'typescript'],
          },
        ],
      },
    ];

    const mockResume: TailoredResume = {
      targetJobTitle: 'Senior Frontend Developer',
      companyName: 'Tech Corp',
      summary: 'Inżynier Frontend',
      atsScore: 0,
      skillsMatched: {
        hardSkills: ['React', 'TypeScript'],
        toolsAndTech: ['Git'],
        softSkills: [],
      },
      selectedHighlights: [],
    };

    const jobDescription = 'Poszukujemy Senior Frontend Developer ze znajomością React, TypeScript oraz Tailwind';
    const atsResult = simulateAtsCheck(mockResume, mockVault, jobDescription);

    expect(atsResult.overallScore).toBeGreaterThan(60);
    expect(Array.isArray(atsResult.missingHardSkills)).toBe(true);
  });

  it('powinien poprawnie wykrywać pusty vault i nie przyznawać 82% ATS (ADR-16)', () => {
    const emptyVault = createEmptyVault();

    const mockResume: TailoredResume = {
      targetJobTitle: 'Developer',
      companyName: 'Company',
      summary: '',
      atsScore: 0,
      skillsMatched: {
        hardSkills: [],
        toolsAndTech: [],
        softSkills: [],
      },
      selectedHighlights: [],
    };

    const atsResult = simulateAtsCheck(mockResume, emptyVault, 'Poszukujemy React Developer');
    expect(atsResult.overallScore).toBe(0);
    expect(atsResult.gapAnalysis[0]).toContain('Brak danych');
  });

  it('powinien zapobiegać fałszywym dopasowaniom "b2" z "b2b" oraz "git" z "digital" (ADR-52, ADR-91)', () => {
    expect(matchesKeyword('Umowa B2B w firmie', 'b2')).toBe(false);
    expect(matchesKeyword('Digital Marketing Manager', 'git')).toBe(false);
    expect(matchesKeyword('Praca z repozytorium Git', 'git')).toBe(true);
    expect(matchesKeyword('Wymagany angielski B2', 'b2')).toBe(true);
  });

  it('nie powinien przyznawać 100% pokrycia, gdy z ogłoszenia nie da się wyodrębnić żadnych wymagań (audyt 2026-08-04: puste ogłoszenie dawało 91% i "100% wymagań spełnionych")', () => {
    const mockVault = createEmptyVault('Jan Kowalski', 'jan@example.com');
    mockVault.personalInfo.title = 'Senior Frontend Developer';
    mockVault.skillsMatrix.hardSkills = ['React', 'TypeScript'];

    const mockResume: TailoredResume = {
      targetJobTitle: 'Senior Frontend Developer',
      companyName: 'Tech Corp',
      summary: '',
      atsScore: 0,
      skillsMatched: { hardSkills: [], toolsAndTech: [], softSkills: [] },
      selectedHighlights: [],
    };

    // Empty job description: nothing was extracted, so there is nothing to have
    // "100% matched" — the score must reflect that instead of defaulting to full marks.
    const atsResult = simulateAtsCheck(mockResume, mockVault, '');
    expect(atsResult.layer2Nlp.hardSkillsCoverage).toBe(0);
    expect(atsResult.gapAnalysis.join(' ')).not.toContain('100% kluczowych wymagań');
  });

  it('nie powinien traktować nazwy dostawcy benefitu (np. PZU) jako wymaganego twardego skilla', () => {
    const { hardSkills } = extractDynamicJdPhrases(
      'Zakres obowiązków: tworzenie aplikacji webowych.\nOferujemy: prywatną opiekę medyczną oraz ubezpieczenie na życie PZU.'
    );
    expect(hardSkills.some((h) => h.phrase === 'pzu')).toBe(false);
  });
});
