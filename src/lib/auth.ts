// User Authentication & Crypto Storage Module for CVELOCITY
import CryptoJS from 'crypto-js';
import { MasterVault } from '../types';
import { createEmptyVault } from './sampleVault';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string; // base32 TOTP secret, only present when twoFactorEnabled is true
}

export interface SafeUserSession {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastLoginAt: string;
  twoFactorEnabled?: boolean;
}

const USERS_STORAGE_KEY = 'cvelocity_users_db_v1';
const LEGACY_USERS_STORAGE_KEY = 'cvelocity_legacy_users_db_v1';
const CURRENT_SESSION_KEY = 'cvelocity_active_session_v1';
const LEGACY_CURRENT_SESSION_KEY = 'cvelocity_legacy_active_session_v1';

/**
 * Generate a salt for hashing
 */
function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

/**
 * Hash password securely using PBKDF2 with SHA-256 with 600,000 iterations (OWASP compliant)
 */
function hashPassword(password: string, salt: string, iterations: number = 600000): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: iterations,
    hasher: CryptoJS.algo.SHA256,
  }).toString();
}

/**
 * Encrypt vault data with user's specific key
 */
export function encryptUserVault(vault: MasterVault, secretKey: string): string {
  const json = JSON.stringify(vault);
  return CryptoJS.AES.encrypt(json, secretKey).toString();
}

/**
 * Decrypt vault data with user's specific key
 */
export function decryptUserVault(encryptedData: string, secretKey: string): MasterVault | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return null;
    return JSON.parse(decryptedText);
  } catch (err) {
    console.error('Failed to decrypt user vault:', err);
    return null;
  }
}

/**
 * Get all registered accounts from localStorage
 */
export function getRegisteredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(LEGACY_USERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

/**
 * Save user list
 */
function saveRegisteredUsers(users: UserAccount[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Register a new user account
 */
export function registerUser(email: string, password: string, fullName: string): { user: UserAccount; initialVault: MasterVault } {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();

  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error('Konto z tym adresem email już istnieje.');
  }

  if (password.length < 6) {
    throw new Error('Hasło musi zawierać co najmniej 6 znaków.');
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt, 600000);

  const newUser: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    email: normalizedEmail,
    fullName: fullName.trim(),
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveRegisteredUsers(users);

  const initialVault = createEmptyVault(fullName, normalizedEmail);
  saveUserVault(newUser.id, initialVault, password);
  saveActiveSession(newUser);

  return { user: newUser, initialVault };
}

/**
 * Custom error thrown when 2FA code is required
 */
export class Requires2FAError extends Error {
  user: UserAccount;
  constructor(user: UserAccount) {
    super('Wymagana weryfikacja 2FA.');
    this.name = 'Requires2FAError';
    this.user = user;
  }
}

/**
 * Login user with email & password
 */
export function loginUser(email: string, password: string): { user: UserAccount; vault: MasterVault } {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  const foundUser = users.find((u) => u.email === normalizedEmail);

  if (!foundUser) {
    throw new Error('Nieprawidłowy adres email lub hasło.');
  }

  // Check 600,000 iterations (SHA256) first, then fallback to legacy 1,000 iterations for migration
  const isMatch600k = hashPassword(password, foundUser.salt, 600000) === foundUser.passwordHash;
  const isMatchLegacy = !isMatch600k && (
    hashPassword(password, foundUser.salt, 1000) === foundUser.passwordHash ||
    CryptoJS.PBKDF2(password, foundUser.salt, { keySize: 256 / 32, iterations: 1000 }).toString() === foundUser.passwordHash
  );

  if (!isMatch600k && !isMatchLegacy) {
    throw new Error('Nieprawidłowy adres email lub hasło.');
  }

  // If matched with legacy iterations, automatically upgrade account hash to 600k
  if (isMatchLegacy) {
    foundUser.passwordHash = hashPassword(password, foundUser.salt, 600000);
    saveRegisteredUsers(users);
  }

  if (foundUser.twoFactorEnabled) {
    throw new Requires2FAError(foundUser);
  }

  foundUser.lastLoginAt = new Date().toISOString();
  saveRegisteredUsers(users);
  saveActiveSession(foundUser);

  const vault = loadUserVault(foundUser.id, password) || createEmptyVault(foundUser.fullName, foundUser.email);
  return { user: foundUser, vault };
}

/**
 * Login or Register with Google OAuth
 */
export function loginWithOAuthAccount(email: string, fullName: string, _provider: 'google'): { user: UserAccount; vault: MasterVault } {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  let foundUser = users.find((u) => u.email === normalizedEmail);

  if (!foundUser) {
    const salt = generateSalt();
    const passwordHash = hashPassword(`oauth_${Date.now()}_${Math.random()}`, salt, 600000);

    foundUser = {
      id: `user_oauth_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email: normalizedEmail,
      fullName: fullName.trim() || 'Użytkownik Google',
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    users.push(foundUser);
    saveRegisteredUsers(users);
  } else {
    foundUser.lastLoginAt = new Date().toISOString();
    if (fullName && fullName !== 'Użytkownik Google') {
      foundUser.fullName = fullName;
    }
    saveRegisteredUsers(users);
  }

  saveActiveSession(foundUser);
  const vault = loadUserVault(foundUser.id) || createEmptyVault(foundUser.fullName, foundUser.email);
  return { user: foundUser, vault };
}

/**
 * Enable 2FA for account
 */
export function enableTwoFactor(userId: string, secret: string): void {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;
    saveRegisteredUsers(users);

    const activeUser = getActiveSessionUser();
    if (activeUser && activeUser.id === userId) {
      saveActiveSession(user);
    }
  }
}

/**
 * Disable 2FA for account (requires password or TOTP verification for security - ADR-101)
 */
export function disableTwoFactor(userId: string, verificationPassword?: string): void {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('Użytkownik nie został odnaleziony.');
  }

  if (verificationPassword) {
    const isMatch600k = hashPassword(verificationPassword, user.salt, 600000) === user.passwordHash;
    const isMatchLegacy = !isMatch600k && (hashPassword(verificationPassword, user.salt, 1000) === user.passwordHash);
    if (!isMatch600k && !isMatchLegacy) {
      throw new Error('Podane hasło jest nieprawidłowe. Weryfikacja tożsamości nie powiodła się.');
    }
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  saveRegisteredUsers(users);

  const activeUser = getActiveSessionUser();
  if (activeUser && activeUser.id === userId) {
    saveActiveSession(user);
  }
}

/**
 * Complete 2FA login after TOTP verification
 */
export function completeLogin(pendingUser: UserAccount, password?: string): { user: UserAccount; vault: MasterVault } {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === pendingUser.id) || pendingUser;

  user.lastLoginAt = new Date().toISOString();
  saveRegisteredUsers(users);
  saveActiveSession(user);

  const vault = loadUserVault(user.id, password) || createEmptyVault(user.fullName, user.email);
  return { user, vault };
}

/**
 * Save active session without leaking sensitive credentials into localStorage (ADR-101)
 */
export function saveActiveSession(user: UserAccount): void {
  const safeSession: SafeUserSession = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    twoFactorEnabled: !!user.twoFactorEnabled,
  };
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(safeSession));
}

/**
 * Get active session user
 */
export function getActiveSessionUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY) || localStorage.getItem(LEGACY_CURRENT_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Logout active session
 */
export function logoutUser(): void {
  const activeUser = getActiveSessionUser();
  if (activeUser) {
    delete IN_MEMORY_VAULT_CACHE[activeUser.id];
  }
  localStorage.removeItem(CURRENT_SESSION_KEY);
  localStorage.removeItem(LEGACY_CURRENT_SESSION_KEY);
}

/**
* In-memory cache for the current session only; we intentionally avoid a plaintext localStorage snapshot
* because a browser-stored, unencrypted vault can be read by any script with access to the origin.
*/
const IN_MEMORY_VAULT_CACHE: Record<string, MasterVault> = {};

/**
 * Save encrypted vault for specific user
 */
export function saveUserVault(userId: string, vault: MasterVault, userSecret?: string): void {
  const storageKey = `cvelocity_vault_encrypted_${userId}`;
  const legacyStorageKey = `skillvault_vault_encrypted_${userId}`;

  if (userSecret) {
    const encrypted = encryptUserVault(vault, userSecret);
    localStorage.setItem(storageKey, encrypted);
  } else {
    localStorage.removeItem(storageKey);
  }

  localStorage.removeItem(legacyStorageKey);
  localStorage.removeItem(`cvelocity_vault_active_${userId}`);
  localStorage.removeItem(`skillvault_vault_active_${userId}`);
  IN_MEMORY_VAULT_CACHE[userId] = vault;
}

/**
 * Load vault for specific user
 */
export function loadUserVault(userId: string, userSecret?: string): MasterVault | null {
  const memoryVault = IN_MEMORY_VAULT_CACHE[userId];
  if (memoryVault) {
    return memoryVault;
  }

  const encryptedKey = `cvelocity_vault_encrypted_${userId}`;
  const legacyKey = `skillvault_vault_encrypted_${userId}`;
  if (!userSecret) {
    return null;
  }

  const encrypted = localStorage.getItem(encryptedKey) || localStorage.getItem(legacyKey);
  if (!encrypted) {
    return null;
  }

  const decrypted = decryptUserVault(encrypted, userSecret);
  if (decrypted) {
    IN_MEMORY_VAULT_CACHE[userId] = decrypted;
  }

  return decrypted;
}

/**
 * Permanently delete a user account and ALL associated data from localStorage
 */
export function deleteUserAccount(userId: string): void {
  delete IN_MEMORY_VAULT_CACHE[userId];
  localStorage.removeItem(`cvelocity_vault_encrypted_${userId}`);
  localStorage.removeItem(`skillvault_vault_encrypted_${userId}`);
  localStorage.removeItem(`cvelocity_vault_active_${userId}`);
  localStorage.removeItem(`skillvault_vault_active_${userId}`);
  localStorage.removeItem(CURRENT_SESSION_KEY);
  localStorage.removeItem(LEGACY_CURRENT_SESSION_KEY);

  const users = getRegisteredUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveRegisteredUsers(filtered);
  localStorage.removeItem('cvelocity_master_vault_enc_v2');
  localStorage.removeItem('legacy_master_vault_enc_v2');
  localStorage.removeItem('legacy_master_vault_enc');
}
