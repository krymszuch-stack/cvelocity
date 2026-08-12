import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock3, BriefcaseBusiness, Plus, CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import { ApplicationRecord } from '../types';
import { Button } from './ui/Button';
import { Card, CardHeader, PageHeader } from './ui/Card';
import { StatusBadge } from './ui/StatusBadge';

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

  const visibleApplications = useMemo(() => {
    const sorted = [...applications].sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    if (statusFilter === 'all') return sorted;
    return sorted.filter((application) => application.status === statusFilter);
  }, [applications, statusFilter]);

  const addSampleApplication = () => {
    if (!onAddApplication) return;

    const sample: ApplicationRecord = {
      id: `sample-${Date.now()}`,
      jobTitle: 'Frontend Developer (React / TypeScript)',
      company: 'Northwind Studio',
      source: 'OLX / Pracuj.pl',
      status: 'applied',
      appliedAt: new Date().toISOString(),
      matchScore: 84,
      notes: 'Aplikacja wysłana po weryfikacji wymagań i dojazdu.',
      url: 'https://example.com/offer',
    };

    onAddApplication(sample);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BriefcaseBusiness}
        title="Tracker aplikacji"
        description="Osobna lista aplikacji z datą i godziną wysłania — bez agresywnych popupów typu Indeed."
        actions={
          <Button size="sm" icon={Plus} variant="primary" onClick={addSampleApplication}>
            Dodaj aplikację
          </Button>
        }
      />

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
              Zapisz pierwszą aplikację z poziomu oferty i ta lista pokaże datę, godzinę oraz status bez agresywnego modalnego flow.
            </p>
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
                    <span>Match: {application.matchScore}%</span>
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
