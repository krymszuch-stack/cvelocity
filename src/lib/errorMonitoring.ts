import * as Sentry from '@sentry/react';
import { clientEnv } from './clientEnv';

let initialized = false;

/** Monitoring jest opcjonalny: lokalny frontend działa bez DSN i bez wysyłki zdarzeń. */
export function initializeErrorMonitoring(): void {
  if (initialized || !clientEnv.sentryDsn) return;
  Sentry.init({
    dsn: clientEnv.sentryDsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
  });
  initialized = true;
}

interface ChunkErrorContext {
  moduleName: string;
  chunkName: string;
  attempt: number;
  componentStack?: string;
}

export function reportChunkError(error: Error, context: ChunkErrorContext): void {
  if (!clientEnv.sentryDsn) return;

  Sentry.withScope((scope) => {
    scope.setTag('error.kind', 'dynamic_chunk');
    scope.setTag('chunk.name', context.chunkName);
    scope.setTag('module.name', context.moduleName);
    scope.setExtra('attempt', context.attempt);
    if (context.componentStack) scope.setExtra('react.componentStack', context.componentStack);
    Sentry.captureException(error);
  });
}