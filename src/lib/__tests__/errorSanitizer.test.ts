import { describe, expect, it } from 'vitest';
import {
  buildFingerprint,
  parseStack,
  sanitizeError,
  sanitizeMessage,
} from '../errorSanitizer';

describe('sanitizeMessage — anonimizacja treści', () => {
  it('zastępuje adres e-mail znacznikiem, nie zostawiając fragmentu', () => {
    const out = sanitizeMessage('uncaught', 'Nie udało się wysłać do jan.kowalski@example.com o 12:00');
    expect(out).not.toContain('jan.kowalski');
    expect(out).toContain('[email]');
    expect(out).toContain('#:#');
  });

  it('rozbiera JWT na znacznik — token w komunikacie błędu to realny przypadek', () => {
    const out = sanitizeMessage(
      'uncaught',
      '401 przy eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.tajnyPodpis'
    );
    expect(out).not.toContain('tajnyPodpis');
    expect(out).not.toContain('eyJ');
    expect(out).toContain('[jwt]');
  });

  it('zastępuje UUID — identyfikatory sesji nie mają czego szukać w zgłoszeniu', () => {
    const out = sanitizeMessage('uncaught', 'profil 6f9619ff-8b86-d011-b42d-00c04fc964ff nie istnieje');
    expect(out).toContain('[uuid]');
    expect(out).not.toContain('6f9619ff');
  });

  it('zwija cały adres URL do znacznika — razem z identyfikatorami w query', () => {
    const out = sanitizeMessage(
      'uncaught',
      'fetch https://api.example.com/v1/vault?profile=6f9619ff-8b86-d011-b42d-00c04fc964ff nie powiódł się'
    );
    expect(out).toContain('[url]');
    expect(out).not.toContain('example.com');
    expect(out).not.toContain('6f9619ff');
  });

  it('normalizuje cyfry na #, więc ta sama usterka z inną wartością tworzy jedną grupę', () => {
    const a = sanitizeMessage('cv-export', 'Cannot read properties of undefined (reading 3)');
    const b = sanitizeMessage('cv-export', 'Cannot read properties of undefined (reading 17)');
    expect(a).toBe(b);
  });

  it('pusty komunikat dostaje fallback z rodzajem — kontrakt API wymaga niepustej treści', () => {
    expect(sanitizeMessage('ui-crash', '')).toBe('(brak komunikatu) ui-crash');
    expect(sanitizeMessage('unhandledrejection', undefined)).toBe('(brak komunikatu) unhandledrejection');
  });
});

describe('parseStack — trzy formaty stosu przeglądarek', () => {
  it('parsuje format V8 (Chrome/Edge): "at fn (file:line:col)"', () => {
    const frames = parseStack(
      'Error: boom\n    at generateCv (app.js:120:15)\n    at downloadNativeDocxCv (assets/index-AbC123.js:2:88123)'
    );
    expect(frames[0]).toEqual({ fn: 'generateCv', file: 'app.js', line: 120 });
    // Basename: hasz bundla w nazwie pliku zostaje, ale ścieżka absolutna nie.
    expect(frames[1]?.file).toBe('index-AbC123.js');
  });

  it('parsuje format Safari/JSC: "fn@file:line:col"', () => {
    const frames = parseStack('generateCv@app.js:120:15');
    expect(frames[0]).toEqual({ fn: 'generateCv', file: 'app.js', line: 120 });
  });

  it('parsuje stack komponentów Reacta (same nazwy) — ramki bez pliku są wartościowe', () => {
    const frames = parseStack('    at CVWordBuilder\n    at AdvisorModalHost');
    expect(frames).toEqual([{ fn: 'CVWordBuilder' }, { fn: 'AdvisorModalHost' }]);
  });

  it('ogranicza stos do 5 ramek — payload ma twardy limit kontraktowy', () => {
    const stack = Array.from({ length: 20 }, (_, i) => `    at f${i} (app.js:${i}:1)`).join('\n');
    expect(parseStack(stack)).toHaveLength(5);
  });
});

describe('buildFingerprint — stabilne grupowanie', () => {
  it('jest identyczny dla tej samej usterki i różny dla innych', () => {
    const frames = [{ fn: 'generateCv', file: 'engine.ts', line: 42 }];
    const a = buildFingerprint('cv-export', 'Cannot read properties of # (reading x)', frames);
    const b = buildFingerprint('cv-export', 'Cannot read properties of # (reading x)', frames);
    const other = buildFingerprint('ui-crash', 'Cannot read properties of # (reading x)', frames);
    expect(a).toBe(b);
    expect(a).not.toBe(other);
  });

  it('ma kształt 16 znaków hex wymagany przez kontrakt serwera', () => {
    const fp = buildFingerprint('uncaught', 'boom', []);
    expect(fp).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('sanitizeError — wartości łapane w try/catch bywają różne', () => {
  it('obsługuje Error ze stosem', () => {
    const err = new TypeError('Cannot read properties of undefined (reading fullName)');
    const out = sanitizeError('cv-export', err);
    expect(out.message).toContain('Cannot read properties');
    expect(out.stack.length).toBeGreaterThan(0);
  });

  it('obsługuje string rzucony jako wyjątek', () => {
    expect(sanitizeError('uncaught', 'coś poszło nie tak user@x.pl').message).toContain('[email]');
  });

  it('obsługuje obiekt z polem message (DOMException z innego realmu)', () => {
    const out = sanitizeError('uncaught', { message: 'The operation was aborted. id=12345' });
    expect(out.message).toBe('The operation was aborted. id=#');
  });
});
