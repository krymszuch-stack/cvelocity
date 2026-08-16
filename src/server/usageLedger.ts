/**
 * Rejestr realnego zużycia modelu.
 *
 * Do tej pory `response.usageMetadata` nie było czytane nigdzie w projekcie, a
 * `GET /api/usage/stats` zwracał wymyślone stałe. Skutek: nie dało się
 * odpowiedzieć na pytanie „ile kosztuje mnie jeden użytkownik", więc każdy
 * cennik byłby zgadywaniem.
 *
 * Zapis idzie w dwa miejsca:
 *  - **ustrukturyzowana linia JSON na stdout** — Cloud Run Logging indeksuje ją
 *    automatycznie i da się po niej filtrować bez stawiania czegokolwiek;
 *  - **agregacja w pamięci** — żeby endpoint statystyk zwracał realne liczby.
 *
 * Agregacja ginie przy restarcie instancji i to jest w porządku na tym etapie:
 * trwałym źródłem prawdy są linie w logach. Gdy wejdzie Supabase, `recordUsage`
 * zacznie dodatkowo pisać do `ai_usage_events` — sygnatura się nie zmieni.
 */

export interface UsageEvent {
  /** Nazwa operacji, np. `parse-jd`. Nigdy treść promptu. */
  context: string;
  model: string;
  promptTokens: number;
  outputTokens: number;
}

/**
 * Cennik w USD za milion tokenów. Zweryfikowany na cenniku Gemini API.
 * Modele spoza tabeli liczymy jako 0 i oznaczamy — lepiej pokazać brak danych
 * niż podstawić cenę innego modelu i zbudować na tym decyzję cenową.
 */
const PRICE_PER_MILLION_USD: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
  'gemini-3.6-flash': { input: 0.75, output: 3.75 },
};

export interface UsageTotals {
  calls: number;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  /** `true`, gdy choć jedno wywołanie użyło modelu spoza tabeli cen. */
  hasUnpricedCalls: boolean;
  since: string;
  byContext: Record<string, { calls: number; totalTokens: number; estimatedCostUsd: number }>;
}

function emptyTotals(): UsageTotals {
  return {
    calls: 0,
    promptTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    hasUnpricedCalls: false,
    since: new Date().toISOString(),
    byContext: {},
  };
}

let totals: UsageTotals = emptyTotals();

export function estimateCostUsd(model: string, promptTokens: number, outputTokens: number): number | null {
  const price = PRICE_PER_MILLION_USD[model];
  if (!price) return null;
  return (promptTokens * price.input + outputTokens * price.output) / 1_000_000;
}

/**
 * Odnotowuje jedno wywołanie modelu.
 *
 * Do logu trafiają wyłącznie liczby i nazwa operacji. Treść promptu to CV
 * użytkownika, a logi serwera nie są miejscem na dane osobowe.
 */
export function recordUsage(event: UsageEvent): void {
  const promptTokens = Number.isFinite(event.promptTokens) ? Math.max(0, event.promptTokens) : 0;
  const outputTokens = Number.isFinite(event.outputTokens) ? Math.max(0, event.outputTokens) : 0;
  const totalTokens = promptTokens + outputTokens;

  const cost = estimateCostUsd(event.model, promptTokens, outputTokens);

  totals.calls += 1;
  totals.promptTokens += promptTokens;
  totals.outputTokens += outputTokens;
  totals.totalTokens += totalTokens;
  totals.estimatedCostUsd += cost ?? 0;
  if (cost === null) totals.hasUnpricedCalls = true;

  const perContext = totals.byContext[event.context] ?? {
    calls: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
  };
  perContext.calls += 1;
  perContext.totalTokens += totalTokens;
  perContext.estimatedCostUsd += cost ?? 0;
  totals.byContext[event.context] = perContext;

  console.log(
    JSON.stringify({
      type: 'ai_usage',
      context: event.context,
      model: event.model,
      promptTokens,
      outputTokens,
      totalTokens,
      estimatedCostUsd: cost,
      at: new Date().toISOString(),
    })
  );
}

export function getUsageTotals(): UsageTotals {
  return {
    ...totals,
    byContext: { ...totals.byContext },
  };
}

/** Wyłącznie na potrzeby testów — produkcja nigdy nie zeruje licznika. */
export function resetUsageTotals(): void {
  totals = emptyTotals();
}
