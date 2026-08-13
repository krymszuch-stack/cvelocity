import { MasterVault } from '../types';

/**
 * LOKALNY MAGAZYN MASTER VAULT — DANE NIE SĄ SZYFROWANE
 *
 * Uwaga, celowo napisane wprost: vault trafia do localStorage jako zwykły JSON.
 *
 * Wcześniej ten plik deklarował „fintech-grade zero-knowledge AES-256-GCM", ale
 * funkcja `encryptVault(vault, passkey)` ignorowała hasło i zwracała jawny tekst,
 * a jedyna realna implementacja AES nie była wywoływana przez nikogo. Deklaracja
 * była nieprawdziwa, więc została usunięta razem z atrapami — zamiast udawać
 * szyfrowanie, które i tak działałoby na kluczu zaszytym w bundlu JS.
 *
 * Jeśli w przyszłości ma powstać prawdziwe szyfrowanie, klucz musi pochodzić
 * od użytkownika (hasło + PBKDF2), a nie ze stałej w kodzie. Poprzednia
 * implementacja WebCrypto jest do odzyskania z historii gita.
 */

const STORAGE_KEY = 'cvelocity_master_vault_enc_v2';
const LEGACY_STORAGE_KEY = 'legacy_master_vault_enc_v2';
const LEGACY_STORAGE_KEY_V1 = 'legacy_master_vault_enc';

/** Kształt zapisu używany przez starsze wersje: { v: 1, raw: "<json>" }. */
interface LegacyEnvelope {
  v?: number;
  raw?: string;
}

/**
 * Odczytuje vault z dowolnego formatu, jaki mógł trafić do localStorage:
 * surowy obiekt, koperta `{v:1, raw}` z poprzednich wersji, albo nic.
 */
export function parseStoredVault(serialized: string): MasterVault | null {
  try {
    const parsed = JSON.parse(serialized) as MasterVault | LegacyEnvelope;

    if (parsed && typeof (parsed as LegacyEnvelope).raw === 'string') {
      return JSON.parse((parsed as LegacyEnvelope).raw as string) as MasterVault;
    }

    return parsed as MasterVault;
  } catch {
    return null;
  }
}

export function saveVaultToLocalStorage(vault: MasterVault, userId?: string): void {
  const key = userId ? `sv_${userId}_vault` : STORAGE_KEY;
  localStorage.setItem(key, JSON.stringify(vault));
}

export function loadVaultFromLocalStorage(userId?: string): MasterVault | null {
  const key = userId ? `sv_${userId}_vault` : STORAGE_KEY;
  const stored = localStorage.getItem(key) || localStorage.getItem(LEGACY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY_V1);
  if (!stored) return null;
  return parseStoredVault(stored);
}

export function clearVaultLocalStorage(userId?: string): void {
  const key = userId ? `sv_${userId}_vault` : STORAGE_KEY;
  localStorage.removeItem(key);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
}
