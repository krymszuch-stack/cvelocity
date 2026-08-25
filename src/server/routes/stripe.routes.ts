import { NextFunction, Request, Response, Router } from 'express';
import type Stripe from 'stripe';
import { loadConfig } from '../config';
import { getStripe } from '../stripeClient';
import { getSupabase } from '../supabase';

export const stripeWebhookRouter = Router();

/**
 * POST /api/stripe-webhook
 *
 * **Jedyne** źródło prawdy o tym, czy subskrypcja jest opłacona.
 *
 * Powrót użytkownika pod `?checkout=success` niczego nie dowodzi — ten adres da
 * się wpisać ręcznie. Dlatego status w tabeli `subscriptions` zmienia wyłącznie
 * ta trasa, na podstawie zdarzenia podpisanego kluczem Stripe'a, i dlatego
 * tabela nie ma polityki zapisu dla użytkownika.
 *
 * Uwierzytelnienia tu nie ma i być nie może: żądanie przychodzi od Stripe'a, nie
 * od przeglądarki z sesją. Rolę uwierzytelnienia pełni podpis w nagłówku
 * `stripe-signature`, weryfikowany na **surowym** ciele żądania.
 */
stripeWebhookRouter.post(
  '/stripe-webhook',
  async (req: Request, res: Response, next: NextFunction) => {
    const config = loadConfig();

    if (!config.paymentsEnabled || !config.STRIPE_WEBHOOK_SECRET) {
      res.status(501).json({ success: false, error: 'Płatności nie są uruchomione.' });
      return;
    }

    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      res.status(400).json({ success: false, error: 'Brak podpisu żądania.' });
      return;
    }

    let event: Stripe.Event;
    try {
      // `req.body` musi tu być Bufferem. Trasa jest zarejestrowana z
      // `express.raw` **przed** globalnym `express.json` w `server.ts` — po
      // sparsowaniu do obiektu podpisu nie da się już zweryfikować, bo liczy się
      // on z dokładnych bajtów, razem z kolejnością pól i białymi znakami.
      event = getStripe().webhooks.constructEvent(
        req.body as Buffer,
        signature,
        config.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      // Nieprawidłowy podpis to nie awaria serwera, tylko odrzucone żądanie.
      // Logujemy skąpo: to jest trasa dostępna publicznie.
      console.warn('[stripe] Odrzucono zdarzenie z nieprawidłowym podpisem.');
      res.status(400).json({ success: false, error: 'Nieprawidłowy podpis żądania.' });
      return;
    }

    try {
      const supabase = getSupabase();

      // Stripe dostarcza zdarzenia *co najmniej raz*, więc to samo zdarzenie
      // potrafi przyjść kilka razy — również w innej kolejności niż powstało.
      // Wstawienie identyfikatora jako pierwsze czyni z tego bramkę: konflikt
      // klucza głównego znaczy „to już przetworzyliśmy".
      const { error: seenError } = await supabase
        .from('stripe_events')
        .insert({ id: event.id, type: event.type });

      if (seenError) {
        if (seenError.code === '23505') {
          res.json({ received: true, duplicate: true });
          return;
        }
        throw new Error(`Nie udało się zapisać zdarzenia: ${seenError.message}`);
      }

      await handleEvent(event);
      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

/** Wyciąga `user_id` z metadanych — sesji albo subskrypcji, zależnie od zdarzenia. */
function userIdFrom(object: { metadata?: Stripe.Metadata | null }): string | null {
  return object.metadata?.user_id ?? null;
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  const supabase = getSupabase();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = userIdFrom(session);
      if (!userId) {
        console.warn(`[stripe] ${event.type} bez metadata.user_id — pomijam.`);
        return;
      }

      // Płatność jednorazowa to Karnet Aplikacyjny: dostęp liczymy z
      // `profiles.plan_expires_at`, nie ze statusu subskrypcji. Procedura bazowa
      // robi obie zmiany (przedłużenie + reset limitów AI) w jednej transakcji,
      // więc awaria sieci w połowie nie zostawia konta z dłuższym planem i
      // starym licznikiem — albo całość się dzieje, albo nic.
      if (session.mode === 'payment') {
        const days =
          typeof session.metadata?.pass_days === 'string'
            ? parseInt(session.metadata.pass_days, 10)
            : 30;
        const { error: passError } = await getSupabase().rpc('activate_application_pass', {
          p_user_id: userId,
          p_days: Number.isFinite(days) && days > 0 ? days : 30,
        });
        if (passError) {
          throw new Error(`Nie udało się aktywować karnetu: ${passError.message}`);
        }
      }

      const { error } = await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
          stripe_subscription_id:
            typeof session.subscription === 'string' ? session.subscription : null,
          plan_id: session.metadata?.plan_id ?? null,
          // Płatność jednorazowa (szablon) nie tworzy subskrypcji, więc nie
          // podnosi statusu do `active` — inaczej kupno szablonu za 19 zł
          // odblokowywałoby plan Pro. Dostęp jednorazowy egzekwuje
          // `plan_expires_at`, a ten status opisuje wyłącznie cykliczne plany.
          status: session.mode === 'subscription' ? 'active' : 'free',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw new Error(`Nie udało się zapisać subskrypcji: ${error.message}`);
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = userIdFrom(subscription);
      if (!userId) {
        console.warn(`[stripe] ${event.type} bez metadata.user_id — pomijam.`);
        return;
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: mapStatus(subscription.status),
          stripe_subscription_id: subscription.id,
          current_period_end: periodEnd(subscription),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw new Error(`Nie udało się zaktualizować subskrypcji: ${error.message}`);
      return;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      if (!customerId) return;

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', customerId);

      if (error) throw new Error(`Nie udało się oznaczyć zaległości: ${error.message}`);
      return;
    }

    default:
      // Reszta zdarzeń nie zmienia niczego po naszej stronie. Zapisany wiersz
      // w `stripe_events` zostaje jako ślad, że przyszło i zostało odebrane.
      return;
  }
}

/**
 * Tłumaczy status Stripe'a na nasz. Stripe rozróżnia więcej stanów, niż ma
 * znaczenie dla dostępu do funkcji — `incomplete`, `unpaid` i `paused` to dla
 * nas wszystko „nie działa", a próba odwzorowania ich jeden do jednego dawałaby
 * stany, których interfejs i tak nie umie pokazać.
 */
function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
      return 'cancelled';
    default:
      return 'free';
  }
}

/**
 * Koniec bieżącego okresu rozliczeniowego.
 *
 * Pole żyje na pozycji subskrypcji, nie na samej subskrypcji — od wersji API,
 * w której jedna subskrypcja może mieć pozycje o różnych cyklach. Bierzemy
 * pierwszą pozycję, bo nasze plany mają dokładnie jedną.
 */
function periodEnd(subscription: Stripe.Subscription): string | null {
  const seconds = subscription.items.data[0]?.current_period_end;
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null;
}
