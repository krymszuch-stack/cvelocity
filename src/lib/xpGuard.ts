/**
 * Warstwa anty-farmingu punktów — czysta logika, zero DOM-u i zero schowka.
 *
 * `gamification.ts` odpowiada na pytanie „ile to jest warte”. Ten moduł
 * odpowiada na wcześniejsze: „czy to w ogóle należy się po raz kolejny”.
 * Rozdzielenie jest celowe — ekonomia punktów zmienia się przy dokładaniu
 * funkcji, a reguły uczciwości nie, i nie chcemy ich przy okazji ruszać.
 *
 * Trzy niezależne bariery, każda z osobnym komunikatem dla użytkownika:
 *   1. deduplikacja po skrócie celu — jedno ogłoszenie to jedna nagroda,
 *   2. dzienny limit sztuk per zdarzenie — pięć ofert, trzy historie STAR,
 *   3. dzienny limit punktów (800 XP) — sufit dla skryptu klikającego w pętli.
 *
 * Do tego dowód pracy (`proof`): zdarzenie, które da się wywołać jednym
 * kliknięciem, nagradzamy tylko wtedy, gdy towarzyszy mu realny wkład — opis
 * o sensownej długości, czas spędzony w widoku, poprawne widełki. Bez tego
 * „+150 XP” byłoby nagrodą za nic, czyli dokładnie tym, co wycina reguła 1
 * z `AGENTS.md`.
 *
 * Każdy odrzut ma gotowy, ludzki komunikat. To nie kosmetyka: cicho zignorowana
 * akcja generuje zgłoszenie do supportu, a zdanie „punkty za to ogłoszenie już
 * naliczyliśmy” zamyka sprawę bez niego.
 */

import { XP_EVENTS, XpEventId } from './gamification';

/** Sufit dobowy. Powyżej niego nie ma już czego zdobyć do północy. */
export const DAILY_XP_CAP = 800;

/** Ile razy na dobę dane zdarzenie w ogóle może się opłacić. */
export const DAILY_EVENT_LIMITS: Record<XpEventId, number> = {
  jd_ingested: 5,
  application_added: 5,
  star_completed: 3,
  ats_high_score: 3,
  question_confirmed: 5,
  salary_reported: 5,
};

/** Dowód pracy wymagany przy zdarzeniu. Brak wpisu = wystarczy sam fakt. */
export interface XpProofRequirement {
  /** Minimalna długość treści, z której zdarzenie powstało. */
  minChars?: number;
  /** Minimalny czas spędzony w widoku, w sekundach. */
  minDwellSeconds?: number;
  /** Widełki muszą być liczbami i mieć sens (min < max). */
  requiresSalaryRange?: boolean;
}

export const PROOF_REQUIREMENTS: Partial<Record<XpEventId, XpProofRequirement>> = {
  jd_ingested: { minChars: 200 },
  star_completed: { minDwellSeconds: 45, minChars: 120 },
  salary_reported: { requiresSalaryRange: true },
};

/** Co wołający może pokazać na dowód. Wszystko opcjonalne — brak = brak dowodu. */
export interface XpProof {
  chars?: number;
  dwellSeconds?: number;
  salary?: { min: number; max: number; currency: string };
}

export interface XpLedgerEntry {
  eventId: XpEventId;
  /** Skrót celu: adres ogłoszenia, identyfikator historii, id oferty. */
  targetHash: string;
  points: number;
  /** Znacznik czasu w ms. */
  at: number;
}

export interface XpLedger {
  entries: XpLedgerEntry[];
}

export function emptyXpLedger(): XpLedger {
  return { entries: [] };
}

/**
 * Skrót celu — djb2 w zapisie szesnastkowym.
 *
 * Świadomie nie SHA-256: `crypto.subtle` jest asynchroniczne i dostępne tylko
 * w bezpiecznym kontekście, a to jest deduplikator w schowku jednej
 * przeglądarki, nie zabezpieczenie kryptograficzne. Wersja serwerowa liczy
 * skrót po swojemu i nie ufa temu, co przyjdzie z klienta.
 */
export function hashTarget(value: string): string {
  const normalized = value.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Początek doby lokalnej — limity resetują się o północy użytkownika. */
export function startOfDay(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function dailyXp(ledger: XpLedger, now: number = Date.now()): number {
  const from = startOfDay(now);
  return ledger.entries
    .filter((entry) => entry.at >= from)
    .reduce((sum, entry) => sum + entry.points, 0);
}

export function dailyCount(ledger: XpLedger, eventId: XpEventId, now: number = Date.now()): number {
  const from = startOfDay(now);
  return ledger.entries.filter((entry) => entry.at >= from && entry.eventId === eventId).length;
}

export type XpRejectionReason =
  | 'ALREADY_CLAIMED'
  | 'DAILY_CAP_REACHED'
  | 'DAILY_EVENT_LIMIT'
  | 'PROOF_INSUFFICIENT';

export interface XpClaimRequest {
  eventId: XpEventId;
  /** Cel akcji: adres oferty, id historii STAR, id aplikacji. */
  target: string;
  proof?: XpProof;
}

export interface XpVerdict {
  granted: boolean;
  points: number;
  reason?: XpRejectionReason;
  /** Komunikat dla użytkownika. Zawsze wypełniony, także przy zgodzie. */
  message: string;
  /** Rejestr po decyzji — przy odrzucie identyczny z wejściowym. */
  ledger: XpLedger;
}

function proofVerdict(eventId: XpEventId, proof?: XpProof): string | null {
  const requirement = PROOF_REQUIREMENTS[eventId];
  if (!requirement) return null;

  if (requirement.minChars !== undefined) {
    const chars = proof?.chars ?? 0;
    if (chars < requirement.minChars) {
      return `Treść jest za krótka na punkty (${chars} z ${requirement.minChars} znaków). Wklej pełne ogłoszenie albo dopisz szczegóły.`;
    }
  }

  if (requirement.minDwellSeconds !== undefined) {
    const dwell = proof?.dwellSeconds ?? 0;
    if (dwell < requirement.minDwellSeconds) {
      return `Punkty naliczamy po ${requirement.minDwellSeconds} sekundach realnej pracy nad odpowiedzią. Tym razem było ich ${Math.round(dwell)}.`;
    }
  }

  if (requirement.requiresSalaryRange) {
    const salary = proof?.salary;
    const valid =
      salary !== undefined &&
      Number.isFinite(salary.min) &&
      Number.isFinite(salary.max) &&
      salary.min > 0 &&
      salary.min < salary.max &&
      /^[A-Z]{3}$/.test(salary.currency);
    if (!valid) {
      return 'Widełki muszą być dwiema liczbami — dolna mniejsza od górnej — i mieć walutę (np. PLN).';
    }
  }

  return null;
}

/**
 * Ocenia zgłoszenie punktów i zwraca rejestr po decyzji.
 *
 * Funkcja niczego nie zapisuje: sklep bierze `verdict.ledger` i utrwala go sam.
 * Dzięki temu ten sam kod odpowiada w testach w Node i w przeglądarce, a decyzja
 * jest odtwarzalna z pary (rejestr, teraz).
 */
export function evaluateXpClaim(
  ledger: XpLedger,
  request: XpClaimRequest,
  now: number = Date.now()
): XpVerdict {
  const { eventId, target, proof } = request;
  const definition = XP_EVENTS[eventId];
  const points = definition.points;
  const targetHash = hashTarget(target);

  const duplicate = ledger.entries.some(
    (entry) => entry.eventId === eventId && entry.targetHash === targetHash
  );
  if (duplicate) {
    return {
      granted: false,
      points: 0,
      reason: 'ALREADY_CLAIMED',
      message: 'Punkty za to konkretne zadanie już naliczyliśmy (jedno zadanie = jedna nagroda).',
      ledger,
    };
  }

  const proofProblem = proofVerdict(eventId, proof);
  if (proofProblem) {
    return {
      granted: false,
      points: 0,
      reason: 'PROOF_INSUFFICIENT',
      message: proofProblem,
      ledger,
    };
  }

  const limit = DAILY_EVENT_LIMITS[eventId];
  if (dailyCount(ledger, eventId, now) >= limit) {
    return {
      granted: false,
      points: 0,
      reason: 'DAILY_EVENT_LIMIT',
      message: `Dzienny limit dla tej akcji to ${limit}. Reszta pracy się liczy — punkty wrócą po północy.`,
      ledger,
    };
  }

  const used = dailyXp(ledger, now);
  if (used >= DAILY_XP_CAP) {
    return {
      granted: false,
      points: 0,
      reason: 'DAILY_CAP_REACHED',
      message: `Osiągnięto dzienny limit punktów (${DAILY_XP_CAP}/${DAILY_XP_CAP}). Licznik zeruje się o północy.`,
      ledger,
    };
  }

  // Przy sufcie przycinamy nagrodę zamiast ją odrzucać: akcja się wydarzyła,
  // więc odesłanie użytkownika z zerem byłoby karą za dobrą robotę.
  const awarded = Math.min(points, DAILY_XP_CAP - used);

  return {
    granted: true,
    points: awarded,
    message:
      awarded < points
        ? `+${awarded} XP — to ostatnie punkty na dziś (limit ${DAILY_XP_CAP} XP).`
        : `+${awarded} XP`,
    ledger: {
      entries: [...ledger.entries, { eventId, targetHash, points: awarded, at: now }],
    },
  };
}

/** Rejestr trzymamy dwa tygodnie: dłużej nie jest już do niczego potrzebny. */
export const LEDGER_RETENTION_DAYS = 14;

export function pruneLedger(ledger: XpLedger, now: number = Date.now()): XpLedger {
  const cutoff = now - LEDGER_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return { entries: ledger.entries.filter((entry) => entry.at >= cutoff) };
}

/** Odsiewa śmieci ze schowka — kształt z dysku nie jest zaufany. */
export function normalizeXpLedger(input: unknown): XpLedger {
  if (!input || typeof input !== 'object') return emptyXpLedger();
  const raw = (input as { entries?: unknown }).entries;
  if (!Array.isArray(raw)) return emptyXpLedger();

  const entries = raw.flatMap((item): XpLedgerEntry[] => {
    if (!item || typeof item !== 'object') return [];
    const entry = item as Partial<XpLedgerEntry>;
    if (typeof entry.eventId !== 'string' || !(entry.eventId in XP_EVENTS)) return [];
    if (typeof entry.targetHash !== 'string' || !entry.targetHash) return [];
    if (typeof entry.points !== 'number' || !Number.isFinite(entry.points) || entry.points < 0) return [];
    if (typeof entry.at !== 'number' || !Number.isFinite(entry.at)) return [];
    return [
      {
        eventId: entry.eventId as XpEventId,
        targetHash: entry.targetHash,
        points: Math.floor(entry.points),
        at: entry.at,
      },
    ];
  });

  return { entries };
}
