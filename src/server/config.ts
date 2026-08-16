import { z } from 'zod';

/**
 * Server configuration, validated once at boot.
 *
 * Failing here is deliberate: a missing GEMINI_API_KEY used to surface as a 500
 * on the first user request, with the raw error text echoed to the browser.
 * Crashing on startup makes the misconfiguration obvious to the operator instead.
 */
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY jest wymagany do działania funkcji AI.'),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash-lite'),

  /**
   * Comma-separated list of origins allowed to call the API.
   * Empty in development means "same origin only", which is what the Vite dev
   * server needs — it is never a wildcard.
   */
  ALLOWED_ORIGINS: z.string().default(''),

  /**
   * Set only when the app actually runs behind a reverse proxy. Enabling it
   * without one lets a client spoof its address via X-Forwarded-For and slip
   * past the rate limiter; leaving it off behind a proxy collapses every user
   * into one bucket. Both directions are wrong, so it has to be explicit.
   */
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type ServerConfig = z.infer<typeof configSchema> & { allowedOrigins: string[] };

let cached: ServerConfig | null = null;

export function loadConfig(): ServerConfig {
  if (cached) return cached;

  const parsed = configSchema.safeParse(process.env);

  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Nieprawidłowa konfiguracja serwera:\n${problems}\n\n` +
        'Uzupełnij plik .env na podstawie .env.example.'
    );
  }

  cached = {
    ...parsed.data,
    allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };

  return cached;
}

export function isProduction(): boolean {
  return loadConfig().NODE_ENV === 'production';
}
