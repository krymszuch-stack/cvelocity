import { describe, it, expect, vi } from 'vitest';
import type { MasterVault, WorkExperience, Project } from '../../types';
import { createDeferredWriter, PERSIST_DELAY_MS } from '../deferredWriter';

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

  it('porównuje sesję pisania przed odłożeniem zapisu i po nim', () => {
    // Pomiar przepuszcza dane przez prawdziwego writera, a nie przez wzór
    // szacujący liczbę zapisów. Zegary są atrapami (sterujemy upływem czasu),
    // ale `JSON.stringify` w funkcji zapisującej jest prawdziwy, więc zmierzony
    // koszt to koszt faktycznie wykonanej pracy.
    const keystrokes = 200;
    const msBetweenKeystrokes = 40;

    // --- przed zmianą: zapis przy każdej zmianie stanu -----------------------
    let writesBefore = 0;
    let costBefore = 0;
    for (let i = 0; i < keystrokes; i++) {
      const edited = { ...vault, updatedAt: String(i) };
      const t0 = performance.now();
      JSON.stringify(edited);
      costBefore += performance.now() - t0;
      writesBefore++;
    }

    // --- po zmianie: ten sam ciąg zdarzeń przez createDeferredWriter ---------
    vi.useFakeTimers();
    let writesAfter = 0;
    let costAfter = 0;

    const writer = createDeferredWriter<MasterVault>((value) => {
      const t0 = performance.now();
      JSON.stringify(value);
      costAfter += performance.now() - t0;
      writesAfter++;
    });

    for (let i = 0; i < keystrokes; i++) {
      writer.push({ ...vault, updatedAt: String(i) } as MasterVault);
      vi.advanceTimersByTime(msBetweenKeystrokes);
    }
    // Użytkownik przestaje pisać — zaległy zapis dochodzi.
    vi.advanceTimersByTime(PERSIST_DELAY_MS);
    vi.useRealTimers();

    console.log(
      `\n  sesja ${keystrokes} znaków (co ${msBetweenKeystrokes} ms):` +
        `\n    przed: ${writesBefore} serializacji, ${costBefore.toFixed(1)} ms na gł. wątku` +
        `\n    po:    ${writesAfter} serializacji, ${costAfter.toFixed(1)} ms na gł. wątku` +
        `\n    redukcja zapisów: ${(100 - (writesAfter / writesBefore) * 100).toFixed(1)}%\n`
    );

    // Pisanie w tempie szybszym niż opóźnienie bez przerwy przesuwa zegar,
    // więc do zapisu dochodzi dopiero po zatrzymaniu się użytkownika.
    expect(writesAfter).toBe(1);
    expect(writesBefore).toBe(keystrokes);
    expect(costAfter).toBeLessThan(costBefore);
  });

  it('nie gubi ostatniej zmiany, gdy karta znika przed upływem opóźnienia', () => {
    vi.useFakeTimers();
    const persisted: string[] = [];
    const writer = createDeferredWriter<MasterVault>((v) => persisted.push(v.updatedAt));

    writer.push({ ...vault, updatedAt: 'ostatnia-zmiana' } as MasterVault);
    vi.advanceTimersByTime(PERSIST_DELAY_MS - 100); // zapis jeszcze nie nastąpił
    expect(persisted).toHaveLength(0);

    // Odpowiednik zamknięcia karty: bindFlushOnHide woła dokładnie to.
    writer.flush();
    vi.useRealTimers();

    expect(persisted).toEqual(['ostatnia-zmiana']);
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
