import CryptoJS from 'crypto-js';
import { MasterVault } from '../types';

const STORAGE_KEY = 'skillvault_master_vault_enc';
const DEFAULT_SECRET = 'SkillVault_MasterVault_Secret_2026';

export function encryptVault(vault: MasterVault, passkey: string = DEFAULT_SECRET): string {
  const jsonStr = JSON.stringify(vault);
  return CryptoJS.AES.encrypt(jsonStr, passkey).toString();
}

export function decryptVault(ciphertext: string, passkey: string = DEFAULT_SECRET): MasterVault | null {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, passkey);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedData) return null;
    return JSON.parse(decryptedData) as MasterVault;
  } catch (err) {
    console.error('Vault decryption error:', err);
    return null;
  }
}

export function saveVaultToLocalStorage(vault: MasterVault, passkey?: string): void {
  const enc = encryptVault(vault, passkey);
  localStorage.setItem(STORAGE_KEY, enc);
}

export function loadVaultFromLocalStorage(passkey?: string): MasterVault | null {
  const enc = localStorage.getItem(STORAGE_KEY);
  if (!enc) return null;
  return decryptVault(enc, passkey);
}

export function clearVaultLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
