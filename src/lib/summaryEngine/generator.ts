import { ExtractedProfileData, SummarySuggestion } from './types';
import { LEXICON } from './lexicon';
import { GRAMMAR } from './grammar';
import { passesQualityConstraints } from './constraints';
import { getEnhancedLexicon, pickWeightedItem } from './learnedStore';

/**
 * Prosty, szybki i w 100% deterministyczny pseudo-losowy generator (PRNG) Mulberry32.
 */
function createSeededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash stringa do liczby na potrzeby seeda PRNG.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  if (!arr || arr.length === 0) return '' as unknown as T;
  const idx = Math.floor(rng() * arr.length);
  return arr[idx];
}

/**
 * Formułuje klauzulę stażu w języku polskim z właściwą odmianą.
 */
function formatYearsClause(years: number): string {
  if (years <= 0) return 'bogatym doświadczeniem';
  if (years === 1) return 'rocznym stażem';
  if (years >= 2 && years <= 4) return `${years}-letnim stażem`;
  return `${years}-letnim doświadczeniem`;
}

/**
 * Formułuje klauzulę umiejętności.
 */
function formatSkillClause(skills: string[], rng: () => number): string {
  if (!skills || skills.length === 0) {
    return 'Posiadam gruntowną wiedzę merytoryczną i praktyczną';
  }
  if (skills.length === 1) {
    return `Specjalizuję się w technologii ${skills[0]}`;
  }
  if (skills.length === 2) {
    return `Kluczowe kompetencje obejmują ${skills[0]} oraz ${skills[1]}`;
  }

  const templates = [
    `Biegle wykorzystuję w pracy ${skills[0]}, ${skills[1]} oraz ${skills[2]}`,
    `Specjalizuję się w obszarach ${skills[0]} i ${skills[1]}`,
    `Doświadczenie opieram na znajomości ${skills.slice(0, 3).join(', ')}`,
  ];
  return pickRandom(templates, rng);
}

/**
 * Formułuje listę umiejętności po przecinku.
 */
function formatSkillsList(skills: string[]): string {
  if (!skills || skills.length === 0) return 'narzędzia branżowe i technologie';
  if (skills.length === 1) return skills[0];
  if (skills.length === 2) return `${skills[0]} oraz ${skills[1]}`;
  return `${skills.slice(0, -1).join(', ')} i ${skills[skills.length - 1]}`;
}

interface TemplateFillResult {
  text: string;
  usedLexemes: {
    verb: string;
    impact: string;
    adj: string;
  };
}

/**
 * Wypełnia pojedynczy szablon danymi z profilu i rozszerzonego banku leksemów z uwzględnieniem wag adaptacyjnych.
 */
function fillTemplate(
  template: string,
  profile: ExtractedProfileData,
  rng: () => number
): TemplateFillResult {
  const enhanced = getEnhancedLexicon(profile.industry, profile.seniority);

  const chosenAdj = pickWeightedItem(enhanced.adjectives, 'adj', enhanced.weights, rng);
  const chosenVerb = pickWeightedItem(enhanced.achieveVerbs, 'verb', enhanced.weights, rng);
  const chosenImpact = pickWeightedItem(enhanced.impactPhrases, 'impact', enhanced.weights, rng);
  const chosenConnector = pickRandom(LEXICON.connectors, rng);

  const yearsClause = formatYearsClause(profile.yearsOfExperience);
  const skillClause = formatSkillClause(profile.topSkills, rng);
  const skillsList = formatSkillsList(profile.topSkills.slice(0, 4));

  const rawText = template
    .replace('{ADJ}', chosenAdj.charAt(0).toUpperCase() + chosenAdj.slice(1))
    .replace('{TITLE}', profile.title)
    .replace('{YEARS_CLAUSE}', yearsClause)
    .replace('{DOMAIN}', profile.domain)
    .replace('{ACHIEVE_VERB}', chosenVerb)
    .replace('{IMPACT}', chosenImpact)
    .replace('{IMPACT_CAPITALIZED}', chosenImpact.charAt(0).toUpperCase() + chosenImpact.slice(1))
    .replace('{CONNECTOR}', chosenConnector)
    .replace('{SKILL_CLAUSE}', skillClause)
    .replace('{SKILLS_LIST}', skillsList);

  const cleanText = rawText
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .replace(/\.\./g, '.')
    .trim();

  return {
    text: cleanText,
    usedLexemes: {
      verb: chosenVerb,
      impact: chosenImpact,
      adj: chosenAdj,
    },
  };
}

/**
 * Główna funkcja generująca warianty podsumowania dla danego profilu.
 * Sortuje warianty wg łącznych wag zadowolenia użytkowników i weryfikacji AI.
 */
export function generateSummaries(profile: ExtractedProfileData, count = 5): SummarySuggestion[] {
  const baseSeed = hashString(`${profile.title}_${profile.yearsOfExperience}_${profile.topSkills.join(',')}`);
  const results: SummarySuggestion[] = [];
  const enhanced = getEnhancedLexicon(profile.industry, profile.seniority);

  for (let i = 0; i < GRAMMAR.styles.length && results.length < count; i++) {
    const style = GRAMMAR.styles[i];
    const rng = createSeededRng(baseSeed + i * 7919);

    const chosenTemplate = pickRandom(style.templates, rng);
    const { text, usedLexemes } = fillTemplate(chosenTemplate, profile, rng);

    if (passesQualityConstraints(text) || text.length > 20) {
      const words = text.trim().split(/\s+/);
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

      // Obliczenie wagi podsumowania
      const styleWeight = enhanced.weights[style.id] ?? 1.0;
      const verbWeight = enhanced.weights[`verb:${usedLexemes.verb}`] ?? 1.0;
      const impactWeight = enhanced.weights[`impact:${usedLexemes.impact}`] ?? 1.0;
      const totalScore = parseFloat((styleWeight + (verbWeight + impactWeight) * 0.5).toFixed(2));

      // Słowa kluczowe do podświetlenia w UI
      const keywords = [profile.title, ...profile.topSkills.slice(0, 3)].filter(Boolean);

      results.push({
        id: `summary-${style.id}`,
        styleId: style.id,
        styleName: style.styleName,
        text,
        wordCount: words.length,
        sentenceCount: sentences.length,
        highlightedKeywords: keywords,
        usedLexemes,
        weight: totalScore,
      });
    }
  }

  // Sortujemy po wadze (najbardziej cenione warianty na górze)
  return results.sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
}
