/**
 * Odkładanie zapisu w czasie, z gwarancją dosłania.
 *
 * Utrwalanie Master Vaultu to pełna serializacja drzewa (`JSON.stringify`)
 * wykonywana synchronicznie na głównym wątku. Efekt utrwalający w `App.tsx` ma
 * `vault` w tablicy zależności, a edytor tworzy nowy obiekt przy każdej edycji
 * pola — więc całe drzewo serializowało się przy każdym wpisanym znaku. Na
 * profilu 38 kB to ok. 0,14 ms na znak, czyli blisko 14 ms zablokowanego wątku
 * na setkę znaków.
 *
 * Opóźnienie zapisu wymienia jednak koszt na ryzyko: między ostatnią zmianą
 * a zapisem dane leżą wyłącznie w pamięci. Dlatego `flush()` jest częścią
 * kontraktu, a nie dodatkiem — wywołanie go domyka to okno.
 *
 * Moduł celowo nie zna Reacta ani DOM-u: testy w tym projekcie biegną w Node
 * z ręcznymi atrapami, a logika, która może się zepsuć, ma być testowalna bez
 * uruchamiania przeglądarki.
 */

/** Ile milisekund bezczynności czekamy przed zapisem. */
/** Opóźnienie utrwalania: 750 ms — poniżej progu zauważalności przerwy przy ciągłym pisaniu. */
export const PERSIST_DELAY_MS = 750;

export interface DeferredWriter<T> {
  /** Zgłasza nową wartość do zapisania i przesuwa termin zapisu. */
  push(value: T): void;
  /** Zapisuje zaległą wartość natychmiast. Bezpieczne do wielokrotnego wywołania. */
  flush(): void;
  /** Czy istnieje wartość oczekująca na zapis. */
  hasPending(): boolean;
  /** Porzuca zegar bez zapisu — wyłącznie do sprzątania po testach. */
  cancel(): void;
}

/**
 * @param persist funkcja zapisująca wartość
 * @param delayMs czas bezczynności przed zapisem
 */
export function createDeferredWriter<T>(
  persist: (value: T) => void,
  delayMs: number = PERSIST_DELAY_MS
): DeferredWriter<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: T | null = null;
  let hasPending = false;
  /**
   * Ostatnia zapisana referencja. Porównanie referencji kosztuje ułamek
   * mikrosekundy wobec 0,14 ms serializacji, a `AuthContext` celowo zwraca tę
   * samą referencję, gdy sanityzacja niczego nie zmieniła.
   */
  let lastPersisted: T | null = null;
  let hasPersisted = false;

  const clear = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const flush = (): void => {
    clear();
    if (!hasPending) return;

    const value = pending as T;
    hasPending = false;
    pending = null;
    lastPersisted = value;
    hasPersisted = true;
    persist(value);
  };

  return {
    push(value: T): void {
      if (hasPersisted && lastPersisted === value) return;

      pending = value;
      hasPending = true;
      clear();
      timer = setTimeout(flush, delayMs);
    },
    flush,
    hasPending: () => hasPending,
    cancel(): void {
      clear();
      hasPending = false;
      pending = null;
    },
  };
}

/** Minimalny kontrakt nadawcy zdarzeń — pozwala testować bez DOM-u. */
export interface EventSource {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface LifecycleTargets {
  window?: EventSource | null;
  document?: (EventSource & { visibilityState?: string }) | null;
}

/**
 * Podpina dosłanie zaległego zapisu pod zdarzenia zakończenia pracy ze stroną.
 *
 * Trzy zabezpieczenia, bo żadne nie wystarcza samo:
 *
 *  1. `visibilitychange` — przełączenie karty jest najczęstszym wstępem do jej
 *     zamknięcia i ostatnim momentem, w którym przeglądarka na pewno wykona
 *     jeszcze nasz kod;
 *  2. `pagehide` — pokrywa zamknięcie karty i nawigację wstecz także tam, gdzie
 *     `beforeunload` nie jest wywoływane (Safari, iOS);
 *  3. odmontowanie komponentu — obsługiwane po stronie hooka.
 *
 * @returns funkcja odpinająca nasłuch
 */
export function bindFlushOnHide(flush: () => void, targets: LifecycleTargets): () => void {
  const { window: win, document: doc } = targets;

  const onVisibilityChange = (): void => {
    // Powrót do karty też generuje to zdarzenie, a nie ma wtedy powodu zapisywać.
    if (doc?.visibilityState === 'visible') return;
    flush();
  };

  doc?.addEventListener('visibilitychange', onVisibilityChange);
  win?.addEventListener('pagehide', flush);

  return () => {
    doc?.removeEventListener('visibilitychange', onVisibilityChange);
    win?.removeEventListener('pagehide', flush);
  };
}
