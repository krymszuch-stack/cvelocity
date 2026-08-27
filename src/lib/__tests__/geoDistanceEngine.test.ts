import { describe, it, expect } from 'vitest';
import {
  getGeoDistanceRegistry,
  normalizeLocalityName,
} from '../geoDistance';

describe('Silnik Relacji Odległości Miejscowości w Polsce (GeoDistanceEngine)', () => {
  const registry = getGeoDistanceRegistry();

  it('poprawnie normalizuje nazwy miejscowości z polskimi znakami i aliasami', () => {
    expect(normalizeLocalityName('Kraków')).toBe('krakow');
    expect(normalizeLocalityName('Gdańsk')).toBe('gdansk');
    expect(normalizeLocalityName('Tarnobrzeg')).toBe('tarnobrzeg');
    expect(normalizeLocalityName('Świętochłowice')).toBe('swietochlowice');
  });

  it('wyszukuje miejscowości po nazwie, ID oraz aliasach (np. Krk, Wwa, 3city, GOP)', () => {
    expect(registry.findLocality('Kraków')?.id).toBe('krakow');
    expect(registry.findLocality('krk')?.id).toBe('krakow');
    expect(registry.findLocality('wwa')?.id).toBe('warszawa');
    expect(registry.findLocality('Tarnów')?.id).toBe('tarnow');
    expect(registry.findLocality('Chorzów')?.id).toBe('chorzow');
    expect(registry.findLocality('Gdańsk')?.id).toBe('gdansk');
  });

  it('precyzyjnie wylicza odległość drogową Kraków ↔ Tarnów (~80-84 km, Korytarz A4)', () => {
    const res = registry.calculateCommute('Kraków', 'Tarnów');
    expect(res).not.toBeNull();
    expect(res!.directDistanceKm).toBeGreaterThan(70);
    expect(res!.directDistanceKm).toBeLessThan(80);

    // Drogowo A4: ~82-84 km
    expect(res!.roadDistanceKm).toBeGreaterThanOrEqual(80);
    expect(res!.roadDistanceKm).toBeLessThanOrEqual(86);
    expect(res!.corridor).toBe('A4_CORRIDOR');
    expect(res!.estimatedDriveTimeMinutes).toBeGreaterThanOrEqual(45);
    expect(res!.estimatedDriveTimeMinutes).toBeLessThanOrEqual(65);
  });

  it('precyzyjnie wylicza odległość drogową Kraków ↔ Warszawa (~290-300 km, Korytarz S7)', () => {
    const res = registry.calculateCommute('Kraków', 'Warszawa');
    expect(res).not.toBeNull();
    expect(res!.directDistanceKm).toBeGreaterThan(245);
    expect(res!.directDistanceKm).toBeLessThan(260);

    // Drogowo S7: ~290-300 km
    expect(res!.roadDistanceKm).toBeGreaterThanOrEqual(285);
    expect(res!.roadDistanceKm).toBeLessThanOrEqual(305);
    expect(res!.corridor).toBe('S7_CORRIDOR');
  });

  it('precyzyjnie wylicza odległość drogową Kraków ↔ Gdańsk (~575-590 km)', () => {
    const res = registry.calculateCommute('Kraków', 'Gdańsk');
    expect(res).not.toBeNull();
    expect(res!.directDistanceKm).toBeGreaterThan(480);
    expect(res!.directDistanceKm).toBeLessThan(500);

    // Drogowo A1/S7: ~580 km
    expect(res!.roadDistanceKm).toBeGreaterThanOrEqual(570);
    expect(res!.roadDistanceKm).toBeLessThanOrEqual(595);
  });

  it('precyzyjnie wylicza odległość drogową Kraków ↔ Chorzów (~78-84 km, Korytarz A4/GOP)', () => {
    const res = registry.calculateCommute('Kraków', 'Chorzów');
    expect(res).not.toBeNull();

    // Drogowo A4 do Chorzowa: ~80 km
    expect(res!.roadDistanceKm).toBeGreaterThanOrEqual(78);
    expect(res!.roadDistanceKm).toBeLessThanOrEqual(85);
    expect(res!.corridor).toBe('A4_CORRIDOR');
  });

  it('precyzyjnie wylicza odległość wewnątrz aglomeracji Katowice ↔ Chorzów (~7-9 km)', () => {
    const res = registry.calculateCommute('Katowice', 'Chorzów');
    expect(res).not.toBeNull();
    expect(res!.isSameUrbanArea).toBe(true);
    expect(res!.corridor).toBe('URBAN_AGGLOMERATION');

    // Odległość miejska: ~7-9 km
    expect(res!.roadDistanceKm).toBeGreaterThanOrEqual(7);
    expect(res!.roadDistanceKm).toBeLessThanOrEqual(10);
    expect(res!.estimatedDriveTimeMinutes).toBeLessThanOrEqual(20);
  });

  it('precyzyjnie wylicza odległość drogową Gdańsk ↔ Warszawa (~335-345 km, Korytarz S7/A1)', () => {
    const res = registry.calculateCommute('Gdańsk', 'Warszawa');
    expect(res).not.toBeNull();

    // Drogowo S7: ~340 km
    expect(res!.roadDistanceKm).toBeGreaterThanOrEqual(330);
    expect(res!.roadDistanceKm).toBeLessThanOrEqual(350);
    expect(res!.corridor).toBe('S7_CORRIDOR');
  });

  it('generuje relacyjną macierz N x N odległości i czasów dojazdu', () => {
    const subList = [
      registry.findLocality('krakow')!,
      registry.findLocality('warszawa')!,
      registry.findLocality('tarnow')!,
      registry.findLocality('chorzow')!,
      registry.findLocality('gdansk')!,
    ];

    const matrix = registry.generateDistanceMatrix(subList);
    // 5 miast -> 5 * 4 = 20 unikalnych skierowanych par
    expect(matrix.length).toBe(20);

    const krkTarnow = matrix.find((p) => p.fromId === 'krakow' && p.toId === 'tarnow');
    expect(krkTarnow).toBeDefined();
    expect(krkTarnow?.roadDistanceKm).toBeGreaterThanOrEqual(80);
    expect(krkTarnow?.roadDistanceKm).toBeLessThanOrEqual(86);
  });

  it('oblicza koszty paliwa i czas dojazdu w jedną stronę i miesięcznie', () => {
    const res = registry.calculateCommute('Tarnów', 'Kraków');
    expect(res).not.toBeNull();

    expect(res!.estimatedFuelCostOneWayPln).toBeGreaterThan(30);
    expect(res!.estimatedFuelCostOneWayPln).toBeLessThan(50);
    // 20 dni w 2 strony
    expect(res!.estimatedMonthlyFuelCostPln).toBeGreaterThan(1200);
    expect(res!.estimatedMonthlyFuelCostPln).toBeLessThan(2000);
  });
});
