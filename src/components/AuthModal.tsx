import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, ShieldCheck, ArrowRight, UserPlus, LogIn, CheckCircle2, Trash2, AlertTriangle, Eye, EyeOff, KeyRound, Smartphone } from 'lucide-react';
import { MasterVault } from '../types';
import { Requires2FAError, UserAccount } from '../lib/auth';
import { generateTwoFactorSetup, verifyTwoFactorToken, TwoFactorSetup } from '../lib/twoFactorAuth';
import { signInWithGooglePopup, isFirebaseConfigured } from '../lib/firebaseClient';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessVaultLoaded?: (vault: MasterVault) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessVaultLoaded }) => {
  const { login, register, loginOAuth, completeTwoFactorLogin, enableTwoFactor, disableTwoFactor, isAuthenticated, user, logout, deleteAccount } = useAuth();
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login-time 2FA challenge
  const [pendingTwoFactorUser, setPendingTwoFactorUser] = useState<UserAccount | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // 2FA setup flow (from the logged-in account panel)
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [confirmDisable2FA, setConfirmDisable2FA] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegisterTab) {
        if (!fullName.trim()) {
          setErrorMsg('Proszę podać Imię i Nazwisko.');
          return;
        }
        const vault = register(email, password, fullName);
        setSuccessMsg('Konto zostało pomyślnie utworzone! Zostałeś zalogowany.');
        if (onSuccessVaultLoaded) onSuccessVaultLoaded(vault);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const vault = login(email, password);
        setSuccessMsg('Pomyślnie zalogowano!');
        if (onSuccessVaultLoaded) onSuccessVaultLoaded(vault);
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      if (err instanceof Requires2FAError) {
        setPendingTwoFactorUser(err.user);
        setErrorMsg(null);
        return;
      }
      setErrorMsg(err.message || 'Wystąpił błąd autoryzacji.');
    }
  };

  const handleTwoFactorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTwoFactorUser) return;
    setErrorMsg(null);
    try {
      const vault = completeTwoFactorLogin(pendingTwoFactorUser, password, twoFactorCode);
      setSuccessMsg('Pomyślnie zalogowano!');
      if (onSuccessVaultLoaded) onSuccessVaultLoaded(vault);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nieprawidłowy kod 2FA.');
    }
  };

  const openTwoFactorSetup = async () => {
    if (!user) return;
    setSetupError(null);
    setSetupCode('');
    const setup = await generateTwoFactorSetup(user.email);
    setSetupData(setup);
    setIs2FASetupOpen(true);
  };

  const confirmTwoFactorSetup = () => {
    if (!setupData) return;
    if (!verifyTwoFactorToken(setupData.secret, setupCode)) {
      setSetupError('Nieprawidłowy kod. Sprawdź czas na urządzeniu i spróbuj ponownie.');
      return;
    }
    enableTwoFactor(setupData.secret);
    setIs2FASetupOpen(false);
    setSetupData(null);
    setSetupCode('');
    setSuccessMsg('Weryfikacja dwuetapowa (2FA) została włączona.');
  };

  const modalTitle = isAuthenticated && user
    ? user.fullName
    : pendingTwoFactorUser
    ? 'Weryfikacja dwuetapowa (2FA)'
    : isRegisterTab
    ? 'Utwórz Nowe Konto'
    : 'Logowanie do CVELOCITY';

  const modalSubtitle = isAuthenticated && user
    ? user.email
    : pendingTwoFactorUser
    ? `Wpisz kod 2FA z aplikacji Authenticator dla ${pendingTwoFactorUser.email}`
    : 'Bezpieczny dostęp do własnego profilu Master Vault';

  const modalIcon = isAuthenticated && user
    ? User
    : pendingTwoFactorUser
    ? ShieldCheck
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
      dismissable={!pendingTwoFactorUser}
    >
      {isAuthenticated && user ? (
        /* Logged In View */
        <div className="space-y-6 py-2">
          <div className="text-center">
            <div className="w-16 h-16 bg-success-soft border border-success-500/30 rounded-full flex items-center justify-center mx-auto text-success-fg font-bold text-xl shadow-xs mb-3">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <StatusBadge variant="success">Konto aktywne</StatusBadge>
          </div>

          {/* Two-Factor Authentication management */}
          <div className="text-left border-t border-line pt-4">
            {!is2FASetupOpen ? (
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-line bg-sunken">
                <div className="flex items-center gap-2 min-w-0">
                  <KeyRound className={`w-4 h-4 shrink-0 ${user.twoFactorEnabled ? 'text-success-fg' : 'text-subtle'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink">Weryfikacja dwuetapowa (2FA)</div>
                    <div className="text-[11px] text-muted">{user.twoFactorEnabled ? 'Włączona — kod z aplikacji Authenticator' : 'Wyłączona'}</div>
                  </div>
                </div>
                {user.twoFactorEnabled ? (
                  !confirmDisable2FA ? (
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => setConfirmDisable2FA(true)}
                    >
                      Wyłącz
                    </Button>
                  ) : (
                    <div className="shrink-0 flex items-center gap-1.5">
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => {
                          const pwd = window.prompt('Wprowadź swoje hasło dostępowe, aby wyłączyć 2FA:');
                          if (!pwd) return;
                          try {
                            disableTwoFactor(pwd);
                            setConfirmDisable2FA(false);
                            setSuccessMsg('Weryfikacja dwuetapowa (2FA) została wyłączona.');
                          } catch (err: any) {
                            setErrorMsg(err?.message || 'Nie udało się wyłączyć 2FA.');
                          }
                        }}
                      >
                        Potwierdź
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setConfirmDisable2FA(false)}
                      >
                        Anuluj
                      </Button>
                    </div>
                  )
                ) : (
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={openTwoFactorSetup}
                  >
                    Włącz
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-brand-300 bg-brand-soft space-y-3">
                <div className="flex items-center gap-2 text-brand-fg font-bold text-xs">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  Zeskanuj kod w aplikacji Authenticator
                </div>
                {setupData && (
                  <>
                    <img src={setupData.qrCodeDataUrl} alt="Kod QR 2FA" className="mx-auto rounded-lg border border-brand-200 bg-surface p-2" width={180} height={180} />
                    <p className="text-[10px] text-muted text-center">
                      Brak możliwości skanowania? Wpisz ręcznie: <span className="font-mono font-bold text-ink break-all">{setupData.secret}</span>
                    </p>
                  </>
                )}
                {setupError && (
                  <div className="p-2 bg-danger-soft border border-danger-500/30 text-danger-fg text-[11px] rounded-lg flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {setupError}
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Wpisz 6-cyfrowy kod z aplikacji"
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-center font-mono tracking-widest focus:outline-none focus:border-brand-500 text-ink"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => { setIs2FASetupOpen(false); setSetupData(null); setSetupCode(''); setSetupError(null); }}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    disabled={setupCode.length !== 6}
                    onClick={confirmTwoFactorSetup}
                  >
                    Potwierdź i włącz
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-between">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                logout();
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
                  <p className="text-xs text-danger-fg/90 mt-0.5">Twoje konto, dane vault i historia zostaną trwale usunięte z Firebase i localStorage.</p>
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
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Błąd usuwania konta.');
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
      ) : pendingTwoFactorUser ? (
        /* Login-time 2FA challenge */
        <form onSubmit={handleTwoFactorSubmit} className="space-y-5 py-2">
          {errorMsg && (
            <div className="p-3 bg-danger-soft border border-danger-500/30 text-danger-fg text-xs rounded-xl font-medium flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            required
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full bg-sunken border border-line rounded-xl px-3 py-3 text-center text-lg font-mono text-ink tracking-[0.5em] focus:outline-none focus:border-brand-500 focus:bg-surface"
          />

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              type="button"
              onClick={() => { setPendingTwoFactorUser(null); setTwoFactorCode(''); setErrorMsg(null); }}
            >
              Wróć
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              type="submit"
              disabled={twoFactorCode.length !== 6}
            >
              Zweryfikuj
            </Button>
          </div>
        </form>
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
              onClick={async () => {
                setErrorMsg(null);
                setSuccessMsg(null);
                try {
                  const googleUser = await signInWithGooglePopup();
                  if (!googleUser.email) {
                    setErrorMsg('Nie udało się pobrać adresu e-mail z Google.');
                    return;
                  }
                  const vault = loginOAuth(googleUser.email, googleUser.displayName, 'google');
                  setSuccessMsg(`Zalogowano pomyślnie z Google jako ${googleUser.email}!`);
                  if (onSuccessVaultLoaded) onSuccessVaultLoaded(vault);
                  setTimeout(() => {
                    onClose();
                  }, 1000);
                } catch (err: any) {
                  if (err instanceof Requires2FAError) {
                    setPendingTwoFactorUser(err.user);
                    setErrorMsg(null);
                    return;
                  }
                  console.error('Google popup auth error:', err);
                  if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                    setErrorMsg('Zamknięto okno logowania Google.');
                    return;
                  }
                  if (err?.code === 'auth/unauthorized-domain') {
                    setErrorMsg('Ta domena nie jest autoryzowana w konsoli Firebase. Dodaj ją w Authentication → Settings → Authorized domains.');
                    return;
                  }
                  setErrorMsg(
                    isFirebaseConfigured()
                      ? 'Logowanie przez Google nie powiodło się. Spróbuj ponownie lub użyj logowania e-mailem i hasłem.'
                      : 'Logowanie przez Google jest niedostępne — brak konfiguracji Firebase. Użyj logowania e-mailem i hasłem.'
                  );
                }
              }}
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
                    onClick={() => alert('Konta lokalne są zabezpieczone szyfrowaniem w przeglądarce. Ze względów bezpieczeństwa zresetowanie zapomnianego hasła lokalnego nie jest możliwe. Możesz zalogować się za pomocą Google lub odzyskać profil z kopii zapasowej.')}
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
                  Min. 6 znaków. Weryfikację dwuetapową (2FA) możesz włączyć po zalogowaniu.
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
            >
              {isRegisterTab ? 'Utwórz Konto i Zaloguj' : 'Zaloguj się'}
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
};

