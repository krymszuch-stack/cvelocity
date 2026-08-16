// User Authentication & Crypto Storage Module for SkillVault
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

const USERS_STORAGE_KEY = 'skillvault_users_db_v1';
const CURRENT_SESSION_KEY = 'skillvault_active_session_v1';

/**
 * Generate a salt for hashing
 */
function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

/**
 * Hash password securely using SHA-256 with salt
 */
function hashPassword(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000,
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
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
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
  const passwordHash = hashPassword(password, salt);

  const newUser: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    email: normalizedEmail,
    fullName: fullName.trim() || 'Użytkownik SkillVault',
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveRegisteredUsers(users);

  // Initialize clean personal vault for this new user without sample placeholders
  const initialVault: MasterVault = createEmptyVault(newUser.fullName, newUser.email);

  saveUserVault(newUser.id, initialVault, password);
  saveActiveSession(newUser);

  return { user: newUser, initialVault };
}

/**
 * Verifies email + password WITHOUT starting a session. Split out from loginUser so that
 * accounts with 2FA enabled can be challenged for a TOTP code before the session actually starts.
 */
export function verifyPasswordCredentials(email: string, password: string): UserAccount {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  const foundUser = users.find((u) => u.email === normalizedEmail);

  if (!foundUser) {
    throw new Error('Nie znaleziono konta dla podanego adresu email.');
  }

  const computedHash = hashPassword(password, foundUser.salt);
  if (computedHash !== foundUser.passwordHash) {
    throw new Error('Nieprawidłowe hasło.');
  }

  return foundUser;
}

/**
 * Finalizes a login: starts the session and loads the vault. Call after
 * verifyPasswordCredentials (and, if the account has 2FA enabled, after the TOTP
 * code has been verified separately via verifyTwoFactorToken).
 */
export function completeLogin(user: UserAccount, password?: string): { user: UserAccount; vault: MasterVault } {
  const users = getRegisteredUsers();
  const foundUser = users.find((u) => u.id === user.id) || user;

  foundUser.lastLoginAt = new Date().toISOString();
  saveRegisteredUsers(users);
  saveActiveSession(foundUser);

  const vault = (password && loadUserVault(foundUser.id, password)) || createEmptyVault(foundUser.fullName, foundUser.email);

  return { user: foundUser, vault };
}

/**
 * Authenticate existing user with email and password in one step.
 * Throws Requires2FA if the account has 2FA enabled — callers should catch it,
 * collect a TOTP code, then call completeLogin() themselves once verified.
 */
export function loginUser(email: string, password: string): { user: UserAccount; vault: MasterVault } {
  const foundUser = verifyPasswordCredentials(email, password);

  if (foundUser.twoFactorEnabled) {
    throw new Requires2FAError(foundUser);
  }

  return completeLogin(foundUser, password);
}

/** Thrown by loginUser when the account requires a TOTP code before the session can start. */
export class Requires2FAError extends Error {
  user: UserAccount;
  constructor(user: UserAccount) {
    super('Wymagany kod 2FA.');
    this.name = 'Requires2FAError';
    this.user = user;
  }
}

/**
 * Enable 2FA for a user account, storing the (already user-confirmed) TOTP secret.
 */
export function enableTwoFactor(userId: string, secret: string): void {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('Nie znaleziono konta.');
  user.twoFactorEnabled = true;
  user.twoFactorSecret = secret;
  saveRegisteredUsers(users);
  saveActiveSession(user);
}

/**
 * Disable 2FA for a user account.
 */
export function disableTwoFactor(userId: string): void {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('Nie znaleziono konta.');
  user.twoFactorEnabled = false;
  delete user.twoFactorSecret;
  saveRegisteredUsers(users);
  saveActiveSession(user);
}

/**
 * Authenticate or register a user via OAuth (Google / Microsoft)
 */
export function loginWithOAuthAccount(email: string, fullName: string, provider: 'google'): { user: UserAccount; vault: MasterVault } {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  let foundUser = users.find((u) => u.email === normalizedEmail);

  if (!foundUser) {
    const salt = generateSalt();
    const passwordHash = hashPassword(`oauth_${provider}_${Date.now()}`, salt);

    foundUser = {
      id: `user_${provider}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email: normalizedEmail,
      fullName: fullName.trim() || 'Użytkownik Google',
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    users.push(foundUser);
    saveRegisteredUsers(users);

    const initialVault: MasterVault = createEmptyVault(foundUser.fullName, foundUser.email);
    saveUserVault(foundUser.id, initialVault, 'oauth_secret');
    saveActiveSession(foundUser);
    return { user: foundUser, vault: initialVault };
  }

  foundUser.lastLoginAt = new Date().toISOString();
  saveRegisteredUsers(users);
  saveActiveSession(foundUser);

  const vault = loadUserVault(foundUser.id) || createEmptyVault(foundUser.fullName, foundUser.email);
  return { user: foundUser, vault };
}

/**
 * Save active session
 */
export function saveActiveSession(user: UserAccount): void {
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(user));
}

/**
 * Get active session user
 */
export function getActiveSessionUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
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
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

/**
 * Save encrypted vault for specific user
 */
export function saveUserVault(userId: string, vault: MasterVault, userSecret: string): void {
  const storageKey = `skillvault_vault_encrypted_${userId}`;
  const encrypted = encryptUserVault(vault, userSecret);
  localStorage.setItem(storageKey, encrypted);

  // Also save a unencrypted backup key for fast seamless app state if unlocked
  localStorage.setItem(`skillvault_vault_active_${userId}`, JSON.stringify(vault));
}

/**
 * Load vault for specific user
 */
export function loadUserVault(userId: string, userSecret?: string): MasterVault | null {
  const activeKey = `skillvault_vault_active_${userId}`;
  const encryptedKey = `skillvault_vault_encrypted_${userId}`;

  // Try loading unencrypted active session cache first
  const cached = localStorage.getItem(activeKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // fallback to decrypting
    }
  }

  if (userSecret) {
    const encrypted = localStorage.getItem(encryptedKey);
    if (encrypted) {
      return decryptUserVault(encrypted, userSecret);
    }
  }

  return null;
}

/**
 * Permanently delete a user account and ALL associated data from localStorage
 */
export function deleteUserAccount(userId: string): void {
  // Remove user's encrypted vault
  localStorage.removeItem(`skillvault_vault_encrypted_${userId}`);
  // Remove user's active vault cache
  localStorage.removeItem(`skillvault_vault_active_${userId}`);
  // Remove active session
  localStorage.removeItem(CURRENT_SESSION_KEY);
  // Remove user from registered users list
  const users = getRegisteredUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveRegisteredUsers(filtered);
  // Remove global vault cache
  localStorage.removeItem('skillvault_master_vault_enc');
}

