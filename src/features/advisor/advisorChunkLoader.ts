export const ADVISOR_CHUNK_NAME = 'GeminiAdvisorModal';
export const ADVISOR_MAX_ATTEMPTS = 3;

type AdvisorModule = typeof import('./GeminiAdvisorModal');
type AdvisorImporter = () => Promise<AdvisorModule>;
export interface AdvisorChunkStatus {
  attempt: number;
  state: 'idle' | 'loading' | 'waiting' | 'ready' | 'failed';
}

const defaultImporter: AdvisorImporter = () => import('./GeminiAdvisorModal');
let cachedPromise: Promise<AdvisorModule> | null = null;
let status: AdvisorChunkStatus = { attempt: 0, state: 'idle' };
const listeners = new Set<(next: AdvisorChunkStatus) => void>();

function publish(next: AdvisorChunkStatus): void {
  status = next;
  listeners.forEach((listener) => listener(next));
}

export function subscribeAdvisorChunkStatus(
  listener: (next: AdvisorChunkStatus) => void,
): () => void {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
}

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|loading chunk|chunkloaderror|importing a module script/i.test(message);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function loadAdvisorChunk(
  importer: AdvisorImporter = defaultImporter,
  sleep: (ms: number) => Promise<void> = wait,
  random: () => number = Math.random,
): Promise<AdvisorModule> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= ADVISOR_MAX_ATTEMPTS; attempt += 1) {
    publish({ attempt, state: 'loading' });
    try {
      const module = await importer();
      publish({ attempt, state: 'ready' });
      return module;
    } catch (error) {
      lastError = error;
      if (!isChunkLoadError(error) || attempt === ADVISOR_MAX_ATTEMPTS) {
        if (error instanceof Error) {
          Object.assign(error, { advisorChunkAttempt: attempt });
        }
        publish({ attempt, state: 'failed' });
        throw error;
      }

      // Jitter rozsuwa ponowienia wielu otwartych kart po tym samym wdrożeniu.
      const baseDelay = 500 * 2 ** (attempt - 1);
      publish({ attempt, state: 'waiting' });
      await sleep(Math.round(baseDelay * (0.9 + random() * 0.2)));
    }
  }

  throw lastError;
}

export function preloadAdvisorChunk(): Promise<AdvisorModule> {
  if (!cachedPromise) {
    cachedPromise = loadAdvisorChunk().catch((error) => {
      cachedPromise = null;
      throw error;
    });
  }
  return cachedPromise;
}

/** Odrzucona obietnica nie może zatruć ręcznej próby użytkownika. */
export function resetAdvisorChunkCache(): void {
  cachedPromise = null;
  publish({ attempt: 0, state: 'idle' });
}