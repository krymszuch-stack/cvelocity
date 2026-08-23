import { describe, it, expect } from 'vitest';
import type { MasterVault, WorkExperience, Project } from '../../types';

/**
 * Pomiar kosztu utrwalania Master Vaultu.
 *
 * Nie jest to test regresji wydajności z progiem czasowym — takie testy sypią
 * się na współdzielonym CI z powodów niezwiązanych ze zmianą. Ten plik służy
 * do zmierzenia rzędu wielkości przed zmianą i po niej; wynik trafia do opisu
 * PR, a asercje pilnują wyłącznie tego, że dane wejściowe mają zakładany
 * rozmiar (inaczej pomiar niczego nie dowodzi).
 */

function buildExperience(index: number): WorkExperience {
  return {
    id: `exp-${index}`,
    company: `Firma Technologiczna numer ${index}`,
    role: `Starszy inżynier oprogramowania (zespół ${index})`,
    startDate: '2019-01',
    endDate: '2023-12',
    isCurrent: false,
    location: 'Warszawa, Polska',
    achievements: Array.from({ length: 6 }, (_, a) => ({
      id: `exp-${index}-ach-${a}`,
      text:
        `Zarządzałem zespołem ośmiu programistów i wdrażałem mikroserwisy ` +
        `na klastrach Kubernetes, obniżając czas wdrożenia o ${a * 7 + 12} procent.`,
      metrics: `${a * 7 + 12}%`,
      keywords: ['kubernetes', 'mikroserwisy', 'zarządzanie zespołem', 'ci/cd'],
    })),
  } as unknown as WorkExperience;
}

function buildProject(index: number): Project {
  return {
    id: `proj-${index}`,
    name: `Platforma wewnętrzna ${index}`,
    description:
      'Projektowanie architektury rozproszonej, wdrożenie potoku ciągłej ' +
      'integracji oraz optymalizacja wydajności zapytań do bazy danych.',
    technologies: ['typescript', 'postgresql', 'docker', 'terraform', 'react'],
    role: 'Architekt rozwiązania',
    startDate: '2021-03',
    endDate: '2022-09',
  } as unknown as Project;
}

/** Profil „rozbudowany" w rozumieniu opisu problemu: kilkadziesiąt projektów. */
export function buildLargeVault(projectCount = 40, experienceCount = 12): MasterVault {
  return {
    version: '1',
    updatedAt: new Date().toISOString(),
    profiler: { languages: [], licenses: [] },
    personalInfo: {
      fullName: 'Adrianna Kowalska-Nowak',
      email: 'adrianna@example.com',
      phone: '+48 600 700 800',
      location: 'Warszawa',
    },
    skillsMatrix: {
      technical: Array.from({ length: 60 }, (_, i) => ({
        id: `sk-${i}`,
        name: `Umiejętność techniczna ${i}`,
        level: (i % 5) + 1,
        yearsOfExperience: (i % 10) + 1,
      })),
      soft: [],
    },
    history: Array.from({ length: experienceCount }, (_, i) => buildExperience(i)),
    education: [],
    projects: Array.from({ length: projectCount }, (_, i) => buildProject(i)),
  } as unknown as MasterVault;
}

describe('koszt utrwalania Master Vaultu', () => {
  const vault = buildLargeVault();
  const serialized = JSON.stringify(vault);

  it('profil kontrolny ma rozmiar odpowiadający opisowi problemu', () => {
    expect(vault.projects).toHaveLength(40);
    expect(vault.history).toHaveLength(12);
    // Rząd wielkości: dziesiątki kilobajtów. Poniżej tego pomiar nie miałby sensu.
    expect(serialized.length).toBeGreaterThan(30_000);
  });

  it('mierzy koszt pełnej serializacji drzewa', () => {
    const iterations = 500;

    const started = performance.now();
    for (let i = 0; i < iterations; i++) {
      // Dokładnie to, co robi writeJson() przy każdej zmianie stanu.
      JSON.stringify(vault);
    }
    const elapsed = performance.now() - started;

    const perWrite = elapsed / iterations;
    console.log(
      `\n  rozmiar vaultu:        ${(serialized.length / 1024).toFixed(1)} kB` +
        `\n  serializacja (1 zapis): ${perWrite.toFixed(3)} ms` +
        `\n  100 znaków pisania:     ${(perWrite * 100).toFixed(1)} ms na głównym wątku\n`
    );

    expect(perWrite).toBeGreaterThan(0);
  });

  it('porównuje koszt zapisu pełnego z porównaniem referencji', () => {
    const iterations = 500;

    const fullStart = performance.now();
    for (let i = 0; i < iterations; i++) JSON.stringify(vault);
    const fullCost = performance.now() - fullStart;

    // Odsiew po referencji: tak działa pominięcie zapisu, gdy nic się nie zmieniło.
    let unchanged = 0;
    const refStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      if (vault === vault) unchanged++;
    }
    const refCost = performance.now() - refStart;

    console.log(
      `\n  ${iterations} pełnych serializacji: ${fullCost.toFixed(1)} ms` +
        `\n  ${iterations} porównań referencji: ${refCost.toFixed(3)} ms\n`
    );

    expect(unchanged).toBe(iterations);
    expect(refCost).toBeLessThan(fullCost);
  });
});
