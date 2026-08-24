/**
 * Ruch po liście podpowiedzi — wydzielony z komponentu, żeby dał się
 * przetestować w Node bez DOM-u (testy tego projektu nie mają jsdom).
 * W `Combobox.tsx` zostaje samo spięcie z klawiaturą.
 */

/** `-1` znaczy „nic nie jest aktywne" i jest stanem początkowym, nie błędem. */
export const NO_ACTIVE_OPTION = -1;

export type ComboboxKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End' | 'Escape';

/**
 * Nowy indeks aktywnej pozycji.
 *
 * Zawijanie na obu końcach: lista podpowiedzi jest krótka, więc szybciej jest
 * przewinąć ją w drugą stronę niż zatrzymać się na krańcu i szukać przeciwnej
 * strzałki.
 *
 * ↓ z `NO_ACTIVE_OPTION` wchodzi na pierwszą pozycję, ↑ na ostatnią —
 * to jest jedyny sposób, w jaki cokolwiek staje się aktywne, i dlatego samo
 * otwarcie listy nie zaznacza niczego. Bez tego `Enter` zaraz po wpisaniu
 * własnej wartości zatwierdzałby podpowiedź zamiast tego, co użytkownik
 * napisał — czyli aplikacja wpisywałaby za niego.
 */
export function moveActiveOption(current: number, count: number, key: ComboboxKey): number {
  if (count <= 0) return NO_ACTIVE_OPTION;

  switch (key) {
    case 'ArrowDown':
      return current >= count - 1 ? 0 : current + 1;
    case 'ArrowUp':
      return current <= 0 ? count - 1 : current - 1;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    case 'Escape':
      return NO_ACTIVE_OPTION;
  }
}

/**
 * Czy `Enter` ma wybrać podpowiedź, czy przepuścić to, co wpisano.
 *
 * Wybiera **wyłącznie** wtedy, gdy użytkownik sam wskazał pozycję strzałkami.
 * To jest ten jeden warunek, na którym stoi zasada „nic nie wpisuje się samo".
 */
export function shouldPickOnEnter(activeIndex: number, count: number): boolean {
  return activeIndex >= 0 && activeIndex < count;
}
