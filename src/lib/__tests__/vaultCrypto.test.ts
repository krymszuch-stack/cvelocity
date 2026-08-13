import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCreateLocalSessionKey,
  parseStoredVault,
  saveVaultToLocalStorage,
  loadVaultFromLocalStorage,
  clearVaultLocalStorage,
  isLocalVaultLocked
} from '../vaultCrypto';
import { MasterVault } from '../../types';

// Mock implementation of Storage
class StorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const localStorageMock = new StorageMock();
const sessionStorageMock = new StorageMock();

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock, writable: true });
Object.defineProperty(global, 'window', { value: {}, writable: true });

const mockVault: MasterVault = {
  version: '1',
  updatedAt: new Date().toISOString(),
  profiler: {
    flags: [],
    experienceLevel: 'MID',
    location: {
      city: '',
      radiusKm: 0,
      willingnessToTravel: false,
      hybridWork: false,
      remoteOnly: false,
    },
    languages: [],
  },
  personalInfo: {
    fullName: 'Jan Kowalski',
    title: 'Senior Engineer',
    summary: 'Doświadczony inżynier oprogramowania.',
    email: 'jan@kowalski.com',
    phone: '+48123456789',
    location: 'Warszawa'
  },
  skillsMatrix: {
    hardSkills: ['TypeScript', 'React'],
    softSkills: ['Komunikatywność'],
    toolsAndTech: ['Git'],
    certifications: []
  },
  history: [],
  education: [],
  projects: []
};

describe('vaultCrypto encryption and decryption suite', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  it('powinien wygenerować spójny klucz sesyjny w sessionStorage', () => {
    const key1 = getOrCreateLocalSessionKey();
    expect(key1).toBeTruthy();
    expect(key1.length).toBeGreaterThan(16);

    const key2 = getOrCreateLocalSessionKey();
    expect(key2).toBe(key1); // Powinien być identyczny w ramach tej samej sesji
  });

  it('powinien zaszyfrować dane i zapisać je do localStorage', () => {
    saveVaultToLocalStorage(mockVault);
    const stored = localStorageMock.getItem('skillvault_master_vault_enc_v2');
    expect(stored).toBeTruthy();
    expect(stored).not.toContain('Jan Kowalski'); // Brak otwartego tekstu w localStorage
    expect(stored?.startsWith('{')).toBe(false); // To nie powinien być bezpośrednio JSON
  });

  it('powinien poprawnie odszyfrować dane jeśli klucz sesyjny jest obecny', () => {
    saveVaultToLocalStorage(mockVault);
    const loaded = loadVaultFromLocalStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.personalInfo.fullName).toBe('Jan Kowalski');
    expect(loaded?.skillsMatrix.hardSkills).toContain('TypeScript');
  });

  it('powinien poprawnie sparsować i zmigrować niezaszyfrowany (legacy) vault z localStorage', () => {
    // Zapisujemy otwarty JSON tak jak robiły to starsze wersje
    localStorageMock.setItem('skillvault_master_vault_enc_v2', JSON.stringify(mockVault));

    // Próba odczytu bez klucza w sessionStorage (lub z nowym) powinna zadziałać dla otwartego tekstu
    const loaded = loadVaultFromLocalStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.personalInfo.fullName).toBe('Jan Kowalski');

    // Po ponownym zapisie dane powinny zostać automatycznie zaszyfrowane
    saveVaultToLocalStorage(loaded!);
    const rawStoredAfterSave = localStorageMock.getItem('skillvault_master_vault_enc_v2');
    expect(rawStoredAfterSave?.startsWith('{')).toBe(false); // Zostało zaszyfrowane
  });

  it('powinien wykryć sytuację zablokowanego vaulta gdy brakuje klucza sesji', () => {
    // Zapisujemy poprawnie zaszyfrowany vault
    saveVaultToLocalStorage(mockVault);
    expect(isLocalVaultLocked()).toBe(false);

    // Czyścimy sessionStorage (symulujemy wygaśnięcie sesji / nową zakładkę)
    sessionStorageMock.clear();

    expect(isLocalVaultLocked()).toBe(true);
    expect(loadVaultFromLocalStorage()).toBeNull(); // Nie można odszyfrować
  });

  it('powinien poprawnie usunąć dane z obu magazynów', () => {
    saveVaultToLocalStorage(mockVault);
    expect(localStorageMock.getItem('skillvault_master_vault_enc_v2')).toBeTruthy();
    expect(sessionStorageMock.getItem('skillvault_local_session_key')).toBeTruthy();

    clearVaultLocalStorage();

    expect(localStorageMock.getItem('skillvault_master_vault_enc_v2')).toBeNull();
    expect(sessionStorageMock.getItem('skillvault_local_session_key')).toBeNull();
  });
});
