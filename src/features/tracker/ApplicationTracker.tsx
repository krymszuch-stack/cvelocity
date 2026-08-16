import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  ArrowUpDown,
  Briefcase,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ApplicationStatus } from './StatusSelect';
import { JobApplication, ApplicationModal } from './ApplicationModal';
import { TrackerTable } from './TrackerTable';
import { StatTile } from '../../components/ui/StatTile';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';

const STORAGE_KEY = 'cvelocity_applications_data';

const DEFAULT_APPLICATIONS: JobApplication[] = [
  {
    id: 'app-1',
    company: 'TechCorp Solutions',
    position: 'Senior Frontend Architect',
    salary: '26 000 - 32 000 PLN B2B',
    date: '2026-08-12',
    status: 'Rozmowa',
    notes: 'I etap techniczny przeszedł świetnie. II etap z VP of Engineering w czwartek o 14:00.',
    jobUrl: 'https://justjoin.it',
  },
  {
    id: 'app-2',
    company: 'CloudScale Europe',
    position: 'Full-Stack React & Node Engineer',
    salary: '22 000 - 28 000 PLN B2B',
    date: '2026-08-10',
    status: 'Rozmowa',
    notes: 'Zadanie rekrutacyjne z Next.js 15 i Tailwind v4 do oddania do piątku.',
    jobUrl: 'https://nofluffjobs.com',
  },
  {
    id: 'app-3',
    company: 'AI Fintech Innovations',
    position: 'TypeScript Platform Lead',
    salary: '30 000 - 35 000 PLN B2B',
    date: '2026-08-04',
    status: 'Oferta',
    notes: 'Otrzymano oficjalną ofertę współpracy! Decyzja do 20 sierpnia.',
    jobUrl: 'https://remotive.com',
  },
  {
    id: 'app-4',
    company: 'Global SaaS Hub',
    position: 'Frontend Developer',
    salary: '18 000 - 24 000 PLN B2B',
    date: '2026-08-02',
    status: 'Wysłana',
    notes: 'Aplikacja wysłana przez 1-Click Match z dopasowanym CV.',
  },
];

export const ApplicationTracker: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Błąd ładowania aplikacji z storage:', e);
      }
    }
    return DEFAULT_APPLICATIONS;
  });

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'COMPANY'>('DATE_DESC');

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Notes Drawer/Modal
  const [notesApp, setNotesApp] = useState<JobApplication | null>(null);
  const [currentNotes, setCurrentNotes] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  // Statistics
  const totalApps = applications.length;
  const inInterviews = applications.filter((a) => a.status === 'Rozmowa').length;
  const offersReceived = applications.filter((a) => a.status === 'Oferta').length;
  const responseRate = totalApps > 0 ? Math.round(((inInterviews + offersReceived) / totalApps) * 100) : 0;

  // Filtered and Sorted
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        if (filterStatus !== 'ALL' && app.status !== filterStatus) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return (
            app.company.toLowerCase().includes(query) ||
            app.position.toLowerCase().includes(query) ||
            (app.notes && app.notes.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'DATE_ASC') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'COMPANY') return a.company.localeCompare(b.company);
        return 0;
      });
  }, [applications, filterStatus, searchQuery, sortBy]);

  const handleStatusChange = (id: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const handleSaveApp = (app: JobApplication) => {
    if (editingApp) {
      setApplications((prev) => prev.map((item) => (item.id === app.id ? app : item)));
    } else {
      setApplications((prev) => [app, ...prev]);
    }
  };

  const handleDeleteApp = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to zgłoszenie z pipeline?')) {
      setApplications((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleOpenNotes = (app: JobApplication) => {
    setNotesApp(app);
    setCurrentNotes(app.notes || '');
  };

  const handleSaveNotes = () => {
    if (!notesApp) return;
    setApplications((prev) =>
      prev.map((item) => (item.id === notesApp.id ? { ...item, notes: currentNotes } : item))
    );
    setNotesApp(null);
  };

  const filterButtons: Array<{ id: string; label: string; count: number }> = [
    { id: 'ALL', label: 'Wszystkie', count: totalApps },
    { id: 'Wysłana', label: 'Wysłane', count: applications.filter((a) => a.status === 'Wysłana').length },
    { id: 'Rozmowa', label: 'Rozmowy', count: inInterviews },
    { id: 'Oferta', label: 'Oferty', count: offersReceived },
    { id: 'Odrzucona', label: 'Odrzucone', count: applications.filter((a) => a.status === 'Odrzucona').length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline Aplikacji (Application Tracker)"
        description="Zarządzaj swoimi procesami rekrutacyjnymi w stylu Linear. Monitoruj etapy, notatki z rozmów i wskaźnik skuteczności aplikacji w czasie rzeczywistym."
        badge="Live Recruitment CRM"
        actions={
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setEditingApp(null);
              setIsAppModalOpen(true);
            }}
          >
            Dodaj Aplikację
          </Button>
        }
      />

      {/* KPI Top Stat Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Zgłoszenia"
          value={totalApps}
          icon={Briefcase}
          subtext="Wszystkie w bazie"
        />

        <StatTile
          label="Rozmowy"
          value={inInterviews}
          icon={TrendingUp}
          subtext="Aktywne etapy"
        />

        <StatTile
          label="Otrzymane Oferty"
          value={offersReceived}
          icon={Award}
          subtext="Końcowe propozycje"
        />

        <StatTile
          label="Response Rate"
          value={`${responseRate}%`}
          icon={CheckCircle2}
          subtext="Wskaźnik odzewu"
        />
      </div>

      {/* Control Bar: Filters, Search, Sort */}
      <Card tone="raised" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Gmail/Linear Style Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilterStatus(btn.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all focus-visible:outline-none ${
                  filterStatus === btn.id
                    ? 'bg-brand-600 text-on-brand shadow-xs'
                    : 'border border-line bg-sunken text-muted hover:border-brand-300 hover:text-ink'
                }`}
              >
                <span>{btn.label}</span>
                <span
                  className={`rounded-md px-1.5 py-px font-mono text-[10px] ${
                    filterStatus === btn.id ? 'bg-surface/30 text-on-brand' : 'bg-surface text-muted'
                  }`}
                >
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2">
            <Input
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj firmy lub roli..."
              containerClassName="w-48 sm:w-64"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-line bg-sunken px-3 py-2 font-mono text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="DATE_DESC">Najnowsze</option>
              <option value="DATE_ASC">Najstarsze</option>
              <option value="COMPANY">Firma A-Z</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table View */}
      <TrackerTable
        applications={filteredApps}
        onStatusChange={handleStatusChange}
        onEdit={(app) => {
          setEditingApp(app);
          setIsAppModalOpen(true);
        }}
        onDelete={handleDeleteApp}
        onOpenNotes={handleOpenNotes}
      />

      {/* Create / Edit Application Modal */}
      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => {
          setIsAppModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSaveApp}
        initialData={editingApp}
      />

      {/* Notes Modal */}
      {notesApp && (
        <Modal
          isOpen={Boolean(notesApp)}
          onClose={() => setNotesApp(null)}
          title={`Notatki Rekrutacyjne: ${notesApp.company} (${notesApp.position})`}
          size="md"
        >
          <div className="space-y-4">
            <Textarea
              label="Zapiski z rozmów technicznych, pytania i ustalenia finansowe"
              rows={6}
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Wpisz notatki z rozmów rekrutacyjnych..."
            />

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" size="sm" onClick={() => setNotesApp(null)}>
                Anuluj
              </Button>

              <Button variant="primary" size="md" onClick={handleSaveNotes}>
                Zapisz Notatkę
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
