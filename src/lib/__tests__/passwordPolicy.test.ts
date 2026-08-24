import { describe, expect, it } from 'vitest';
import {
  checkPassword,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  passwordStrength,
} from '../passwordPolicy';

describe('polityka haseł', () => {
  it('przyjmuje hasło spełniające wszystkie wymagania', () => {
    expect(checkPassword('Poprawne1Haslo', 'jan@example.com')).toEqual({ ok: true, problems: [] });
  });

  it('wymienia wszystkie braki naraz, a nie pierwszy z brzegu', () => {
    // Użytkownik ma poprawić hasło raz, a nie dowiadywać się o kolejnym
    // wymaganiu po każdej próbie.
    const { ok, problems } = checkPassword('krotkie');
    expect(ok).toBe(false);
    expect(problems.length).toBeGreaterThanOrEqual(3);
  });

  it('odrzuca hasło krótsze niż próg', () => {
    const { problems } = checkPassword('Krotkie1');
    expect(problems.join(' ')).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it('odrzuca hasło dłuższe niż limit, który i tak zostałby przycięty', () => {
    const { problems } = checkPassword('A1' + 'a'.repeat(MAX_PASSWORD_LENGTH));
    expect(problems.join(' ')).toContain(String(MAX_PASSWORD_LENGTH));
  });

  it('uznaje polskie znaki za litery', () => {
    // „ł" jest małą literą, „Ż" wielką. Zakres [a-z] by ich nie zobaczył
    // i kazał Polakowi dopisywać angielskie znaki do własnego hasła.
    expect(checkPassword('Żółwieścieżka1').ok).toBe(true);
  });

  it('nie pozwala schować adresu e-mail w haśle', () => {
    const { problems } = checkPassword('Adrianowicz11Haslo', 'adrianowicz@example.com');
    expect(problems.join(' ')).toContain('adresu e-mail');
  });

  it('krótki fragment adresu nie blokuje hasła', () => {
    // „ja" w „jan@…" trafiłoby w połowę słownika języka polskiego.
    expect(checkPassword('Ja1PoprawneHaslo', 'ja@example.com').ok).toBe(true);
  });

  it('brak adresu wyłącza tylko tę jedną regułę', () => {
    expect(checkPassword('Poprawne1Haslo').ok).toBe(true);
  });

  it('odrzuca wypełniacz z powtórzonych znaków', () => {
    const { problems } = checkPassword('Haslo1aaaaaaaa');
    expect(problems.join(' ')).toContain('takich samych znaków');
  });
});

describe('wskaźnik siły hasła', () => {
  it('puste hasło ma siłę zero', () => {
    expect(passwordStrength('')).toBe(0);
  });

  it('rośnie wraz z długością i różnorodnością znaków', () => {
    expect(passwordStrength('krotkie')).toBeLessThan(passwordStrength('Poprawne1Haslo'));
    expect(passwordStrength('Poprawne1Haslo')).toBeLessThan(
      passwordStrength('Bardzo-Dlugie1Haslo!')
    );
  });

  it('nigdy nie wychodzi poza skalę', () => {
    const wynik = passwordStrength('Bardzo-Dlugie-I-Zlozone1Haslo!@#');
    expect(wynik).toBeGreaterThanOrEqual(0);
    expect(wynik).toBeLessThanOrEqual(4);
  });
});
