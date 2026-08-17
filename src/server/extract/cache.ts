import { createHash } from 'node:crypto';
import type { ExtractionResult } from './types';

/**
 * Cache wyników ekstrakcji, kluczowany skrótem adresu.
 *
 * Ta sama oferta wklejana przez wielu użytkowników jest pobierana raz. Oszczędza
 * to ruch wychodzący, czas oczekiwania i — gdy ekstrakcja zejdzie do modelu —
 * wywołanie AI.
 *
 * To jest realna oszczędność, w odróżnieniu od usuniętego „cache'u
 * semantycznego", który deklarował zaoszczędzone tokeny jako stałą pomnożoną
 * przez licznik uruchomień i nie redukował ani jednego wywołania.
 *
 * Trzymamy to w pamięci procesu — przy jednej instancji Cloud Run wystarcza,
 * a przy wielu każda po prostu ma własny cache. Przeniesienie do Postgresa
 * (tabela z `url_hash`) nie zmieni tego interfejsu.
 */

const TTL_MS = 60 * 60 * 1000; // 1 h — ogłoszenia zmieniają się rzadko
const MAX_ENTRIES = 500;

interface CacheEntry {
  result: ExtractionResult;
  finalUrl: string;
  expiresAt: number;
}

const entries = new Map<string, CacheEntry>();

export function urlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}

export function getCachedExtraction(url: string): { result: ExtractionResult; finalUrl: string } | null {
  const key = urlHash(url);
  const entry = entries.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    entries.delete(key);
    return null;
  }

  // Odświeżenie pozycji w kolejności — `Map` zachowuje kolejność wstawiania,
  // więc dzięki temu eksmisja usuwa wpis najdawniej używany, a nie najstarszy.
  entries.delete(key);
  entries.set(key, entry);

  return { result: entry.result, finalUrl: entry.finalUrl };
}

export function setCachedExtraction(url: string, result: ExtractionResult, finalUrl: string): void {
  // Nie zapisujemy wyników, z których i tak nie da się skorzystać.
  if (result.tier === 'none') return;

  if (entries.size >= MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest) entries.delete(oldest);
  }

  entries.set(urlHash(url), { result, finalUrl, expiresAt: Date.now() + TTL_MS });
}

/** Wyłącznie na potrzeby testów. */
export function clearExtractionCache(): void {
  entries.clear();
}

export function extractionCacheSize(): number {
  return entries.size;
}
