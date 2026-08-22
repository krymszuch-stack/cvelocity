import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { clientEnv } from '../../lib/clientEnv';
import { ApiError, api } from '../../lib/apiClient';
import { useEntitlements } from '../../store/useEntitlements';

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

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  onUnlocked,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { grantDemoPro } = useEntitlements();

  const paymentsAvailable = clientEnv.backendConfigured;

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

  const handleDemoUnlock = () => {
    grantDemoPro();
    onUnlocked?.();
    onClose();
  };

  return (
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

        <div className="space-y-2 pt-2">
          {paymentsAvailable ? (
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

          {/*
            Odblokowanie na potrzeby pracy nad interfejsem. `import.meta.env.DEV`
            jest podmieniane na stałą przy budowaniu, więc cały ten blok znika
            z pakietu produkcyjnego — wcześniej przycisk nadający status Pro bez
            płatności pokazywał się każdemu, kto wszedł na cennik bez klucza.
          */}
          {import.meta.env.DEV && (
            <Button variant="ghost" size="sm" className="w-full text-muted" onClick={handleDemoUnlock}>
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
  );
};
