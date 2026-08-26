import { useEffect, useState } from 'react';
import {
  AchievementDefinition,
  GamificationState,
  LevelDefinition,
  XpEventId,
  awardXp as awardXpPure,
  emptyGamificationState,
  levelProgress,
  normalizeGamificationState,
  XP_EVENTS,
} from '../lib/gamification';
import {
  DAILY_XP_CAP,
  XpLedger,
  XpProof,
  XpVerdict,
  dailyXp,
  emptyXpLedger,
  evaluateXpClaim,
  normalizeXpLedger,
  pruneLedger,
} from '../lib/xpGuard';
import { StorageKeys, onAppStorageWiped, readJson, writeJson } from '../lib/storage';
import { showToast } from './useToastStore';
import { api } from '../lib/apiClient';

/**
 * Stan gamifikacji — cienkie spięcie wokół `src/lib/gamification.ts`.
 *
 * Sklep bez zależności, na wzór `useApplications`: moduł trzyma jedną kopię
 * stanu, komponenty dostają ją przez nasłuch. Zapis do schowka idzie od razu —
 * to kilkadziesiąt bajtów, więc odkładanie go kupiłoby wyłącznie okno na utratę
 * punktów (reguła 9 w `AGENTS.md`).
 *
 * Schowek jest źródłem prawdy, serwer kopią. Odwrotna kolejność znaczyłaby, że
 * w trybie `local` — bez konta — gamifikacja nie działa wcale, a to jest tryb,
 * w którym aplikacja ma działać w całości.
 */

let state: GamificationState = normalizeGamificationState(
  readJson<unknown>(StorageKeys.gamification, null)
);

let ledger: XpLedger = pruneLedger(
  normalizeXpLedger(readJson<unknown>(StorageKeys.xpLedger, null))
);

const listeners = new Set<() => void>();

/** Powiadomienie do pokazania: pojedynczy przyrost punktów albo awans. */
export interface XpNotice {
  id: string;
  points: number;
  label: string;
  leveledUpTo: LevelDefinition | null;
  achievements: AchievementDefinition[];
}

let notices: XpNotice[] = [];
const noticeListeners = new Set<() => void>();

function commit(next: GamificationState): void {
  state = next;
  writeJson(StorageKeys.gamification, next);
  listeners.forEach((notify) => notify());

  // Kopia na serwerze jest opcjonalna: bez sesji trasa odpowie 401, a to nie
  // jest błąd, który miałby czymkolwiek strzelić w interfejsie. Punkty i tak
  // leżą już w schowku.
  void api.put('/api/gamification', { xp: next.xp, counters: next.counters, achievements: next.unlockedAchievements })
    .catch(() => undefined);
}

function commitLedger(next: XpLedger): void {
  ledger = pruneLedger(next);
  writeJson(StorageKeys.xpLedger, ledger);
  listeners.forEach((notify) => notify());
}

onAppStorageWiped(() => {
  state = emptyGamificationState();
  ledger = emptyXpLedger();
  listeners.forEach((notify) => notify());
});

function pushNotice(notice: XpNotice): void {
  notices = [...notices, notice];
  noticeListeners.forEach((notify) => notify());
  // Ten sam czas życia co w `useToastStore` — dwa różne czasy znikania obok
  // siebie wyglądają jak usterka.
  setTimeout(() => dismissXpNotice(notice.id), 3600);
}

export function dismissXpNotice(id: string): void {
  notices = notices.filter((notice) => notice.id !== id);
  noticeListeners.forEach((notify) => notify());
}

/**
 * Przyznaje punkty za zdarzenie i kolejkuje powiadomienie.
 *
 * Wołane z warstwy, która *wie*, że coś się faktycznie stało — nie z efektu
 * renderującego się przy każdym wejściu na widok. XP za obejrzenie ekranu to
 * dokładnie ta klasa fałszywej informacji zwrotnej, którą wycina reguła 1.
 */
export function grantXp(eventId: XpEventId, target?: string, proof?: XpProof): XpVerdict {
  // Brak celu znaczy „to zdarzenie jest z natury jednorazowe w swoim kontekście”
  // — wtedy deduplikacja opiera się na znaczniku czasu i realnie nie działa.
  // Wołający, który ma identyfikator oferty czy historii, ma go podać.
  const verdict = evaluateXpClaim(ledger, {
    eventId,
    target: target ?? `${eventId}:${Date.now()}`,
    proof,
  });

  if (!verdict.granted) {
    // Cisza w tym miejscu to najczęstsze pytanie do supportu: „kliknąłem,
    // a punktów nie ma”. Powód zawsze mówimy wprost.
    showToast('Bez punktów tym razem', { message: verdict.message, variant: 'info' });
    return verdict;
  }

  commitLedger(verdict.ledger);

  const result = awardXpPure(state, eventId);
  // Sufit dobowy potrafi przyciąć nagrodę — licznik zdarzeń rośnie normalnie,
  // ale do sumy trafia tyle, ile realnie przyznaliśmy.
  const clipped = verdict.points - result.points;
  commit({ ...result.state, xp: result.state.xp + clipped });

  pushNotice({
    id: `xp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    points: verdict.points,
    label: XP_EVENTS[eventId].label,
    leveledUpTo: result.leveledUpTo,
    achievements: result.newAchievements,
  });

  return verdict;
}

/** Alias czytelny w miejscach wywołania: „zgłaszam roszczenie”, nie „daję XP”. */
export const claimXp = grantXp;

/** Ile z dobowego limitu zostało. Pasek w interfejsie żyje z tej liczby. */
export function getDailyXpUsage(): { used: number; cap: number } {
  return { used: dailyXp(ledger), cap: DAILY_XP_CAP };
}

export function getGamificationState(): GamificationState {
  return state;
}

export function useGamification() {
  const [snapshot, setSnapshot] = useState<GamificationState>(state);

  useEffect(() => {
    const listener = () => setSnapshot(state);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { ...snapshot, progress: levelProgress(snapshot.xp), daily: getDailyXpUsage() };
}

export function useXpNotices(): XpNotice[] {
  const [snapshot, setSnapshot] = useState<XpNotice[]>(notices);

  useEffect(() => {
    const listener = () => setSnapshot(notices);
    noticeListeners.add(listener);
    listener();
    return () => {
      noticeListeners.delete(listener);
    };
  }, []);

  return snapshot;
}
