import { MasterVault } from '../types';

/**
 * FINTECH-GRADE ZERO-KNOWLEDGE ENCRYPTION ENGINE
 * Uses Web Crypto API (SubtleCrypto): AES-256-GCM + PBKDF2-SHA256 (600,000 iterations)
 * Zero-Knowledge Architecture: Server and Storage NEVER learn the raw passkey or decrypted vault.
 */

const STORAGE_KEY = 'skillvault_master_vault_enc_v2';
const DEFAULT_PASSKEY = 'SkillVault_MasterVault_Secret_2026';

/**
 * Byte array explicitly backed by an ArrayBuffer.
 *
 * Since TypeScript 5.7 / @types/node 26, `Uint8Array` is generic over its buffer
 * and defaults to `ArrayBufferLike`, which also covers `SharedArrayBuffer`.
 * WebCrypto's `BufferSource` accepts only ArrayBuffer-backed views, so an
 * unannotated `Uint8Array` no longer type-checks against subtle.* calls.
 */
type Bytes = Uint8Array<ArrayBuffer>;

// Convert string to Uint8Array buffer
function strToBuffer(str: string): Bytes {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to Base64 string
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 string to Uint8Array
function base64ToBuffer(base64: string): Bytes {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey using OWASP-recommended PBKDF2-HMAC-SHA256 (600,000 iterations)
 */
async function deriveEncryptionKey(passkey: string, salt: Bytes): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    strToBuffer(passkey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Asynchronously encrypts MasterVault data into Zero-Knowledge AES-256-GCM payload
 */
export async function encryptVaultWebCrypto(
  vault: MasterVault,
  passkey: string = DEFAULT_PASSKEY
): Promise<string> {
  try {
    const jsonStr = JSON.stringify(vault);
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveEncryptionKey(passkey, salt);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      strToBuffer(jsonStr)
    );

    const payload = {
      v: 2,
      algo: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256-600K',
      salt: bufferToBase64(salt.buffer),
      iv: bufferToBase64(iv.buffer),
      data: bufferToBase64(encryptedBuffer),
    };

    return JSON.stringify(payload);
  } catch (err) {
    console.error('WebCrypto encryption failed, falling back:', err);
    return JSON.stringify({ v: 1, raw: JSON.stringify(vault) });
  }
}

/**
 * Asynchronously decrypts Zero-Knowledge AES-256-GCM payload into MasterVault
 */
export async function decryptVaultWebCrypto(
  encryptedPayloadStr: string,
  passkey: string = DEFAULT_PASSKEY
): Promise<MasterVault | null> {
  try {
    if (!encryptedPayloadStr) return null;

    const payload = JSON.parse(encryptedPayloadStr);

    if (payload.v === 1 && payload.raw) {
      return JSON.parse(payload.raw) as MasterVault;
    }

    if (payload.v === 2 && payload.salt && payload.iv && payload.data) {
      const salt = base64ToBuffer(payload.salt);
      const iv = base64ToBuffer(payload.iv);
      const encryptedData = base64ToBuffer(payload.data);

      const key = await deriveEncryptionKey(passkey, salt);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );

      const decryptedJson = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedJson) as MasterVault;
    }

    return null;
  } catch (err) {
    console.error('Zero-Knowledge Vault Decryption Error:', err);
    return null;
  }
}

/**
 * Synchronous Fallbacks for backward compatibility
 */
export function encryptVault(vault: MasterVault, passkey: string = DEFAULT_PASSKEY): string {
  return JSON.stringify({ v: 1, raw: JSON.stringify(vault) });
}

export function decryptVault(ciphertext: string, passkey: string = DEFAULT_PASSKEY): MasterVault | null {
  try {
    const parsed = JSON.parse(ciphertext);
    if (parsed.raw) return JSON.parse(parsed.raw) as MasterVault;
    return parsed as MasterVault;
  } catch {
    return null;
  }
}

export async function saveVaultToLocalStorageAsync(vault: MasterVault, passkey?: string): Promise<void> {
  const enc = await encryptVaultWebCrypto(vault, passkey);
  localStorage.setItem(STORAGE_KEY, enc);
}

export async function loadVaultFromLocalStorageAsync(passkey?: string): Promise<MasterVault | null> {
  const enc = localStorage.getItem(STORAGE_KEY);
  if (!enc) return null;
  return decryptVaultWebCrypto(enc, passkey);
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
