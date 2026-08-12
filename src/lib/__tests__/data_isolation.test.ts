import { beforeEach, describe, expect, it } from 'vitest';
import { saveVaultToLocalStorage, loadVaultFromLocalStorage, clearVaultLocalStorage } from '../vaultCrypto';
import { MasterVault } from '../../types';

// Mock localStorage to guarantee standard behavior in Node/test environments
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

// Assign mock to global context before running tests
if (typeof window === 'undefined') {
  global.localStorage = localStorageMock as any;
} else {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

const mockVaultUserA: MasterVault = {
  version: '1',
  updatedAt: new Date().toISOString(),
  personalInfo: {
    fullName: 'Jan Kowalski',
    title: 'Senior Developer',
    summary: 'Doświadczony programista',
    location: 'Kraków',
    email: 'jan@kowalski.pl',
    phone: '123456789',
    linkedin: '',
  },
  skillsMatrix: {
    hardSkills: ['React', 'TypeScript'],
    softSkills: ['Komunikatywność'],
    toolsAndTech: ['Git'],
    certifications: [],
  },
  history: [],
  education: [],
  projects: [],
  profiler: {
    flags: [],
    experienceLevel: 'SENIOR',
    location: {
      city: 'Kraków',
      radiusKm: 30,
      willingnessToTravel: true,
      hybridWork: true,
      remoteOnly: false,
    },
    languages: [],
  },
};

const mockVaultUserB: MasterVault = {
  version: '1',
  updatedAt: new Date().toISOString(),
  personalInfo: {
    fullName: 'Anna Nowak',
    title: 'Product Manager',
    summary: 'Product Manager z pasją',
    location: 'Warszawa',
    email: 'anna@nowak.pl',
    phone: '987654321',
    linkedin: '',
  },
  skillsMatrix: {
    hardSkills: ['Agile', 'Scrum'],
    softSkills: ['Liderstwo'],
    toolsAndTech: ['Jira'],
    certifications: [],
  },
  history: [],
  education: [],
  projects: [],
  profiler: {
    flags: [],
    experienceLevel: 'MID',
    location: {
      city: 'Warszawa',
      radiusKm: 0,
      willingnessToTravel: false,
      hybridWork: false,
      remoteOnly: true,
    },
    languages: [],
  },
};

const mockVaultGuest: MasterVault = {
  version: '1',
  updatedAt: new Date().toISOString(),
  personalInfo: {
    fullName: 'Anonimowy Gość',
    title: 'Guest',
    summary: 'Profil gościa',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
  },
  skillsMatrix: {
    hardSkills: [],
    softSkills: [],
    toolsAndTech: [],
    certifications: [],
  },
  history: [],
  education: [],
  projects: [],
  profiler: {
    flags: [],
    experienceLevel: 'ENTRY',
    location: {
      city: '',
      radiusKm: 0,
      willingnessToTravel: false,
      hybridWork: false,
      remoteOnly: true,
    },
    languages: [],
  },
};

describe('Data Isolation and Storage Key Isolation per User', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('zapisuje i odczytuje dane dla gościa pod domyślnym kluczem bez nakładania się na użytkowników', () => {
    saveVaultToLocalStorage(mockVaultGuest);

    // Guest vault should be loaded when no userId is supplied
    const loadedGuest = loadVaultFromLocalStorage();
    expect(loadedGuest).not.toBeNull();
    expect(loadedGuest?.personalInfo.fullName).toBe('Anonimowy Gość');

    // It should not populate any isolated user vaults
    const loadedUserA = loadVaultFromLocalStorage('userA');
    expect(loadedUserA).toBeNull();
  });

  it('izoluje dane w localStorage dla różnych zalogowanych użytkowników pod kluczami sv_${userId}_vault', () => {
    // Save vaults for two different users
    saveVaultToLocalStorage(mockVaultUserA, 'userA');
    saveVaultToLocalStorage(mockVaultUserB, 'userB');

    // Load and check User A's data
    const loadedUserA = loadVaultFromLocalStorage('userA');
    expect(loadedUserA).not.toBeNull();
    expect(loadedUserA?.personalInfo.fullName).toBe('Jan Kowalski');
    expect(loadedUserA?.skillsMatrix.hardSkills).toContain('TypeScript');

    // Load and check User B's data
    const loadedUserB = loadVaultFromLocalStorage('userB');
    expect(loadedUserB).not.toBeNull();
    expect(loadedUserB?.personalInfo.fullName).toBe('Anna Nowak');
    expect(loadedUserB?.skillsMatrix.hardSkills).toContain('Agile');

    // Verify there is no cross-leakage or overlap
    expect(loadedUserA?.personalInfo.fullName).not.toBe(loadedUserB?.personalInfo.fullName);
  });

  it('czyszczenie pamięci jednego użytkownika nie wpływa na dane innych użytkowników ani gościa', () => {
    saveVaultToLocalStorage(mockVaultGuest);
    saveVaultToLocalStorage(mockVaultUserA, 'userA');
    saveVaultToLocalStorage(mockVaultUserB, 'userB');

    // Clear User A's vault
    clearVaultLocalStorage('userA');

    // User A should be gone
    expect(loadVaultFromLocalStorage('userA')).toBeNull();

    // User B and Guest should still remain intact
    const loadedUserB = loadVaultFromLocalStorage('userB');
    expect(loadedUserB).not.toBeNull();
    expect(loadedUserB?.personalInfo.fullName).toBe('Anna Nowak');

    const loadedGuest = loadVaultFromLocalStorage();
    expect(loadedGuest).not.toBeNull();
    expect(loadedGuest?.personalInfo.fullName).toBe('Anonimowy Gość');
  });
});
