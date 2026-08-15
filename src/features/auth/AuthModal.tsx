import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  User,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/useAppStore';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccessVaultLoaded?: (loadedVault: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccessVaultLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [step, setStep] = useState<'credentials' | 'twoFactor'>('credentials');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useAppStore();

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('twoFactor');
    }, 600);
  };

  const handleTwoFactorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length < 6) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setUser({
        id: `user-${Date.now()}`,
        email: email.trim(),
        name: fullName.trim() || email.split('@')[0] || 'Kandydat CVELOCITY',
      });
      onClose();
      // Reset
      setStep('credentials');
      setTwoFactorCode('');
    }, 700);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setUser({
        id: 'google-user-1',
        email: 'uzytkownik.google@gmail.com',
        name: 'Adrian Kandydat',
      });
      onClose();
    }, 800);
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      alert('Podaj swój adres e-mail, aby otrzymać link resetujący hasło.');
      return;
    }
    alert(`Link resetujący hasło został wysłany na adres: ${email}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'twoFactor' ? 'Weryfikacja Dwuetapowa (2FA)' : activeTab === 'login' ? 'Zaloguj się do CVELOCITY' : 'Utwórz Nowe Konto'}
      size="sm"
    >
      <div className="space-y-5">
        {step === 'credentials' && (
          <>
            {/* Tabs: Logowanie / Rejestracja */}
            <div className="flex justify-center border-b border-line pb-3">
              <Tabs<'login' | 'register'>
                items={[
                  { id: 'login', label: 'Logowanie', icon: Lock },
                  { id: 'register', label: 'Rejestracja', icon: User },
                ]}
                active={activeTab}
                onChange={setActiveTab}
                className="w-full"
              />
            </div>

            {/* Google Fast Auth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-3 text-xs font-bold text-ink shadow-xs transition-all hover:bg-elevated hover:border-brand-300 focus-visible:outline-none"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Kontynuuj przez Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-line" />
              <span className="absolute bg-surface px-3 font-mono text-[10px] uppercase text-muted">
                lub adresem e-mail
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <Input
                  label="Imię i Nazwisko"
                  icon={User}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jan Kowalski"
                  required
                />
              )}

              <Input
                label="Adres E-mail"
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan.kowalski@domena.pl"
                autoComplete="email"
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">Hasło</label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-semibold text-brand-fg hover:underline focus-visible:outline-none"
                    >
                      Zapomniałem hasła
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted hover:text-ink focus-visible:outline-none"
                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={isLoading}
                icon={ArrowRight}
              >
                {activeTab === 'login' ? 'Dalej (Krok 2FA)' : 'Zarejestruj się'}
              </Button>
            </form>
          </>
        )}

        {/* Step 2: 2FA Sequential Screen */}
        {step === 'twoFactor' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-ink">Wpisz 6-cyfrowy kod bezpieczeństwa</h3>
              <p className="mt-1 text-xs text-muted">
                Wysłaliśmy kod weryfikacyjny na adres <strong className="text-ink">{email}</strong> lub do Twojej aplikacji uwierzytelniającej.
              </p>
            </div>

            <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="w-full rounded-2xl border border-line bg-sunken py-3 text-center font-mono text-2xl font-extrabold tracking-[0.4em] text-ink focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              />

              <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={ArrowLeft}
                  onClick={() => setStep('credentials')}
                >
                  Wstecz
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={Check}
                  loading={isLoading}
                  disabled={twoFactorCode.length < 6}
                >
                  Potwierdź i zaloguj
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </Modal>
  );
};
