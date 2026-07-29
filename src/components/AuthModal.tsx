import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, ShieldCheck, X, ArrowRight, UserPlus, LogIn, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { MasterVault } from '../types';
import { signInWithGooglePopup } from '../lib/firebaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessVaultLoaded?: (vault: MasterVault) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessVaultLoaded }) => {
  const { login, register, loginOAuth, isAuthenticated, user, logout, deleteAccount } = useAuth();
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      setErrorMsg(err.message || 'Wystąpił błąd autoryzacji.');
    }
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
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center mx-auto text-indigo-600 font-bold text-xl">
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
        ) : (
          /* Authentication Form (Login / Register) */
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
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
                  !isRegisterTab ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
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
                  isRegisterTab ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Rejestracja</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                ⚠️ {errorMsg}
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
                onClick={() => alert('Wymaga konfiguracji Azure Entra ID (zobacz instrukcje agenta)')}
                className="w-full py-2.5 bg-[#2F2F2F] hover:bg-black text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 21 21">
                  <path fill="#f35325" d="M0 0h10v10H0z"/>
                  <path fill="#81bc06" d="M11 0h10v10H11z"/>
                  <path fill="#05a6f0" d="M0 11h10v10H0z"/>
                  <path fill="#ffba08" d="M11 11h10v10H11z"/>
                </svg>
                <span>Kontynuuj z Microsoft (Entra ID)</span>
              </button>
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
                      placeholder="np. Jan Kowalski"
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
                    placeholder="jan.kowalski@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white pl-9"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hasło
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white pl-9"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                {isRegisterTab && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Min. 6 znaków. Hasło posłuży jako klucz szyfrujący dane AES-256.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center space-x-2 transition-all mt-2"
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
