import { NextFunction, Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { checkoutSessionSchema, type CheckoutSessionInput } from '../../types/contracts';
import { loadConfig } from '../config';
import { getStripe } from '../stripeClient';
import { getSupabase } from '../supabase';
import { levelForXp, privilegesForLevel } from '../../lib/gamification';

export const billingRouter = Router();

function paymentsUnavailable(res: Response): void {
  res.status(501).json({
    success: false,
    error: 'Płatności nie są uruchomione w tej instalacji.',
  });
}

/**
 * Znajduje albo zakłada klienta w Stripe dla danego konta.
 *
 * Jeden użytkownik = jeden `stripe_customer_id`. Bez tego każde wejście do kasy
 * tworzyłoby nowego klienta, historia płatności rozsypałaby się po kilku
 * rekordach, a Customer Portal pokazywałby pustkę zamiast aktywnej subskrypcji.
 */
async function resolveCustomerId(userId: string, email?: string): Promise<string> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (data?.stripe_customer_id) return data.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email,
    // `metadata.user_id` to jedyny sposób, w jaki webhook potrafi powiązać
    // zdarzenie ze Stripe'a z kontem w naszej bazie.
    metadata: { user_id: userId },
  });

  const { error } = await supabase
    .from('subscriptions')
    .upsert({ user_id: userId, stripe_customer_id: customer.id }, { onConflict: 'user_id' });

  if (error) throw new Error(`Nie udało się zapisać klienta płatności: ${error.message}`);

  return customer.id;
}

/**
 * Zniżka za rangę — ta sama definicja poziomu, której używa interfejs
 * (`src/lib/gamification.ts`). Centrum Kariery obiecuje „zniżka nalicza się
 * w kasie”, więc kasa musi ją znać; obietnica bez egzekucji byłaby dokładnie
 * tą kontrolą wyłącznie w przeglądarce, przed którą przestrzega reguła 2.
 */
async function levelDiscountPercent(userId: string): Promise<number | null> {
  try {
    const { data, error } = await getSupabase()
      .from('user_gamification')
      .select('xp')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    // Brak wiersza = nowe konto na poziomie 1 = brak zniżki. To normalny stan.
    if (!data || typeof data.xp !== 'number') return null;

    return privilegesForLevel(levelForXp(data.xp).level).discountPercent;
  } catch (err) {
    // Migracja `user_gamification` (docs/migracje/0007) może jeszcze nie być
    // aplikowana. Zakup nie może przez to się wysypać — wychodzi bez zniżki,
    // a ostrzeżenie zostaje w logu po stronie operatora.
    console.warn('[billing] Nie udało się odczytać rangi użytkownika — sesja bez zniżki:', err);
    return null;
  }
}

/**
 * Kupon Stripe dla zniżki procentowej, tworzony przy pierwszym użyciu.
 *
 * Deterministyczne `id` (`ranga-15`, `ranga-30`) czyni tworzenie idempotentnym:
 * powtórny `create` z tym samym identyfikatorem kończy się błędem istnienia
 * wiersza i wtedy po prostu używamy tego, który już jest. Kupony są jednorazowe
 * (`duration: 'once'`), bo zniżka ma dotyczyć konkretnej transakcji, nie
 * całej przyszłości subskrypcji.
 */
async function ensureLevelCouponId(percentOff: number): Promise<string> {
  const couponId = `ranga-${percentOff}`;
  try {
    await getStripe().coupons.create({
      id: couponId,
      percent_off: percentOff,
      duration: 'once',
      name: `Zniżka za rangę −${percentOff}%`,
    });
  } catch {
    // „Coupon already exists” jest tu oczekiwaną ścieżką, nie awarią.
  }
  return couponId;
}

/**
 * POST /api/billing/checkout-session
 *
 * Tworzy sesję płatności po stronie serwera i zwraca adres bramki. Przeglądarka
 * jedynie pod niego przechodzi — nie ma tu Stripe.js, więc CSP zostaje przy
 * `script-src 'self'`.
 *
 * Cena pochodzi z tabeli `plans`, a przysłany `priceId` jest wyłącznie kluczem
 * wyszukiwania. Gdyby trafiał wprost do Stripe'a, wystarczyłoby podmienić go
 * w żądaniu i kupić plan Pro za cenę jednorazowego szablonu.
 */
billingRouter.post(
  '/billing/checkout-session',
  requireAuth,
  validateBody(checkoutSessionSchema),
  async (req: Request<unknown, unknown, CheckoutSessionInput>, res: Response, next: NextFunction) => {
    try {
      const config = loadConfig();
      if (!config.paymentsEnabled) return paymentsUnavailable(res);

      const { data: plan, error: planError } = await getSupabase()
        .from('plans')
        .select('id, stripe_price_id, interval, trial_days')
        .eq('stripe_price_id', req.body.priceId)
        .eq('active', true)
        .maybeSingle();

      if (planError) throw new Error(`Nie udało się odczytać cennika: ${planError.message}`);
      if (!plan) {
        res.status(400).json({ success: false, error: 'Nieznany plan.' });
        return;
      }

      const userId = req.user!.id;
      const customerId = await resolveCustomerId(userId, req.user!.email);
      const isRecurring = plan.interval !== 'one_time';

      // Zniżka z rangi liczona przed utworzeniem sesji, żeby trafiła do
      // podpisanego przez Stripe podsumowania — klient nie ma tu nic do
      // powiedzenia, bo procent przychodzi z serwera, nie z żądania.
      const discountPercent = await levelDiscountPercent(userId);
      const discounts = discountPercent
        ? [{ coupon: await ensureLevelCouponId(discountPercent) }]
        : [];

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: isRecurring ? 'subscription' : 'payment',
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        ...(discounts.length > 0 ? { discounts } : {}),
        success_url: `${config.APP_URL}/?checkout=success`,
        cancel_url: `${config.APP_URL}/?checkout=cancelled`,
        // Powtarzane w dwóch miejscach celowo: `checkout.session.completed`
        // niesie metadane sesji, a `customer.subscription.*` metadane
        // subskrypcji. Webhook musi umieć powiązać konto w obu przypadkach.
        metadata: { user_id: userId, plan_id: plan.id },
        ...(isRecurring
          ? {
              subscription_data: {
                metadata: { user_id: userId, plan_id: plan.id },
                ...(plan.trial_days > 0 ? { trial_period_days: plan.trial_days } : {}),
              },
            }
          : {}),
      });

      if (!session.url) throw new Error('Stripe nie zwrócił adresu sesji płatności.');

      res.json({ success: true, url: session.url });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/billing/portal-session
 *
 * Customer Portal Stripe'a: zmiana karty, faktury i anulowanie subskrypcji.
 * Budowanie własnych ekranów do tych operacji oznaczałoby obsługę kart płatniczych
 * po naszej stronie — czyli zakres PCI DSS, którego ten projekt nie chce.
 */
billingRouter.post(
  '/billing/portal-session',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = loadConfig();
      if (!config.paymentsEnabled) return paymentsUnavailable(res);

      const { data } = await getSupabase()
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', req.user!.id)
        .maybeSingle();

      if (!data?.stripe_customer_id) {
        res.status(400).json({ success: false, error: 'Brak historii płatności dla tego konta.' });
        return;
      }

      const session = await getStripe().billingPortal.sessions.create({
        customer: data.stripe_customer_id,
        return_url: config.APP_URL,
      });

      res.json({ success: true, url: session.url });
    } catch (err) {
      next(err);
    }
  }
);
