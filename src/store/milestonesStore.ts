import { UxLiveState, UxMilestones, loadMilestones, reconcileMilestones, saveMilestones } from '../lib/uxMilestones';

/**
 * Kamienie milowe trzymane poza Reactem.
 *
 * Kuszące było zamknąć je w `useState` i przeliczać efektem, ale wychodził
 * z tego dokładnie ten wzorzec, przed którym ostrzega `react-hooks`: efekt,
 * który ustawia stan, po czym powoduje kolejny render. Sklep modułowy plus
 * `useSyncExternalStore` w haku odwraca zależność — React czyta migawkę,
 * zamiast być źródłem prawdy dla czegoś, co i tak musi przeżyć przeładowanie
 * strony.
 */

let milestones: UxMilestones = loadMilestones();
const listeners = new Set<() => void>();

/**
 * Migawka. Musi oddawać **tę samą referencję**, dopóki nic się nie zmieniło —
 * `useSyncExternalStore` porównuje wynik tożsamością i nowy obiekt przy każdym
 * wywołaniu wpędziłby go w nieskończoną pętlę renderów.
 */
export function getMilestones(): UxMilestones {
  return milestones;
}

export function subscribeMilestones(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Dopisuje kamienie milowe wynikające z bieżącego stanu. Bez zmiany — bez
 * powiadomienia, więc wywoływanie tego przy każdym renderze jest bezpieczne.
 */
export function syncMilestones(state: UxLiveState): void {
  const next = reconcileMilestones(milestones, state, new Date());
  if (next === milestones) return;

  milestones = next;
  saveMilestones(next);
  listeners.forEach((notify) => notify());
}

/** Odhacza jednorazową podpowiedź o skrótach klawiszowych. */
export function markShortcutsHintSeen(): void {
  if (milestones.shortcutsHintSeenAt) return;

  milestones = { ...milestones, shortcutsHintSeenAt: new Date().toISOString() };
  saveMilestones(milestones);
  listeners.forEach((notify) => notify());
}
