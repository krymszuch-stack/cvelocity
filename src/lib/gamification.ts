/**
 * Silnik gamifikacji — czysta logika, zero DOM-u i zero schowka.
 *
 * Tu mieszka wszystko, co da się sprawdzić w Node: ile punktów daje zdarzenie,
 * jaki poziom wynika z sumy punktów, ile brakuje do awansu i które osiągnięcie
 * właśnie się odblokowało. Warstwa przeglądarki (`src/store/useGamificationStore.ts`)
 * tylko to woła i utrwala — konwencja z `AGENTS.md`: logika w module, cienkie
 * spięcie w komponencie.
 *
 * Reguła 1 obowiązuje też tutaj: punkty przyznaje wyłącznie faktyczne działanie
 * użytkownika. Nie ma XP „za zalogowanie się dziś", bo to nagroda za nic, i nie
 * ma punktów startowych — nowe konto ma zero i to jest uczciwy stan.
 */

/** Zdarzenia, za które w ogóle da się dostać punkty. Zamknięta lista. */
export type XpEventId =
  | 'jd_ingested'
  | 'application_added'
  | 'star_completed'
  | 'ats_high_score'
  | 'question_confirmed'
  | 'salary_reported';

export interface XpEventDefinition {
  id: XpEventId;
  points: number;
  /** Co użytkownik zobaczy w powiadomieniu. Druga osoba, czas przeszły. */
  label: string;
}

export const XP_EVENTS: Record<XpEventId, XpEventDefinition> = {
  jd_ingested: { id: 'jd_ingested', points: 150, label: 'Ogłoszenie wczytane i sparsowane' },
  application_added: { id: 'application_added', points: 200, label: 'Nowa aplikacja w Pipelinie' },
  star_completed: { id: 'star_completed', points: 300, label: 'Historia STAR domknięta' },
  ats_high_score: { id: 'ats_high_score', points: 500, label: 'Wynik ATS 85+ na realnym CV' },
  question_confirmed: { id: 'question_confirmed', points: 100, label: 'Pytanie potwierdzone z rozmowy' },
  salary_reported: { id: 'salary_reported', points: 50, label: 'Widełki z ogłoszenia zgłoszone' },
};

export interface LevelDefinition {
  level: number;
  name: string;
  /** Próg wejścia w punktach. */
  from: number;
  /** Klasy Tailwind odznaki. Trzymane przy definicji, bo poziom bez wyglądu
   *  i wygląd bez poziomu zawsze rozjeżdżały się przy dokładaniu rangi. */
  badgeClass: string;
}

export const LEVELS: readonly LevelDefinition[] = [
  {
    level: 1,
    name: 'Aplikant',
    from: 0,
    badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  },
  {
    level: 2,
    name: 'Poszukiwacz',
    from: 500,
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  {
    level: 3,
    name: 'ATS Infiltrator',
    from: 1500,
    badgeClass: 'bg-[#F26440]/15 text-[#F26440] border-[#F26440]/40',
  },
  {
    level: 4,
    name: 'Negocjator Ofert',
    from: 3500,
    badgeClass: 'bg-amber-400/15 text-amber-400 border-amber-400/40',
  },
  {
    level: 5,
    name: 'Master of Velocity',
    from: 7000,
    badgeClass:
      'bg-gradient-to-r from-[#F26440]/25 via-fuchsia-500/20 to-sky-400/25 text-[#F26440] border-[#F26440]/50 shadow-[0_0_18px_rgba(242,100,64,0.35)]',
  },
] as const;

export interface LevelProgress {
  definition: LevelDefinition;
  /** Następny poziom albo `null`, gdy to już szczyt. */
  next: LevelDefinition | null;
  /** 0–100. Na ostatnim poziomie zawsze 100 — nie ma czego wypełniać. */
  percent: number;
  /** Ile punktów do awansu. `0`, gdy nie ma dokąd awansować. */
  toNext: number;
}

/**
 * Funkcje, które poziom potrafi odblokować.
 *
 * Klucze są jawną listą, a nie dowolnym stringiem, bo bramka funkcji z literówką
 * w nazwie wpuszczałaby wszystkich po cichu — błąd tej klasy nie zapala się
 * nigdzie w interfejsie.
 */
export type FeatureKey =
  | 'BASIC_TEMPLATES'
  | 'LIVE_HUD_TELEPROMPTER'
  | 'DEEP_COMPANY_INTEL'
  | 'UNLIMITED_TYPST_EXPORT';

export interface LevelPrivileges {
  level: number;
  /** Co ten poziom dokłada. Kumuluje się z niższymi. */
  features: FeatureKey[];
  /** Zdanie dla użytkownika — jedno źródło prawdy dla ekranu nagród. */
  perk: string;
  /**
   * Zniżka obiecana na tym poziomie w procentach albo `null`.
   *
   * Sama liczba, nigdy kod promocyjny: kodu nie da się wymyślić po stronie
   * przeglądarki, bo o tym, czy istnieje, decyduje operator płatności.
   * Wyświetlony „gotowy kod”, którego kasa nie zna, byłby danymi z sufitu
   * (reguła 1) i wygenerował dokładnie te zgłoszenia do supportu, które ten
   * system ma eliminować.
   */
  discountPercent: number | null;
}

export const LEVEL_PRIVILEGES: readonly LevelPrivileges[] = [
  {
    level: 1,
    features: ['BASIC_TEMPLATES'],
    perk: 'Pełny darmowy dostęp i podstawowy szablon A4.',
    discountPercent: null,
  },
  {
    level: 2,
    features: ['BASIC_TEMPLATES'],
    perk: 'Zniżka −15% na Karnet Aplikacyjny.',
    discountPercent: 15,
  },
  {
    level: 3,
    features: ['BASIC_TEMPLATES', 'LIVE_HUD_TELEPROMPTER'],
    perk: 'Beta: Teleprompter / HUD na żywo podczas rozmowy. Zniżka −30%.',
    discountPercent: 30,
  },
  {
    level: 4,
    features: ['BASIC_TEMPLATES', 'LIVE_HUD_TELEPROMPTER', 'DEEP_COMPANY_INTEL'],
    perk: 'Beta: Rentgen firmy i wykrywacz ukrytych pytań.',
    discountPercent: 30,
  },
  {
    level: 5,
    features: [
      'BASIC_TEMPLATES',
      'LIVE_HUD_TELEPROMPTER',
      'DEEP_COMPANY_INTEL',
      'UNLIMITED_TYPST_EXPORT',
    ],
    perk: 'Status VIP: nielimitowany eksport Typst/LaTeX i beta bez kolejki.',
    discountPercent: 30,
  },
] as const;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  BASIC_TEMPLATES: 'Podstawowe szablony A4',
  LIVE_HUD_TELEPROMPTER: 'Teleprompter Live HUD',
  DEEP_COMPANY_INTEL: 'Rentgen firmy i pytania strategiczne',
  UNLIMITED_TYPST_EXPORT: 'Eksport Typst / LaTeX bez limitu',
};

export function privilegesForLevel(level: number): LevelPrivileges {
  let match = LEVEL_PRIVILEGES[0];
  for (const entry of LEVEL_PRIVILEGES) if (level >= entry.level) match = entry;
  return match;
}

/** Próg punktowy, od którego funkcja jest w zasięgu. `null` = nigdy z poziomu. */
export function xpRequiredForFeature(feature: FeatureKey): number | null {
  const privilege = LEVEL_PRIVILEGES.find((entry) => entry.features.includes(feature));
  if (!privilege) return null;
  return LEVELS.find((level) => level.level === privilege.level)?.from ?? null;
}

/**
 * Czy użytkownik ma dostęp do funkcji.
 *
 * `hasPaidPass` przechodzi obok poziomu celowo: karnet kupiony za pieniądze nie
 * może być gorszy od karnetu wyklikanego. Uwaga — to jest podpowiedź dla
 * interfejsu, nie egzekucja (reguła 2). O tym, czy żądanie do AI przejdzie,
 * decyduje serwer.
 */
export function hasFeatureAccess(
  xp: number,
  feature: FeatureKey,
  options: { hasPaidPass?: boolean } = {}
): boolean {
  if (options.hasPaidPass) return true;
  return privilegesForLevel(levelForXp(xp).level).features.includes(feature);
}

export function levelForXp(xp: number): LevelDefinition {

  let match = LEVELS[0];
  for (const level of LEVELS) if (xp >= level.from) match = level;
  return match;
}

export function levelProgress(xp: number): LevelProgress {
  const definition = levelForXp(xp);
  const next = LEVELS.find((level) => level.level === definition.level + 1) ?? null;
  if (!next) return { definition, next: null, percent: 100, toNext: 0 };

  const span = next.from - definition.from;
  const gained = Math.max(0, xp - definition.from);
  return {
    definition,
    next,
    percent: Math.min(100, Math.round((gained / span) * 100)),
    toNext: Math.max(0, next.from - xp),
  };
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  /** Warunek na liczniku zdarzeń. Sprawdzany po każdym przyznaniu punktów. */
  isUnlocked: (counters: Record<XpEventId, number>) => boolean;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: 'pierwsza_oferta',
    name: 'Pierwszy zaciąg',
    description: 'Wczytałeś pierwsze ogłoszenie do analizy.',
    isUnlocked: (c) => c.jd_ingested >= 1,
  },
  {
    id: 'pipeline_piatka',
    name: 'Pipeline w ruchu',
    description: 'Pięć aplikacji w Pipelinie naraz.',
    isUnlocked: (c) => c.application_added >= 5,
  },
  {
    id: 'star_trojka',
    name: 'Gotowy na rozmowę',
    description: 'Trzy domknięte historie STAR.',
    isUnlocked: (c) => c.star_completed >= 3,
  },
  {
    id: 'ats_snajper',
    name: 'Snajper ATS',
    description: 'Wynik 85+ na realnym CV.',
    isUnlocked: (c) => c.ats_high_score >= 1,
  },
  {
    id: 'zwiadowca',
    name: 'Zwiadowca',
    description: 'Dziesięć potwierdzonych pytań z prawdziwych rozmów.',
    isUnlocked: (c) => c.question_confirmed >= 10,
  },
] as const;

export interface GamificationState {
  xp: number;
  /** Ile razy padło każde zdarzenie. Podstawa osiągnięć. */
  counters: Record<XpEventId, number>;
  unlockedAchievements: string[];
}

export function emptyGamificationState(): GamificationState {
  return {
    xp: 0,
    counters: {
      jd_ingested: 0,
      application_added: 0,
      star_completed: 0,
      ats_high_score: 0,
      question_confirmed: 0,
      salary_reported: 0,
    },
    unlockedAchievements: [],
  };
}

export interface XpAwardResult {
  state: GamificationState;
  points: number;
  leveledUpTo: LevelDefinition | null;
  newAchievements: AchievementDefinition[];
}

/**
 * Dolicza punkty za zdarzenie i mówi, co się przez to zmieniło.
 *
 * Zwraca *różnicę*, a nie tylko nowy stan, bo interfejs musi wiedzieć, czy
 * pokazać zwykłe „+150 XP", czy fanfarę awansu. Liczenie tego po stronie
 * komponentu (przez porównanie poziomu przed i po) rozjeżdżało się przy dwóch
 * zdarzeniach w tej samej klatce.
 */
export function awardXp(state: GamificationState, eventId: XpEventId): XpAwardResult {
  const definition = XP_EVENTS[eventId];
  const before = levelForXp(state.xp);
  const xp = state.xp + definition.points;
  const counters = { ...state.counters, [eventId]: (state.counters[eventId] ?? 0) + 1 };

  const newAchievements = ACHIEVEMENTS.filter(
    (achievement) =>
      !state.unlockedAchievements.includes(achievement.id) && achievement.isUnlocked(counters)
  );

  const after = levelForXp(xp);

  return {
    state: {
      xp,
      counters,
      unlockedAchievements: [
        ...state.unlockedAchievements,
        ...newAchievements.map((achievement) => achievement.id),
      ],
    },
    points: definition.points,
    leveledUpTo: after.level > before.level ? after : null,
    newAchievements,
  };
}

/** Odsiewa śmieci ze schowka — kształt z dysku nie jest zaufany. */
export function normalizeGamificationState(input: unknown): GamificationState {
  const empty = emptyGamificationState();
  if (!input || typeof input !== 'object') return empty;

  const raw = input as Partial<GamificationState>;
  const counters = { ...empty.counters };
  if (raw.counters && typeof raw.counters === 'object') {
    for (const key of Object.keys(counters) as XpEventId[]) {
      const value = (raw.counters as Record<string, unknown>)[key];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        counters[key] = Math.floor(value);
      }
    }
  }

  return {
    xp: typeof raw.xp === 'number' && Number.isFinite(raw.xp) && raw.xp >= 0 ? Math.floor(raw.xp) : 0,
    counters,
    unlockedAchievements: Array.isArray(raw.unlockedAchievements)
      ? raw.unlockedAchievements.filter((id): id is string => typeof id === 'string')
      : [],
  };
}
