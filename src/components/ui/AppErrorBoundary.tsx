import React from 'react';
import { Button } from './Button';
import { reportClientError } from '../../lib/errorReporter';

/**
 * Granica błędów dla całego drzewa aplikacji.
 *
 * Do tej pory istniała wyłącznie granica chunków (`ChunkErrorBoundary`), więc
 * każdy inny wyjątek w renderze odmontowywał drzewo i użytkownik dostawał pusty
 * ekran bez żadnego śladu po stronie operatora. Ta granica domyka dwie rzeczy:
 * pokazuje uczciwy ekran awarii i wysyła zanonimizowane zgłoszenie
 * (`ui-crash`) przez errorReporter — bez danych użytkownika, bo treść zgłoszenia
 * przechodzi przez sanityzer.
 */
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportClientError({
      kind: 'ui-crash',
      surface: 'ui-crash:AppErrorBoundary',
      error,
      componentStack: info.componentStack ?? undefined,
    });
  }

  private handleReload = () => {
    // Twardy przeładunek: stan modułów może być niespójny po wyjątku w renderze.
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink/40 p-4">
        <div role="alertdialog" aria-modal="true" aria-labelledby="app-error-title" aria-describedby="app-error-description" className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl">
          <h1 id="app-error-title" className="text-base font-semibold text-fg">Wystąpił błąd aplikacji</h1>
          <p id="app-error-description" className="mt-2 text-sm text-fg-muted">
            Twoje dane pozostają bezpieczne. Zgłoszenie awarii zawiera wyłącznie
            techniczny opis błędu — bez danych z Twojego profilu.
          </p>
          {this.state.error && (
            <div className="mt-4 rounded-lg border border-danger-line bg-danger-soft/30 p-3 text-xs font-mono text-danger-fg">
              <p className="font-bold text-danger-fg">{this.state.error.name}: {this.state.error.message}</p>
              {this.state.error.stack && (
                <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-[11px] opacity-80">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={this.handleReload} className="cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-500/50">Odśwież stronę</Button>
          </div>
        </div>
      </div>
    );
  }
}
