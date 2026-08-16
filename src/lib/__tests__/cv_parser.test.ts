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

  it('nie zniekształca apostrofów w nazwiskach', () => {
    // Poprzedni sanitizer robił escapowanie SQL (' → '') w aplikacji bez SQL,
    // przez co O'Brien zmieniało się w O''Brien i narastało przy każdym zapisie.
    const parsed = parseTextToMasterVault(
      "Sean O'Brien\nEmail: sean@example.com\nStanowisko: Developer",
      'TXT'
    );

    expect(parsed.personalInfo.fullName).toBe("Sean O'Brien");
    expect(parsed.rawText).not.toContain("''");
  });

  it('zachowuje polskie znaki diakrytyczne', () => {
    const parsed = parseTextToMasterVault(
      'Łukasz Wiśniewski\nStanowisko: Główny Inżynier\nEmail: l.w@example.pl',
      'TXT'
    );

    expect(parsed.personalInfo.fullName).toBe('Łukasz Wiśniewski');
  });

  it('nie fabrykuje wykształcenia, certyfikatów ani umiejętności miękkich, gdy CV ich nie zawiera', () => {
    const cvWithoutThoseSections = `
    Anna Zielińska
    Email: anna.zielinska@firma.pl
    Doświadczenie zawodowe:
    Acme Sp. z o.o. - Analityk danych, 2020 - 2023
    `;

    const parsed = parseTextToMasterVault(cvWithoutThoseSections, 'TXT');

    expect(parsed.education).toEqual([]);
    expect(parsed.certifications).toEqual([]);
    expect(parsed.softSkills).toEqual([]);
  });

  it('nie wstawia zastępczego doświadczenia, gdy CV nie ma sekcji doświadczenia', () => {
    const parsed = parseTextToMasterVault('Piotr Mazur\nEmail: piotr@example.pl', 'TXT');

    expect(parsed.history).toEqual([]);
    expect(parsed.personalInfo.title).toBe('');
    expect(parsed.personalInfo.location).toBe('');
  });

  it('wyodrębnia realne wykształcenie i certyfikaty, gdy CV je zawiera', () => {
    const fullCv = `
    Marek Wolny
    Wykształcenie:
    Politechnika Warszawska - Inżynier - Informatyka, 2016 - 2020
    Certyfikaty:
    AWS Certified Solutions Architect - Amazon Web Services, 2022
    Umiejętności miękkie:
    Komunikacja, Praca zespołowa
    `;

    const parsed = parseTextToMasterVault(fullCv, 'TXT');

    expect(parsed.education[0].institution).toBe('Politechnika Warszawska');
    expect(parsed.education[0].startDate).toBe('2016');
    expect(parsed.certifications[0].name).toBe('AWS Certified Solutions Architect');
    expect(parsed.certifications[0].date).toBe('2022');
    expect(parsed.softSkills).toEqual(['Komunikacja', 'Praca zespołowa']);
  });
});
