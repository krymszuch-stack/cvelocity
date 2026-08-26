import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Mail, Radio, Repeat } from 'lucide-react';
import { JobApplication, MasterVault } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ReactFloatingPanel } from '../../components/hud/ReactFloatingPanel';
import { FeatureGate } from '../../components/gamification/FeatureGate';
import { useAppStore } from '../../store/useAppStore';
import { useEntitlements } from '../../store/useEntitlements';
import { InterviewLoopModal } from '../loop/InterviewLoopModal';

/**
 * Zasobnik Rozmowy — narzędzia live przy konkretnej rozmowie.
 *
 * To jest miejsce, w którym wylądowały teleprompter (HUD) i pętla rozmowy.
 * Wcześniej były przyciskami w pasku górnym, widocznymi od pierwszego wejścia
 * do aplikacji, z globalnymi skrótami Ctrl+H i Ctrl+L działającymi non stop.
 * Dotyczą jednej sytuacji — rozmowy, która jest umówiona — i nie ma powodu,
 * żeby zajmowały uwagę wcześniej ani żeby trzeba było zgadywać, której
 * rozmowy dotyczą.
 *
 * Panel pokazuje się wyłącznie wtedy, gdy jakaś aplikacja ma status „Rozmowa".
 * Nie ma takiej — nie ma panelu, zamiast pustego stanu tłumaczącego, co by tu
 * mogło być.
 */

export interface InterviewPanelProps {
  applications: JobApplication[];
  vault: MasterVault;
  onPatch: (id: string, changes: Partial<JobApplication>) => void;
  /** Jednorazowa podpowiedź o skrótach — pokazywana dopiero na tym poziomie. */
  showShortcutsHint?: boolean;
  onDismissShortcutsHint?: () => void;
  className?: string;
}

/**
 * `datetime-local` oczekuje `YYYY-MM-DDTHH:mm` **w czasie lokalnym**, a w bazie
 * trzymamy ISO w UTC. Bez tego przeliczenia pole pokazywałoby godzinę przesuniętą
 * o strefę — latem w Polsce o dwie.
 */
function toLocalInputValue(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromLocalInputValue(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function describeTiming(interviewAt: string | undefined, now: Date): string {
  if (!interviewAt) return 'Termin nieustalony';
  const at = new Date(interviewAt).getTime();
  if (Number.isNaN(at)) return 'Termin nieustalony';

  const diffHours = Math.round((at - now.getTime()) / 3_600_000);
  if (diffHours < 0) return 'Rozmowa się odbyła';
  if (diffHours === 0) return 'Rozmowa lada chwila';
  if (diffHours < 48) return `Za ${diffHours} h`;
  return `Za ${Math.round(diffHours / 24)} dni`;
}

export const InterviewPanel: React.FC<InterviewPanelProps> = ({
  applications,
  vault,
  onPatch,
  showShortcutsHint = false,
  onDismissShortcutsHint,
  className = '',
}) => {
  const interviews = useMemo(
    () => applications.filter((app) => app.status === 'Rozmowa'),
    [applications]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isHUDOpen, setHUDOpen] = useState(false);
  const { setActiveTab } = useAppStore();
  const [isLoopOpen, setLoopOpen] = useState(false);
  // Karnet kupiony za pieniądze przechodzi obok progu rangi — bez tego
  // obietnica z Centrum Kariery („karnet odblokowuje beta od razu”) byłaby
  // tylko tekstem.
  const { hasActivePass } = useEntitlements();

  // Domyślnie najbliższa rozmowa z terminem; bez terminu — pierwsza z listy.
  const selected = useMemo(() => {
    if (interviews.length === 0) return null;
    const byId = interviews.find((app) => app.id === selectedId);
    if (byId) return byId;

    const scheduled = interviews
      .filter((app) => app.interviewAt)
      .sort((a, b) => new Date(a.interviewAt!).getTime() - new Date(b.interviewAt!).getTime());

    return scheduled[0] ?? interviews[0];
  }, [interviews, selectedId]);

  /**
   * Skróty klawiszowe rejestrowane **tylko wtedy, gdy zasobnik jest na
   * ekranie**. Wcześniej pięć skrótów wisiało na `window` przez cały czas
   * życia aplikacji i przechwytywało Ctrl+P użytkownikowi, który chciał po
   * prostu wydrukować stronę.
   */
  useEffect(() => {
    if (!selected) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      const key = event.key.toLowerCase();
      if (key === 'h') {
        event.preventDefault();
        setHUDOpen((prev) => !prev);
      } else if (key === 'l') {
        event.preventDefault();
        setLoopOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  if (!selected) return null;

  const now = new Date();

  return (
    <Card variant="elevated" className={`border-brand-200 bg-brand-50/60 p-4 sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-fg">
            Zasobnik Rozmowy
          </p>
          <h3 className="mt-1 text-base font-black tracking-tight text-ink">
            {selected.position} • {selected.company}
          </h3>
        </div>
        <span className="rounded-lg border border-brand-200 bg-surface px-2 py-1 font-mono text-[11px] font-bold text-brand-fg">
          {describeTiming(selected.interviewAt, now)}
        </span>
      </div>

      {/* Wybór rozmowy pokazuje się dopiero, gdy jest z czego wybierać. */}
      {interviews.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {interviews.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => setSelectedId(app.id)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                app.id === selected.id
                  ? 'border-brand-500 bg-brand-500/15 text-brand-fg'
                  : 'border-line bg-surface text-muted hover:text-ink'
              }`}
            >
              {app.company}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Termin rozmowy
          </span>
          <input
            type="datetime-local"
            value={toLocalInputValue(selected.interviewAt)}
            onChange={(event) =>
              onPatch(selected.id, { interviewAt: fromLocalInputValue(event.target.value) })
            }
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
          />
        </label>

        <div className="flex flex-col justify-end gap-2">
          {/* Odhaczenia napędzają rekomendację na ekranie startowym: dopóki
              przygotowanie nie jest zrobione, silnik „następnego kroku"
              podpowiada właśnie je. */}
          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <input
              type="checkbox"
              checked={Boolean(selected.briefDoneAt)}
              onChange={(event) =>
                onPatch(selected.id, {
                  briefDoneAt: event.target.checked ? new Date().toISOString() : undefined,
                })
              }
              className="h-4 w-4 rounded border-line accent-brand-600"
            />
            <CheckCircle2 className="h-3.5 w-3.5 text-success-fg" />
            Przygotowanie odhaczone
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <input
              type="checkbox"
              checked={Boolean(selected.debriefSentAt)}
              onChange={(event) =>
                onPatch(selected.id, {
                  debriefSentAt: event.target.checked ? new Date().toISOString() : undefined,
                })
              }
              className="h-4 w-4 rounded border-line accent-brand-600"
            />
            <Mail className="h-3.5 w-3.5 text-brand-fg" />
            Follow-up wysłany
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" icon={Radio} onClick={() => setHUDOpen(true)}>
          Teleprompter
        </Button>
        <Button variant="secondary" size="sm" icon={Repeat} onClick={() => setLoopOpen(true)}>
          Pętla rozmowy
        </Button>
      </div>

      {showShortcutsHint && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2">
          <p className="text-xs text-muted">
            W trakcie rozmowy: <strong className="text-ink">Ctrl+H</strong> otwiera teleprompter,{' '}
            <strong className="text-ink">Ctrl+L</strong> pętlę rozmowy.
          </p>
          {onDismissShortcutsHint && (
            <Button variant="ghost" size="sm" onClick={onDismissShortcutsHint}>
              Rozumiem
            </Button>
          )}
        </div>
      )}

      {/* Bramka rangi zamiast pustego kliknięcia: teleprompter jest funkcją beta
          od poziomu 3, a użytkownik ma zobaczyć ile mu brakuje i czym to skrócić,
          nie komunikat o braku uprawnień. */}
      {isHUDOpen && (
        <FeatureGate
          feature="LIVE_HUD_TELEPROMPTER"
          hasPaidPass={hasActivePass}
          pitch="Podpowiedzi z Twojego Vaultu na wierzchu ekranu w trakcie rozmowy — bez przeglądania notatek na oczach rekrutera."
          onTrain={() => {
            setHUDOpen(false);
            setActiveTab('trenuj');
          }}
          onBuyPass={() => {
            setHUDOpen(false);
            setActiveTab('pricing');
          }}
        >
          <ReactFloatingPanel isOpen onClose={() => setHUDOpen(false)} vault={vault} />
        </FeatureGate>
      )}
      <InterviewLoopModal isOpen={isLoopOpen} onClose={() => setLoopOpen(false)} vault={vault} />
    </Card>
  );
};
