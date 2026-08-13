import { describe, it, expect } from 'vitest';
import {
  handleFactEditPromotion,
  generatePreFlightChecklist,
  generatePlainTextCvExport,
  generateLinkedInReadyExport,
} from '../layeredVaultEngine';
import { MasterVault, LayeredFactItem } from '../../types';

describe('layeredVaultEngine (Fact Edits, Checklist & Exporters)', () => {
  const sampleVault: MasterVault = {
    version: '2.0',
    updatedAt: new Date().toISOString(),
    profiler: {
      flags: ['OFFICE_IT'],
      experienceLevel: 'SENIOR',
      location: { city: 'Kraków', radiusKm: 20, willingnessToTravel: false, hybridWork: true, remoteOnly: false },
      languages: [],
    },
    personalInfo: {
      fullName: 'Anna Nowak',
      email: 'anna@example.com',
      phone: '+48 987 654 321',
      location: 'Kraków',
      title: 'Senior Product Manager',
      summary: 'Ekspert zarządzania produktami cyfrowymi.',
    },
    skillsMatrix: {
      hardSkills: ['Product Strategy', 'Roadmapping', 'Scrum'],
      softSkills: ['Przywództwo', 'Negocjacje'],
      toolsAndTech: ['Jira', 'Figma', 'Amplitude'],
      certifications: [],
    },
    history: [
      {
        id: 'exp1',
        company: 'FinTech Sp. z o.o.',
        role: 'Product Owner',
        location: 'Kraków',
        startDate: '2020',
        endDate: '2023',
        isCurrent: false,
        highlights: [
          {
            id: 'hl1',
            text: 'Zwiększono retencję użytkowników o 25% w ciągu 6 miesięcy.',
            action: 'Zwiększono retencję',
            target: 'baza użytkowników',
            tool: 'Amplitude',
            metric: '25%',
            keywords: ['Retention', 'Analytics'],
          },
        ],
      },
    ],
    projects: [],
    education: [
      {
        id: 'edu1',
        degree: 'Magister',
        institution: 'Uniwersytet Jagielloński',
        fieldOfStudy: 'Zarządzanie',
        startDate: '2015',
        endDate: '2020',
      },
    ],
  };

  const sampleFacts: LayeredFactItem[] = [
    {
      id: 'fact1',
      experienceId: 'exp1',
      sourceFactId: 'hl1',
      baseText: 'Zwiększono retencję użytkowników o 25% w ciągu 6 miesięcy.',
      jobReframedText: 'Zwiększono retencję użytkowników o 25% w ciągu 6 miesięcy.',
      keywordsMatched: ['Retention'],
      isUserEdited: false,
      sourceType: 'VAULT_BASE',
    },
  ];

  it('1. handleFactEditPromotion promotes user edits to MasterVault history when enabled', () => {
    const { updatedVault, updatedFact } = handleFactEditPromotion(
      sampleVault,
      sampleFacts[0],
      'Zwiększono retencję użytkowników o 30% w ciągu 6 miesięcy.',
      true
    );

    expect(updatedFact.isUserEdited).toBe(true);
    expect(updatedFact.userOverrideText).toContain('30%');
    expect(updatedVault.history[0].highlights[0].text).toContain('30%');
  });

  it('2. generatePreFlightChecklist returns 5 pre-export checklist items', () => {
    const checklist = generatePreFlightChecklist(sampleVault, sampleFacts, [], 'Lead PM');
    expect(checklist.length).toBe(5);
    expect(checklist.map((c) => c.category)).toEqual([
      'FACT_ACCURACY',
      'DEALBREAKER',
      'METRICS',
      'PAGE_BUDGET',
      'LANGUAGE',
    ]);
    expect(checklist[0].status).toBe('PASSED');
  });

  it('3. generatePlainTextCvExport creates clean text format with RODO clause', () => {
    const txt = generatePlainTextCvExport(sampleVault, sampleFacts, 'Senior PM', 'Acme Ltd');
    expect(txt).toContain('ANNA NOWAK');
    expect(txt).toContain('FinTech Sp. z o.o.');
    expect(txt).toContain('Wyrażam zgodę na przetwarzanie moich danych osobowych');
  });

  it('4. generateLinkedInReadyExport creates structured LinkedIn headline and sections', () => {
    const exportData = generateLinkedInReadyExport(sampleVault, 'Senior Product Manager');
    expect(exportData.headline).toContain('Senior Product Manager');
    expect(exportData.headline).toContain('Product Strategy');
    expect(exportData.aboutSection).toContain('Ekspert zarządzania produktami cyfrowymi.');
    expect(exportData.experienceBullets.length).toBe(1);
    expect(exportData.experienceBullets[0].company).toBe('FinTech Sp. z o.o.');
  });
});
