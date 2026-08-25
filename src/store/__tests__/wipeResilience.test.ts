import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryStorage } from '../../lib/__tests__/helpers/memoryStorage';
import { StorageKeys } from '../../lib/storage';
import { createEmptyVault } from '../../lib/sampleVault';
import type { JobApplication } from '../../types';

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
  // Sklepy trzymają stan w zmiennych modułowych, więc każdy test dostaje
  // świeże rejestry modułów — inaczej dane przenikałyby między testami.
  vi.resetModules();
});

const STARA_DATA = '2020-01-01T00:00:00.000Z';

const aplikacja = (nadpisane: Partial<JobApplication> = {}): JobApplication => ({
  id: 'app-1',
  company: 'Firma',
  position: 'Stanowisko',
  salary: '',
  date: '2026-01-01',
  status: 'Rozmowa',
  ...nadpisane,
});

describe('odporność sklepów na „usuń moje dane"', () => {
  it('wipeAppStorage powiadamia zarejestrowane sklepy; odpinięty przestaje dostawać zdarzenia', async () => {
    const storage = await import('../../lib/storage');
    const zdarzenia: string[] = [];
    const odpnij = storage.onAppStorageWiped(() => zdarzenia.push('a'));
    storage.onAppStorageWiped(() => zdarzenia.push('b'));

    storage.wipeAppStorage();
    expect(zdarzenia).toEqual(['a', 'b']);

    odpnij();
    storage.wipeAppStorage();
    expect(zdarzenia).toEqual(['a', 'b', 'b']);
  });

  it('kamienie milowe sprzed wymazania nie odradzają się przy pierwszym zapisie po nim', async () => {
    const storage = await import('../../lib/storage');
    localStorage.setItem(
      StorageKeys.uxMilestones,
      JSON.stringify({ vaultStartedAt: STARA_DATA })
    );

    const sklep = await import('../milestonesStore');
    expect(sklep.getMilestones().vaultStartedAt).toBe(STARA_DATA);

    storage.wipeAppStorage();

    // Klucz zniknął ze schowka i kopia w pamięci też — dopiero ta para gwarantuje,
    // że kolejny zapis nie odzyska usuniętego stanu.
    expect(localStorage.getItem(StorageKeys.uxMilestones)).toBeNull();
    expect(sklep.getMilestones()).toEqual({});

    // Regresja, którą widział ten plik przed naprawą: syncMilestones porównywał
    // się z pamięcią sprzed wymazania i odzyskiwał stare znaczniki do schowka.
    sklep.syncMilestones({ vault: createEmptyVault(), applications: [aplikacja()] });

    const zapis = localStorage.getItem(StorageKeys.uxMilestones);
    expect(zapis).not.toBeNull();
    expect(zapis).not.toContain(STARA_DATA);
    expect(sklep.getMilestones().vaultStartedAt).not.toBe(STARA_DATA);
  });
});
