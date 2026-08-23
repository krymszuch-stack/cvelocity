import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  CheckSquare,
  Radio,
  FileCheck2,
  Calendar,
  Building,
  Plus,
  Trash2,
  BookOpen,
  Zap,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MasterVault,
  InterviewLoopSession,
  JobOffer,
  STARStory,
  SkillBridge,
} from '../../types';
import {
  createInterviewSession,
  loadInterviewSessions,
  saveInterviewSession,
  deleteInterviewSession,
  STAGE_LABELS,
} from '../../lib/interviewLoopEngine';
import { generateSkillBridges } from '../../lib/skillBridgeEngine';
import { PreCallChecklistView } from '../../components/loop/PreCallChecklistView';
import { LiveTrackerView } from '../../components/loop/LiveTrackerView';
import { PostCallDebriefView } from '../../components/loop/PostCallDebriefView';
import { STARStoryCard } from '../../components/star/STARStoryCard';
import { SkillBridgeCard } from '../../components/bridge/SkillBridgeCard';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Card } from '../../components/ui/Card';

export type LoopViewMode = 'PRE_CALL_BRIEF' | 'LIVE_HUD' | 'POST_CALL_DEBRIEF';

export interface InterviewLoopManagerProps {
  vault: MasterVault;
  jobOffer?: JobOffer;
  initialSessionId?: string;
  className?: string;
}

export const InterviewLoopManager: React.FC<InterviewLoopManagerProps> = ({
  vault,
  jobOffer,
  initialSessionId,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<LoopViewMode>('PRE_CALL_BRIEF');
  const [sessions, setSessions] = useState<InterviewLoopSession[]>(() => loadInterviewSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId || null);

  // Inicjalizacja sesji
  useEffect(() => {
    const loaded = loadInterviewSessions();
    if (loaded.length > 0) {
      setSessions(loaded);
      if (!activeSessionId) {
        setActiveSessionId(loaded[0].id);
      }
    } else {
      const initial = createInterviewSession(
        jobOffer?.company || 'Firma Docelowa',
        jobOffer?.title || vault.personalInfo?.title || 'Stanowisko',
        undefined,
        jobOffer?.id,
        jobOffer?.rawDescription || jobOffer?.description,
        ['Rekrutacja', 'Techniczne']
      );
      saveInterviewSession(initial);
      setSessions([initial]);
      setActiveSessionId(initial.id);
    }
  }, [jobOffer, vault, activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleUpdateSession = (updated: InterviewLoopSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    saveInterviewSession(updated);
  };

  const handleCreateSession = () => {
    const newSession = createInterviewSession(
      'Nowa Rozmowa',
      vault.personalInfo?.title || 'Stanowisko',
      undefined,
      undefined,
      undefined,
      ['Nowa']
    );
    saveInterviewSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setViewMode('PRE_CALL_BRIEF');
  };

  const handleDeleteSession = (id: string) => {
    deleteInterviewSession(id);
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id && remaining.length > 0) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Dostępne historie STAR i Mosty Kompetencyjne
  const availableBridges = useMemo(() => {
    const missing = ['Kafka', 'AWS', 'Kubernetes', 'GraphQL'];
    return generateSkillBridges(missing, vault);
  }, [vault]);

  if (!activeSession) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Główny Komponentu */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-elevated p-6 shadow-raised">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-on-brand shadow-raised">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-ink font-mono tracking-tight">
                Interview Loop Manager
              </h2>
              <Chip variant="brand" size="sm">
                360° Cykl Rozmowy
              </Chip>
            </div>
            <p className="text-xs text-muted">
              Pre-Call Brief • Live HUD Telemetria • Post-Call Debrief z auto-mailem Follow-Up
            </p>
          </div>
        </div>

        {/* Przełącznik sesji */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line">
            {sessions.map((sess) => (
              <button
                key={sess.id}
                type="button"
                onClick={() => setActiveSessionId(sess.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-all ${
                  sess.id === activeSession.id
                    ? 'bg-brand-600 text-on-brand font-bold shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {sess.companyName}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={handleCreateSession}
          >
            Nowa Sesja
          </Button>
        </div>
      </div>

      {/* 2. Nawigacja 3 Głównych Widoków */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-2xl bg-sunken p-1.5 border border-line">
        <button
          type="button"
          onClick={() => setViewMode('PRE_CALL_BRIEF')}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-xs font-bold transition-all ${
            viewMode === 'PRE_CALL_BRIEF'
              ? 'bg-surface text-ink shadow-raised border border-line'
              : 'text-muted hover:text-ink'
          }`}
        >
          <CheckSquare className="h-4 w-4 text-brand-600" />
          <span>1. PreCallBrief (Przygotowanie)</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('LIVE_HUD')}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-xs font-bold transition-all ${
            viewMode === 'LIVE_HUD'
              ? 'bg-brand-600 text-on-brand shadow-raised'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>2. LiveHUD (W Trakcie Rozmowy)</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('POST_CALL_DEBRIEF')}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-xs font-bold transition-all ${
            viewMode === 'POST_CALL_DEBRIEF'
              ? 'bg-surface text-ink shadow-raised border border-line'
              : 'text-muted hover:text-ink'
          }`}
        >
          <FileCheck2 className="h-4 w-4 text-brand-600" />
          <span>3. PostCallDebrief (Auto-Mail & Wnioski)</span>
        </button>
      </div>

      {/* 3. Widok 1: PreCallBrief */}
      {viewMode === 'PRE_CALL_BRIEF' && (
        <div className="space-y-6">
          {/* Metadane Spotkania */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-line bg-surface p-5">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block">
                Firma i Organizacja:
              </label>
              <input
                type="text"
                value={activeSession.companyName}
                onChange={(e) =>
                  handleUpdateSession({ ...activeSession, companyName: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-elevated px-3 py-2 text-xs font-mono font-bold text-ink focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block">
                Stanowisko Rekrutacyjne:
              </label>
              <input
                type="text"
                value={activeSession.roleTitle}
                onChange={(e) =>
                  handleUpdateSession({ ...activeSession, roleTitle: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-elevated px-3 py-2 text-xs font-mono font-bold text-ink focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Checklista Przed Rozmową */}
          <PreCallChecklistView
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onStartLiveTracking={() => setViewMode('LIVE_HUD')}
          />

          {/* Podgląd Gotowych Mostów Kompetencyjnych */}
          <div className="rounded-3xl border border-line bg-elevated p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <h4 className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                  Mosty Kompetencyjne do Wykorzystania (SkillBridge):
                </h4>
              </div>
              <Chip variant="brand" size="sm">
                {availableBridges.length} Mosty Gotowe
              </Chip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {availableBridges.slice(0, 2).map((bridge) => (
                <SkillBridgeCard key={bridge.id} bridge={bridge} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Widok 2: LiveHUD */}
      {viewMode === 'LIVE_HUD' && (
        <div className="space-y-6">
          <LiveTrackerView
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onFinishToDebrief={() => setViewMode('POST_CALL_DEBRIEF')}
          />
        </div>
      )}

      {/* 5. Widok 3: PostCallDebrief */}
      {viewMode === 'POST_CALL_DEBRIEF' && (
        <div className="space-y-6">
          <PostCallDebriefView
            session={activeSession}
            vault={vault}
            onUpdateSession={handleUpdateSession}
            onClose={() => setViewMode('PRE_CALL_BRIEF')}
          />
        </div>
      )}
    </div>
  );
};
