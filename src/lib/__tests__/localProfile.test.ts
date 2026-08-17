import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLocalProfile,
  getActiveProfile,
  signOutLocalProfile,
  deleteLocalProfile,
  loadProfileVault,
  saveProfileVault,
} from '../localProfile';
import { createEmptyVault } from '../sampleVault';

/** Minimalna atrapa localStorage — testy biegną w Node, nie w przeglądarce. */
class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
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
    localStorage.setItem('cvelocity-auth-state', '{"subscription":{"status":"active"}}');
    localStorage.setItem('cvelocity-favorite-tips', '["tip-1"]');
    localStorage.setItem('skillvault_users_db_v1', '[{"id":"stary"}]');
    localStorage.setItem('cvelocity-theme', 'dark');

    deleteLocalProfile();

    expect(getActiveProfile()).toBeNull();
    expect(loadProfileVault(profile.id)).toBeNull();
    expect(localStorage.getItem('cvelocity-auth-state')).toBeNull();
    expect(localStorage.getItem('cvelocity-favorite-tips')).toBeNull();
    expect(localStorage.getItem('skillvault_users_db_v1')).toBeNull();

    // Motyw to ustawienie interfejsu, nie dane osobowe — zostaje.
    expect(localStorage.getItem('cvelocity-theme')).toBe('dark');
  });

  it('zapisuje vault czystym tekstem — bez udawania szyfrowania', () => {
    // Świadoma decyzja, opisana w SECURITY.md. Poprzednia wersja zapisywała
    // obok kopię "zaszyfrowaną" kluczem 'default_key' zaszytym w bundlu, co przy
    // XSS nie chroni przed niczym, a mnożyło kopie tych samych danych.
    const { profile } = createLocalProfile('Jan');
    saveProfileVault(profile.id, createEmptyVault('Sean O’Brien', 'sean@example.pl'));

    const stored = localStorage.getItem(`skillvault_vault_active_${profile.id}`);

    expect(stored).toContain('Sean');
    expect(localStorage.getItem(`skillvault_vault_encrypted_${profile.id}`)).toBeNull();
  });

  it('zwraca null zamiast rzucać, gdy zapisany profil jest uszkodzony', () => {
    localStorage.setItem('cvelocity_local_profile_v1', '{to nie jest json');

    expect(getActiveProfile()).toBeNull();
  });
});
