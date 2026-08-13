import CryptoJS from 'crypto-js';
import { MasterVault } from '../types';

/**
 * LOKALNY MAGAZYN MASTER VAULT — DANE SĄ SZYFROWANE AES-256
 *
 * Klucz vaulta jest przechowywany tymczasowo w sessionStorage pod kluczem
 * 'skillvault_local_session_key' (generowany przy pierwszej wizycie).
 * Zapobiega to wyciekowi jawnego tekstu z localStorage w przypadku ataków XSS.
 */

const STORAGE_KEY = 'skillvault_master_vault_enc_v2';
const SESSION_KEY_NAME = 'skillvault_local_session_key';

/** Kształt zapisu używany przez starsze wersje: { v: 1, raw: "<json>" }. */
interface LegacyEnvelope {
  v?: number;
  raw?: string;
}

/**
 * Pobiera lub generuje klucz sesji dla lokalnego nieautoryzowanego szyfrowania.
 */
export function getOrCreateLocalSessionKey(): string {
  if (typeof window === 'undefined') return '';
  let key = sessionStorage.getItem(SESSION_KEY_NAME);
  if (!key) {
    key = CryptoJS.lib.WordArray.random(256 / 8).toString();
    sessionStorage.setItem(SESSION_KEY_NAME, key);
  }
  return key;
}

/**
 * Odczytuje vault z dowolnego formatu, jaki mógł trafić do localStorage:
 * surowy obiekt, koperta `{v:1, raw}` z poprzednich wersji, zaszyfrowana wersja lub nic.
 */
export function parseStoredVault(serialized: string, key?: string): MasterVault | null {
  try {
    const trimmed = serialized.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed) as MasterVault | LegacyEnvelope;
      if (parsed && typeof (parsed as LegacyEnvelope).raw === 'string') {
        return JSON.parse((parsed as LegacyEnvelope).raw as string) as MasterVault;
      }
      return parsed as MasterVault;
    }

    // Jeśli dane nie zaczynają się od '{', traktujemy je jako zaszyfrowane AES
    if (!key) return null;
    const bytes = CryptoJS.AES.decrypt(serialized, key);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return null;
    return JSON.parse(decryptedText) as MasterVault;
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
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  const key = sessionStorage.getItem(SESSION_KEY_NAME);
  return parseStoredVault(stored, key || undefined);
}

export function clearVaultLocalStorage(userId?: string): void {
  const key = userId ? `sv_${userId}_vault` : STORAGE_KEY;
  localStorage.removeItem(key);
}
