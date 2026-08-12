import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  UserAccount,
  getActiveSessionUser,
  loginUser as authLogin,
  registerUser as authRegister,
  loginWithOAuthAccount,
  logoutUser as authLogout,
  deleteUserAccount,
  saveUserVault,
  loadUserVault,
  completeLogin,
  enableTwoFactor as authEnableTwoFactor,
  disableTwoFactor as authDisableTwoFactor,
} from '../lib/auth';
import { verifyTwoFactorToken } from '../lib/twoFactorAuth';
import { deleteCurrentFirebaseUser, signOutFirebaseUser } from '../lib/firebaseClient';
import { MasterVault } from '../types';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  userVault: MasterVault | null;
  /** Throws Requires2FAError (see lib/auth.ts) if the account has 2FA enabled — catch it and call completeTwoFactorLogin. */
  login: (email: string, pass: string) => MasterVault;
  register: (email: string, pass: string, fullName: string) => MasterVault;
  loginOAuth: (email: string, fullName: string, provider: 'google') => MasterVault;
  /** Verifies a TOTP code for a pending 2FA login and finalizes the session. */
  completeTwoFactorLogin: (pendingUser: UserAccount, password: string, token: string) => MasterVault;
  enableTwoFactor: (secret: string) => void;
  disableTwoFactor: (password?: string) => void;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  saveUserVault: (vault: MasterVault, userSecret?: string) => void;
  saveCurrentVault: (vault: MasterVault, userSecret?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; onVaultLoaded?: (vault: MasterVault) => void }> = ({
  children,
  onVaultLoaded,
}) => {
  const [user, setUser] = useState<UserAccount | null>(() => getActiveSessionUser());
  const [userVault, setUserVault] = useState<MasterVault | null>(() => {
    const sessionUser = getActiveSessionUser();
    if (sessionUser) {
      return loadUserVault(sessionUser.id);
    }
    return null;
  });

  const login = useCallback((email: string, pass: string): MasterVault => {
    const result = authLogin(email, pass);
    setUser(result.user);
    setUserVault(result.vault);
    if (onVaultLoaded) {
      onVaultLoaded(result.vault);
    }
    return result.vault;
  }, [onVaultLoaded]);

  const completeTwoFactorLogin = useCallback((pendingUser: UserAccount, password: string, token: string): MasterVault => {
    if (!pendingUser.twoFactorSecret || !verifyTwoFactorToken(pendingUser.twoFactorSecret, token)) {
      throw new Error('Nieprawidłowy kod weryfikacyjny 2FA.');
    }
    const result = completeLogin(pendingUser, password);
    setUser(result.user);
    setUserVault(result.vault);
    if (onVaultLoaded) {
      onVaultLoaded(result.vault);
    }
    return result.vault;
  }, [onVaultLoaded]);

  const enableTwoFactor = useCallback((secret: string) => {
    if (!user) return;
    authEnableTwoFactor(user.id, secret);
    setUser({ ...user, twoFactorEnabled: true, twoFactorSecret: secret });
  }, [user]);

  const disableTwoFactor = useCallback((password?: string) => {
    if (!user) return;
    authDisableTwoFactor(user.id, password);
    setUser({ ...user, twoFactorEnabled: false, twoFactorSecret: undefined });
  }, [user]);

  const register = useCallback((email: string, pass: string, fullName: string): MasterVault => {
    const result = authRegister(email, pass, fullName);
    setUser(result.user);
    setUserVault(result.initialVault);
    if (onVaultLoaded) {
      onVaultLoaded(result.initialVault);
    }
    return result.initialVault;
  }, [onVaultLoaded]);

  const loginOAuth = useCallback((email: string, fullName: string, provider: 'google'): MasterVault => {
    const result = loginWithOAuthAccount(email, fullName, provider);
    setUser(result.user);
    setUserVault(result.vault);
    if (onVaultLoaded) {
      onVaultLoaded(result.vault);
    }
    return result.vault;
  }, [onVaultLoaded]);

  const logout = useCallback(() => {
    authLogout();
    void signOutFirebaseUser().catch(() => {});
    setUser(null);
    setUserVault(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    const emailToDelete = user.email;
    deleteUserAccount(user.id);
    try {
      await deleteCurrentFirebaseUser(emailToDelete);
    } catch (err) {
      console.warn('Firebase user deletion skipped:', err);
    }
    setUser(null);
    setUserVault(null);
  }, [user]);

  const saveUserVaultFunc = useCallback((vault: MasterVault, userSecret: string = 'default_key') => {
    if (user) {
      const cleanFullName = (vault.personalInfo.fullName || '').replace(/<[^>]+>/g, '').trim();
      const cleanEmail = (vault.personalInfo.email || '').replace(/<[^>]+>/g, '').trim();
      const cleanPhone = (vault.personalInfo.phone || '').replace(/<[^>]+>/g, '').trim();
      const cleanLocation = (vault.personalInfo.location || '').replace(/<[^>]+>/g, '').trim();

      const needsSanitization =
        cleanFullName !== vault.personalInfo.fullName ||
        cleanEmail !== vault.personalInfo.email ||
        cleanPhone !== vault.personalInfo.phone ||
        cleanLocation !== vault.personalInfo.location;

      const sanitizedVault: MasterVault = needsSanitization
        ? {
            ...vault,
            personalInfo: {
              ...vault.personalInfo,
              fullName: cleanFullName,
              email: cleanEmail,
              phone: cleanPhone,
              location: cleanLocation,
            },
          }
        : vault;

      saveUserVault(user.id, sanitizedVault, userSecret);
      setUserVault(sanitizedVault);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      userVault,
      login,
      register,
      loginOAuth,
      completeTwoFactorLogin,
      enableTwoFactor,
      disableTwoFactor,
      logout,
      deleteAccount,
      saveUserVault: saveUserVaultFunc,
      saveCurrentVault: saveUserVaultFunc,
    }),
    [user, userVault, login, register, loginOAuth, completeTwoFactorLogin, enableTwoFactor, disableTwoFactor, logout, deleteAccount, saveUserVaultFunc]
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
