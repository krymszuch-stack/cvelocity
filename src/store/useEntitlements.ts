import { useCallback, useEffect, useState } from 'react';
import { StorageKeys, onAppStorageWiped, readJson, writeJson } from '../lib/storage';
import { clientEnv } from '../lib/clientEnv';
import { ApiError, api } from '../lib/apiClient';

/**
 * Uprawnienia i pozostałe limity — **wyłącznie na potrzeby interfejsu**.
 *
 * To jest podpowiedź dla ekranu, a nie kontrola dostępu. Wartości leżą
 * w `localStorage`, więc użytkownik może je sobie przestawić z konsoli
 * przeglądarki i zobaczyć etykietę „Pro". Nic z tego nie wynika: realne
 * uprawnienie sprawdza serwer przy każdym wywołaniu, w `src/server/quota.ts`,
 * na podstawie tabel `subscriptions` i `usage_counters`, których użytkownik nie
 * może zapisać (polityki RLS w `supabase/migrations/0001_init.sql`).
 *
 * Ten podział jest celowy. Licznik w interfejsie musi odpowiadać natychmiast,
 * bez czekania na sieć; decyzja o wydaniu cudzych pieniędzy na wywołanie modelu
 * musi zapaść po stronie serwera. Poprzednia wersja miała wyłącznie tę pierwszą
 * połowę i nazywała ją kontrolą dostępu.
 */

export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'cancelled' | 'past_due';

export interface Subscription {
  status: SubscriptionStatus;
  sku?: string;
  currentPeriodEnd?: string;
}

export interface Usage {
  /** Pozostałe importy pliku w tym miesiącu. */
  importUses: number;
  /** Pozostałe wywołania AI w tym miesiącu. */
  aiUses: number;
  monthKey: string;
}

export interface EntitlementsState {
  subscription: Subscription;
  usage: Usage;
  /** `server` znaczy: te liczby przyszły z `/api/me` i są prawdziwe. */
  source: 'local' | 'server';
}

const FREE_IMPORTS = 10;
const FREE_AI_USES = 5;

const getMonthKey = () => new Date().toISOString().slice(0, 7);

function freshState(): EntitlementsState {
  return {
    subscription: { status: 'free' },
    usage: { importUses: FREE_IMPORTS, aiUses: FREE_AI_USES, monthKey: getMonthKey() },
    source: 'local',
  };
}

function loadInitialState(): EntitlementsState {
  const saved = readJson<EntitlementsState | null>(StorageKeys.entitlementsCache, null);
  if (!saved?.usage || !saved.subscription) return freshState();

  // Nowy miesiąc zeruje darmowe limity. Serwer liczy to samo po swojej stronie
  // po `date_trunc('month', now())` — tutaj chodzi tylko o to, żeby licznik
  // w interfejsie nie pokazywał zera do czasu pierwszej odpowiedzi z API.
  if (saved.usage.monthKey !== getMonthKey()) {
    return { ...saved, usage: { importUses: FREE_IMPORTS, aiUses: FREE_AI_USES, monthKey: getMonthKey() } };
  }

  return saved;
}

let globalState: EntitlementsState = loadInitialState();
const listeners = new Set<() => void>();

function setState(updater: (prev: EntitlementsState) => EntitlementsState): void {
  globalState = updater(globalState);
  writeJson(StorageKeys.entitlementsCache, globalState);
  listeners.forEach((notify) => notify());
}

// Po „usuń moje dane" licznik wraca do stanu wyjściowego w pamięci, ale bez
// natychmiastowego zapisu — klucz właśnie zniknął ze schowka, a odtworzenie go
// tuż po wymazaniu byłoby pisaniem danej osobowej w tej samej operacji, która
// miała ją usunąć. Zapis wróci dopiero przy realnej akcji użytkownika.
onAppStorageWiped(() => {
  globalState = freshState();
  listeners.forEach((notify) => notify());
});

export function isProStatus(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

/** Kształt odpowiedzi `GET /api/me` w części dotyczącej uprawnień. */
interface MeResponse {
  subscription: Subscription;
  usage: Usage;
}

export function useEntitlements() {
  const [state, setLocalState] = useState<EntitlementsState>(globalState);

  useEffect(() => {
    const listener = () => setLocalState(globalState);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  /**
   * Pobiera prawdziwy stan z serwera. Wywoływane po zalogowaniu i po powrocie
   * z bramki płatności — status subskrypcji potwierdza webhook Stripe'a, a nie
   * to, że użytkownik wrócił pod adres z `?checkout=success`.
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!clientEnv.backendConfigured) return;

    try {
      const me = await api.get<MeResponse>('/api/me');
      setState(() => ({ subscription: me.subscription, usage: me.usage, source: 'server' }));
    } catch (err) {
      // Niezalogowany użytkownik dostaje 401 i to jest normalny stan, nie awaria.
      if (err instanceof ApiError && err.isUnauthorized) {
        setState(() => freshState());
        return;
      }
      // Przy każdym innym błędzie zostajemy przy ostatnich znanych liczbach:
      // pokazanie „0 pozostałych" z powodu chwilowego problemu z siecią byłoby
      // gorsze niż lekko nieaktualny licznik.
    }
  }, []);

  const isPro = isProStatus(state.subscription.status);

  /**
   * Zmniejsza licznik pokazywany w interfejsie i mówi, czy warto w ogóle
   * wysyłać żądanie. `false` znaczy „pokaż cennik", nie „odmów dostępu" —
   * odmawia serwer.
   */
  const consumeLocally = useCallback((kind: 'ai' | 'import'): boolean => {
    if (isProStatus(globalState.subscription.status)) return true;

    const field = kind === 'ai' ? 'aiUses' : 'importUses';
    if (globalState.usage[field] <= 0) return false;

    setState((prev) => ({ ...prev, usage: { ...prev.usage, [field]: prev.usage[field] - 1 } }));
    return true;
  }, []);

  const consumeAi = useCallback(() => consumeLocally('ai'), [consumeLocally]);
  const consumeImport = useCallback(() => consumeLocally('import'), [consumeLocally]);

  /**
   * Odblokowanie na potrzeby pracy nad interfejsem, bez przechodzenia przez
   * bramkę płatności. Świadomie nie istnieje w buildzie produkcyjnym: wcześniej
   * przycisk „Symuluj natychmiastowe odblokowanie" pokazywał się każdemu, kto
   * wszedł na cennik bez skonfigurowanego klucza Stripe'a.
   */
  const grantDemoPro = useCallback(() => {
    if (!import.meta.env.DEV) return;
    setState((prev) => ({ ...prev, subscription: { status: 'active' }, source: 'local' }));
  }, []);

  return {
    subscription: state.subscription,
    usage: state.usage,
    source: state.source,
    isPro,
    refresh,
    consumeAi,
    consumeImport,
    grantDemoPro,
  };
}
