import { describe, it, expect, beforeEach } from 'vitest';
import { findLegacyVaultForEmail, clearLegacyLocalData } from '../legacyVaultMigration';
import { MasterVault } from '../../types';

class StorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const localStorageMock = new StorageMock();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

const filledVault: MasterVault = {
  version: '1',
  updatedAt: new Date().toISOString(),
  personalInfo: { fullName: 'Jan Kowalski', title: '', email: 'jan@example.com', phone: '', location: '', summary: '' },
  skillsMatrix: { hardSkills: ['React'], softSkills: [], toolsAndTech: [], certifications: [] },
  history: [],
  education: [],
  projects: [],
  profiler: { flags: [], experienceLevel: 'MID', location: { city: '', radiusKm: 0, willingnessToTravel: false, hybridWork: false, remoteOnly: false }, languages: [] },
};

const emptyVault: MasterVault = {
  ...filledVault,
  personalInfo: { fullName: '', title: '', email: '', phone: '', location: '', summary: '' },
  skillsMatrix: { hardSkills: [], softSkills: [], toolsAndTech: [], certifications: [] },
};

describe('legacyVaultMigration', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('finds a per-account legacy vault matched by email', () => {
    localStorage.setItem('skillvault_users_db_v1', JSON.stringify([{ id: 'user_123', email: 'jan@example.com' }]));
    localStorage.setItem('sv_user_123_vault', JSON.stringify(filledVault));

    const found = findLegacyVaultForEmail('jan@example.com');
    expect(found?.personalInfo.fullName).toBe('Jan Kowalski');
  });

  it('falls back to the shared guest vault when no per-account match exists', () => {
    localStorage.setItem('skillvault_master_vault_enc_v2', JSON.stringify(filledVault));

    const found = findLegacyVaultForEmail('someone-else@example.com');
    expect(found?.personalInfo.fullName).toBe('Jan Kowalski');
  });

  it('returns null when there is nothing worth migrating', () => {
    localStorage.setItem('skillvault_master_vault_enc_v2', JSON.stringify(emptyVault));
    expect(findLegacyVaultForEmail('nobody@example.com')).toBeNull();
  });

  it('returns null when localStorage has no legacy data at all', () => {
    expect(findLegacyVaultForEmail('nobody@example.com')).toBeNull();
  });

  it('clears legacy keys it knows about', () => {
    localStorage.setItem('skillvault_users_db_v1', JSON.stringify([{ id: 'user_123', email: 'jan@example.com' }]));
    localStorage.setItem('sv_user_123_vault', JSON.stringify(filledVault));
    localStorage.setItem('skillvault_master_vault_enc_v2', JSON.stringify(filledVault));

    clearLegacyLocalData();

    expect(localStorage.getItem('sv_user_123_vault')).toBeNull();
    expect(localStorage.getItem('skillvault_master_vault_enc_v2')).toBeNull();
  });
});
