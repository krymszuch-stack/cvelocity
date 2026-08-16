import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  LocalProfile,
  getActiveProfile,
  createLocalProfile,
  signOutLocalProfile,
  deleteLocalProfile,
  loadProfileVault,
  saveProfileVault,
} from '../lib/localProfile';
import { MasterVault } from '../types';

/**
 * Jedyne źródło prawdy o tym, kto korzysta z aplikacji.
 *
 * Wcześniej były dwa: `AuthModal` zapisywał użytkownika do `useAppStore`, a
 * `Topbar` czytał `isAuthenticated` z tego kontekstu. Efekt widoczny gołym
 * okiem — po „zalogowaniu" pasek górny dalej pokazywał „Zaloguj się", bo stan,
 * który ustawiał modal, nie był tym, który czytał interfejs.
 *
 * Metody `login`, `register`, `loginOAuth`, `completeTwoFactorLogin`,
 * `enableTwoFactor` i `disableTwoFactor` zostały usunięte: żadna nie miała ani
 * jednego wywołania, a wszystkie opierały się na module udającym system kont.
 */
interface AuthContextType {
  user: LocalProfile | null;
  isAuthenticated: boolean;
  userVault: MasterVault | null;
  /**
   * Zakłada profil w tej przeglądarce. Świadomie nie nazywa się `login` —
   * nic tu nikogo nie uwierzytelnia i interfejs mówi o tym wprost.
   */
  signInLocally: (name: string, email?: string) => MasterVault;
  logout: () => void;
  deleteAccount: () => void;
  saveUserVault: (vault: MasterVault) => void;
  saveCurrentVault: (vault: MasterVault) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; onVaultLoaded?: (vault: MasterVault) => void }> = ({
  children,
  onVaultLoaded,
}) => {
  const [user, setUser] = useState<LocalProfile | null>(() => getActiveProfile());
  const [userVault, setUserVault] = useState<MasterVault | null>(() => {
    const active = getActiveProfile();
    return active ? loadProfileVault(active.id) : null;
  });

  // Uwaga: celowo brak efektu przeładowującego vault przy każdej zmianie `user`.
  // Każda ścieżka ustawia vault jawnie wartością, którą właśnie wyliczyła, a
  // odczyt z localStorage w efekcie dawał nową referencję obiektu za każdym
  // razem i odbijał się z efektem lustrzanym w App.tsx („Maximum update depth
  // exceeded"). Leniwy inicjalizator wyżej pokrywa przypadek wejścia na stronę
  // z istniejącym profilem.

  const signInLocally = useCallback(
    (name: string, email?: string): MasterVault => {
      const { profile, vault } = createLocalProfile(name, email);
      setUser(profile);
      setUserVault(vault);
      onVaultLoaded?.(vault);
      return vault;
    },
    [onVaultLoaded]
  );

  const logout = useCallback(() => {
    signOutLocalProfile();
    setUser(null);
    setUserVault(null);
  }, []);

  const deleteAccount = useCallback(() => {
    deleteLocalProfile();
    setUser(null);
    setUserVault(null);
  }, []);

  const saveUserVaultFunc = useCallback(
    (vault: MasterVault) => {
      if (!user) return;

      const stripTags = (value: string | undefined) => (value || '').replace(/<[^>]+>/g, '').trim();
      const { personalInfo } = vault;

      const cleaned = {
        fullName: stripTags(personalInfo.fullName),
        email: stripTags(personalInfo.email),
        phone: stripTags(personalInfo.phone),
        location: stripTags(personalInfo.location),
      };

      const needsSanitization =
        cleaned.fullName !== personalInfo.fullName ||
        cleaned.email !== personalInfo.email ||
        cleaned.phone !== personalInfo.phone ||
        cleaned.location !== personalInfo.location;

      // Ta sama referencja obiektu, gdy nic się nie zmieniło — App.tsx odbija
      // `userVault` z powrotem do własnego stanu, a nowa referencja przy każdym
      // wywołaniu powodowała nieskończoną pętlę aktualizacji.
      const sanitizedVault: MasterVault = needsSanitization
        ? { ...vault, personalInfo: { ...personalInfo, ...cleaned } }
        : vault;

      saveProfileVault(user.id, sanitizedVault);
      setUserVault((prev) => (prev === sanitizedVault ? prev : sanitizedVault));
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      userVault,
      signInLocally,
      logout,
      deleteAccount,
      saveUserVault: saveUserVaultFunc,
      saveCurrentVault: saveUserVaultFunc,
    }),
    [user, userVault, signInLocally, logout, deleteAccount, saveUserVaultFunc]
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
