import { describe, it, expect } from 'vitest';
import { mergeParsedVaultIntoMaster } from '../layeredVaultEngine';
import { MasterVault } from '../../types';
import { createEmptyVault } from '../sampleVault';

describe('mergeParsedVaultIntoMaster Deduplication Regression Suite', () => {
  it('should not increase the number of history and education entries on double import of the same CV', () => {
    const emptyVault = createEmptyVault('Jan Kowalski', 'jan.kowalski@example.com');

    const parsedCv: Partial<MasterVault> = {
      personalInfo: {
        fullName: 'Jan Kowalski',
        title: 'Full-Stack Developer',
        email: 'jan.kowalski@example.com',
        phone: '123456789',
        location: 'Warszawa',
        summary: 'Jestem doświadczonym deweloperem.',
      },
      skillsMatrix: {
        hardSkills: ['React', 'TypeScript'],
        softSkills: ['Komunikatywność'],
        toolsAndTech: ['Git'],
        certifications: [
          { id: 'c1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2023-05' }
        ],
      },
      history: [
        {
          id: 'exp_parsed_1',
          company: 'Acme Corp',
          role: 'Senior React Developer',
          location: 'Warszawa',
          startDate: '2022-01',
          endDate: '2023-12',
          isCurrent: false,
          highlights: [],
        },
      ],
      education: [
        {
          id: 'edu_parsed_1',
          institution: 'Politechnika Warszawska',
          degree: 'Inżynier',
          fieldOfStudy: 'Informatyka',
          startDate: '2018',
          endDate: '2022',
        },
      ],
      projects: [
        {
          id: 'proj_parsed_1',
          name: 'My Awesome Project',
          role: 'Developer',
          description: 'A React and TypeScript project',
          techStack: ['React', 'TypeScript'],
        }
      ],
    };

    // First import
    const firstMerge = mergeParsedVaultIntoMaster(emptyVault, parsedCv);
    expect(firstMerge.history.length).toBe(1);
    expect(firstMerge.education.length).toBe(1);
    expect(firstMerge.skillsMatrix.certifications.length).toBe(1);
    expect(firstMerge.projects.length).toBe(1);

    // Second import of the exact same CV
    const secondMerge = mergeParsedVaultIntoMaster(firstMerge, parsedCv);
    expect(secondMerge.history.length).toBe(1);
    expect(secondMerge.education.length).toBe(1);
    expect(secondMerge.skillsMatrix.certifications.length).toBe(1);
    expect(secondMerge.projects.length).toBe(1);
    expect(secondMerge.personalInfo.fullName).toBe('Jan Kowalski');
  });

  it('should merge new entries but filter out duplicates based on key fields', () => {
    const existingVault = createEmptyVault('Jan Kowalski', 'jan.kowalski@example.com');
    existingVault.history = [
      {
        id: 'exp_exist_1',
        company: 'Acme Corp',
        role: 'Senior React Developer',
        location: 'Warszawa',
        startDate: '2022-01', // Exact match
        endDate: '2023-12',
        isCurrent: false,
        highlights: [],
      },
      {
        id: 'exp_exist_2',
        company: 'Beta Inc',
        role: 'Mid Developer',
        location: 'Kraków',
        startDate: '2020-01',
        endDate: '2021-12',
        isCurrent: false,
        highlights: [],
      }
    ];

    existingVault.education = [
      {
        id: 'edu_exist_1',
        institution: 'Politechnika Warszawska',
        degree: 'Inżynier',
        fieldOfStudy: 'Informatyka',
        startDate: '2018',
        endDate: '2022',
      }
    ];

    const parsedCv: Partial<MasterVault> = {
      history: [
        {
          id: 'exp_parsed_dup',
          company: 'Acme Corp ', // with trailing space for trimming test
          role: 'Senior React Developer',
          location: 'Gdańsk', // different location, but same company+role+startDate key
          startDate: ' 2022-01', // with leading space
          endDate: '2023-12',
          isCurrent: false,
          highlights: [],
        },
        {
          id: 'exp_parsed_new',
          company: 'Gamma Corp',
          role: 'Architect',
          location: 'Gdańsk',
          startDate: '2024-01',
          endDate: 'Obecnie',
          isCurrent: true,
          highlights: [],
        }
      ],
      education: [
        {
          id: 'edu_parsed_dup',
          institution: 'Politechnika Warszawska',
          degree: 'Inżynier',
          fieldOfStudy: 'Informatyka',
          startDate: '2018',
          endDate: '2022',
        },
        {
          id: 'edu_parsed_new',
          institution: 'Uniwersytet Jagielloński',
          degree: 'Magister',
          fieldOfStudy: 'Filozofia',
          startDate: '2022',
          endDate: '2024',
        }
      ]
    };

    const merged = mergeParsedVaultIntoMaster(existingVault, parsedCv);

    // Acme Corp (duplicate) should not be added; Gamma Corp (new) should be added.
    // Total history: Acme Corp + Beta Inc + Gamma Corp = 3
    expect(merged.history.length).toBe(3);
    expect(merged.history.map(h => h.company)).toContain('Acme Corp');
    expect(merged.history.map(h => h.company)).toContain('Beta Inc');
    expect(merged.history.map(h => h.company)).toContain('Gamma Corp');

    // Politechnika Warszawska (duplicate) should not be added; Uniwersytet Jagielloński (new) should be added.
    // Total education: Politechnika Warszawska + Uniwersytet Jagielloński = 2
    expect(merged.education.length).toBe(2);
    expect(merged.education.map(e => e.institution)).toContain('Politechnika Warszawska');
    expect(merged.education.map(e => e.institution)).toContain('Uniwersytet Jagielloński');
  });
});
