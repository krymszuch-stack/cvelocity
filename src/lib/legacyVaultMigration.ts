import { MasterVault } from '../types';

/**
 * One-time upgrade path from the pre-Firestore localStorage-only persistence model.
 *
 * Deliberately self-contained (doesn't import the old auth.ts/vaultCrypto.ts, which this
 * migration replaces) — it only reads plain, already-unencrypted JSON that those modules
 * used to write, matching on email since the old local user id and the new Firebase uid
 * are different values for the same person.
 */

const LEGACY_USERS_KEY = 'skillvault_users_db_v1';
const LEGACY_GUEST_VAULT_KEY = 'skillvault_master_vault_enc_v2';

interface LegacyUserRecord {
  id: string;
  email: string;
}

function readLegacyVaultByLocalId(localId: string): MasterVault | null {
  try {
    const raw = localStorage.getItem(`sv_${localId}_vault`);
    if (!raw) return null;
    return JSON.parse(raw) as MasterVault;
  } catch {
    return null;
  }
}

function isVaultWorthMigrating(vault: MasterVault | null): vault is MasterVault {
  if (!vault) return false;
  // Skip a vault that's just the empty starting state — nothing to bring over.
  return Boolean(
    vault.personalInfo?.fullName ||
    vault.personalInfo?.summary ||
    (vault.history?.length ?? 0) > 0 ||
    (vault.education?.length ?? 0) > 0 ||
    (vault.skillsMatrix?.hardSkills?.length ?? 0) > 0
  );
}

/**
 * Looks for pre-migration local data belonging to this email: first a per-account vault
 * (registered/OAuth user), then the shared guest vault as a fallback. Returns null when
 * there's nothing worth bringing forward.
 */
export function findLegacyVaultForEmail(email: string): MasterVault | null {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const rawUsers = localStorage.getItem(LEGACY_USERS_KEY);
    if (rawUsers) {
      const users = JSON.parse(rawUsers) as LegacyUserRecord[];
      const match = users.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (match) {
        const perUserVault = readLegacyVaultByLocalId(match.id);
        if (isVaultWorthMigrating(perUserVault)) return perUserVault;
      }
    }
  } catch {
    // Corrupt/legacy-shaped data — fall through to the guest vault check.
  }

  try {
    const rawGuest = localStorage.getItem(LEGACY_GUEST_VAULT_KEY);
    if (rawGuest) {
      const guestVault = JSON.parse(rawGuest) as MasterVault;
      if (isVaultWorthMigrating(guestVault)) return guestVault;
    }
  } catch {
    // Nothing usable.
  }

  return null;
}

/** Clears everything this migration reads, once it's no longer needed. */
export function clearLegacyLocalData(): void {
  try {
    localStorage.removeItem(LEGACY_GUEST_VAULT_KEY);
    const rawUsers = localStorage.getItem(LEGACY_USERS_KEY);
    if (rawUsers) {
      const users = JSON.parse(rawUsers) as LegacyUserRecord[];
      users.forEach((u) => localStorage.removeItem(`sv_${u.id}_vault`));
    }
  } catch {
    // Best-effort cleanup only.
  }
}
