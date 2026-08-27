import { StorageKeys, readJson, writeJson } from '../storage';
import { LEXICON } from './lexicon';
import { passesLexemeSanity } from './constraints';
import { SeniorityLevel } from './types';

export interface LearnedLexiconData {
  version: number;
  updatedAt: string;
  weights: Record<string, number>;
  customVerbs: Record<string, string[]>;
  customImpacts: Record<string, string[]>;
  feedbackCount: number;
}

const DEFAULT_LEARNED_DATA: LearnedLexiconData = {
  version: 1,
  updatedAt: new Date().toISOString(),
  weights: {},
  customVerbs: {},
  customImpacts: {},
  feedbackCount: 0,
};

/**
 * Wczytuje nauczony bank leksemów i wag z rejestru storage.
 */
export function loadLearnedLexicon(): LearnedLexiconData {
  return readJson<LearnedLexiconData>(StorageKeys.learnedLexicon, DEFAULT_LEARNED_DATA);
}

/**
 * Bezpiecznie utrwala stan nauczonego leksykonu w rejestrze storage.
 */
export function saveLearnedLexicon(data: LearnedLexiconData): void {
  writeJson(StorageKeys.learnedLexicon, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Zapisuje pozytywny sygnał nagrody (Reward Signal) dla wybranego szablonu i leksemów.
 * Podnosi wagi użytych elementów, dzięki czemu algorytm będzie faworyzować trafne formuły.
 */
export function recordPositiveFeedback(
  styleId: string,
  usedLexemes: { verb?: string; impact?: string; adj?: string },
  rewardWeight = 0.5
): void {
  const store = loadLearnedLexicon();

  // 1. Zwiększenie wagi stylu / szablonu
  const currentStyleWeight = store.weights[styleId] ?? 1.0;
  store.weights[styleId] = parseFloat((currentStyleWeight + rewardWeight).toFixed(2));

  // 2. Zwiększenie wag dla użytych słów
  if (usedLexemes.verb) {
    const key = `verb:${usedLexemes.verb}`;
    store.weights[key] = parseFloat(((store.weights[key] ?? 1.0) + rewardWeight).toFixed(2));
  }
  if (usedLexemes.impact) {
    const key = `impact:${usedLexemes.impact}`;
    store.weights[key] = parseFloat(((store.weights[key] ?? 1.0) + rewardWeight).toFixed(2));
  }
  if (usedLexemes.adj) {
    const key = `adj:${usedLexemes.adj}`;
    store.weights[key] = parseFloat(((store.weights[key] ?? 1.0) + rewardWeight).toFixed(2));
  }

  store.feedbackCount += 1;
  saveLearnedLexicon(store);
}

/**
 * Pozyskuje i utrwala nowe zweryfikowane czasowniki i frazy (Knowledge Distillation).
 * Każda nowa fraza przechodzi przez sanityzację i filtr zakazanego żargonu.
 */
export function harvestNewPatterns(
  industry: string,
  verbs: string[],
  impacts: string[]
): { addedVerbs: number; addedImpacts: number } {
  const store = loadLearnedLexicon();
  let addedVerbs = 0;
  let addedImpacts = 0;

  const existingVerbs = new Set([
    ...(LEXICON.achieveVerbs[industry] || []),
    ...(store.customVerbs[industry] || []),
  ]);

  const existingImpacts = new Set([
    ...(LEXICON.impactPhrases[industry] || []),
    ...(store.customImpacts[industry] || []),
  ]);

  if (!store.customVerbs[industry]) store.customVerbs[industry] = [];
  if (!store.customImpacts[industry]) store.customImpacts[industry] = [];

  for (const v of verbs) {
    const clean = v.trim().toLowerCase();
    if (clean.length >= 4 && clean.length <= 80 && !existingVerbs.has(clean)) {
      // Weryfikacja sanityzacji (brak pustosłowia)
      if (passesLexemeSanity(clean)) {
        store.customVerbs[industry].push(clean);
        existingVerbs.add(clean);
        addedVerbs++;
      }
    }
  }

  for (const imp of impacts) {
    const clean = imp.trim().toLowerCase();
    if (clean.length >= 8 && clean.length <= 120 && !existingImpacts.has(clean)) {
      if (passesLexemeSanity(clean)) {
        store.customImpacts[industry].push(clean);
        existingImpacts.add(clean);
        addedImpacts++;
      }
    }
  }

  if (addedVerbs > 0 || addedImpacts > 0) {
    saveLearnedLexicon(store);
  }

  return { addedVerbs, addedImpacts };
}

/**
 * Zwraca połączony leksykon (statyczny + nauczony) wraz z mapą wag.
 */
export function getEnhancedLexicon(industry: string, seniority: SeniorityLevel) {
  const store = loadLearnedLexicon();

  const baseVerbs = LEXICON.achieveVerbs[industry] || LEXICON.achieveVerbs.general;
  const customVerbs = store.customVerbs[industry] || [];
  const allVerbs = [...baseVerbs, ...customVerbs];

  const baseImpacts = LEXICON.impactPhrases[industry] || LEXICON.impactPhrases.general;
  const customImpacts = store.customImpacts[industry] || [];
  const allImpacts = [...baseImpacts, ...customImpacts];

  const allAdjs = LEXICON.adjectives[seniority] || LEXICON.adjectives.mid;

  return {
    adjectives: allAdjs,
    achieveVerbs: allVerbs,
    impactPhrases: allImpacts,
    weights: store.weights,
  };
}

/**
 * Losowanie ważone (Weighted Selection) ze zbioru elementów z uwzględnieniem wag adaptacyjnych.
 */
export function pickWeightedItem<T extends string>(
  items: T[],
  prefix: string,
  weights: Record<string, number>,
  rng: () => number
): T {
  if (!items || items.length === 0) return '' as T;
  if (items.length === 1) return items[0];

  // Pobranie wag lub 1.0 domyślnie
  const itemWeights = items.map((item) => {
    const key = prefix ? `${prefix}:${item}` : item;
    return weights[key] ?? 1.0;
  });

  const totalWeight = itemWeights.reduce((sum, w) => sum + w, 0);
  let threshold = rng() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    threshold -= itemWeights[i];
    if (threshold <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}
