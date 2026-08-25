import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLocalProfile,
  getActiveProfile,
  signOutLocalProfile,
  deleteLocalProfile,
  loadProfileVault,
  saveProfileVault,
  ANONYMOUS_PROFILE_ID,
} from '../localProfile';
import { createEmptyVault } from '../sampleVault';
import { StorageKeys, migrateLegacyKeys, resetLastGoodCache, vaultKeyFor } from '../storage';
import { MemoryStorage } from './helpers/memoryStorage';

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
  resetLastGoodCache();
});

describe('Profil lokalny', () => {
  it('zapisuje profil i odczytuje go po ponownym wejściu', () => {
    const { profile } = createLocalProfile('Jan Kowalski', 'jan@example.pl');

    expect(profile.name).toBe('Jan Kowalski');
    expect(profile.email).toBe('jan@example.pl');
    expect(getActiveProfile()?.id).toBe(profile.id);
  });

  it('nie wymaga adresu e-mail', () => {
    const { profile } = createLocalProfile('Anna Nowak');

    expect(profile.email).toBeUndefined();
    expect(getActiveProfile()?.name).toBe('Anna Nowak');
  });

  it('nie tworzy dwóch profili o tym samym identyfikatorze', () => {
    const first = createLocalProfile('Jan').profile;
    const second = createLocalProfile('Jan').profile;

    expect(first.id).not.toBe(second.id);
  });

  it('wylogowanie usuwa profil, ale zostawia zapisany vault na urządzeniu', () => {
    const { profile } = createLocalProfile('Jan');
    saveProfileVault(profile.id, createEmptyVault('Jan', 'jan@example.pl'));

    signOutLocalProfile();

    expect(getActiveProfile()).toBeNull();
    expect(loadProfileVault(profile.id)).not.toBeNull();
  });

  it('usunięcie profilu czyści WSZYSTKIE dane aplikacji, nie tylko wyliczone klucze', () => {
    // Poprzednia implementacja kasowała zakodowaną na sztywno listę kluczy i
    // zostawiała za sobą m.in. stan subskrypcji. „Usuń moje dane", które czegoś
    // nie usuwa, jest gorsze niż brak takiej funkcji.
    const { profile } = createLocalProfile('Jan');
    saveProfileVault(profile.id, createEmptyVault('Jan'));
    localStorage.setItem(StorageKeys.entitlementsCache, '{"subscription":{"status":"active"}}');
    localStorage.setItem(StorageKeys.favoriteTips, '["tip-1"]');
    localStorage.setItem('skillvault_users_db_v1', '[{"id":"stary"}]');
    localStorage.setItem(StorageKeys.theme, 'dark');

    deleteLocalProfile();

    expect(getActiveProfile()).toBeNull();
    expect(loadProfileVault(profile.id)).toBeNull();
    expect(localStorage.getItem(StorageKeys.entitlementsCache)).toBeNull();
    expect(localStorage.getItem(StorageKeys.favoriteTips)).toBeNull();
    expect(localStorage.getItem('skillvault_users_db_v1')).toBeNull();

    // Motyw to ustawienie interfejsu, nie dane osobowe — zostaje.
    expect(localStorage.getItem(StorageKeys.theme)).toBe('dark');
  });

  it('zapisuje vault czystym tekstem — bez udawania szyfrowania', () => {
    // Świadoma decyzja, opisana w SECURITY.md. Poprzednia wersja zapisywała
    // obok kopię "zaszyfrowaną" kluczem 'default_key' zaszytym w bundlu, co przy
    // XSS nie chroni przed niczym, a mnożyło kopie tych samych danych.
    const { profile } = createLocalProfile('Jan');
    saveProfileVault(profile.id, createEmptyVault('Sean O’Brien', 'sean@example.pl'));

    const stored = localStorage.getItem(vaultKeyFor(profile.id));

    expect(stored).toContain('Sean');
    // Nie ma drugiej kopii — ani „zaszyfrowanej", ani żadnej innej.
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    expect(keys.filter((k) => k?.includes(profile.id))).toHaveLength(1);
  });

  it('zwraca null zamiast rzucać, gdy zapisany profil jest uszkodzony', () => {
    localStorage.setItem(StorageKeys.profile, '{to nie jest json');

    expect(getActiveProfile()).toBeNull();
  });
});

describe('Migracja ze starych kluczy', () => {
  it('przenosi profil i vault spod dawnych nazw kluczy', () => {
    const legacyProfile = { id: 'local-123', name: 'Jan', createdAt: '2026-01-01T00:00:00.000Z' };
    localStorage.setItem('cvelocity_local_profile_v1', JSON.stringify(legacyProfile));
    localStorage.setItem(
      'skillvault_vault_active_local-123',
      JSON.stringify(createEmptyVault('Jan'))
    );

    migrateLegacyKeys();

    expect(getActiveProfile()?.id).toBe('local-123');
    expect(loadProfileVault('local-123')).not.toBeNull();
    expect(localStorage.getItem('cvelocity_local_profile_v1')).toBeNull();
    expect(localStorage.getItem('skillvault_vault_active_local-123')).toBeNull();
  });

  it('nie nadpisuje danych zapisanych już pod nowym kluczem', () => {
    // Powtórne wywołanie migracji nie może cofać zmian wprowadzonych po niej.
    localStorage.setItem('cvelocity-theme', 'light');
    localStorage.setItem(StorageKeys.theme, 'dark');

    migrateLegacyKeys();

    expect(localStorage.getItem(StorageKeys.theme)).toBe('dark');
  });

  it('usuwa pozostałości po module udającym system kont', () => {
    localStorage.setItem('skillvault_users_db_v1', '[{"passwordHash":"..."}]');
    localStorage.setItem('skillvault_master_vault_enc_v2', '{"v":1,"raw":"{}"}');

    migrateLegacyKeys();

    expect(localStorage.getItem('skillvault_users_db_v1')).toBeNull();
    expect(localStorage.getItem('skillvault_master_vault_enc_v2')).toBeNull();
  });
});

describe('Praca sprzed założenia profilu', () => {
  it('przenosi vault z profilu anonimowego na nowo założony profil', () => {
    // Klin ATS działa bez rejestracji. Gdyby wynik przepadał w chwili podania
    // imienia, cała propozycja „sprawdź najpierw, zarejestruj się potem"
    // rozpadałaby się dokładnie w momencie konwersji.
    saveProfileVault(ANONYMOUS_PROFILE_ID, createEmptyVault('Sean O’Brien', 'sean@example.pl'));

    const { profile, vault } = createLocalProfile('Sean O’Brien');

    expect(vault.personalInfo.email).toBe('sean@example.pl');
    expect(loadProfileVault(profile.id)?.personalInfo.email).toBe('sean@example.pl');
    expect(loadProfileVault(ANONYMOUS_PROFILE_ID)).toBeNull();
  });
});
