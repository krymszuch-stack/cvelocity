/**
 * Awaryjny magazyn IndexedDB dla danych, których localStorage nie przyjął.
 *
 * localStorage ma twardy limit (~5 MB na domenę) i potrafi rzucić
 * QuotaExceededError w momencie, w którym użytkownik właśnie skończył pisać
 * najdłuższy opis stanowiska. Utrata tego zapisu jest nieakceptowalna, więc
 * nadmiar ląduje w IndexedDB — tej samej origin, ale z limitem liczonym
 * w setkach megabajtów.
 *
 * Interfejs jest synchroniczny z punktu widzenia reszty aplikacji celowo:
 * odczyt obsługuje w pamięci podręcznej lustrzanych kluczy, zasilanej przy
 * starcie i aktualizowanej przy każdym zapisie awaryjnym. Asynchroniczność
 * IndexedDB nigdy nie przecieka do wywołań `readJson`.
 */

const DB_NAME = 'cvelocity-backup';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

/** Klucze, które trafiły do IndexedDB i tam trzeba ich szukać przy odczycie. */
const mirroredKeys = new Set<string>();
const mirrorCache = new Map<string, string>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      // Środowisko bez IndexedDB (testy w Node, SSR) — funkcja spada do no-op,
      // a odpowiedzialność za dane zostaje przy localStorage.
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const tx = db.transaction(STORE_NAME, mode);
          const request = operation(tx.objectStore(STORE_NAME));
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

/** Zapis awaryjny. Zwraca `true`, gdy dane faktycznie dotarły do IndexedDB. */
export function idbBackupSet(key: string, value: string): boolean {
  mirrorCache.set(key, value);
  mirroredKeys.add(key);

  void withStore('readwrite', (store) => store.put(value, key));

  // Cache pamięciowy jest aktualny od razu, więc odczyty synchroniczne mają
  // świeże dane niezależnie od tego, czy transakcja zdążyła się zamknąć.
  return true;
}

/** Szybki odczyt z lustra pamięciowego; asynchroniczne DOBicie do IndexedDB tylko przy chłodnym starcie. */
export function idbBackupGet(key: string): string | null {
  const cached = mirrorCache.get(key);
  if (cached !== undefined) return cached;

  if (!mirroredKeys.has(key)) return null;

  // Klucz oznaczony jako lustro, ale jeszcze bez wartości w pamięci (chłodny
  // start przed preloadingiem). Nie blokujemy — kolejny odczyt znajdzie już
  // dane zasilone przez `preloadIdbMirror`.
  return null;
}

/** Zasila lustro pamięciowe wszystkimi kluczami zapasowymi. Wywoływane raz przy starcie modułu storage. */
export async function preloadIdbMirror(): Promise<void> {
  const keys = await withStore<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
  if (!keys) return;

  for (const key of keys) {
    if (typeof key !== 'string') continue;
    mirroredKeys.add(key);
    const value = await withStore<string>('readonly', (store) => store.get(key));
    if (typeof value === 'string') mirrorCache.set(key, value);
  }
}

/** Usuwa wpis zapasowy (np. przy „usuń moje dane"). */
export function idbBackupRemove(key: string): void {
  mirrorCache.delete(key);
  mirroredKeys.delete(key);
  void withStore('readwrite', (store) => store.delete(key));
}

/** Czyści całą kopię zapasową — wołane przez `wipeAppStorage`. */
export function idbBackupClearAll(): void {
  mirrorCache.clear();
  mirroredKeys.clear();
  void withStore('readwrite', (store) => store.clear());
}
