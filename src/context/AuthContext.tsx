import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
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
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { saveCloudVault } from '../lib/cloudVault';
import { authErrorMessage } from '../lib/authErrors';
import { removeRaw, vaultKeyFor } from '../lib/storage';
import { showToast } from '../store/useToastStore';
import { setAccessTokenProvider } from '../lib/apiClient';

/**
 * Jedyne źródło prawdy o tym, kto korzysta z aplikacji.
 *
 * Obsługuje **dwa tryby naraz** i to jest decyzja produktowa, nie zaszłość:
 *
 * - `local` — profil w tej przeglądarce, bez konta i bez serwera. Dane nie
 *   opuszczają urządzenia, co polityka prywatności obiecuje wprost i co dla
 *   części osób jest powodem, żeby w ogóle wpisać tu swoje CV.
 * - `cloud` — konto w Supabase. Synchronizacja między urządzeniami i kopia
 *   zapasowa, kosztem zaufania nam swoich danych.
 *
 * Wybór należy do użytkownika. Zlikwidowanie trybu lokalnego zamieniłoby
 * aplikację działającą bez rejestracji w kolejną, która żąda konta na wejściu.
 */

export type AuthMode = 'local' | 'cloud';

export interface AuthActionResult {
  ok: boolean;
  /** Komunikat po polsku, gotowy do pokazania. Pusty przy powodzeniu. */
  message: string;
  /** `true`, gdy konto powstało, ale czeka na potwierdzenie adresu. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: LocalProfile | null;
  isAuthenticated: boolean;
  /** `null`, gdy nikt nie jest zalogowany. */
  mode: AuthMode | null;
  /** Sesja Supabase — `null` w trybie lokalnym. */
  session: Session | null;
  /** Czy ta instalacja w ogóle ma skonfigurowane konta w chmurze. */
  cloudAvailable: boolean;
  userVault: MasterVault | null;

  /**
   * Zakłada profil w tej przeglądarce. Świadomie nie nazywa się `login` —
   * nic tu nikogo nie uwierzytelnia i interfejs mówi o tym wprost.
   */
  signInLocally: (name: string, email?: string) => MasterVault;

  signUpCloud: (email: string, password: string, displayName: string) => Promise<AuthActionResult>;
  signInCloud: (email: string, password: string) => Promise<AuthActionResult>;
  signInWithGoogle: () => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  resendConfirmation: (email: string) => Promise<AuthActionResult>;

  logout: () => Promise<void>;
  deleteAccount: () => Promise<AuthActionResult>;
  saveUserVault: (vault: MasterVault) => void;
  saveCurrentVault: (vault: MasterVault) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Jeden wspólny literał zamiast pięciu kopii — poprawka treści trafia w
 *  jedno miejsce, a nie w tyle funkcji (reguła 3; audyt treści §5.8). */
const CHMURA_NIESKONFIGUROWANA = 'Konta w chmurze nie są tu skonfigurowane.';

/** Adres, na który wraca użytkownik po kliknięciu linku z maila. */
function redirectTarget(): string {
  return `${window.location.origin}/`;
}

/** Zamienia konto Supabase na ten sam kształt, którego używa reszta interfejsu. */
function profileFromSession(session: Session): LocalProfile {
  const meta = session.user.user_metadata as { display_name?: string } | undefined;
  const email = session.user.email ?? '';
  return {
    id: session.user.id,
    name: meta?.display_name?.trim() || email.split('@')[0] || 'Użytkownik',
    email,
    createdAt: session.user.created_at ?? new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onVaultLoaded?: (vault: MasterVault) => void;
}> = ({ children, onVaultLoaded }) => {
  const [user, setUser] = useState<LocalProfile | null>(() => getActiveProfile());
  const [mode, setMode] = useState<AuthMode | null>(() => (getActiveProfile() ? 'local' : null));
  const [session, setSession] = useState<Session | null>(null);
  const [userVault, setUserVault] = useState<MasterVault | null>(() => {
    const active = getActiveProfile();
    return active ? loadProfileVault(active.id) : null;
  });

  const supabase = getSupabaseBrowserClient();
  const cloudAvailable = supabase !== null;

  // Dostawca tokenu dla apiClient: zapytania pod /api/* automatycznie dostają
  // nagłówek Authorization: Bearer <token>, gdy aktywna jest sesja w chmurze.
  useEffect(() => {
    if (supabase) {
      setAccessTokenProvider(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      });
    } else {
      setAccessTokenProvider(() => null);
    }
  }, [supabase]);

  // Uwaga: celowo brak efektu przeładowującego vault przy każdej zmianie `user`.
  // Każda ścieżka ustawia vault jawnie wartością, którą właśnie wyliczyła, a
  // odczyt z localStorage w efekcie dawał nową referencję obiektu za każdym
  // razem i odbijał się z efektem lustrzanym w App.tsx („Maximum update depth
  // exceeded"). Leniwy inicjalizator wyżej pokrywa przypadek wejścia na stronę
  // z istniejącym profilem.

  /**
   * Nasłuch sesji. Obsługuje też powrót z linku potwierdzającego e-mail —
   * `detectSessionInUrl` w `supabaseClient.ts` wyłapuje token z adresu i
   * emituje `SIGNED_IN`, więc nie trzeba osobno parsować fragmentu URL-a.
   */
  useEffect(() => {
    if (!supabase) return;

    let aktywny = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!aktywny || !data.session) return;
      setSession(data.session);
      setUser(profileFromSession(data.session));
      setMode('cloud');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nowaSesja) => {
      if (!aktywny) return;

      if (nowaSesja) {
        setSession(nowaSesja);
        setUser(profileFromSession(nowaSesja));
        setMode('cloud');
        // Link potwierdzający zostawia token we fragmencie adresu. Zostaje on
        // w historii przeglądarki i w pasku adresu, więc sprzątamy go od razu.
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setMode(null);
        setUserVault(null);
      }
    });

    return () => {
      aktywny = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInLocally = useCallback(
    (name: string, email?: string): MasterVault => {
      const { profile, vault } = createLocalProfile(name, email);
      setUser(profile);
      setMode('local');
      setUserVault(vault);
      onVaultLoaded?.(vault);
      return vault;
    },
    [onVaultLoaded]
  );

  const signUpCloud = useCallback(
    async (email: string, password: string, displayName: string): Promise<AuthActionResult> => {
      if (!supabase) return { ok: false, message: CHMURA_NIESKONFIGUROWANA };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // `display_name` czyta wyzwalacz `handle_new_user` w bazie i zakłada
        // z niego wiersz w `profiles` (migracja 0001).
        options: { data: { display_name: displayName.trim() }, emailRedirectTo: redirectTarget() },
      });

      if (error) return { ok: false, message: authErrorMessage(error) };

      // Przy włączonym potwierdzaniu adresu Supabase zwraca użytkownika bez
      // sesji. To nie jest błąd — to jest ten moment, w którym trzeba wysłać
      // człowieka do skrzynki.
      if (!data.session) return { ok: true, message: '', needsEmailConfirmation: true };

      return { ok: true, message: '' };
    },
    [supabase]
  );

  const signInCloud = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      if (!supabase) return { ok: false, message: CHMURA_NIESKONFIGUROWANA };

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, message: authErrorMessage(error) };
      return { ok: true, message: '' };
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    if (!supabase) return { ok: false, message: CHMURA_NIESKONFIGUROWANA };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTarget(),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) return { ok: false, message: authErrorMessage(error) };
    return { ok: true, message: '' };
  }, [supabase]);

  const requestPasswordReset = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      if (!supabase) return { ok: false, message: CHMURA_NIESKONFIGUROWANA };

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTarget(),
      });

      // Nawet przy błędzie odpowiadamy tak samo: inaczej formularz resetu
      // powiedziałby obcemu, czy dany adres ma u nas konto.
      if (error) return { ok: false, message: authErrorMessage(error) };
      return { ok: true, message: '' };
    },
    [supabase]
  );

  const resendConfirmation = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      if (!supabase) return { ok: false, message: CHMURA_NIESKONFIGUROWANA };

      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) return { ok: false, message: authErrorMessage(error) };
      return { ok: true, message: '' };
    },
    [supabase]
  );

  const logout = useCallback(async () => {
    if (mode === 'cloud' && supabase) {
      const wychodzacy = user?.id;
      await supabase.auth.signOut();
      // Lokalna kopia CV znika razem z sesją. Bez tego dokument zostawałby
      // na dysku pod kluczem, którego po wylogowaniu nic już nie odczyta ani
      // nie skasuje — na wspólnym komputerze to jest wyciek, nie niedopatrzenie.
      if (wychodzacy) removeRaw(vaultKeyFor(wychodzacy));
      return;
    }

    signOutLocalProfile();
    setUser(null);
    setMode(null);
    setUserVault(null);
  }, [mode, supabase, user]);

  const deleteAccount = useCallback(async (): Promise<AuthActionResult> => {
    if (mode === 'cloud' && supabase) {
      const { error } = await supabase.functions.invoke('usun-konto');
      if (error) {
        return { ok: false, message: 'Nie udało się usunąć konta. Spróbuj ponownie za chwilę.' };
      }
      await supabase.auth.signOut();
      deleteLocalProfile();
      setSession(null);
      setUser(null);
      setMode(null);
      setUserVault(null);
      return { ok: true, message: '' };
    }

    deleteLocalProfile();
    setUser(null);
    setMode(null);
    setUserVault(null);
    return { ok: true, message: '' };
  }, [mode, supabase]);

  /**
   * Zapis vaultu. Sanityzacja jest wspólna dla obu trybów; różni się wyłącznie
   * miejsce docelowe.
   */
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

      // Kopia lokalna powstaje w obu trybach: w chmurowym jest zabezpieczeniem
      // na czas bez sieci i znika przy wylogowaniu.
      saveProfileVault(user.id, sanitizedVault);
      setUserVault((prev) => (prev === sanitizedVault ? prev : sanitizedVault));

      if (mode === 'cloud') {
        // Zapis do chmury jest asynchroniczny, a `persistVault` w App.tsx nie
        // czeka na wynik — sygnalizujemy więc awarię wprost, zamiast pozwolić
        // użytkownikowi wierzyć, że dokument jest bezpieczny.
        void saveCloudVault(sanitizedVault).catch(() => {
          showToast('Nie udało się zapisać CV w chmurze', {
            message: 'Zmiany zostały zachowane w tej przeglądarce. Spróbujemy ponownie.',
            variant: 'error',
          });
        });
      }
    },
    [user, mode]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      mode,
      session,
      cloudAvailable,
      userVault,
      signInLocally,
      signUpCloud,
      signInCloud,
      signInWithGoogle,
      requestPasswordReset,
      resendConfirmation,
      logout,
      deleteAccount,
      saveUserVault: saveUserVaultFunc,
      saveCurrentVault: saveUserVaultFunc,
    }),
    [
      user,
      mode,
      session,
      cloudAvailable,
      userVault,
      signInLocally,
      signUpCloud,
      signInCloud,
      signInWithGoogle,
      requestPasswordReset,
      resendConfirmation,
      logout,
      deleteAccount,
      saveUserVaultFunc,
    ]
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
