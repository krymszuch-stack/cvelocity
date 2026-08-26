import { describe, expect, it } from 'vitest';
import { formatDecimalPl, pluralPl } from '../pluralFormat';

describe('pluralPl — polska odmiana po liczebniku', () => {
  it('dokłada formę pojedynczą dla 1 i -1', () => {
    expect(pluralPl(1, 'pozycja', 'pozycje', 'pozycji')).toBe('pozycja');
    expect(pluralPl(-1, 'dzień', 'dni', 'dni')).toBe('dzień');
  });

  it('dokuje formę mnogą dla 2–4 poza 12–14', () => {
    expect(pluralPl(2, 'pozycja', 'pozycje', 'pozycji')).toBe('pozycje');
    expect(pluralPl(4, 'certyfikat', 'certyfikaty', 'certyfikatów')).toBe('certyfikaty');
    expect(pluralPl(22, 'rozbieżność', 'rozbieżności', 'rozbieżności')).toBe('rozbieżności');
  });

  it('dokuje dopełniacz dla 5+ oraz dla 12–14', () => {
    expect(pluralPl(5, 'pozycja', 'pozycje', 'pozycji')).toBe('pozycji');
    expect(pluralPl(12, 'pozycja', 'pozycje', 'pozycji')).toBe('pozycji');
    expect(pluralPl(114, 'dzień', 'dni', 'dni')).toBe('dni');
    expect(pluralPl(0, 'pozycja', 'pozycje', 'pozycji')).toBe('pozycji');
  });
});

describe('formatDecimalPl — przecinek dziesiętny zamiast kropki z toFixed', () => {
  it('wypisuje przecinek i stałą liczbę miejsc', () => {
    expect(formatDecimalPl(31.25, 2)).toBe('31,25');
    expect(formatDecimalPl(2, 1)).toBe('2,0');
    expect(formatDecimalPl(0.5, 2)).toBe('0,50');
  });

  it('grupuje tysiące zgodnie z pl-PL', () => {
    expect(formatDecimalPl(1234.5, 1)).toBe('1234,5');
  });
});
