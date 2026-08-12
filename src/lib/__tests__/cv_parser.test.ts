import { describe, it, expect } from 'vitest';
import { parseTextToMasterVault } from '../cvUniversalParser';

describe('CV Universal Multi-Format Parser Suite', () => {
  it('powinien wyodrębnić prawdziwe dane z CV: imię, stanowisko, firmę i uczelnię', () => {
    const rawCvText = `
    Anna Kowalska
    Senior Frontend Developer
    Email: anna.kowalska@gmail.com
    Telefon: +48 555 123 456
    Warszawa, Polska

    Podsumowanie:
    Frontend developer z doświadczeniem w React, TypeScript i architekturze aplikacji webowych.

    Umiejętności:
    React, TypeScript, Tailwind, Node.js, Git, REST API

    Doświadczenie zawodowe:
    Pixel Studio - Senior Frontend Developer
    2022-01 - obecnie
    - Budowa i utrzymanie aplikacji webowych w React oraz TypeScript.
    - Współpraca z backendem i UX w ramach sprintów Agile.

    Wykształcenie:
    Politechnika Warszawska
    Inżynieria Oprogramowania, magister
    2014 - 2019
    `;

    const parsed = parseTextToMasterVault(rawCvText, 'TXT');

    expect(parsed.personalInfo.fullName).toBe('Anna Kowalska');
    expect(parsed.personalInfo.email).toBe('anna.kowalska@gmail.com');
    expect(parsed.personalInfo.phone).toContain('555');
    expect(parsed.personalInfo.title).toContain('Senior Frontend Developer');
    expect(parsed.hardSkills).toContain('React');
    expect(parsed.toolsAndTech).toContain('Git');
    expect(parsed.history[0]?.company).toBe('Pixel Studio');
    expect(parsed.history[0]?.role).toContain('Senior Frontend Developer');
    expect(parsed.education[0]?.institution).toContain('Politechnika Warszawska');
    expect(parsed.education[0]?.degree).toContain('magister');
  });

  it('powinien przestrzegać zasady 0-Halucynacji i nie wstawiać placeholderów dla pustych/częściowych CV', () => {
    const rawCvText = `
    12345 CV
    brak sekcji doswiadczenia i edukacji.
    `;

    const parsed = parseTextToMasterVault(rawCvText, 'TXT');

    // Brak imienia (nie spełnia wymagań regex), brak maila, brak telefonu, brak stanowiska
    expect(parsed.personalInfo.fullName).toBe('');
    expect(parsed.personalInfo.title).toBe('');
    expect(parsed.personalInfo.email).toBe('');
    expect(parsed.personalInfo.phone).toBe('');
    expect(parsed.personalInfo.location).toBe('');
    expect(parsed.personalInfo.summary).toBe('');

    // Brak sekcji doświadczenia i edukacji powinien skutkować pustymi tablicami
    expect(parsed.history).toEqual([]);
    expect(parsed.education).toEqual([]);
    expect(parsed.certifications).toEqual([]);
  });

  it('powinien poprawnie obsługiwać częściowe wykształcenie bez wstawiania domyślnych wartości', () => {
    const rawCvText = `
    Wykształcenie:
    Politechnika Warszawska
    `;

    const parsed = parseTextToMasterVault(rawCvText, 'TXT');

    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0].institution).toBe('Politechnika Warszawska');
    expect(parsed.education[0].degree).toBe('');
    expect(parsed.education[0].fieldOfStudy).toBe('');
    expect(parsed.education[0].endDate).toBe('');
  });
});
