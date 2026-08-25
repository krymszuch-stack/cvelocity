import { describe, it, expect, beforeEach } from 'vitest';
import {
  StorageKeys,
  vaultKeyFor,
  readRaw,
  writeRaw,
  removeRaw,
  readJson,
  writeJson,
  migrateLegacyKeys,
  onAppStorageWiped,
  resetLastGoodCache,
  fnv1a,
  SCHEMA_VERSION,
  wipeAppStorage,
} from '../storage';
import { MemoryStorage } from './helpers/memoryStorage';

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
  // Mapa ostatnich poprawnych stanów jest modułowa i przeżyłaby podmianę
  // atrapy schowka — bez resetu wyniki przenikałyby między testami.
  resetLastGoodCache();
});

describe('storage.ts - warstwa schowka przeglądarki', () => {
  describe('vaultKeyFor', () => {
    it('klucz zawiera identyfikator profilu i wspólny przedrostek', () => {
      const key = vaultKeyFor('user-123');
      expect(key).toBe(`${StorageKeys.vault}:user-123`);
      expect(key).toContain('user-123');
      expect(key.startsWith('cvelocity:')).toBe(true);
    });
  });

  describe('readJson', () => {
    it('uszkodzony JSON zwraca wartość zapasową, nie wyjątek', () => {
      localStorage.setItem('invalid-json-key', '{to nie jest json');
      const result = readJson('invalid-json-key', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it('zwraca poprawnie sparsowane dane JSON', () => {
      localStorage.setItem('valid-json-key', JSON.stringify({ name: 'Anna' }));
      const result = readJson<{ name: string }>('valid-json-key', { name: '' });
      expect(result).toEqual({ name: 'Anna' });
    });

    it('zwraca wartość zapasową gdy klucz nie istnieje', () => {
      const result = readJson('non-existent-key', 'default');
      expect(result).toBe('default');
    });
  });

  describe('writeJson', () => {
    it('struktura z cyklem nie wywraca wywołania', () => {
      const circularObj: Record<string, unknown> = {};
      circularObj.self = circularObj;

      expect(() => {
        writeJson('circular-key', circularObj);
      }).not.toThrow();

      expect(localStorage.getItem('circular-key')).toBeNull();
    });

    it('zapisuje obiekt w kopercie z sumą kontrolną, odczyt go odwraca', () => {
      const obj = { active: true, count: 5 };
      writeJson('test-json-key', obj);

      const raw = localStorage.getItem('test-json-key');
      expect(raw).not.toBeNull();

      const envelope = JSON.parse(raw!) as { cvel: number; crc: string; data: string };
      expect(envelope.cvel).toBe(SCHEMA_VERSION);
      // Suma kontrola liczy się z dokładnym stringiem danych w kopercie.
      expect(envelope.crc).toBe(fnv1a(envelope.data));
      expect(JSON.parse(envelope.data)).toEqual(obj);

      // Odczyt przez API zwraca oryginalny kształt, nie kopertę.
      expect(readJson('test-json-key', null)).toEqual(obj);
    });

    it('podmiana danych unieważnia sumę kontrolną — readJson reveruje do ostatniego dobrego stanu', () => {
      writeJson('crc-key', { value: 42 });

      const envelope = JSON.parse(localStorage.getItem('crc-key')!) as { data: string };
      envelope.data = envelope.data.replace('42', '43'); // symulacja uszkodzenia/ucięcia
      localStorage.setItem('crc-key', JSON.stringify(envelope));

      // Pierwsza linia obrony: pamięć sesyjna ostatniego poprawnego stanu —
      // aplikacja działa dalej na prawdziwych danych użytkownika.
      expect(readJson<{ value: number } | null>('crc-key', null)).toEqual({ value: 42 });

      // Bez pamięci sesyjnej (chłodny start z uszkodzonym plikiem) — fallback.
      resetLastGoodCache();
      expect(readJson<{ value: number } | null>('crc-key', null)).toBeNull();
    });
  });

  describe('readRaw / writeRaw / removeRaw / obsługa braku przeglądarki', () => {
    it('localStorage rzucający wyjątkiem (tryb prywatny / przepełnienie) nie wywraca wywołania', () => {
      const throwingStorage = {
        getItem() {
          throw new Error('Access denied (private mode)');
        },
        setItem() {
          throw new Error('QuotaExceededError');
        },
        removeItem() {
          throw new Error('Access denied');
        },
      };

      (globalThis as { localStorage?: unknown }).localStorage = throwingStorage;

      expect(() => readRaw('any-key')).not.toThrow();
      expect(readRaw('any-key')).toBeNull();

      expect(() => writeRaw('any-key', 'value')).not.toThrow();
      expect(() => removeRaw('any-key')).not.toThrow();
    });

    it('gałąź isBrowser() gdy localStorage === undefined nie rzuca błędu i readRaw zwraca null', () => {
      (globalThis as { localStorage?: unknown }).localStorage = undefined;

      expect(() => readRaw('key')).not.toThrow();
      expect(readRaw('key')).toBeNull();

      expect(() => writeRaw('key', 'val')).not.toThrow();
      expect(() => removeRaw('key')).not.toThrow();
    });
  });

  describe('migrateLegacyKeys', () => {
    it('dane spod starego klucza trafiają pod nowy, stary znika', () => {
      localStorage.setItem('cvelocity-theme', 'dark');
      localStorage.setItem('cvelocity_applications_data', '["app1"]');

      migrateLegacyKeys();

      expect(localStorage.getItem(StorageKeys.theme)).toBe('dark');
      expect(localStorage.getItem(StorageKeys.applications)).toBe('["app1"]');

      expect(localStorage.getItem('cvelocity-theme')).toBeNull();
      expect(localStorage.getItem('cvelocity_applications_data')).toBeNull();
    });

    it('idempotencja: istniejący klucz docelowy nie zostaje nadpisany przy powtórnym wywołaniu', () => {
      localStorage.setItem('cvelocity-theme', 'light');
      localStorage.setItem(StorageKeys.theme, 'dark');

      migrateLegacyKeys();

      expect(localStorage.getItem(StorageKeys.theme)).toBe('dark');
      expect(localStorage.getItem('cvelocity-theme')).toBeNull();
    });

    it('vault profilowy spod skillvault_vault_active_<id> ląduje pod vaultKeyFor(<id>)', () => {
      const profileId = 'profile-xyz';
      const legacyVaultKey = `skillvault_vault_active_${profileId}`;
      const newVaultKey = vaultKeyFor(profileId);

      const vaultData = JSON.stringify({ name: 'Jan', skills: ['TS'] });
      localStorage.setItem(legacyVaultKey, vaultData);

      migrateLegacyKeys();

      expect(localStorage.getItem(newVaultKey)).toBe(vaultData);
      expect(localStorage.getItem(legacyVaultKey)).toBeNull();
    });

    it('nie nadpisuje vaulta profilowego jeśli pod nowym kluczem już istnieją dane', () => {
      const profileId = 'profile-xyz';
      const legacyVaultKey = `skillvault_vault_active_${profileId}`;
      const newVaultKey = vaultKeyFor(profileId);

      localStorage.setItem(legacyVaultKey, '{"version":"stara"}');
      localStorage.setItem(newVaultKey, '{"version":"nowa"}');

      migrateLegacyKeys();

      expect(localStorage.getItem(newVaultKey)).toBe('{"version":"nowa"}');
      expect(localStorage.getItem(legacyVaultKey)).toBeNull();
    });

    it('pozostałości skillvault_users_db_v1 i skillvault_master_vault_enc_v2 są usuwane bezwarunkowo', () => {
      localStorage.setItem('skillvault_users_db_v1', '[{"user":"test"}]');
      localStorage.setItem('skillvault_master_vault_enc_v2', '{"enc":"secret"}');

      migrateLegacyKeys();

      expect(localStorage.getItem('skillvault_users_db_v1')).toBeNull();
      expect(localStorage.getItem('skillvault_master_vault_enc_v2')).toBeNull();
    });
  });

  describe('wipeAppStorage', () => {
    it('usuwa klucze cvelocity:* i skillvault*, zachowuje StorageKeys.theme, nie rusza klucza obcego', () => {
      localStorage.setItem(StorageKeys.theme, 'dark');
      localStorage.setItem(StorageKeys.profile, '{"id":"p1"}');
      localStorage.setItem(StorageKeys.vault, '{"vault":"v1"}');
      localStorage.setItem('skillvault_custom_key', 'legacy-data');
      localStorage.setItem('foreign_app:setting', 'keep-me');

      wipeAppStorage();

      expect(localStorage.getItem(StorageKeys.theme)).toBe('dark');
      expect(localStorage.getItem(StorageKeys.profile)).toBeNull();
      expect(localStorage.getItem(StorageKeys.vault)).toBeNull();
      expect(localStorage.getItem('skillvault_custom_key')).toBeNull();
      expect(localStorage.getItem('foreign_app:setting')).toBe('keep-me');
    });

    it('poprawnie usuwa wiele kluczy naraz bez problemu przesuwania indeksów w pętli', () => {
      // Pętla pobierająca klucze zbiera je do tablicy przed usunięciem,
      // żeby usuwanie w trakcie iteracji po localStorage.key(i) nie pomijało kluczy.
      for (let i = 1; i <= 20; i++) {
        localStorage.setItem(`cvelocity:key_${i}`, `val_${i}`);
        localStorage.setItem(`skillvault_key_${i}`, `val_${i}`);
      }
      localStorage.setItem(StorageKeys.theme, 'dark');
      localStorage.setItem('foreign:1', 'stay');

      wipeAppStorage();

      for (let i = 1; i <= 20; i++) {
        expect(localStorage.getItem(`cvelocity:key_${i}`)).toBeNull();
        expect(localStorage.getItem(`skillvault_key_${i}`)).toBeNull();
      }
      expect(localStorage.getItem(StorageKeys.theme)).toBe('dark');
      expect(localStorage.getItem('foreign:1')).toBe('stay');
    });

    it('nie rzuca błędu i zachowuje się bezpiecznie przy braku localStorage', () => {
      (globalThis as { localStorage?: unknown }).localStorage = undefined;

      expect(() => wipeAppStorage()).not.toThrow();
    });

    it('powiadamia subskrybentów dopiero po usunięciu kluczy', () => {
      localStorage.setItem(StorageKeys.applications, '["a1"]');

      const widziane: Array<string | null> = [];
      const odpnij = onAppStorageWiped(() => {
        // Subskrybent (sklep resetujący swoją kopię w pamięci) musi zobaczyć
        // schowek po wymazaniu, nie przed.
        widziane.push(localStorage.getItem(StorageKeys.applications));
      });
      try {
        wipeAppStorage();
      } finally {
        odpnij();
      }

      expect(widziane).toEqual([null]);
    });
  });
});
