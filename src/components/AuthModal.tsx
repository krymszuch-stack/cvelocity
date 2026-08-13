import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, ArrowRight, UserPlus, LogIn, CheckCircle2, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { sendPasswordReset, isFirebaseConfigured } from '../lib/firebaseClient';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Maps Firebase Auth error codes to a message a candidate (not a developer) can act on. */
function describeAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Konto z tym adresem email już istnieje. Zaloguj się zamiast rejestrować nowe konto.';
    case 'auth/invalid-email':
      return 'Adres email wygląda na nieprawidłowy.';
    case 'auth/weak-password':
      return 'Hasło musi zawierać co najmniej 6 znaków.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return 'Nieprawidłowy adres email lub hasło.';
    case 'auth/too-many-requests':
      return 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Zamknięto okno logowania Google.';
    case 'auth/unauthorized-domain':
      return 'Ta domena nie jest autoryzowana w konsoli Firebase. Dodaj ją w Authentication → Settings → Authorized domains.';
    default:
      return (err as { message?: string })?.message || 'Wystąpił błąd autoryzacji.';
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loginOAuth, isAuthenticated, user, logout, deleteAccount } = useAuth();
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (isRegisterTab) {
        if (!fullName.trim()) {
          setErrorMsg('Proszę podać Imię i Nazwisko.');
          return;
        }
        await register(email, password, fullName);
        setSuccessMsg('Konto zostało pomyślnie utworzone! Zostałeś zalogowany.');
        setTimeout(onClose, 1200);
      } else {
        await login(email, password);
        setSuccessMsg('Pomyślnie zalogowano!');
        setTimeout(onClose, 1000);
      }
    } catch (err) {
      setErrorMsg(describeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) {
      setErrorMsg('Wpisz adres email, żeby wysłać link do resetu hasła.');
      return;
    }
    try {
      await sendPasswordReset(email);
      setSuccessMsg(`Wysłaliśmy link do resetu hasła na adres ${email}, jeśli istnieje takie konto.`);
    } catch (err) {
      setErrorMsg(describeAuthError(err));
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await loginOAuth();
      setSuccessMsg('Zalogowano pomyślnie z Google!');
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error('Google popup auth error:', err);
      setErrorMsg(
        isFirebaseConfigured()
          ? describeAuthError(err)
          : 'Logowanie przez Google jest niedostępne — brak konfiguracji Firebase. Użyj logowania e-mailem i hasłem.'
      );
    }
  };

  const displayName = user?.displayName || user?.email || '';

  const modalTitle = isAuthenticated && user
    ? displayName
    : isRegisterTab
    ? 'Utwórz Nowe Konto'
    : 'Logowanie do CVELOCITY';

  const modalSubtitle = isAuthenticated && user
    ? user.email
    : 'Bezpieczny dostęp do własnego profilu Master Vault';

  const modalIcon = isAuthenticated && user
    ? User
    : isRegisterTab
    ? UserPlus
    : LogIn;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={modalIcon}
      size="sm"
      dismissable={isAuthenticated || false}
    >
      {isAuthenticated && user ? (
        /* Logged In View */
        <div className="space-y-6 py-2">
          <div className="text-center">
            <div className="w-16 h-16 bg-success-soft border border-success-500/30 rounded-full flex items-center justify-center mx-auto text-success-fg font-bold text-xl shadow-xs mb-3">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <StatusBadge variant="success">Konto aktywne</StatusBadge>
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-between">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                void logout();
                setSuccessMsg('Wylogowano z konta.');
              }}
            >
              Wyloguj się
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Zamknij
            </Button>
          </div>

          {/* Delete account section */}
          {!confirmDelete ? (
            <div className="pt-2">
              <button
                type="button"
                id="delete-account-btn"
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-subtle hover:text-danger-fg hover:bg-danger-soft border border-transparent hover:border-danger-500/30 rounded-xl transition-all duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Usuń konto i wszystkie dane
              </button>
            </div>
          ) : (
            <div className="pt-2 rounded-xl border border-danger-500/30 bg-danger-soft p-4 space-y-3 text-left">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-danger-fg mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-danger-fg">Tej operacji nie można cofnąć!</p>
                  <p className="text-xs text-danger-fg/90 mt-0.5">Twoje konto i dane vault zostaną trwale usunięte z Firebase.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setConfirmDelete(false)}
                >
                  Anuluj
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  id="confirm-delete-account-btn"
                  disabled={isDeleting}
                  icon={Trash2}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteAccount();
                      onClose();
                    } catch (err) {
                      setErrorMsg(describeAuthError(err));
                      setConfirmDelete(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  {isDeleting ? 'Usuwanie…' : 'Tak, usuń konto'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Authentication Form (Login / Register) */
        <div className="space-y-5 py-2">
          {/* Tab Switcher */}
          <div className="flex bg-sunken p-1 rounded-xl text-xs font-bold border border-line">
            <button
              type="button"
              onClick={() => {
                setIsRegisterTab(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                !isRegisterTab ? 'bg-surface text-brand-fg shadow-2xs' : 'text-muted hover:text-ink'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Logowanie</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegisterTab(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                isRegisterTab ? 'bg-surface text-brand-fg shadow-2xs' : 'text-muted hover:text-ink'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Rejestracja</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-danger-soft border border-danger-500/30 text-danger-fg text-xs rounded-xl font-medium flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-success-soft border border-success-500/30 text-success-fg text-xs rounded-xl font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={!isFirebaseConfigured()}
              title={
                isFirebaseConfigured()
                  ? 'Zaloguj się kontem Google'
                  : 'Niedostępne — brak konfiguracji Firebase (VITE_FIREBASE_*)'
              }
              className="w-full py-2.5 bg-surface border border-line hover:bg-sunken text-ink rounded-xl font-bold text-xs shadow-xs flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.238-2.627-.611-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.238-2.627-.611-3.917z" />
              </svg>
              <span>Kontynuuj z Google</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-1 h-px bg-line"></div>
            <span className="text-[10px] uppercase font-bold text-subtle">lub przez email</span>
            <div className="flex-1 h-px bg-line"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterTab && (
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Imię i Nazwisko
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Wpisz imię i nazwisko"
                    className="w-full bg-sunken border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-brand-500 focus:bg-surface pl-9"
                  />
                  <User className="w-4 h-4 text-subtle absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                Adres Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj.email@domain.com"
                  className="w-full bg-sunken border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-brand-500 focus:bg-surface pl-9"
                />
                <Mail className="w-4 h-4 text-subtle absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted">
                  Hasło
                </label>
                {!isRegisterTab && (
                  <button
                    type="button"
                    onClick={() => void handlePasswordReset()}
                    className="text-[11px] font-medium text-brand-fg hover:underline"
                  >
                    Nie pamiętasz hasła?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-sunken border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-brand-500 focus:bg-surface pl-9 pr-9"
                />
                <Lock className="w-4 h-4 text-subtle absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-subtle hover:text-ink transition-colors"
                  title={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isRegisterTab && (
                <p className="text-[10px] text-subtle mt-1">
                  Min. 6 znaków.
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              icon={ArrowRight}
              className="mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Chwileczkę…' : isRegisterTab ? 'Utwórz Konto i Zaloguj' : 'Zaloguj się'}
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
};
