/**
 * Single source of truth for where the backend lives.
 *
 * Empty base (dev) → relative URLs → Express serves both the SPA and the API on
 * one port, exactly as before. In production the frontend is on Firebase Hosting
 * and the API on Render, so VITE_API_BASE_URL points at the Render service.
 *
 * Note: Vite inlines this at BUILD time — it cannot be changed after deploy.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Thin wrapper over fetch — returns the raw Response on purpose, because each
 * call site already has its own (Polish, endpoint-specific) error handling.
 * Includes a default 45s timeout to prevent infinite hanging spinners.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (
    !API_BASE &&
    typeof window !== 'undefined' &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname)
  ) {
    console.warn(
      'VITE_API_BASE_URL nie została zdefiniowana w czasie buildu. Wywołania API mogą trafiać do Firebase Hosting zamiast serwera API Render.'
    );
  }

  const signal = init?.signal ?? AbortSignal.timeout(45_000);
  return fetch(apiUrl(path), { ...init, signal });
}

/**
 * Wakes the API without blocking the UI. Render's free tier sleeps after ~15
 * minutes, and the first request afterwards costs ~50s — firing this on app
 * mount means the cold start overlaps with the user reading the page instead of
 * with them waiting on a spinner. Failures are irrelevant and swallowed.
 */
export function warmUpApi(): void {
  void apiFetch('/api/health').catch(() => {});
}
