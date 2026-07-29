// User Authentication & Crypto Storage Module for SkillVault
import CryptoJS from 'crypto-js';
import { MasterVault } from '../types';
import { INITIAL_SAMPLE_VAULT, createEmptyVault } from './sampleVault';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
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
 * Authenticate existing user with email and password
 */
export function loginUser(email: string, password: string): { user: UserAccount; vault: MasterVault } {
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

  // Update last login timestamp
  foundUser.lastLoginAt = new Date().toISOString();
  saveRegisteredUsers(users);

  saveActiveSession(foundUser);

  const vault = loadUserVault(foundUser.id, password) || createEmptyVault(foundUser.fullName, foundUser.email);

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
