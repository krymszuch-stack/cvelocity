import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Lock, Cloud } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { clientEnv } from '../../lib/clientEnv';
import { ApiError, api } from '../../lib/apiClient';
import { useEntitlements } from '../../store/useEntitlements';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../features/auth/AuthModal';

/**
 * Przejście do bramki płatności.
 *
 * Sesja płatności powstaje **po stronie serwera** (`POST /api/billing/checkout-session`),
 * a przeglądarka jedynie przechodzi pod zwrócony adres. Trzy powody:
 *
 *  1. Poprzednia wersja używała `stripe.redirectToCheckout({ lineItems })` —
 *     integracji czysto klienckiej, wyłączonej dla nowych kont Stripe. Nie
 *     zadziałałaby na świeżo założonym koncie, a to jest dokładnie ten przypadek.
 *  2. Cena pochodzi wtedy z tabeli `plans` w bazie, a nie z pola w kodzie
 *     przeglądarki, które użytkownik może podmienić przed wysłaniem.
 *  3. Nie doładowujemy skryptu firmy trzeciej, więc CSP zostaje przy
 *     `script-src 'self'` bez wyjątków (`server.ts`).
 *
 * O tym, że subskrypcja jest aktywna, decyduje webhook Stripe'a — nie powrót
 * użytkownika pod adres z `?checkout=success`, który da się wpisać ręcznie.
 */

export interface StripeCheckoutProduct {
  /** Identyfikator ceny w Stripe (`price_...`). Serwer weryfikuje go w tabeli `plans`. */
  sku: string;
  title: string;
  price: string;
  period: string;
  recurring: boolean;
  trialDays?: number;
}

export interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StripeCheckoutProduct;
  onUnlocked?: () => void;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
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
);

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  onUnlocked,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { grantDemoPro } = useEntitlements();
  const { mode, cloudAvailable, signInWithGoogle, user } = useAuth();

  const paymentsAvailable = clientEnv.backendConfigured;
  const isCloudAccount = mode === 'cloud' && !!user;

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { url } = await api.post<{ url: string }>('/api/billing/checkout-session', {
        priceId: product.sku,
      });
      window.location.assign(url);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : 'Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę.'
      );
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await signInWithGoogle();
    setLoading(false);
    if (!res.ok) {
      setErrorMsg(res.message);
    }
  };

  const handleDemoUnlock = () => {
    grantDemoPro();
    onUnlocked?.();
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Odblokuj: ${product.title}`} size="sm">
        <div className="space-y-5">
          <div className="flex items-baseline gap-1.5 border-b border-line pb-3">
            <span className="font-mono text-3xl font-bold text-ink">{product.price}</span>
            <span className="text-xs text-subtle">{product.period}</span>
            <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-brand-fg">
              Cena brutto (z VAT)
            </span>
          </div>

          <div className="space-y-2 text-xs text-muted">
            <p>
              {product.recurring
                ? 'Subskrypcja odnawialna miesięcznie. Możesz anulować w 2 kliknięciach w panelu Stripe Customer Portal.'
                : 'Jednorazowa opłata bez żadnej subskrypcji ani ukrytych kosztów.'}
            </p>
            {product.trialDays && (
              <div className="flex items-center gap-2 rounded-xl bg-success-soft p-2.5 text-success-fg">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Zawiera {product.trialDays} dni bezpłatnego okresu próbnego (0 zł teraz).</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-danger-soft p-3 text-xs text-danger-fg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {!isCloudAccount && cloudAvailable ? (
              /* Użytkownik lokalny / niezalogowany w chmurze */
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-fg">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">Wymagane konto w chmurze</h4>
                    <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                      Licencja i płatności są powiązane z Twoim kontem, co chroni Cię przed utratą subskrypcji po wyczyszczeniu przeglądarki. Twoje dotychczasowe CV zostanie automatycznie zachowane!
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-ink shadow-xs transition hover:bg-elevated hover:border-ink/20 active:scale-[0.99]"
                  >
                    <GoogleIcon />
                    <span>Zaloguj się przez Google i kontynuuj</span>
                  </button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Użyj e-maila i hasła
                  </Button>
                </div>
              </div>
            ) : paymentsAvailable ? (
              <Button
                variant="primary"
                className="w-full"
                icon={Lock}
                onClick={handleCheckout}
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Łączenie z bramką płatności...' : 'Przejdź do bezpiecznej płatności'}
              </Button>
            ) : (
              <div className="flex gap-2 rounded-xl bg-warning-soft p-3 text-xs text-warning-fg">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Płatności nie są jeszcze uruchomione w tej instalacji. Nic nie zostanie pobrane.
                </span>
              </div>
            )}

            {/* Odblokowanie testowe dla trybu deweloperskiego */}
            {import.meta.env.DEV && (
              <Button variant="ghost" size="sm" className="w-full text-muted text-xs" onClick={handleDemoUnlock}>
                Odblokuj lokalnie (tylko tryb deweloperski)
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-line/60 pt-3 text-[10px] text-subtle">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
            <span>Płatność obsługuje Stripe. Dane karty nie trafiają na nasz serwer.</span>
          </div>
        </div>
      </Modal>

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </>
  );
};
