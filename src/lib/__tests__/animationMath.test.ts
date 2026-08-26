import { describe, expect, it } from 'vitest';
import { spotlightCoords } from '../animationMath';

describe('spotlightCoords', () => {
  const rect = { left: 100, top: 50, width: 200, height: 400 };

  it('środek elementu daje 50% na obu osiach', () => {
    expect(spotlightCoords(rect, 200, 250)).toEqual({ x: 50, y: 50 });
  });

  it('lewy górny róg daje 0%/0%', () => {
    expect(spotlightCoords(rect, 100, 50)).toEqual({ x: 0, y: 0 });
  });

  it('prawy dolny róg daje 100%/100%', () => {
    expect(spotlightCoords(rect, 300, 450)).toEqual({ x: 100, y: 100 });
  });

  it('kursor tuż poza krawędzią wychodzi poza zakres zamiast skakać do zera', () => {
    const { x } = spotlightCoords(rect, 90, 250);
    expect(x).toBeLessThan(0);
    expect(x).toBeGreaterThan(-50);
  });

  it('astronomiczne wartości są przycinane do -50..150%', () => {
    // Degenerowany rect (zerowy rozmiar) nie może wyprodukować nieskończonych
    // procentów — gradient z taką pozycją wyszedłby poza sens.
    expect(spotlightCoords({ left: 0, top: 0, width: 0, height: 0 }, -9999, 9999)).toEqual({
      x: -50,
      y: 150,
    });
  });
});
