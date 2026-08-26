/**
 * Czysta matematyka animacji — bez DOM, bez Reacta. Testy biegną w Node,
 * więc wszystko, co da się wyrazić na liczbach i prostych obiektach, mieszka
 * tutaj zamiast wewnątrz komponentów (wzorzec: logika poza DOM-em jest
 * testowalna, komponent zostaje cienkim spięciem).
 */

/** Kształt wystarczający do policzenia pozycji kursora — getBoundingClientRect
 *  nie istnieje w Node, więc testy podają zwykły obiekt z tymi polami. */
export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SpotlightCoords {
  /** Pozycja pozioma jako procent szerokości elementu. */
  x: number;
  /** Pozycja pionowa jako procent wysokości elementu. */
  y: number;
}

/**
 * Pozycja kursora względem elementu, w procentach jego wymiarów.
 *
 * Zwracane wartości zasiliłyby `radial-gradient(... at var(--spot-x) ...)`.
 * Przycinamy do -50..150%, bo degenerowany rect (zerowy rozmiar, ujemny) mógłby
 * wyprodukować astronomiczne procenty i gradient wyszedłby poza sens.
 */
export function spotlightCoords(
  rect: RectLike,
  clientX: number,
  clientY: number,
): SpotlightCoords {
  const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 100;
  const y = ((clientY - rect.top) / Math.max(rect.height, 1)) * 100;

  const clamp = (value: number) => Math.max(-50, Math.min(150, value));

  return { x: clamp(x), y: clamp(y) };
}
