import { describe, it, expect } from 'vitest';
import { mergeImportedVault, mergeUnique } from '../vaultImportMerge';
import { createEmptyVault } from '../sampleVault';
import { MasterVault, WorkExperience, Education, Project } from '../../types';

function experience(id: string, company: string, role: string): WorkExperience {
  return {
    id,
    company,
    role,
    location: 'Kraków',
    startDate: '2020-01',
    endDate: '2022-01',
    isCurrent: false,
    description: '',
    highlights: [],
  };
}

function education(id: string, institution: string, degree: string): Education {
  return { id, institution, degree, fieldOfStudy: 'Informatyka', startDate: '2015-10', endDate: '2019-06' };
}

function project(id: string, name: string): Project {
  return { id, name, role: 'Autor', description: '', techStack: [] };
}

function vaultWithHistory(...entries: WorkExperience[]): MasterVault {
  const vault = createEmptyVault('Anna Kowalska', 'anna@example.pl');
  return { ...vault, history: entries };
}

describe('mergeUnique', () => {
  it('zachowuje pozycje bazowe i ich kolejność', () => {
    const base = ['a', 'b'];
    const merged = mergeUnique(base, ['c'], (item) => item);
    expect(merged).toEqual(['a', 'b', 'c']);
  });

  it('pomija duplikaty z importu', () => {
    const merged = mergeUnique(['a', 'b'], ['b', 'c'], (item) => item);
    expect(merged).toEqual(['a', 'b', 'c']);
  });

  it('pomija pozycje z importu bez treści w polach kluczowych', () => {
    const merged = mergeUnique(['a'], ['', 'b'], (item) => item);
    expect(merged).toEqual(['a', 'b']);
  });

  it('nigdy nie usuwa pozycji bazowej, nawet bez klucza', () => {
    const merged = mergeUnique(['', 'a'], ['a'], (item) => item);
    expect(merged).toEqual(['', 'a']);
  });
});

describe('mergeImportedVault', () => {
  /**
   * Regresja na błąd, przez który import CV kasował doświadczenie wpisane
   * ręcznie. To jedyny test, który naprawdę musi tu być — reszta pilnuje
   * szczegółów, ten pilnuje danych użytkownika.
   */
  it('zachowuje dotychczasową historię przy imporcie nowej', () => {
    const prev = vaultWithHistory(experience('1', 'Alfa', 'Programista'));
    const parsed = { history: [experience('2', 'Beta', 'Analityk')] };

    const merged = mergeImportedVault(prev, parsed);

    expect(merged.history.map((h) => h.company)).toEqual(['Alfa', 'Beta']);
  });

  it('nie dubluje wpisu obecnego po obu stronach', () => {
    const prev = vaultWithHistory(experience('1', 'Alfa', 'Programista'));
    const parsed = { history: [experience('2', 'alfa', '  Programista ')] };

    const merged = mergeImportedVault(prev, parsed);

    expect(merged.history).toHaveLength(1);
    expect(merged.history[0].id).toBe('1');
  });

  it('nie gubi historii, gdy import jej nie zawiera', () => {
    const prev = vaultWithHistory(experience('1', 'Alfa', 'Programista'));

    const merged = mergeImportedVault(prev, {
      personalInfo: { ...prev.personalInfo, fullName: 'Jan Nowak' },
    });

    expect(merged.history).toHaveLength(1);
  });

  it('scala umiejętności bez duplikatów', () => {
    const prev = createEmptyVault();
    prev.skillsMatrix.hardSkills = ['TypeScript'];

    const merged = mergeImportedVault(prev, {
      skillsMatrix: { ...prev.skillsMatrix, hardSkills: ['TypeScript', 'Python'] },
    });

    expect(merged.skillsMatrix.hardSkills).toEqual(['TypeScript', 'Python']);
  });

  it('dokłada wykształcenie i projekty zamiast je nadpisywać', () => {
    const prev = createEmptyVault();
    prev.education = [education('1', 'AGH', 'Informatyka')];
    prev.projects = [project('1', 'Portfolio')];

    const merged = mergeImportedVault(prev, {
      education: [education('2', 'PW', 'Elektronika')],
      projects: [project('2', 'Sklep')],
    });

    expect(merged.education.map((e) => e.institution)).toEqual(['AGH', 'PW']);
    expect(merged.projects.map((p) => p.name)).toEqual(['Portfolio', 'Sklep']);
  });

  it('nadpisuje dane osobowe wartościami z CV', () => {
    const prev = createEmptyVault('Anna Kowalska', 'anna@example.pl');

    const merged = mergeImportedVault(prev, {
      personalInfo: { ...prev.personalInfo, fullName: 'Anna Nowak' },
    });

    expect(merged.personalInfo.fullName).toBe('Anna Nowak');
    expect(merged.personalInfo.email).toBe('anna@example.pl');
  });
});
