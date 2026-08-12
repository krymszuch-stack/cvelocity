import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock3, BriefcaseBusiness, Plus, CheckCircle2, CircleDashed, XCircle, X } from 'lucide-react';
import { ApplicationRecord } from '../types';
import { Button } from './ui/Button';
import { Card, CardHeader, PageHeader } from './ui/Card';
import { StatusBadge } from './ui/StatusBadge';
import { Input } from './ui/Field';

interface ApplicationTrackerProps {
  applications: ApplicationRecord[];
  onAddApplication?: (record: ApplicationRecord) => void;
}

const STATUS_META: Record<ApplicationRecord['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  saved: { label: 'Zapisana', variant: 'warning' },
  applied: { label: 'Aplikacja wysłana', variant: 'success' },
  interview: { label: 'Rozmowa', variant: 'success' },
  rejected: { label: 'Odrzucona', variant: 'danger' },
};

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ applications, onAddApplication }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationRecord['status']>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const visibleApplications = useMemo(() => {
    const sorted = [...applications].sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    if (statusFilter === 'all') return sorted;
    return sorted.filter((application) => application.status === statusFilter);
  }, [applications, statusFilter]);

  const resetForm = () => {
    setFormJobTitle('');
    setFormCompany('');
    setFormUrl('');
    setIsAdding(false);
  };

  // Every field here is what the user actually typed. Nothing is invented — an
  // application record with a fabricated title, company or "wysłana" status is
  // worse than no record at all (see "0-Hallucinacji" w AGENTS.md §8.3).
  const handleSubmitManualApplication = () => {
    if (!onAddApplication || !formJobTitle.trim() || !formCompany.trim()) return;

    onAddApplication({
      id: `${Date.now()}`,
      jobTitle: formJobTitle.trim(),
      company: formCompany.trim(),
      source: 'manual',
      status: 'saved',
      appliedAt: new Date().toISOString(),
      matchScore: 0,
      notes: undefined,
      url: formUrl.trim() || undefined,
    });

    resetForm();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BriefcaseBusiness}
        title="Tracker aplikacji"
        description="Osobna lista aplikacji z datą i godziną wysłania — bez agresywnych popupów typu Indeed."
        actions={
          onAddApplication && (
            <Button size="sm" icon={Plus} variant="primary" onClick={() => setIsAdding(true)}>
              Dodaj aplikację
            </Button>
          )
        }
      />

      {isAdding && (
        <Card>
          <CardHeader
            icon={Plus}
            title="Nowa aplikacja"
            subtitle="Wpisz dane oferty, do której faktycznie aplikujesz."
            accent="brand"
            actions={
              <Button size="sm" variant="ghost" icon={X} onClick={resetForm}>
                Anuluj
              </Button>
            }
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              label="Stanowisko"
              required
              value={formJobTitle}
              onChange={(e) => setFormJobTitle(e.target.value)}
              placeholder="np. Senior Frontend Developer"
            />
            <Input
              label="Firma"
              required
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              placeholder="np. Northwind Studio"
            />
            <Input
              label="Link do oferty (opcjonalnie)"
              wrapClassName="sm:col-span-2"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={resetForm}>
              Anuluj
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              disabled={!formJobTitle.trim() || !formCompany.trim()}
              onClick={handleSubmitManualApplication}
            >
              Zapisz aplikację
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={CalendarDays}
          title="Filtry aplikacji"
          subtitle="Szybko sprawdzaj, które oferty są aktywne, odrzucone lub czekające na rozmowę."
          accent="brand"
          actions={
            <div className="flex flex-wrap gap-2">
              {(['all', 'saved', 'applied', 'interview', 'rejected'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="xs"
                  variant={statusFilter === filter ? 'primary' : 'ghost'}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter === 'all' ? 'Wszystkie' : STATUS_META[filter].label}
                </Button>
              ))}
            </div>
          }
        />
      </Card>

      {visibleApplications.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CircleDashed className="w-10 h-10 text-muted" />
            <h3 className="mt-4 text-lg font-bold text-ink">Brak zapisanych aplikacji</h3>
            <p className="mt-2 max-w-md text-sm text-muted">
              Zapisz pierwszą aplikację z poziomu oferty (przycisk „Zapisz aplikację" w zakładce Dopasuj Ofertę) albo dodaj ją ręcznie poniżej.
            </p>
            {onAddApplication && !isAdding && (
              <Button className="mt-4" size="sm" icon={Plus} variant="outline" onClick={() => setIsAdding(true)}>
                Dodaj ręcznie
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleApplications.map((application) => {
            const appliedAt = new Date(application.appliedAt);
            const meta = STATUS_META[application.status];

            return (
              <Card key={application.id} className="overflow-hidden">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-ink truncate">{application.jobTitle}</h3>
                      <StatusBadge variant={meta.variant} size="sm" showIcon={false}>{meta.label}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted">{application.company} · {application.source}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-subtle">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-brand-fg" />
                      <span>{appliedAt.toLocaleDateString('pl-PL')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4 text-brand-fg" />
                      <span>{appliedAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {application.status === 'applied' ? <CheckCircle2 className="w-4 h-4 text-success-fg" /> : null}
                    {application.status === 'rejected' ? <XCircle className="w-4 h-4 text-danger-fg" /> : null}
                    {application.status !== 'applied' && application.status !== 'rejected' ? <CircleDashed className="w-4 h-4 text-warning-fg" /> : null}
                    {/* matchScore is 0 both for "no keywords matched" and for "never
                        analyzed against an offer" (manual entries) — showing "Match: 0%"
                        for the latter would read as a real, computed zero. */}
                    <span>Match: {application.matchScore > 0 ? `${application.matchScore}%` : 'brak analizy'}</span>
                  </div>

                  {application.url && (
                    <a
                      href={application.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-brand-fg hover:underline"
                    >
                      Otwórz ofertę
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
