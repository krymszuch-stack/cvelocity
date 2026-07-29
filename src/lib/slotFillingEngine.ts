import { HighlightMetric, PhraseSlot } from '../types';

// Synonym Bank for local sentence rephrasing without LLM tokens
const SYNONYM_MAP: Record<string, string[]> = {
  'stworzyłem': ['zbudowałem', 'wytworzyłem', 'zaprojektowałem i wdrożyłem', 'zrealizowałem', 'opracowałem', 'skomponowałem'],
  'zoptymalizowałem': ['skróciłem czas wykonania', 'zwiększyłem wydajność', 'usprawniłem', 'przyspieszyłem proces', 'podniosłem efektywność'],
  'zintegrowałem': ['połączyłem', 'zasiliłem dane z', 'skonfigurowałem komunikację z', 'zbudowałem interfejs do', 'zsynchronizowałem'],
  'kierowałem': ['zarządzałem', 'koordynowałem pracę', 'stałem na czele', 'prowadziłem nadzór techniczny nad', 'przewodziłem zespołowi'],
  'zaprojektowałem': ['zbudowałem architekturę', 'zaplanowałem strukturę', 'stworzyłem koncepcję i wdrożyłem', 'opracowałem schemat'],
  'wdrożyłem': ['zainstalowałem i uruchomiłem', 'wprowadziłem na produkcję', 'zrealizowałem wdrożenie', 'udostępniłem użytkownikom'],
  'zautomatyzowałem': ['skróciłem ręczne operacje poprzez automatyzację', 'zbudowałem skrypty automatyzujące', 'zrealizowałem automatyczny pipeline'],
  'przyspieszyłem': ['zredukowałem opóźnienia', 'zoptymalizowałem czas reakcji', 'zwiększyłem przepustowość'],
};

// Buzzwords & fluff phrases to automatically purify (Slogan Eliminator)
const SLOGAN_BUZZWORDS = [
  'dynamiczny',
  'zmotywowany',
  'szybko się uczę',
  'pasjonat',
  'elastyczne podejście',
  'odpowiedzialny pracownik',
  'ambitny profesjonalista',
  'nastawiony na sukces',
  'umiejętność pracy pod presją czasu',
  'kreatywne myślenie',
  'odporny na stres',
  'komunikatywny',
  'efektywny lider',
  'zorientowany na cele',
  'myślenie out-of-the-box',
  'synergia działań',
];

/**
 * Eliminates slogans and word fluff from input text.
 */
export function eliminateSlogans(text: string): { purifiedText: string; slogansRemoved: string[] } {
  let purified = text;
  const slogansRemoved: string[] = [];

  for (const slogan of SLOGAN_BUZZWORDS) {
    const regex = new RegExp(`\\b${slogan}\\b`, 'gi');
    if (regex.test(purified)) {
      slogansRemoved.push(slogan);
      purified = purified.replace(regex, '').replace(/\s{2,}/g, ' ').trim();
    }
  }

  return { purifiedText: purified, slogansRemoved };
}

/**
 * Parses a raw highlight bullet point into a structured PhraseSlot ({action}, {target}, {tool}, {metric}).
 */
export function extractSlotsFromHighlight(highlight: HighlightMetric | string): PhraseSlot {
  const rawText = typeof highlight === 'string' ? highlight : (highlight.text || '');

  // If specific slot breakdown was already provided on the highlight object
  if (typeof highlight !== 'string' && highlight.action && highlight.target && highlight.tool && highlight.metric) {
    return {
      template: '{action} {target} wykorzystując {tool}, co przyniosło {metric}.',
      action: highlight.action,
      target: highlight.target,
      tool: highlight.tool,
      metric: highlight.metric,
      keywords: highlight.keywords || [],
    };
  }

  // Fallback heuristic slot parsing for plain strings or text-only highlight objects
  const text = rawText.trim();
  if (!text) {
    return {
      template: '{action} {target}.',
      action: 'Realizowałem',
      target: 'zadania operacyjne',
      tool: 'narzędzia zawodowe',
      metric: 'wysoką jakość wykonania',
      keywords: [],
    };
  }

  // Try extracting first word as action verb, and rest as target
  const parts = text.split(/,\s*/);
  const words = text.split(/\s+/);
  const firstWord = words[0] || 'Realizowałem';

  return {
    template: '{text}',
    action: firstWord,
    target: words.slice(1).join(' ') || text,
    tool: parts[1] ? parts[1].trim() : '',
    metric: parts[2] ? parts[2].trim() : '',
    keywords: words.filter(w => w.length > 4),
  };
}

/**
 * Local 0-Token Slot Filling Transformer
 * Inverts sentence structure (Metric-First, Action-First, Tool-First, PAR) and injects target job keywords.
 */
export function fillSlotSentence(
  slot: PhraseSlot,
  targetKeywords: string[],
  variant: 'ACTION_FIRST' | 'METRIC_FIRST' | 'TOOL_FIRST' | 'PAR_STRUCTURE' = 'ACTION_FIRST'
): string {
  let { action, target, tool, metric } = slot;

  // Substitute action with synonym if applicable
  const lowerAction = action.toLowerCase();
  if (SYNONYM_MAP[lowerAction]) {
    const synonyms = SYNONYM_MAP[lowerAction];
    action = synonyms[Math.floor(Math.random() * synonyms.length)];
    // Capitalize first letter
    action = action.charAt(0).toUpperCase() + action.slice(1);
  }

  // Purify fluff
  const cleanTarget = eliminateSlogans(target).purifiedText;
  const cleanMetric = eliminateSlogans(metric).purifiedText;

  // Ensure target keywords correlation (Terminology matching without hallucination)
  let matchedToolsStr = tool;
  for (const kw of targetKeywords) {
    const lowerKw = kw.toLowerCase();
    if (
      lowerKw.includes('sql') &&
      tool.toLowerCase().includes('bazy') &&
      !tool.toLowerCase().includes('sql')
    ) {
      matchedToolsStr = `${tool} (SQL Optimization)`;
    } else if (
      lowerKw.includes('docker') &&
      tool.toLowerCase().includes('kontener') &&
      !tool.toLowerCase().includes('docker')
    ) {
      matchedToolsStr = `${tool} (Docker/Kubernetes)`;
    }
  }

  // Build clean result sentence without empty parens or trailing clauses
  let result = `${action} ${cleanTarget}`.trim();
  if (matchedToolsStr && matchedToolsStr.trim()) {
    result += ` przy użyciu ${matchedToolsStr}`;
  }
  if (cleanMetric && cleanMetric.trim()) {
    result += `, co przyniosło ${cleanMetric}`;
  }
  if (!result.endsWith('.')) {
    result += '.';
  }

  if (variant === 'METRIC_FIRST' && cleanMetric) {
    return `Osiągnąłem ${cleanMetric}, gdy ${action.toLowerCase()} ${cleanTarget}${matchedToolsStr ? ` (${matchedToolsStr})` : ''}.`;
  }

  if (variant === 'TOOL_FIRST' && matchedToolsStr) {
    return `Wykorzystując ${matchedToolsStr}, ${action.toLowerCase()} ${cleanTarget}${cleanMetric ? `, uzyskując ${cleanMetric}` : ''}.`;
  }

  if (variant === 'PAR_STRUCTURE' && cleanMetric) {
    return `W odpowiedzi na potrzeby biznesowe ${action.toLowerCase()} ${cleanTarget}${matchedToolsStr ? ` (${matchedToolsStr})` : ''}${cleanMetric ? `, generując ${cleanMetric}` : ''}.`;
  }

  return result;
}

