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
});
