import React from 'react';

/**
 * Pierścień wyniku — jedyny egzemplarz geometrii, którą wcześniej kopiowano
 * inline przy każdej metryce (konsensus ATS, telemetria, kokpit).
 *
 * Dlaczego komponent, a nie copy-paste SVG: trzy egzemplarze zaczęły już dryfować
 * (dwie różne prędkości animacji tej samej wizualnej metafory), a poprawka
 * geometrii wymagała edycji w N miejscach. Tu jest jedno miejsce prawdy:
 * obwód liczony ze stroke, offset animowany jedną stałą czasową.
 */

export interface ScoreRingProps {
  /** Wynik 0–100. Wartości spoza zakresu są przycinane. */
  value: number;
  /** Rozmiar w px (kwadrat). Default 176 = dotychczasowy h-44 w-44. */
  size?: number;
  /** Grubość pierścienia w jednostkach viewBox (100×100). */
  stroke?: number;
  /** Etykieta pod liczbą, np. „Mediana Rynkowa". */
  label?: string;
  suffix?: string;
  className?: string;
}

/** Kolor łuku — token brandowy; tor zostaje neutralny z powierzchni. */
const TRACK_CLASS = 'text-surface-sunken';
const BAR_CLASS = 'text-brand';
const TRANSITION = 'stroke-dashoffset 700ms cubic-bezier(0.19, 1, 0.22, 1)';

export const ScoreRing: React.FC<ScoreRingProps> = ({
  value,
  size = 176,
  stroke = 8,
  label,
  suffix = '%',
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  // Obwód okręgu r=42 w viewBox 100 — niezależny od rozmiaru renderowania.
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (circumference * clamped) / 100;

  return (
    <div
      role="img"
      aria-label={label ? `${label}: ${clamped}${suffix}` : `Wynik: ${clamped}${suffix}`}
      className={`relative flex flex-col items-center justify-center ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Rozmiar sterowany stylem, bo skala viewBox jest stała (100×100). */}
        <svg
          style={{ width: size, height: size }}
          className="-rotate-90 transform"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className={TRACK_CLASS}
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${BAR_CLASS} transition-all`}
            style={{ transition: TRANSITION }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-black tracking-tight text-ink font-mono sm:text-5xl">
            {clamped}
            {suffix}
          </span>
          {label && (
            <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
