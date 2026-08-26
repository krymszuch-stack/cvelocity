import { fnv1a } from './storage';

/**
 * Anonimizacja zgłoszeń błędów — jedyne miejsce, które decyduje, co opuszcza
 * przeglądarkę użytkownika.
 *
 * Zasada jest radykalna, bo inaczej nie do utrzymania: zamiast „zbieramy wszystko
 * i obiecujemy, że niczego nie wycieknie", klient wysyła wyłącznie to, co da się
 * wyrazić bez żadnej danej osobowej:
 *
 * - komunikat po scrubbingu (adresy e-mail, JWT, UUID i adresy URL zastępowane
 *   znacznikami, cyfry zamieniane na `#` — zostaje kształt błędu, nie treść);
 * - stos zredukowany do nazw funkcji i nazw plików (basename), bez ścieżek
 *   absolutnych, argumentów wywołań i treści linii źródłowych;
 * - fingerprint = stabilny skrót zanonimizowanych części, więc ta sama usterka
 *   tworzy jedną grupę niezależnie od tego, u kogo wystąpiła.
 *
 * Wzorce grupowania zaadoptowane od systemów klasy Sentry: priorytet ma miejsce
 * w kodzie (ramki stosu), potem znormalizowana treść; niestabilne elementy
 * (numery kolumn, minifikowane nazwy plików z haszami) celowo nie wchodzą
 * do skrótu, żeby grupa nie rozpadała się przy każdym deployu.
 */

export type ClientErrorKind = 'cv-export' | 'ui-crash' | 'uncaught' | 'unhandledrejection';

/** Ramka stosu bezpieczna do wysłania: nazwa funkcji + basename pliku + linia. */
export interface SanitizedStackFrame {
  fn?: string;
  file?: string;
  line?: number;
}

export interface SanitizedError {
  message: string;
  stack: SanitizedStackFrame[];
}

const MESSAGE_MAX_CHARS = 300;
const STACK_MAX_FRAMES = 5;

/**
 * Kolejność podstawień ma znaczenie: wzorce o większej specyficzności muszą
 * wejść przed ogólną zamianą cyfr na `#`, bo inaczej rozebrałyby strukturę
 * tokenu, który miałby zostać rozpoznany jako całość.
 */
function scrubPii(text: string): string {
  return text
    // Adresy URL pierwsze: połykają identyfikatory osadzone w query, więc
    // późniejsze wzorce nie mają już czego rozpoznawać w ich wnętrzu.
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[uuid]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, '[jwt]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/\d+/g, '#');
}

/**
 * Zanonimizowany, przycięty komunikat. Fallback jest potrzebny, bo kontrakt
 * API wymaga niepustej treści — pusty komunikat to realny przypadek
 * (`new Error()` albo `String(błędazInnegoTypu)` dające pusty tekst).
 */
export function sanitizeMessage(kind: ClientErrorKind, rawText?: unknown): string {
  const source =
    typeof rawText === 'string' && rawText.length > 0 ? rawText : `(brak komunikatu) ${kind}`;
  const scrubbed = scrubPii(source).replace(/\s+/g, ' ').trim();
  if (scrubbed.length === 0) return `(brak komunikatu) ${kind}`;
  return scrubbed.slice(0, MESSAGE_MAX_CHARS);
}

/** Basename ścieżki z obsługą separatorów uniksowych i windowsowych. */
function basename(pathLike: string): string {
  const parts = pathLike.split(/[/\\]/);
  return parts[parts.length - 1] || pathLike;
}

/**
 * Parser stosu tolerancyjny wobec trzech formatów, które faktycznie spotyka
 * przeglądarka: V8 (`at fn (file:line:col)`), JSC/Safari (`fn@file:line:col`)
 * oraz stack komponentów Reacta (same nazwy, bez plików). Ramki bez żadnej
 * treści identyfikującej są odrzucane.
 */
export function parseStack(rawStack?: string): SanitizedStackFrame[] {
  if (!rawStack) return [];

  const frames: SanitizedStackFrame[] = [];

  for (const line of rawStack.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'Error') continue;

    // V8: "at fnName (file:line:col)" / "at file:line:col"
    const v8Match = trimmed.match(/^at\s+(.+?)\s+\((.+?):(\d+):\d+\)$/) ?? trimmed.match(/^at\s+(.+):(\d+):\d+$/);
    // JSC: "fnName@file:line:col" (bez pliku też bywa)
    const jscMatch = v8Match ? null : trimmed.match(/^(.*?)@(?:(.*?):(\d+):\d+)?$/);

    let frame: SanitizedStackFrame | null = null;

    if (v8Match) {
      if (v8Match.length === 3) {
        // "at file:line:col" — funkcji brak, plik identyfikuje ramkę.
        frame = { file: basename(v8Match[1]), line: Number(v8Match[2]) };
      } else {
        const fnPart = v8Match[1];
        const locPart = v8Match[2];
        // Lokalizacja może być adresem URL, ale też np. "<anonymous>".
        const looksLikePath = /[/\\]/.test(locPart);
        frame = {
          fn: fnPart === '' ? undefined : fnPart.slice(0, 80),
          file: looksLikePath ? basename(locPart) : locPart.slice(0, 120),
          line: Number(v8Match[3]),
        };
      }
    } else if (jscMatch) {
      frame = {
        fn: jscMatch[1] ? jscMatch[1].slice(0, 80) : undefined,
        file: jscMatch[2] ? basename(jscMatch[2]).slice(0, 120) : undefined,
        line: jscMatch[3] ? Number(jscMatch[3]) : undefined,
      };
    } else if (/^at\s/.test(trimmed) || !/[@()]/.test(trimmed)) {
      // Nagłówek stosu ("TypeError: boom") zawiera treść komunikatu i nie jest
      // ramką — pomijamy go, żeby nie zaśmiecał grupy nazwą typu błędu.
      if (/^[A-Za-z_$][\w$]*(?:\[\w+\])?:\s/.test(trimmed)) continue;
      // Stack komponentów Reacta: "    at ComponentName" albo sama nazwa.
      const fn = trimmed.replace(/^at\s+/, '').trim();
      if (fn) frame = { fn: fn.slice(0, 80) };
    }

    if (frame && (frame.fn || frame.file)) frames.push(frame);
    if (frames.length >= STACK_MAX_FRAMES) break;
  }

  return frames;
}

/** Skrót grupy: 2 × FNV-1a (treść, stos) sklejone w 16 znaków hex. */
export function buildFingerprint(kind: ClientErrorKind, message: string, frames: SanitizedStackFrame[]): string {
  const framesKey = frames.map((f) => `${f.fn ?? ''}@${f.file ?? ''}:${f.line ?? ''}`).join('|');
  return fnv1a(`${kind}|${message}`) + fnv1a(framesKey);
}

/**
 * Sanityzuje wartość złapaną w try/catch dowolnego pochodzenia — łapie się tam
 * nie tylko `Error`, ale i stringi, `DOMException` czy obiekty z innego realmu
 * (bez `instanceof`, za to z polem `message`).
 */
export function sanitizeError(kind: ClientErrorKind, error: unknown): SanitizedError {
  if (error instanceof Error) {
    return { message: sanitizeMessage(kind, error.message), stack: parseStack(error.stack) };
  }

  if (typeof error === 'string' && error.length > 0) {
    return { message: sanitizeMessage(kind, error), stack: [] };
  }

  const maybeMessage = (error as { message?: unknown } | null)?.message;
  if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
    return { message: sanitizeMessage(kind, maybeMessage), stack: [] };
  }

  return { message: sanitizeMessage(kind, undefined), stack: [] };
}
