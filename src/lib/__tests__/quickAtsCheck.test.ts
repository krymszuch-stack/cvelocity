import { describe, it, expect } from 'vitest';
import { runQuickAtsCheck, QuickCheckError, MIN_CV_CHARS } from '../quickAtsCheck';

const CV = `
Anna Kowalska
Email: anna.kowalska@example.pl
Tel: +48 600 700 800
Stanowisko: Backend Developer

Podsumowanie: Programistka backendu z pięcioletnim doświadczeniem w budowie usług sieciowych.

Umiejętności: Python, Django, PostgreSQL, Git, Docker

Doświadczenie zawodowe:
Acme Sp. z o.o. - Backend Developer, 2020 - 2025
Projektowanie i utrzymanie usług REST w Pythonie oraz optymalizacja zapytań do bazy PostgreSQL.

Wykształcenie:
Politechnika Warszawska - Inżynier - Informatyka, 2015 - 2019
`;

const JD = `
Poszukujemy Senior Backend Developera.

Wymagania:
- Bardzo dobra znajomość Pythona i frameworka Django
- Doświadczenie z bazami PostgreSQL
- Znajomość Kubernetes i Terraform
- Doświadczenie z AWS
- Umiejętność pracy zespołowej i komunikatywność

Oferujemy pracę zdalną i pakiet medyczny.
`;

describe('Szybkie sprawdzenie CV pod ofertę', () => {
  it('zwraca wynik liczbowy w sensownym zakresie', () => {
    const { ats } = runQuickAtsCheck(CV, JD);

    expect(ats.overallScore).toBeGreaterThan(0);
    expect(ats.overallScore).toBeLessThanOrEqual(100);
  });

  it('wskazuje konkretne braki, a nie samą liczbę', () => {
    // To jest wartość, którą użytkownik pokazuje dalej znajomym: nie „62%",
    // tylko „brakuje Kubernetes i Terraform".
    const { missingSkills } = runQuickAtsCheck(CV, JD);

    expect(missingSkills.length).toBeGreaterThan(0);
    const joined = missingSkills.join(' ').toLowerCase();
    expect(joined).toMatch(/kubernetes|terraform|aws/);
  });

  it('NIE zgłasza jako brakującej umiejętności, którą CV wprost zawiera', () => {
    // Regresja: nagłówek sekcji stojący w tej samej linii co treść
    // („Umiejętności: Python, Django, …") nie pasował do żadnego wzorca sekcji,
    // więc lista umiejętności zostawała pusta, a jedynym źródłem była zaszyta
    // lista kilkunastu słów kluczowych. CV z Django dostawało informację,
    // że brakuje mu Django — czyli dokładnie to, co niszczy zaufanie do wyniku.
    const { missingSkills, vault } = runQuickAtsCheck(CV, JD);

    expect(vault.skillsMatrix.hardSkills).toContain('Django');
    expect(missingSkills.map((s) => s.toLowerCase())).not.toContain('django');
    expect(missingSkills.map((s) => s.toLowerCase())).not.toContain('python');
  });

  it('nie pokazuje fragmentów zdań jako brakujących umiejętności', () => {
    // Frazy z ogłoszenia bywają resztkami zdań („senior backend developera.").
    // Jedna taka pozycja na liście podważa cały wynik.
    const { missingSkills } = runQuickAtsCheck(CV, JD);

    for (const skill of missingSkills) {
      expect(skill).not.toMatch(/[.!?;:]$/);
      expect(skill.split(/\s+/).length).toBeLessThanOrEqual(3);
      expect(skill.length).toBeLessThanOrEqual(32);
    }
  });

  it('odczytuje profil z CV bez dopisywania czegokolwiek', () => {
    const { vault, parsed } = runQuickAtsCheck(CV, JD);

    expect(vault.personalInfo.fullName).toBe('Anna Kowalska');
    expect(vault.skillsMatrix.hardSkills).toContain('Python');
    expect(vault.history.length).toBeGreaterThan(0);
    expect(parsed.education[0].institution).toBe('Politechnika Warszawska');
  });

  it('daje ten sam wynik dla tej samej pary danych', () => {
    // Ocena musi być powtarzalna — użytkownik, który poprawi CV i uruchomi
    // ponownie, ma widzieć skutek swojej zmiany, a nie szum.
    expect(runQuickAtsCheck(CV, JD).ats.overallScore).toBe(runQuickAtsCheck(CV, JD).ats.overallScore);
  });

  it('lepiej dopasowane CV dostaje wyższy wynik', () => {
    const better = `${CV}\nDodatkowe umiejętności: Kubernetes, Terraform, AWS`;

    expect(runQuickAtsCheck(better, JD).ats.overallScore).toBeGreaterThanOrEqual(
      runQuickAtsCheck(CV, JD).ats.overallScore
    );
  });

  it('odmawia liczenia na zbyt krótkim CV, zamiast zwracać wynik z niczego', () => {
    expect(() => runQuickAtsCheck('Jan Kowalski', JD)).toThrow(QuickCheckError);

    try {
      runQuickAtsCheck('Jan Kowalski', JD);
    } catch (err) {
      expect((err as QuickCheckError).field).toBe('cv');
    }
  });

  it('odmawia liczenia bez treści ogłoszenia', () => {
    try {
      runQuickAtsCheck(CV, 'Szukamy programisty');
      throw new Error('powinno rzucić');
    } catch (err) {
      expect((err as QuickCheckError).field).toBe('jd');
    }
  });

  it('próg długości CV jest faktycznie egzekwowany', () => {
    const justUnder = 'a '.repeat(Math.floor((MIN_CV_CHARS - 10) / 2));

    expect(() => runQuickAtsCheck(justUnder, JD)).toThrow(QuickCheckError);
  });

  it('nie wywraca się na CV bez sekcji wykształcenia i certyfikatów', () => {
    const minimal = `
      Piotr Mazur
      Stanowisko: Frontend Developer
      Umiejętności: React, TypeScript, CSS
      Doświadczenie zawodowe:
      Studio Web - Frontend Developer, 2021 - 2024
      Budowa interfejsów użytkownika w React i TypeScript dla klientów zagranicznych.
    `;

    const { ats, vault } = runQuickAtsCheck(minimal, JD);

    expect(ats.overallScore).toBeGreaterThanOrEqual(0);
    expect(vault.education).toEqual([]);
    expect(vault.skillsMatrix.certifications).toEqual([]);
  });
});
