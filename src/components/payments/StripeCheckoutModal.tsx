import React, { useState } from 'react';
import { ShieldCheck, Zap, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';

export interface StripeCheckoutProduct {
  sku: string;        // price_...
  title: string;      // "CVELOCITY Pro"
  price: string;      // "49 zł"
  period: string;     // "/ miesiąc" | "jednorazowo"
  recurring: boolean;
  trialDays?: number; // np. 30 dla Pro Insights
}

export interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StripeCheckoutProduct;
  onUnlocked?: () => void;
}

const STRIPE_KEY = (import.meta as any).env?.VITE_STRIPE_PUB_KEY as string | undefined;

async function loadStripeClient(publishableKey: string): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).Stripe) {
    return (window as any).Stripe(publishableKey);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      resolve((window as any).Stripe(publishableKey));
    };
    script.onerror = () => reject(new Error('Nie udało się pobrać Stripe JS SDK.'));
    document.head.appendChild(script);
  });
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  onUnlocked,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { setSubscription } = useAuthStore();

  const handleCheckout = async () => {
    if (!STRIPE_KEY) {
      // Demo fallback mode when key is absent
      handleSuccess();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const stripe = await loadStripeClient(STRIPE_KEY);

      if (!stripe) {
        throw new Error('Nie udało się załadować biblioteki płatności Stripe.');
      }

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: product.sku, quantity: 1 }],
        mode: product.recurring ? 'subscription' : 'payment',
        ...(product.recurring && product.trialDays
          ? { subscriptionData: { trial_period_days: product.trialDays } }
          : {}),
        successUrl: `${window.location.origin}/?checkout=success`,
        cancelUrl: `${window.location.origin}/?checkout=cancelled`,
      });

      if (error) {
        setErrorMsg(error.message || 'Płatność nie powiodła się.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Wystąpił błąd podczas łączenia z systemem płatności.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setSubscription({
      status: product.recurring ? 'active' : 'free',
      customerId: 'cus_demo_123',
      sku: product.sku,
      trialEndsAt: product.trialDays
        ? new Date(Date.now() + product.trialDays * 86400000).toISOString()
        : undefined,
    });
    if (onUnlocked) {
      onUnlocked();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Odblokuj: ${product.title}`}
      size="sm"
    >
      <div className="space-y-5">
        {/* Price Tag */}
        <div className="flex items-baseline gap-1.5 border-b border-line pb-3">
          <span className="font-mono text-3xl font-bold text-ink">{product.price}</span>
          <span className="text-xs text-subtle">{product.period}</span>
          <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-brand-fg">
            Cena brutto (z VAT)
          </span>
        </div>

        {/* Benefits Note */}
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

        {/* Action CTA */}
        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            className="w-full"
            icon={Lock}
            onClick={handleCheckout}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Ładowanie bezpiecznej bramki Stripe...' : 'Przejdź do bezpiecznej płatności'}
          </Button>

          {!STRIPE_KEY && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted"
              onClick={handleSuccess}
            >
              Symuluj natychmiastowe odblokowanie (tryb demo dev)
            </Button>
          )}
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-2 border-t border-line/60 pt-3 text-[10px] text-subtle">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
          <span>Szyfrowane połączenie 256-bit SSL • Stripe Hosted Checkout</span>
        </div>
      </div>
    </Modal>
  );
};
