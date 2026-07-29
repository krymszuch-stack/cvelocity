import { describe, it, expect } from 'vitest';
import { parseTextToMasterVault } from '../cvUniversalParser';

describe('CV Universal Multi-Format Parser Suite', () => {
  it('powinien wyodrębnić dane z tekstu CV (imię, email, telefon, stanowisko, umiejętności)', () => {
    const rawCvText = `
    Jan Nowak
    Email: jan.nowak@example.com
    Tel: +48 600 700 800
    Stanowisko: Senior Frontend Developer
    Podsumowanie: Doświadczony programista aplikacji internetowych.
    Umiejętności: React, TypeScript, Tailwind, Node.js, Git
    Doświadczenie zawodowe:
    TechCorp - Senior Frontend Developer
    Praca przy architekturze oprogramowania webowego.
    `;

    const parsed = parseTextToMasterVault(rawCvText, 'TXT');

    expect(parsed.personalInfo.fullName).toBe('Jan Nowak');
    expect(parsed.personalInfo.email).toBe('jan.nowak@example.com');
    expect(parsed.personalInfo.phone).toContain('600');
    expect(parsed.personalInfo.title).toContain('Senior Frontend Developer');
    expect(parsed.hardSkills).toContain('React');
    expect(parsed.toolsAndTech).toContain('Git');
    expect(parsed.history.length).toBeGreaterThan(0);
  });
});
