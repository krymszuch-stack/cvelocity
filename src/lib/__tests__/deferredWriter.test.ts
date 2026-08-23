import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDeferredWriter,
  bindFlushOnHide,
  PERSIST_DELAY_MS,
  type EventSource,
} from '../deferredWriter';

/**
 * Odłożenie zapisu w czasie wymienia koszt na ryzyko: między ostatnią zmianą
 * a zapisem dane leżą wyłącznie w pamięci. Połowa tych testów pilnuje więc nie
 * oszczędności, tylko drugiej strony tej wymiany — że okno utraty danych jest
 * domknięte.
 */
describe('createDeferredWriter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('nie zapisuje przed upływem opóźnienia', () => {
    const persist = vi.fn();
    createDeferredWriter(persist).push({ v: 1 });

    vi.advanceTimersByTime(PERSIST_DELAY_MS - 1);

    expect(persist).not.toHaveBeenCalled();
  });

  it('zapisuje raz po upływie opóźnienia', () => {
    const persist = vi.fn();
    const value = { v: 1 };
    createDeferredWriter(persist).push(value);

    vi.advanceTimersByTime(PERSIST_DELAY_MS);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith(value);
  });

  it('scala serię szybkich zmian w jeden zapis ostatniej wartości', () => {
    const persist = vi.fn();
    const writer = createDeferredWriter<{ v: number }>(persist);

    // Dwadzieścia „naciśnięć klawisza" w tempie szybszym niż opóźnienie.
    for (let i = 1; i <= 20; i++) {
      writer.push({ v: i });
      vi.advanceTimersByTime(50);
    }
    expect(persist).not.toHaveBeenCalled();

    vi.advanceTimersByTime(PERSIST_DELAY_MS);

    // Jeden zapis zamiast dwudziestu, i to wartości najświeższej.
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith({ v: 20 });
  });

  it('pomija zapis wartości o tej samej referencji', () => {
    const persist = vi.fn();
    const writer = createDeferredWriter(persist);
    const stable = { v: 1 };

    writer.push(stable);
    vi.advanceTimersByTime(PERSIST_DELAY_MS);
    expect(persist).toHaveBeenCalledTimes(1);

    // AuthContext celowo zwraca tę samą referencję, gdy sanityzacja
    // niczego nie zmieniła — taki zapis nie ma czego utrwalić.
    writer.push(stable);
    vi.advanceTimersByTime(PERSIST_DELAY_MS * 3);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('zapisuje ponownie, gdy wartość wróci do wcześniejszej treści pod nową referencją', () => {
    const persist = vi.fn();
    const writer = createDeferredWriter(persist);

    writer.push({ v: 1 });
    vi.advanceTimersByTime(PERSIST_DELAY_MS);

    // Ta sama treść, inna referencja: użytkownik cofnął zmianę, a to jest
    // stan wart utrwalenia.
    writer.push({ v: 1 });
    vi.advanceTimersByTime(PERSIST_DELAY_MS);

    expect(persist).toHaveBeenCalledTimes(2);
  });

  // --- Domknięcie okna utraty danych -----------------------------------------

  it('dosyła zaległy zapis natychmiast', () => {
    const persist = vi.fn();
    const writer = createDeferredWriter(persist);

    writer.push({ v: 42 });
    vi.advanceTimersByTime(100); // znacznie przed upływem opóźnienia
    expect(persist).not.toHaveBeenCalled();

    writer.flush();

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith({ v: 42 });
  });

  it('nie dubluje zapisu, gdy po dosłaniu upłynie jeszcze zegar', () => {
    const persist = vi.fn();
    const writer = createDeferredWriter(persist);

    writer.push({ v: 3 });
    writer.flush();
    expect(persist).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(PERSIST_DELAY_MS * 2);

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('dosłanie bez zaległości nic nie robi', () => {
    const persist = vi.fn();
    const writer = createDeferredWriter(persist);

    writer.flush();
    writer.flush();

    expect(persist).not.toHaveBeenCalled();
  });

  it('zgłasza, czy istnieje wartość oczekująca na zapis', () => {
    const writer = createDeferredWriter(vi.fn());

    expect(writer.hasPending()).toBe(false);
    writer.push({ v: 1 });
    expect(writer.hasPending()).toBe(true);
    writer.flush();
    expect(writer.hasPending()).toBe(false);
  });

  it('respektuje własne opóźnienie', () => {
    const persist = vi.fn();
    createDeferredWriter(persist, 50).push({ v: 1 });

    vi.advanceTimersByTime(49);
    expect(persist).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(persist).toHaveBeenCalledTimes(1);
  });
});

/** Atrapa nadawcy zdarzeń — testy biegną w Node, nie w przeglądarce. */
class FakeEventSource implements EventSource {
  private listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    this.listeners.get(type)?.forEach((listener) => listener());
  }

  countFor(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

describe('bindFlushOnHide', () => {
  it('dosyła zapis przy ukryciu karty', () => {
    const flush = vi.fn();
    const doc = Object.assign(new FakeEventSource(), { visibilityState: 'hidden' });

    bindFlushOnHide(flush, { window: new FakeEventSource(), document: doc });
    doc.dispatch('visibilitychange');

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('nie zapisuje przy powrocie do widocznej karty', () => {
    const flush = vi.fn();
    const doc = Object.assign(new FakeEventSource(), { visibilityState: 'visible' });

    bindFlushOnHide(flush, { window: new FakeEventSource(), document: doc });
    doc.dispatch('visibilitychange');

    expect(flush).not.toHaveBeenCalled();
  });

  it('dosyła zapis przy zamknięciu strony', () => {
    const flush = vi.fn();
    const win = new FakeEventSource();

    bindFlushOnHide(flush, { window: win, document: new FakeEventSource() });
    win.dispatch('pagehide');

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('odpina nasłuch po sprzątnięciu', () => {
    const flush = vi.fn();
    const win = new FakeEventSource();
    const doc = Object.assign(new FakeEventSource(), { visibilityState: 'hidden' });

    const unbind = bindFlushOnHide(flush, { window: win, document: doc });
    expect(win.countFor('pagehide')).toBe(1);
    expect(doc.countFor('visibilitychange')).toBe(1);

    unbind();

    expect(win.countFor('pagehide')).toBe(0);
    expect(doc.countFor('visibilitychange')).toBe(0);

    win.dispatch('pagehide');
    doc.dispatch('visibilitychange');
    expect(flush).not.toHaveBeenCalled();
  });

  it('działa bez obiektów przeglądarki (renderowanie po stronie serwera)', () => {
    const flush = vi.fn();

    expect(() => {
      const unbind = bindFlushOnHide(flush, { window: null, document: null });
      unbind();
    }).not.toThrow();
    expect(flush).not.toHaveBeenCalled();
  });
});
