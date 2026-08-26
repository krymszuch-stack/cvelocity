import { getSupabase } from './supabase';

/**
 * Limity liczone po stronie serwera.
 *
 * To jest miejsce, w którym zapada decyzja o wydaniu pieniędzy właściciela
 * projektu na wywołanie modelu. Licznik w przeglądarce (`useEntitlements`) jest
 * wyłącznie podpowiedzią dla interfejsu — leży w `localStorage` i użytkownik
 * może go sobie przestawić z konsoli. Tutaj źródłem prawdy są tabele
 * `subscriptions` i `usage_counters`, do których nie ma prawa zapisu.
 */

export type QuotaKind = 'ai' | 'import';

export class QuotaExceededError extends Error {
  readonly status = 402;
  /** `errorHandler` przepuszcza treść do klienta tylko przy `expose === true`. */
  readonly expose = true;

  constructor(kind: QuotaKind) {
    super(
      kind === 'ai'
        ? 'Wyczerpano darmowe wywołania AI w tym miesiącu.'
        : 'Wyczerpano darmowe importy pliku w tym miesiącu.'
    );
    this.name = 'QuotaExceededError';
  }
}

/**
 * Pobiera jedną jednostkę limitu albo rzuca `QuotaExceededError`.
 *
 * Sprawdzenie i pobranie dzieje się w jednym poleceniu SQL (`consume_quota`),
 * więc dwie równolegle otwarte karty nie mogą obie zużyć ostatniego kredytu.
 * Rozbicie tego na "odczytaj ile zostało" i "odejmij jeden" po stronie
 * aplikacji dawałoby dokładnie taki wyścig.
 */
export async function consumeQuota(userId: string, kind: QuotaKind): Promise<void> {
  const { data, error } = await getSupabase().rpc('consume_quota', {
    p_user: userId,
    p_kind: kind,
  });

  if (error) {
    throw new Error(`Nie udało się sprawdzić limitu (${kind}): ${error.message}`);
  }

  if (data !== true) {
    throw new QuotaExceededError(kind);
  }
}

export interface RemainingQuota {
  aiUses: number;
  importUses: number;
  monthKey: string;
}

export interface Entitlements {
  subscription: {
    status: 'free' | 'trialing' | 'active' | 'cancelled' | 'past_due';
    sku?: string;
    currentPeriodEnd?: string;
  };
  usage: RemainingQuota;
}

const monthKey = () => new Date().toISOString().slice(0, 7);

/**
 * Zwraca stan uprawnień do pokazania w interfejsie: status subskrypcji oraz
 * **pozostałe** (nie zużyte) limity, bo to jest liczba, którą użytkownik chce
 * zobaczyć.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const supabase = getSupabase();
  const currentMonth = monthKey();

  const [subscriptionResult, counterResult, freePlanResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('status, plan_id, current_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('usage_counters')
      .select('ai_uses, import_uses')
      .eq('user_id', userId)
      .eq('month_key', currentMonth)
      .maybeSingle(),
    supabase.from('plans').select('ai_quota, import_quota').eq('id', 'free').maybeSingle(),
  ]);

  const status = (subscriptionResult.data?.status ?? 'free') as Entitlements['subscription']['status'];
  const isPaid = status === 'active' || status === 'trialing';

  // Limity planu darmowego czytamy z bazy, a nie ze stałej w kodzie — inaczej
  // zmiana cennika wymagałaby wdrożenia nowej wersji aplikacji.
  const aiQuota = freePlanResult.data?.ai_quota ?? 0;
  const importQuota = freePlanResult.data?.import_quota ?? 0;

  const usedAi = counterResult.data?.ai_uses ?? 0;
  const usedImports = counterResult.data?.import_uses ?? 0;

  return {
    subscription: {
      status,
      sku: subscriptionResult.data?.plan_id ?? undefined,
      currentPeriodEnd: subscriptionResult.data?.current_period_end ?? undefined,
    },
    usage: {
      // Plan opłacony nie ma limitu miesięcznego. `Infinity` nie przechodzi
      // przez JSON (staje się `null`), więc interfejs i tak pyta o `isPro`.
      aiUses: isPaid ? Number.MAX_SAFE_INTEGER : Math.max(0, aiQuota - usedAi),
      importUses: isPaid ? Number.MAX_SAFE_INTEGER : Math.max(0, importQuota - usedImports),
      monthKey: currentMonth,
    },
  };
}

export interface AiTaskResult<T> {
  data: T;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    model: string;
    calculatedCost?: number | null;
  };
}

/**
 * Rezerwuje atomowo 1 wywołanie AI z użyciem blokady pesymistycznej w bazie PostgreSQL (SELECT FOR UPDATE).
 */
export async function reserveAiQuota(userId: string, maxDailyUses: number): Promise<{ allowed: boolean; current_uses?: number }> {
  const { data, error } = await getSupabase().rpc('reserve_ai_quota', {
    p_user_id: userId,
    p_max_daily_uses: maxDailyUses,
  });

  if (error) {
    throw new Error(`Nie udało się zarezerwować limitu AI: ${error.message}`);
  }

  return (data as { allowed: boolean; current_uses?: number }) ?? { allowed: false };
}

/**
 * Zwrot zarezerwowanego limitu AI w przypadku awarii wykonania operacji LLM.
 */
export async function refundAiQuota(userId: string): Promise<void> {
  const { error } = await getSupabase().rpc('refund_ai_quota', {
    p_user_id: userId,
  });

  if (error) {
    console.warn(`[quota] Nie udało się zwrócić limitu AI dla użytkownika ${userId}:`, error.message);
  }
}

/**
 * Wykonuje potok wywołania AI z pre-flight rezerwacją pesymistyczną,
 * wykonaniem zadania LLM, księgowaniem tokenów i automatyczną refundacją w razie awarii.
 */
export async function executeAiOperation<T>(
  userId: string,
  tier: string,
  context: string,
  runAiTask: () => Promise<AiTaskResult<T>>
): Promise<T> {
  const maxUses = tier === 'PRO' || tier === 'active' || tier === 'trialing' ? 100 : 5;

  const reservation = await reserveAiQuota(userId, maxUses);
  if (!reservation.allowed) {
    throw new QuotaExceededError('ai');
  }

  try {
    const result = await runAiTask();

    if (result.usage) {
      const { recordUsage } = await import('./usageLedger');
      recordUsage({
        userId,
        context,
        model: result.usage.model,
        promptTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
      });
    }

    return result.data;
  } catch (error) {
    await refundAiQuota(userId);
    throw error;
  }
}
