/**
 * Parser i cache `robots.txt`.
 *
 * Moduł jest celowo **bez wejścia/wyjścia** — samo pobranie pliku robi
 * `safeFetch.ts`, które ma już całą ochronę przed SSRF. Gdyby ten plik sam
 * sięgał do sieci, powstałby cykliczny import i drugie miejsce, w którym trzeba
 * pamiętać o walidacji adresu.
 *
 * Zgodnie z RFC 9309: grupy po `User-agent`, wygrywa najdłuższa pasująca reguła,
 * przy równej długości wygrywa `Allow`. Obsługiwane są `*` i `$`.
 */

export interface RobotsRules {
  /** Grupy reguł, kluczowane nazwą agenta zapisaną małymi literami. */
  groups: Map<string, PathRule[]>;
  crawlDelaySeconds: number | null;
}

interface PathRule {
  pattern: string;
  allow: boolean;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 h
const MAX_CACHED_HOSTS = 200;

interface CacheEntry {
  rules: RobotsRules;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function parseRobotsTxt(text: string): RobotsRules {
  const groups = new Map<string, PathRule[]>();
  let crawlDelaySeconds: number | null = null;

  // Agenci bieżącej grupy. Kilka linii `User-agent` pod rząd tworzy jedną grupę.
  let currentAgents: string[] = [];
  let expectingAgents = true;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === 'user-agent') {
      // Nowa grupa zaczyna się dopiero po tym, jak poprzednia miała reguły.
      if (!expectingAgents) {
        currentAgents = [];
        expectingAgents = true;
      }
      currentAgents.push(value.toLowerCase());
      continue;
    }

    if (field === 'disallow' || field === 'allow') {
      expectingAgents = false;
      // Reguła bez poprzedzającego `User-agent` nie należy do nikogo.
      if (currentAgents.length === 0) continue;

      // Puste `Disallow:` znaczy „nic nie jest zabronione" — pomijamy je,
      // bo pusty wzorzec pasowałby do każdej ścieżki.
      if (field === 'disallow' && value === '') continue;

      for (const agent of currentAgents) {
        const rules = groups.get(agent) ?? [];
        rules.push({ pattern: value, allow: field === 'allow' });
        groups.set(agent, rules);
      }
      continue;
    }

    if (field === 'crawl-delay') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed) && parsed >= 0) crawlDelaySeconds = parsed;
    }
  }

  return { groups, crawlDelaySeconds };
}

/**
 * Zamienia wzorzec z `robots.txt` na wyrażenie regularne.
 * `*` to dowolny ciąg, `$` na końcu kotwiczy dopasowanie.
 */
function patternToRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;

  const escaped = body
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  return new RegExp(`^${escaped}${anchored ? '$' : ''}`);
}

/** Wybiera grupę reguł dla naszego agenta, z `*` jako grupą zapasową. */
function rulesForAgent(rules: RobotsRules, userAgent: string): PathRule[] {
  const needle = userAgent.toLowerCase();

  let best: { agent: string; rules: PathRule[] } | null = null;
  for (const [agent, group] of rules.groups) {
    if (agent === '*') continue;
    // Dopasowanie po przedrostku tokenu, tak jak robią to crawlery.
    if (needle.includes(agent) && (!best || agent.length > best.agent.length)) {
      best = { agent, rules: group };
    }
  }

  return best?.rules ?? rules.groups.get('*') ?? [];
}

export function isPathAllowed(rules: RobotsRules, path: string, userAgent: string): boolean {
  const applicable = rulesForAgent(rules, userAgent);
  if (applicable.length === 0) return true;

  let decision: { length: number; allow: boolean } | null = null;

  for (const rule of applicable) {
    if (!patternToRegex(rule.pattern).test(path)) continue;

    const length = rule.pattern.length;
    if (
      !decision ||
      length > decision.length ||
      // Przy równej długości wygrywa `Allow` — tak stanowi RFC 9309.
      (length === decision.length && rule.allow)
    ) {
      decision = { length, allow: rule.allow };
    }
  }

  return decision ? decision.allow : true;
}

export function getCachedRules(origin: string): RobotsRules | null {
  const entry = cache.get(origin);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(origin);
    return null;
  }

  return entry.rules;
}

export function cacheRules(origin: string, rules: RobotsRules): void {
  // Prosta eksmisja najstarszego wpisu — `Map` zachowuje kolejność wstawiania.
  if (cache.size >= MAX_CACHED_HOSTS) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }

  cache.set(origin, { rules, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Wyłącznie na potrzeby testów. */
export function clearRobotsCache(): void {
  cache.clear();
}

/**
 * Reguły oznaczające „brak zakazu".
 *
 * Używane, gdy `robots.txt` nie istnieje (404) albo host odpowiedział błędem.
 * Brak pliku to brak zakazu — traktowanie awarii serwera jako zakazu
 * zablokowałoby pobieranie ofert przy każdej chwilowej usterce po drugiej stronie.
 */
export function permissiveRules(): RobotsRules {
  return { groups: new Map(), crawlDelaySeconds: null };
}
