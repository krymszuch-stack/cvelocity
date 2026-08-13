import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AuthUserInfo,
  isFirebaseConfigured,
  onAuthChange,
  registerWithEmail,
  signInWithEmail,
  signInWithGooglePopup,
  signOutFirebaseUser,
  deleteCurrentFirebaseUser,
} from '../lib/firebaseClient';
import { loadVaultFromFirestore, saveVaultToFirestore, deleteVaultFromFirestore } from '../lib/firestoreVault';
import { findLegacyVaultForEmail, clearLegacyLocalData } from '../lib/legacyVaultMigration';
import { createEmptyVault } from '../lib/sampleVault';
import { MasterVault } from '../types';

interface AuthContextType {
  user: AuthUserInfo | null;
  isAuthenticated: boolean;
  /** True until the first Firebase Auth state resolves — avoids flashing the sign-in screen. */
  authLoading: boolean;
  /** False when VITE_FIREBASE_* env vars aren't set — nothing here will work without them. */
  firebaseConfigured: boolean;
  userVault: MasterVault | null;
  /** True while the vault is being fetched/migrated right after sign-in. */
  vaultLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName: string) => Promise<void>;
  loginOAuth: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  saveCurrentVault: (vault: MasterVault) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Strips characters that don't belong in personal-info fields before anything gets saved. */
function sanitizeVault(vault: MasterVault): MasterVault {
  const strip = (value: string | undefined) => (value || '').replace(/<[^>]+>/g, '').trim();
  const p = vault.personalInfo;
  const cleaned = {
    fullName: strip(p.fullName),
    email: strip(p.email),
    phone: strip(p.phone),
    location: strip(p.location),
  };
  const changed = cleaned.fullName !== p.fullName
    || cleaned.email !== p.email
    || cleaned.phone !== p.phone
    || cleaned.location !== p.location;
  return changed ? { ...vault, personalInfo: { ...p, ...cleaned } } : vault;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userVault, setUserVault] = useState<MasterVault | null>(null);
  const [vaultLoading, setVaultLoading] = useState(false);
  const activeUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // No VITE_FIREBASE_* env vars — calling any Firebase Auth API throws
      // (auth/invalid-api-key) instead of resolving, which would otherwise leave
      // the app stuck on the loading screen with no explanation. Fail visibly instead.
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthChange((nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);

      if (!nextUser) {
        activeUidRef.current = null;
        setUserVault(null);
        return;
      }

      // Guard against a slower, stale load resolving after a newer sign-in/out.
      activeUidRef.current = nextUser.uid;
      setVaultLoading(true);

      void (async () => {
        let vault = await loadVaultFromFirestore(nextUser.uid);

        if (!vault) {
          const legacyVault = findLegacyVaultForEmail(nextUser.email);
          vault = legacyVault || createEmptyVault(nextUser.displayName, nextUser.email);
          await saveVaultToFirestore(nextUser.uid, vault);
          if (legacyVault) clearLegacyLocalData();
        }

        if (activeUidRef.current === nextUser.uid) {
          setUserVault(vault);
          setVaultLoading(false);
        }
      })();
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    await signInWithEmail(email, pass);
  }, []);

  const register = useCallback(async (email: string, pass: string, fullName: string) => {
    await registerWithEmail(email, pass, fullName);
  }, []);

  const loginOAuth = useCallback(async () => {
    await signInWithGooglePopup();
  }, []);

  const logout = useCallback(async () => {
    await signOutFirebaseUser();
    try {
      sessionStorage.clear();
    } catch (e) {
      // Ignore if sessionStorage is not accessible (e.g. privacy mode)
    }
    try {
      clearLegacyLocalData();
    } catch (e) {
      // Ignore
    }
    activeUidRef.current = null;
    setUser(null);
    setUserVault(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    // Delete the Firestore doc first — it needs the still-valid auth session (rules check
    // request.auth.uid), which disappears the moment the Firebase Auth user itself is deleted.
    await deleteVaultFromFirestore(user.uid);
    await deleteCurrentFirebaseUser(user.email);
  }, [user]);

  const saveCurrentVault = useCallback(async (vault: MasterVault) => {
    if (!user) return;
    const sanitized = sanitizeVault(vault);
    await saveVaultToFirestore(user.uid, sanitized);
    setUserVault(sanitized);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      authLoading,
      firebaseConfigured: isFirebaseConfigured(),
      userVault,
      vaultLoading,
      login,
      register,
      loginOAuth,
      logout,
      deleteAccount,
      saveCurrentVault,
    }),
    [user, authLoading, userVault, vaultLoading, login, register, loginOAuth, logout, deleteAccount, saveCurrentVault]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
