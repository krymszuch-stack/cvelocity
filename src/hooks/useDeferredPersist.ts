import { useCallback, useEffect, useRef } from 'react';
import {
  bindFlushOnHide,
  createDeferredWriter,
  PERSIST_DELAY_MS,
  type DeferredWriter,
} from '../lib/deferredWriter';

export { PERSIST_DELAY_MS };

/**
 * Reactowa nakładka na `createDeferredWriter`.
 *
 * Cała logika — odkładanie zapisu, pomijanie zapisów bez zmian, dosyłanie —
 * mieszka w `src/lib/deferredWriter.ts` i jest testowana bez Reacta i bez DOM-u.
 * Tutaj zostaje wyłącznie spięcie jej z cyklem życia komponentu, żeby ta część,
 * której nie da się przetestować w Node, była możliwie cienka.
 *
 * @param value wartość do utrwalenia
 * @param persist funkcja zapisująca; jej zmiana nie przestawia zegara
 * @returns `flush` do ręcznego dosłania (np. przed wylogowaniem)
 */
export function useDeferredPersist<T>(
  value: T,
  persist: (value: T) => void,
  delayMs: number = PERSIST_DELAY_MS
): { flush: () => void; cancel: () => void } {
  const persistRef = useRef(persist);
  const writerRef = useRef<DeferredWriter<T> | null>(null);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  // Writer powstaje w efekcie, nie podczas renderowania: konstruowanie go w
  // ciele komponentu oznaczałoby sięganie do referencji w fazie, w której React
  // nie gwarantuje jej aktualności.
  //
  // Sprzątanie dosyła zaległy zapis — to ono domyka okno utraty danych przy
  // odmontowaniu komponentu.
  useEffect(() => {
    const writer = createDeferredWriter<T>((v) => persistRef.current(v), delayMs);
    writerRef.current = writer;

    return () => {
      writer.flush();
      writerRef.current = null;
    };
  }, [delayMs]);

  const flush = useCallback(() => writerRef.current?.flush(), []);
  const cancel = useCallback(() => writerRef.current?.cancel(), []);

  // Efekt zgłaszający wartość jest zadeklarowany po efekcie tworzącym, więc
  // przy pierwszym renderowaniu writer już istnieje.
  useEffect(() => {
    writerRef.current?.push(value);
  }, [value]);

  useEffect(
    () =>
      bindFlushOnHide(flush, {
        window: typeof window === 'undefined' ? null : window,
        document: typeof document === 'undefined' ? null : document,
      }),
    [flush]
  );

  return { flush, cancel };
}
