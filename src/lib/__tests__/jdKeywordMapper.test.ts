import { describe, it, expect } from 'vitest';
import { mapJdKeywords } from '../jdKeywordMapper';
import { MasterVault, TailoredResume } from '../../types';
import { createEmptyVault } from '../sampleVault';

describe('JDKeywordMapper Engine', () => {
  const createMockVault = (): MasterVault => {
    const vault = createEmptyVault('Jan Kowalski', 'jan@example.com');
    vault.skillsMatrix = {
      hardSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      toolsAndTech: ['Docker', 'Git', 'Kafka', 'AWS'],
      softSkills: ['Komunikatywność', 'Praca zespołowa'],
      certifications: [],
    };
    vault.projects = [
      {
        id: 'proj_kafka',
        name: 'System Płatności',
        role: 'Senior Backend Engineer',
        description: 'System przetwarzania zdarzeń w oparciu o Kafka i Node.js.',
        techStack: ['Kafka', 'Node.js', 'PostgreSQL'],
      },
    ];
    vault.history = [
      {
        id: 'exp_1',
        company: 'Cloud Corp',
        role: 'Full-Stack Developer',
        location: 'Warszawa',
        startDate: '2021-01',
        endDate: '2023-01',
        isCurrent: false,
        highlights: [
          {
            id: 'hl_1',
            text: 'Wdrożenie mikroserwisów w TypeScript i React.',
            action: 'Wdrożenie',
            target: 'Frontend',
            tool: 'React',
            metric: '+30% TPS',
            keywords: ['TypeScript', 'React'],
          },
        ],
      },
    ];
    return vault;
  };

  const createMockTailoredResume = (): TailoredResume => {
    return {
      targetJobTitle: 'Senior Full-Stack Engineer',
      companyName: 'TechScale Dynamics',
      summary: 'Doświadczony programista TypeScript i React.',
      atsScore: 80,
      skillsMatched: {
        hardSkills: ['TypeScript', 'React'],
        toolsAndTech: ['Git', 'Docker'],
        softSkills: ['Komunikatywność'],
      },
      selectedHighlights: [
        {
          experienceId: 'exp_1',
          role: 'Full-Stack Developer',
          company: 'Cloud Corp',
          originalText: 'Wdrożenie mikroserwisów w TypeScript i React.',
          optimizedText: 'Wdrożenie mikroserwisów w TypeScript i React.',
          source: 'SLOT_FILLING',
          keywordsMatched: ['TypeScript', 'React'],
        },
      ],
    };
  };

  it('ekstrahuje słowa kluczowe (hard skills, tools, soft skills) z opisu stanowiska', () => {
    const vault = createMockVault();
    const tailored = createMockTailoredResume();
    const jdText = `
      Poszukujemy Senior Developera.
      Wymagania:
      - Bardzo dobra znajomość TypeScript, React oraz Node.js
      - Doświadczenie w pracy z Kafka, Docker i Kubernetes
      - Komunikatywność i praca zespołowa
    `;

    const result = mapJdKeywords(jdText, vault, tailored);

    expect(result.keywords.length).toBeGreaterThan(0);
    const terms = result.keywords.map((k) => k.term);
    expect(terms).toContain('TypeScript');
    expect(terms).toContain('React');
    expect(terms).toContain('Node.js');
    expect(terms).toContain('Kafka');
    expect(terms).toContain('Docker');
    expect(terms).toContain('Kubernetes');
    expect(terms).toContain('Komunikatywność');
  });

  it('poprawnie klasyfikuje statusy słów (W CV, W Vault poza CV, Brak w profilu)', () => {
    const vault = createMockVault();
    const tailored = createMockTailoredResume();
    const jdText = `
      Wymagania:
      - React (jest w CV)
      - Kafka (jest w Vault w projekcie 'System Płatności', ale nie w CV)
      - Kubernetes (brak w Vault)
    `;

    const result = mapJdKeywords(jdText, vault, tailored);

    const reactKw = result.keywords.find((k) => k.term === 'React');
    expect(reactKw?.status).toBe('MATCHED_IN_CV');

    const kafkaKw = result.keywords.find((k) => k.term === 'Kafka');
    expect(kafkaKw?.status).toBe('IN_VAULT_NOT_IN_CV');
    expect(kafkaKw?.foundInVaultLocations.some((loc) => loc.includes('System Płatności'))).toBe(true);

    const k8sKw = result.keywords.find((k) => k.term === 'Kubernetes');
    expect(k8sKw?.status).toBe('MISSING_IN_VAULT');
  });

  it('generuje trafną sugestię: "Dodaj Kafka do opisu projektu System Płatności — masz to w vault, ale nie w CV"', () => {
    const vault = createMockVault();
    const tailored = createMockTailoredResume();
    const jdText = `
      Wymagamy znajomości Apache Kafka oraz architektury opartej na zdarzeniach.
    `;

    const result = mapJdKeywords(jdText, vault, tailored);

    const kafkaSug = result.suggestions.find((s) => s.keyword === 'Kafka');
    expect(kafkaSug).toBeDefined();
    expect(kafkaSug?.message).toContain('Kafka');
    expect(kafkaSug?.message).toContain('System Płatności');
    expect(kafkaSug?.message).toContain('masz to w Vault, ale nie w wybranym CV');
  });

  it('oblicza Match Score vs MasterVault oraz pokrycie kategorii', () => {
    const vault = createMockVault();
    const tailored = createMockTailoredResume();
    const jdText = `
      Stack: TypeScript, React, Docker, Kafka, Kubernetes.
    `;

    const result = mapJdKeywords(jdText, vault, tailored);

    expect(result.overallCvScore).toBeGreaterThan(0);
    expect(result.overallVaultScore).toBeGreaterThan(result.overallCvScore); // Vault zawiera Kafkę, więc ma wyższy potencjał
    expect(result.categoryCoverage.HARD_SKILL).toBeDefined();
    expect(result.categoryCoverage.TOOL).toBeDefined();
    expect(result.counts.total).toBeGreaterThanOrEqual(4);
  });

  it('zwraca pusty wynik dla pustego tekstu ogłoszenia', () => {
    const vault = createMockVault();
    const result = mapJdKeywords('', vault, null);

    expect(result.keywords).toHaveLength(0);
    expect(result.overallCvScore).toBe(0);
    expect(result.overallVaultScore).toBe(0);
    expect(result.suggestions).toHaveLength(0);
  });
});
