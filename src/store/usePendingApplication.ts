import { useEffect, useState } from 'react';
import type { PendingApplication } from '../lib/applicationFeedback';

/**
 * Jedna oferta czekająca na pytanie „udało się zaaplikować?".
 *
 * Osobny moduł, a nie pole w `useAppStore`: ten stan ma własny wyzwalacz spoza
 * Reacta (powrót do karty przeglądarki po kliknięciu „Aplikuj teraz”), a
 * `useAppStore` jest świadomie tylko o tym, co jest otwarte na ekranie. Wzorzec
 * sklepu bez zależności jest ten sam co w `useApplications`.
 *
 * Nic tu nie trafia do schowka. Pytanie dotyczy czynności sprzed sekund; wpis
 * przywrócony po tygodniu z `localStorage` pytałby o coś, czego użytkownik już
 * nie pamięta — i tak dostałby odpowiedź zgadywaną, czyli wymyśloną (reguła 1).
 */

let pending: PendingApplication | null = null;
/** Oferty już odpytane w tej sesji — druga ankieta o to samo to nagabywanie. */
const answered = new Set<string>();
const listeners = new Set<() => void>();
/** Uchwyt opóźnienia — bez niego dwa eksporty pod rząd dałyby dwa pytania. */
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Zwłoka po eksporcie. Pytanie zaraz po kliknięciu „Pobierz” trafia w moment,
 * w którym użytkownik patrzy na pasek pobierania, a nie na aplikację — i tak
 * zostałoby odklikane odruchowo. Cztery sekundy to środek widełek 3–5 s.
 */
export const CONFIRMATION_DELAY_MS = 4000;

function emit(): void {
  listeners.forEach((notify) => notify());
}

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

/**
 * Zgłasza, że użytkownik właśnie wyeksportował dokument dla tej oferty.
 * Wołane z warstwy, która *wie*, że eksport się wydarzył — nigdy z efektu
 * renderującego, bo wtedy pytanie wyskakiwałoby przy samym wejściu na ekran.
 *
 * `delayMs` to furtka dla ścieżki powrotu z portalu, gdzie zwłoka jest zbędna:
 * użytkownik już przełączył kartę, więc patrzy na nas.
 */
export function requestApplicationConfirmation(
  job: PendingApplication,
  delayMs: number = CONFIRMATION_DELAY_MS
): void {
  if (!job.company?.trim() || !job.title?.trim()) return;
  if (answered.has(job.jobId)) return;

  clearTimer();

  const show = () => {
    timer = null;
    if (answered.has(job.jobId)) return;
    pending = job;
    emit();
  };

  if (delayMs <= 0) {
    show();
    return;
  }
  timer = setTimeout(show, delayMs);
}

/** Zamknięcie bez odpowiedzi — „przypomnij później” w tej samej sesji. */
export function dismissPendingConfirmation(): void {
  clearTimer();
  pending = null;
  emit();
}


/** Odpowiedź udzielona: chowamy widget i nie wracamy do tej oferty. */
export function resolvePendingConfirmation(jobId: string): void {
  clearTimer();
  answered.add(jobId);
  pending = null;
  emit();
}


/**
 * Kliknięcie „Aplikuj teraz”: pytanie ma się pokazać dopiero, gdy użytkownik
 * wróci z portalu. `visibilitychange` zamiast `focus`, bo przełączenie karty
 * nie zawsze daje focus na oknie, a na iOS `focus` bywa pomijany zupełnie.
 */
export function noteApplyLinkOpened(job: PendingApplication): void {
  if (typeof document === 'undefined') return;
  if (!job.company?.trim() || !job.title?.trim()) return;
  if (answered.has(job.jobId)) return;

  const onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', onVisible);
    // Bez zwłoki: powrót na kartę sam jest dowodem, że użytkownik tu patrzy.
    requestApplicationConfirmation(job, 0);

  };

  document.addEventListener('visibilitychange', onVisible);
}

export function usePendingApplication(): PendingApplication | null {
  const [state, setState] = useState<PendingApplication | null>(pending);

  useEffect(() => {
    const listener = () => setState(pending);
    listeners.add(listener);
    // Stan mógł się zmienić między pierwszym renderem a podpięciem nasłuchu.
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}

/** Wyłącznie na potrzeby testów — produkcja żyje jedną sesją. */
export function resetPendingApplicationStore(): void {
  clearTimer();
  pending = null;
  answered.clear();
}

