import Stripe from 'stripe';
import { loadConfig } from './config';

/**
 * Klient Stripe'a, tworzony leniwie.
 *
 * Leniwie, bo `BACKEND_MODE=local` jest wspieranym trybem pracy i nie ma powodu,
 * żeby brak klucza płatności przerywał start serwera — tak samo jak brak
 * Supabase nie przerywa go w trybie lokalnym. Trasy płatności same sprawdzają
 * `config.paymentsEnabled` i odpowiadają 501, gdy nie ma czym zapłacić.
 */

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const config = loadConfig();
  if (!config.STRIPE_SECRET_KEY) {
    throw new Error('Płatności wymagają STRIPE_SECRET_KEY.');
  }

  cached = new Stripe(config.STRIPE_SECRET_KEY);
  return cached;
}

/** Wyłącznie na potrzeby testów. */
export function resetStripeClient(): void {
  cached = null;
}
