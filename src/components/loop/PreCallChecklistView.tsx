import React from 'react';
import {
  CheckCircle2,
  Circle,
  Video,
  BookOpen,
  Coffee,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { InterviewLoopSession, PreCallChecklistItem } from '../../types';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';

export interface PreCallChecklistViewProps {
  session: InterviewLoopSession;
  onUpdateSession: (updated: InterviewLoopSession) => void;
  onStartLiveTracking: () => void;
}

const CATEGORY_META = {
  TECHNICAL: {
    label: 'Sprzęt & Połączenie',
    icon: Video,
    color: 'text-brand-600',
  },
  RESEARCH: {
    label: 'Materiały & Autoprezentacja',
    icon: BookOpen,
    color: 'text-brand-700',
  },
  ENVIRONMENT: {
    label: 'Otoczenie & Komfort',
    icon: Coffee,
    color: 'text-amber-600',
  },
};

export const PreCallChecklistView: React.FC<PreCallChecklistViewProps> = ({
  session,
  onUpdateSession,
  onStartLiveTracking,
}) => {
  const checklist = session.preCallChecklist;
  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isReady = completedCount === totalCount;

  const handleToggleItem = (itemId: string) => {
    const updatedList = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateSession({
      ...session,
      preCallChecklist: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  const categories: Array<'TECHNICAL' | 'RESEARCH' | 'ENVIRONMENT'> = [
    'TECHNICAL',
    'RESEARCH',
    'ENVIRONMENT',
  ];

  return (
    <div className="space-y-5">
      {/* Pasek postępu przygotowań */}
      <div className="rounded-2xl border border-line bg-surface p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span>Gotowość Przed Rozmową:</span>
          </span>
          <Chip variant={isReady ? 'success' : 'brand'} size="sm">
            {completedCount} / {totalCount} ({progressPercent}%)
          </Chip>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-sunken">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full transition-all duration-300 ${
              isReady ? 'bg-success' : 'bg-brand-600'
            }`}
          />
        </div>
      </div>

      {/* Kategorie checklisty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {categories.map((catKey) => {
          const meta = CATEGORY_META[catKey];
          const items = checklist.filter((i) => i.category === catKey);
          const Icon = meta.icon;

          return (
            <div
              key={catKey}
              className="rounded-2xl border border-line bg-elevated p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center gap-2 border-b border-line pb-2">
                <Icon className={`h-4 w-4 ${meta.color}`} />
                <h4 className="font-bold text-xs text-ink">{meta.label}</h4>
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleItem(item.id)}
                    className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left hover:bg-sunken transition-colors group"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted group-hover:text-ink mt-0.5" />
                    )}
                    <span
                      className={`text-xs font-sans leading-snug ${
                        item.completed ? 'text-muted line-through' : 'text-ink font-medium'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Przejście do spotkania na żywo */}
      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
        <div>
          <span className="text-xs font-bold text-ink block">
            Wszystko gotowe do połączenia?
          </span>
          <span className="text-[11px] text-muted">
            Przełącz na Live Tracker, aby monitorować etapy i zapisywać uwagi na bieżąco.
          </span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          icon={ArrowRight}
          onClick={onStartLiveTracking}
        >
          Uruchom Live Tracker 🎙️
        </Button>
      </div>
    </div>
  );
};
