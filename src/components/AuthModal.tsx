import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, ShieldCheck, X, ArrowRight, UserPlus, LogIn, CheckCircle2, Trash2, AlertTriangle, Eye, EyeOff, KeyRound, Smartphone } from 'lucide-react';
import { MasterVault } from '../types';
import { Requires2FAError, UserAccount } from '../lib/auth';
import { generateTwoFactorSetup, verifyTwoFactorToken, TwoFactorSetup } from '../lib/twoFactorAuth';
import { signInWithGooglePopup } from '../lib/firebaseClient';

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isAuthenticated && user ? (
          /* Logged In View */
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-700 font-bold text-xl shadow-xs">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{user.fullName}</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">{user.email}</p>
              <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Konto aktywne & Szyfrowane AES</span>
              </div>
            </div>

            {/* Two-Factor Authentication management */}
            <div className="text-left border-t border-slate-100 pt-4">
              {!is2FASetupOpen ? (
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <KeyRound className={`w-4 h-4 shrink-0 ${user.twoFactorEnabled ? 'text-success-500' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800">Weryfikacja dwuetapowa (2FA)</div>
                      <div className="text-[11px] text-slate-500">{user.twoFactorEnabled ? 'Włączona — kod z aplikacji Authenticator' : 'Wyłączona'}</div>
                    </div>
                  </div>
                  {user.twoFactorEnabled ? (
                    !confirmDisable2FA ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDisable2FA(true)}
                        className="shrink-0 px-3 py-1.5 text-xs font-bold text-danger-700 bg-white border border-danger-500/30 rounded-lg hover:bg-danger-50 transition-colors"
                      >
                        Wyłącz
                      </button>
                    ) : (
                      <div className="shrink-0 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            disableTwoFactor();
                            setConfirmDisable2FA(false);
                            setSuccessMsg('Weryfikacja dwuetapowa (2FA) została wyłączona.');
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-white bg-danger-500 hover:bg-danger-700 rounded-lg transition-colors"
                        >
                          Potwierdź
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDisable2FA(false)}
                          className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Anuluj
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={openTwoFactorSetup}
                      className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
                    >
                      Włącz
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-brand-200 bg-brand-50 space-y-3">
                  <div className="flex items-center gap-2 text-brand-700 font-bold text-xs">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    Zeskanuj kod w aplikacji Authenticator
                  </div>
                  {setupData && (
                    <>
                      <img src={setupData.qrCodeDataUrl} alt="Kod QR 2FA" className="mx-auto rounded-lg border border-brand-200 bg-white p-2" width={180} height={180} />
                      <p className="text-[10px] text-slate-500 text-center">
                        Brak możliwości skanowania? Wpisz ręcznie: <span className="font-mono font-bold text-slate-700 break-all">{setupData.secret}</span>
                      </p>
                    </>
                  )}
                  {setupError && (
                    <div className="p-2 bg-danger-50 border border-danger-500/30 text-danger-700 text-[11px] rounded-lg flex items-center gap-1.5">
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
                    className="w-full bg-white border border-brand-200 rounded-lg px-3 py-2 text-xs text-center font-mono tracking-widest focus:outline-none focus:border-brand-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setIs2FASetupOpen(false); setSetupData(null); setSetupCode(''); setSetupError(null); }}
                      className="flex-1 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      onClick={confirmTwoFactorSetup}
                      disabled={setupCode.length !== 6}
                      className="flex-1 px-3 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      Potwierdź i włącz
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  logout();
                  setSuccessMsg('Wylogowano z konta.');
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
              >
                Wyloguj się
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
              >
                Zamknij
              </button>
            </div>

            {/* Delete account section */}
            {!confirmDelete ? (
              <div className="pt-2">
                <button
                  type="button"
                  id="delete-account-btn"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Usuń konto i wszystkie dane
                </button>
              </div>
            ) : (
              <div className="pt-2 rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-rose-800">Tej operacji nie można cofnąć!</p>
                    <p className="text-xs text-rose-600 mt-0.5">Twoje konto, dane vault i historia zostaną trwale usunięte z Firebase i localStorage.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    id="confirm-delete-account-btn"
                    disabled={isDeleting}
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
                    className="flex-1 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isDeleting ? (
                      <span>Usuwanie…</span>
                    ) : (
                      <><Trash2 className="w-3.5 h-3.5" /> Tak, usuń konto</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : pendingTwoFactorUser ? (
          /* Login-time 2FA challenge */
          <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-50 border border-brand-200 rounded-xl text-brand-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Weryfikacja dwuetapowa</h3>
                <p className="text-xs text-slate-500">Wpisz kod z aplikacji Authenticator dla {pendingTwoFactorUser.email}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-danger-50 border border-danger-500/30 text-danger-700 text-xs rounded-xl font-medium flex items-start gap-1.5">
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:border-brand-500 focus:bg-white"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setPendingTwoFactorUser(null); setTwoFactorCode(''); setErrorMsg(null); }}
                className="flex-1 px-3 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Wróć
              </button>
              <button
                type="submit"
                disabled={twoFactorCode.length !== 6}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-2xs transition-all"
              >
                Zweryfikuj
              </button>
            </div>
          </form>
        ) : (
          /* Authentication Form (Login / Register) */
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isRegisterTab ? 'Utwórz Nowe Konto' : 'Logowanie do SkillVault'}
                </h3>
                <p className="text-xs text-slate-500">
                  Bezpieczny dostęp do własnego profilu Master Vault
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterTab(false);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  !isRegisterTab ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
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
                  isRegisterTab ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Rejestracja</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-danger-50 border border-danger-500/30 text-danger-700 text-xs rounded-xl font-medium flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold flex items-center space-x-1.5">
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
                    console.error('Google popup auth error:', err);
                    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                      setErrorMsg('Zamknięto okno logowania Google.');
                      return;
                    }
                    // Fallback to seamless prompt if Firebase API Key is unconfigured
                    const googleEmail = prompt('Wprowadź swój adres e-mail Google:', email || 'uzytkownik@gmail.com');
                    if (!googleEmail) return;
                    const googleName = prompt('Wprowadź swoje Imię i Nazwisko:', fullName || 'Użytkownik Google');
                    const vault = loginOAuth(googleEmail, googleName || 'Użytkownik Google', 'google');
                    setSuccessMsg(`Zalogowano pomyślnie jako ${googleEmail}!`);
                    if (onSuccessVaultLoaded) onSuccessVaultLoaded(vault);
                    setTimeout(() => {
                      onClose();
                    }, 1000);
                  }
                }}
                className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.238-2.627-.611-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.238-2.627-.611-3.917z" />
                </svg>
                <span>Kontynuuj z Google</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-[10px] uppercase font-bold text-slate-400">lub przez email</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegisterTab && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Imię i Nazwisko
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Wpisz imię i nazwisko"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white pl-9"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adres Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="twoj.email@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white pl-9"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Hasło
                  </label>
                  {!isRegisterTab && (
                    <button
                      type="button"
                      onClick={() => alert('W przypadku zgubienia hasła lub konta lokalnego, możesz zalogować się z Google lub utwożyć nowe konto z tym samym e-mailem.')}
                      className="text-[11px] font-medium text-emerald-700 hover:underline"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white pl-9 pr-9"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition-colors"
                    title={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isRegisterTab && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Min. 6 znaków. Hasło posłuży jako klucz szyfrujący dane AES-256. Weryfikację dwuetapową (2FA) możesz włączyć po zalogowaniu.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center space-x-2 transition-all mt-2"
              >
                <span>{isRegisterTab ? 'Utwórz Konto i Zaloguj' : 'Zaloguj się'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
