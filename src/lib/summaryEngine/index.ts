import { MasterVault } from '../../types';
import { extractProfileFromVault } from './extractor';
import { generateSummaries } from './generator';
import { SummarySuggestion } from './types';

export * from './types';
export * from './lexicon';
export * from './grammar';
export * from './extractor';
export * from './constraints';
export * from './generator';
export * from './learnedStore';

/**
 * Główny punkt wejściowy do beztokenowego generatora podsumowania zawodowego.
 * Czerpie fakty bezpośrednio z MasterVault i tworzy deterministyczne,
 * wysokiej jakości propozycje podsumowań.
 */
export function generateSummarySuggestions(
  vault: MasterVault,
  count = 5
): SummarySuggestion[] {
  const profile = extractProfileFromVault(vault);
  return generateSummaries(profile, count);
}
