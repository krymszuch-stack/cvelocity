import { describe, expect, it } from 'vitest';
import { moveActiveOption, NO_ACTIVE_OPTION, shouldPickOnEnter } from '../comboboxNavigation';

describe('ruch po liście podpowiedzi', () => {
  it('strzałka w dół z pustego zaznaczenia wchodzi na pierwszą pozycję', () => {
    expect(moveActiveOption(NO_ACTIVE_OPTION, 3, 'ArrowDown')).toBe(0);
  });

  it('strzałka w górę z pustego zaznaczenia wchodzi na ostatnią pozycję', () => {
    expect(moveActiveOption(NO_ACTIVE_OPTION, 3, 'ArrowUp')).toBe(2);
  });

  it('zawija się na obu końcach', () => {
    expect(moveActiveOption(2, 3, 'ArrowDown')).toBe(0);
    expect(moveActiveOption(0, 3, 'ArrowUp')).toBe(2);
  });

  it('Home i End skaczą na krańce', () => {
    expect(moveActiveOption(1, 4, 'Home')).toBe(0);
    expect(moveActiveOption(1, 4, 'End')).toBe(3);
  });

  it('Escape czyści zaznaczenie', () => {
    expect(moveActiveOption(2, 3, 'Escape')).toBe(NO_ACTIVE_OPTION);
  });

  it('pusta lista nie ma czego zaznaczyć', () => {
    expect(moveActiveOption(0, 0, 'ArrowDown')).toBe(NO_ACTIVE_OPTION);
  });
});

describe('Enter nie wpisuje niczego za użytkownika', () => {
  it('bez wskazanej pozycji przepuszcza to, co wpisano', () => {
    // To jest ten jeden warunek, na którym stoi zasada „nic nie wpisuje się
    // samo": lista otwiera się bez zaznaczenia, więc Enter zaraz po wpisaniu
    // własnej treści zatwierdza tę treść, a nie pierwszą podpowiedź.
    expect(shouldPickOnEnter(NO_ACTIVE_OPTION, 5)).toBe(false);
  });

  it('wybiera dopiero po świadomym wskazaniu strzałkami', () => {
    expect(shouldPickOnEnter(0, 5)).toBe(true);
    expect(shouldPickOnEnter(4, 5)).toBe(true);
  });

  it('indeks poza listą nie wybiera niczego', () => {
    expect(shouldPickOnEnter(5, 5)).toBe(false);
  });
});
