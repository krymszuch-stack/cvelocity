import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
} from '../lib/auth';
import { deleteCurrentFirebaseUser } from '../lib/firebaseClient';
import { MasterVault } from '../types';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  userVault: MasterVault | null;
  login: (email: string, pass: string) => MasterVault;
  register: (email: string, pass: string, fullName: string) => MasterVault;
  loginOAuth: (email: string, fullName: string, provider: 'google' | 'microsoft') => MasterVault;
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

  useEffect(() => {
    if (user) {
      const vault = loadUserVault(user.id);
      setUserVault(vault);
      if (vault && onVaultLoaded) {
        onVaultLoaded(vault);
      }
    } else {
      setUserVault(null);
    }
  }, [user, onVaultLoaded]);

  const login = useCallback((email: string, pass: string): MasterVault => {
    const result = authLogin(email, pass);
    setUser(result.user);
    setUserVault(result.vault);
    if (onVaultLoaded) {
      onVaultLoaded(result.vault);
    }
    return result.vault;
  }, [onVaultLoaded]);

  const register = useCallback((email: string, pass: string, fullName: string): MasterVault => {
    const result = authRegister(email, pass, fullName);
    setUser(result.user);
    setUserVault(result.initialVault);
    if (onVaultLoaded) {
      onVaultLoaded(result.initialVault);
    }
    return result.initialVault;
  }, [onVaultLoaded]);

  const loginOAuth = useCallback((email: string, fullName: string, provider: 'google' | 'microsoft'): MasterVault => {
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
    setUser(null);
    setUserVault(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    // 1. Delete all localStorage data for this user
    deleteUserAccount(user.id);
    // 2. Delete Firebase Auth account (if logged in via Google/Firebase)
    try {
      await deleteCurrentFirebaseUser();
    } catch (err) {
      // Firebase user might not exist if registered via email/password only
      console.warn('Firebase user deletion skipped:', err);
    }
    // 3. Clear local React state
    setUser(null);
    setUserVault(null);
  }, [user]);

  const saveUserVaultFunc = useCallback((vault: MasterVault, userSecret: string = 'default_key') => {
    if (user) {
      saveUserVault(user.id, vault, userSecret);
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
      logout,
      deleteAccount,
      saveUserVault: saveUserVaultFunc,
      saveCurrentVault: saveUserVaultFunc,
    }),
    [user, userVault, login, register, loginOAuth, logout, deleteAccount, saveUserVaultFunc]
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
