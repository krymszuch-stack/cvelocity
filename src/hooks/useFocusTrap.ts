import { useEffect, useRef, RefObject } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Więzienie fokusu dla okien dialogowych.
 *
 * Trzy gwarancje, bez których pułapka jest iluzją:
 * 1. **Wejście** — fokus trafia w pierwszy sterowalny element (albo w sam
 *    kontener, gdy treść renderuje się asynchronicznie i chwilowo jest pusta).
 * 2. **Cykl** — Tab/Shift+Tab nie wyprowadzają poza kontener; zestaw elementów
 *    odpytywany jest przy KAŻDYM naciśnięciu, bo modale typu kreator zmieniają
 *    zawartość między krokami.
 * 3. **Wyjście** — fokus wraca dokładnie do elementu, który otworzył modal;
 *    bez tego użytkownik klawiatury ląduje na początku strony i musi od nowa
 *    tabować do miejsca, w którym skończył.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Snapshot PRZED jakimkolwiek przeniesieniem fokusa — to jest punkt
    // powrotu po zamknięciu.
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Scroll-lock: tło nie przewija się spod modala (kółko myszy nad backdropem
    // nie powinno ruszać strony). Restore w cleanup przywraca wcześniejszy stan,
    // także wtedy, gdy modal zamknął inny modal — bez kradzieży wartości.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const container = containerRef.current;
    if (!container) return;

    const focusFirst = () => {
      const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      if (elements.length > 0) {
        elements[0].focus();
      } else {
        // Treść jeszcze nie istnieje (asynchroniczny import, animacja wejścia).
        // Kontener ma tabIndex=-1, więc przyjmuje fokus bez wpisywania go
        // w sekwencję tabulacji strony.
        container.focus();
      }
    };
    focusFirst();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Powrót do wywołującego — sedno dostępności modali.
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
      document.body.style.overflow = previousOverflow;
    };
  }, [isActive]);

  return containerRef;
}
