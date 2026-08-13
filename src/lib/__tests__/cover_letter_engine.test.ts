import { describe, it, expect } from 'vitest';
import { generateAntiTemplateCoverLetter } from '../coverLetterEngine';
import { MasterVault } from '../../types';

describe('coverLetterEngine (Anti-Template Business Cover Letter)', () => {
  const sampleVault: MasterVault = {
    version: '2.0',
    updatedAt: new Date().toISOString(),
    profiler: {
      flags: ['OFFICE_IT'],
      experienceLevel: 'SENIOR',
      location: { city: 'Warszawa', radiusKm: 30, willingnessToTravel: false, hybridWork: true, remoteOnly: false },
      languages: [],
    },
    personalInfo: {
      fullName: 'Jan Kowalski',
      email: 'jan@example.com',
      phone: '+48 123 456 789',
      location: 'Warszawa',
      title: 'Senior Fullstack Engineer',
      summary: 'Doświadczony inżynier oprogramowania specjalizujący się w systemach rozproszonych.',
    },
    skillsMatrix: {
      hardSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      softSkills: ['Komunikacja', 'Praca w zespole'],
      toolsAndTech: ['Docker', 'Git', 'Vite'],
      certifications: [],
    },
    history: [
      {
        id: 'exp-1',
        company: 'TechCorp',
        role: 'Lead Developer',
        location: 'Warszawa',
        startDate: '2021',
        endDate: '2024',
        isCurrent: false,
        highlights: [
          {
            id: 'hl-1',
            text: 'Zwiększono wydajność przetwarzania danych o 40% poprzez optymalizację zapytania SQL.',
            action: 'Zwiększono wydajność',
            target: 'przetwarzanie danych',
            tool: 'SQL',
            metric: '40%',
            keywords: ['SQL', 'Performance'],
          },
          {
            id: 'hl-2',
            text: 'Kierowanie zespołem 5 programistów przy wdrażaniu mikroserwisów.',
            action: 'Kierowanie',
            target: 'zespół programistów',
            tool: 'Node.js',
            metric: '5 osób',
            keywords: ['Leadership', 'Microservices'],
          },
        ],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'E-commerce Platform',
        role: 'Lead Architect',
        description: 'System obsługujący 100k użytkowników dziennie.',
        techStack: ['React', 'Node.js'],
        metrics: 'Czas odpowiedzi < 100ms',
      },
    ],
    education: [],
  };

  it('1. Generates 3-section cover letter using candidate MasterVault data', () => {
    const result = generateAntiTemplateCoverLetter(
      'Senior React Developer',
      'Acme Corp',
      'Poszukujemy inżyniera React i TypeScript do budowy wydajnych aplikacji webowych.',
      sampleVault
    );

    expect(result.companyName).toBe('Acme Corp');
    expect(result.targetJobTitle).toBe('Senior React Developer');
    expect(result.hook).toContain('Acme Corp');
    expect(result.hook).toContain('Senior React Developer');
    expect(result.proofPoints.length).toBeGreaterThan(0);
    expect(result.callToAction).toContain('Acme Corp');
    expect(result.fullText).toContain('Jan Kowalski');
    expect(result.fullText).toContain('+48 123 456 789');
  });

  it('2. Handles sparse vault data with clean fallback values', () => {
    const emptyVault: MasterVault = {
      version: '2.0',
      updatedAt: new Date().toISOString(),
      profiler: {
        flags: [],
        experienceLevel: 'MID',
        location: { city: '', radiusKm: 0, willingnessToTravel: false, hybridWork: false, remoteOnly: false },
        languages: [],
      },
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        title: '',
        summary: '',
      },
      skillsMatrix: {
        hardSkills: [],
        softSkills: [],
        toolsAndTech: [],
        certifications: [],
      },
      history: [],
      projects: [],
      education: [],
    };

    const result = generateAntiTemplateCoverLetter('', '', '', emptyVault);

    expect(result.companyName).toBe('Państwa Firmie');
    expect(result.targetJobTitle).toBe('oferowanym stanowisku');
    expect(result.proofPoints.length).toBe(2);
    expect(result.fullText).toContain('Kandydat');
  });
});
