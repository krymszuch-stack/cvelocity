import { describe, it, expect } from 'vitest';
import {
  pseudonymize,
  rehydrate,
  stripSensitiveFields,
  identifyingValues,
  assertNoPii,
  PiiLeakError,
} from '../pseudonymize';
import type { MasterVault } from '../../types';

const vault = {
  personalInfo: {
    fullName: "Sean O'Brien",
    email: 'sean.obrien@example.pl',
    phone: '+48 600 700 800',
    location: 'Kraków',
    photoUrl: 'https://cdn.example.pl/zdjecia/sean.jpg',
    title: 'Backend Developer',
    summary: 'Programista z 8-letnim stażem.',
  },
} as unknown as Partial<MasterVault>;

describe('Pseudonimizacja na granicy modelu', () => {
  it('usuwa imię, e-mail, telefon i miasto z tekstu wysyłanego do modelu', () => {
    const input =
      "Sean O'Brien, Kraków. Kontakt: sean.obrien@example.pl, tel. +48 600 700 800. Programista backendu.";

    const { text } = pseudonymize(input, identifyingValues(vault));

    expect(text).not.toContain("Sean O'Brien");
    expect(text).not.toContain('sean.obrien@example.pl');
    expect(text).not.toContain('600 700 800');
    expect(text).toContain('[KANDYDAT]');
    expect(text).toContain('[EMAIL]');
    // Treść merytoryczna musi przetrwać — inaczej model nie ma z czego korzystać.
    expect(text).toContain('Programista backendu');
  });

  it('przywraca prawdziwe dane w wyniku wracającym do użytkownika', () => {
    const input = "Sean O'Brien, e-mail: sean.obrien@example.pl";
    const { text, map } = pseudonymize(input, identifyingValues(vault));

    // Model zwraca tekst z placeholderami — list zaadresowany do [KANDYDAT]
    // byłby bezużyteczny.
    const modelOutput = `Szanowni Państwo, nazywam się ${text.split(',')[0]}.`;

    expect(rehydrate(modelOutput, map)).toContain("Sean O'Brien");
  });

  it('nie myli dwóch różnych adresów e-mail przy przywracaniu', () => {
    const input = 'Kontakt: jan@example.pl oraz rekrutacja@firma.pl';
    const { text, map } = pseudonymize(input);

    expect(text).toContain('[EMAIL]');
    expect(text).toContain('[EMAIL_2]');
    expect(rehydrate(text, map)).toBe(input);
  });

  it('usuwa zdjęcie całkowicie, bez placeholdera', () => {
    // Wizerunek to dane szczególnej kategorii (art. 9 RODO), a do wygenerowania
    // treści CV nie jest potrzebny w żadnej postaci.
    const safe = stripSensitiveFields(vault);

    expect(safe.personalInfo).not.toHaveProperty('photoUrl');
    expect(JSON.stringify(safe)).not.toContain('sean.jpg');
    // Pozostałe pola zostają nietknięte.
    expect(safe.personalInfo?.title).toBe('Backend Developer');
  });

  it('zamienia dłuższe dopasowanie przed krótszym', () => {
    // Gdyby "Sean" poszło przed "Sean O'Brien", w tekście zostałoby "[KANDYDAT] O'Brien".
    const { text } = pseudonymize("Sean O'Brien pracował z Seanem", ["Sean O'Brien", 'Sean']);

    expect(text).not.toContain("O'Brien");
  });

  it('nie wywraca się na pustym wejściu', () => {
    expect(pseudonymize('').text).toBe('');
    expect(rehydrate('', new Map())).toBe('');
    expect(identifyingValues({} as Partial<MasterVault>)).toEqual([]);
  });
});

describe('Bramka assertNoPii', () => {
  it('przepuszcza ładunek po pseudonimizacji', () => {
    const { text } = pseudonymize(
      "Sean O'Brien, sean.obrien@example.pl, +48 600 700 800",
      identifyingValues(vault)
    );

    expect(() => assertNoPii(text)).not.toThrow();
  });

  it('blokuje wysyłkę, gdy w ładunku został adres e-mail', () => {
    expect(() => assertNoPii('Kandydat: jan.kowalski@example.pl')).toThrow(PiiLeakError);
  });

  it('blokuje numer PESEL i numer telefonu', () => {
    expect(() => assertNoPii('PESEL 90010112345')).toThrow(PiiLeakError);
    expect(() => assertNoPii('tel. 600 700 800')).toThrow(PiiLeakError);
  });

  it('przepuszcza ścieżkę parsowania CV, która z definicji musi widzieć dane', () => {
    // parseRawCvToVault ma za zadanie WYDOBYĆ imię, e-mail i telefon z CV —
    // pseudonimizacja wejścia zniszczyłaby tę funkcję. Wyjątek jest jawny.
    expect(() => assertNoPii('Jan Kowalski jan@example.pl', { allowPii: true })).not.toThrow();
  });
});
