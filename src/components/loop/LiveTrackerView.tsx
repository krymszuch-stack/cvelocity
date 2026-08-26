import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Clock,
  Plus,
  Smile,
  Meh,
  Frown,
  ArrowRight,
  Sparkles,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import {
  InterviewLoopSession,
  InterviewStage,
  LiveNoteItem,
} from '../../types';
import {
  STAGE_LABELS,
  advanceInterviewStage,
  addLiveNote,
} from '../../lib/interviewLoopEngine';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';

export interface LiveTrackerViewProps {
  session: InterviewLoopSession;
  onUpdateSession: (updated: InterviewLoopSession) => void;
  onFinishToDebrief: () => void;
}

const STAGES: InterviewStage[] = [
  'INTRO',
  'TECHNICAL',
  'SYSTEM_DESIGN',
  'BEHAVIORAL',
  'CANDIDATE_QA',
  'WRAP_UP',
];

export const LiveTrackerView: React.FC<LiveTrackerViewProps> = ({
  session,
  onUpdateSession,
  onFinishToDebrief,
}) => {
  const [noteText, setNoteText] = useState('');
  const [sentiment, setSentiment] = useState<'POSITIVE' | 'NEUTRAL' | 'CHALLENGING'>('NEUTRAL');

  const currentStage = session.liveTracker.currentStage;
  const currentStageMeta = STAGE_LABELS[currentStage];

  const handleSelectStage = (stage: InterviewStage) => {
    const updated = advanceInterviewStage(session, stage);
    onUpdateSession(updated);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const updated = addLiveNote(session, noteText, sentiment);
    onUpdateSession(updated);
    setNoteText('');
  };

  return (
    <div className="space-y-5">
      {/* 1. Oś Etapów Rozmowy (Stage Pipeline) */}
      <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted block">
          Etapy Rozmowy w Czasie Rzeczywistym:
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
          {STAGES.map((stage, idx) => {
            const isActive = stage === currentStage;
            const isPassed = STAGES.indexOf(currentStage) > idx;
            const meta = STAGE_LABELS[stage];

            return (
              <button
                key={stage}
                type="button"
                onClick={() => handleSelectStage(stage)}
                className={`rounded-xl p-2 text-left transition-all ${
                  isActive
                    ? 'bg-brand-600 text-on-brand shadow-xs font-bold'
                    : isPassed
                    ? 'bg-success-soft text-success-fg border border-success/30'
                    : 'bg-elevated text-muted border border-line hover:text-ink'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span>KROK {idx + 1}</span>
                  {isPassed && <CheckCircle2 className="h-3 w-3 text-success" />}
                </div>
                <div className="text-[11px] truncate mt-0.5">{meta.shortLabel}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Podpowiedź dla aktywnego etapu */}
      <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-extrabold text-brand-700 uppercase">
            {currentStageMeta.label}
          </span>
          <Chip variant="brand" size="sm">
            Aktywny Etap
          </Chip>
        </div>
        <p className="text-xs text-ink/90 font-sans leading-relaxed">
          {currentStageMeta.description}
        </p>
      </div>

      {/* 3. Rejestrator Szybkich Notatek na Żywo */}
      <div className="rounded-2xl border border-line bg-elevated p-4 space-y-3 shadow-xs">
        <label className="font-mono text-xs font-bold text-ink uppercase tracking-wider block">
          Zanotuj pytanie rekrutera lub kluczowy fakt:
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Wpisz pytanie, uwagę lub zagadnienie z rozmowy..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNote();
              }
            }}
            className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none"
          />

          {/* Wybór sentymentu */}
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            <button
              type="button"
              onClick={() => setSentiment('POSITIVE')}
              className={`rounded-lg p-1.5 transition-colors ${
                sentiment === 'POSITIVE' ? 'bg-success-soft text-success' : 'text-muted hover:text-ink'
              }`}
              title="Pozytywny odbiór / świetna odpowiedź"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSentiment('NEUTRAL')}
              className={`rounded-lg p-1.5 transition-colors ${
                sentiment === 'NEUTRAL' ? 'bg-sunken text-ink' : 'text-muted hover:text-ink'
              }`}
              title="Neutralny fakt"
            >
              <Meh className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSentiment('CHALLENGING')}
              className={`rounded-lg p-1.5 transition-colors ${
                sentiment === 'CHALLENGING' ? 'bg-error-soft text-error-fg' : 'text-muted hover:text-ink'
              }`}
              title="Trudne pytanie / wymaga doprecyzowania"
            >
              <Frown className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleAddNote}
          >
            Dodaj
          </Button>
        </div>

        {/* Lista zarejestrowanych notatek */}
        {session.liveTracker.notes.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-1">
            {session.liveTracker.notes.map((note) => (
              <div
                key={note.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface p-2.5 text-xs shadow-2xs"
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[10px] text-muted shrink-0 mt-0.5">
                    {note.timestamp}
                  </span>
                  <span className="font-sans text-ink">{note.text}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[9px] text-muted">
                    {STAGE_LABELS[note.stage].shortLabel}
                  </span>
                  {note.sentiment === 'POSITIVE' && (
                    <Smile className="h-3.5 w-3.5 text-success" />
                  )}
                  {note.sentiment === 'CHALLENGING' && (
                    <Frown className="h-3.5 w-3.5 text-error" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted">
            Brak notatek na żywo. Wpisuj pytania i spostrzeżenia, aby ułatwić debrief.
          </div>
        )}
      </div>

      {/* Podsumowanie i przejście do Debriefu */}
      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
        <div>
          <span className="text-xs font-bold text-ink block">
            Koniec rozmowy?
          </span>
          <span className="text-[11px] text-muted">
            Przejdź do natychmiastowego debriefu i wygeneruj e-mail z podziękowaniem (Follow-Up).
          </span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          icon={ArrowRight}
          onClick={onFinishToDebrief}
        >
          Zakończ i Rozpocznij Debrief 📝
        </Button>
      </div>
    </div>
  );
};
