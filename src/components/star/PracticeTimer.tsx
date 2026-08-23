import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PracticeTimerProps {
  targetDurationSec?: number;
  initialElapsedSec?: number;
  onSaveDuration?: (durationSec: number) => void;
  className?: string;
}

export const PracticeTimer: React.FC<PracticeTimerProps> = ({
  targetDurationSec = 90,
  initialElapsedSec = 0,
  onSaveDuration,
  className = '',
}) => {
  const [elapsedSec, setElapsedSec] = useState(initialElapsedSec);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSec(0);
  };

  const handleStopAndSave = () => {
    setIsRunning(false);
    if (onSaveDuration) {
      onSaveDuration(elapsedSec);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round((elapsedSec / targetDurationSec) * 100));

  // Wskaźnik fazy wypowiedzi STAR w oparciu o upływający czas
  const getStagePacing = (elapsed: number, target: number) => {
    const ratio = elapsed / target;
    if (ratio < 0.2) return { stage: 'S (Situation)', label: 'Zarysowanie kontekstu (ok. 15-20s)', color: 'text-muted' };
    if (ratio < 0.35) return { stage: 'T (Task)', label: 'Twoje zadanie i wyzwanie (ok. 10-15s)', color: 'text-brand-600' };
    if (ratio < 0.75) return { stage: 'A (Action)', label: 'Główne działania i technologie (ok. 40s)', color: 'text-brand-700' };
    if (ratio <= 1.1) return { stage: 'R (Result)', label: 'Rezultat i wymierne metryki (ok. 20s)', color: 'text-success-fg' };
    return { stage: 'Przekroczono czas', label: 'Zalecane domknięcie wypowiedzi (< 2 min)', color: 'text-warning-fg' };
  };

  const pacing = getStagePacing(elapsedSec, targetDurationSec);

  return (
    <div className={`rounded-2xl border border-line bg-elevated p-4 shadow-raised space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isRunning ? 'bg-brand-600 text-on-brand animate-pulse' : 'bg-sunken text-muted'}`}>
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink block">
              Timer Ćwiczenia Odpowiedzi STAR
            </span>
            <span className={`text-[11px] font-semibold ${pacing.color}`}>
              Faza: {pacing.stage} — {pacing.label}
            </span>
          </div>
        </div>

        {/* Czasomierz */}
        <div className="text-right">
          <div className="font-mono text-xl font-black text-ink">
            {formatTime(elapsedSec)} <span className="text-xs font-normal text-muted">/ {formatTime(targetDurationSec)}</span>
          </div>
        </div>
      </div>

      {/* Pasek postępu czasu i faz STAR */}
      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-sunken flex">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full transition-all duration-300 ${
              progressPercent > 100 ? 'bg-warning' : progressPercent > 75 ? 'bg-success' : 'bg-brand-600'
            }`}
          />
        </div>

        {/* Znaczniki etapów S - T - A - R */}
        <div className="flex justify-between text-[9px] font-mono text-subtle px-1">
          <span>0s (S)</span>
          <span>18s (T)</span>
          <span>32s (A)</span>
          <span>68s (R)</span>
          <span>90s (Stop)</span>
        </div>
      </div>

      {/* Przyciski kontrolne */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => setIsRunning(true)}
            >
              {elapsedSec > 0 ? 'Wznów' : 'Rozpocznij próbę'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Pause}
              onClick={() => setIsRunning(false)}
            >
              Pauza
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleReset}
            disabled={elapsedSec === 0 && !isRunning}
          >
            Reset
          </Button>
        </div>

        {onSaveDuration && elapsedSec > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={CheckCircle2}
            onClick={handleStopAndSave}
          >
            Zapisz czas ({elapsedSec}s)
          </Button>
        )}
      </div>
    </div>
  );
};
