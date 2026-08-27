import React, { useId } from 'react';

export interface CVelocityMarkProps {
  className?: string;
  onDark?: boolean;
  speedLines?: boolean;
}

/**
 * Nowoczesny, minimalistyczny sygnet CVelocity.
 * Geometryczny monogram CV symbolizujący prędkość (Velocity) i rozwój kariery.
 * Wyraźny i czytelny zarówno w rozmiarze 16px jak i 64px.
 */
export const CVelocityMark: React.FC<CVelocityMarkProps> = ({
  className = 'w-8 h-8',
}) => {
  const gradId = useId();

  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${gradId}-grad`} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7A59" />
          <stop offset="50%" stopColor="#F26440" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id={`${gradId}-accent`} x1="16" y1="8" x2="34" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#F26440" />
        </linearGradient>
      </defs>

      {/* Tło łuku C z subtelnym przejściem */}
      <path
        d="M 28 9 C 23.5 6 15 6.5 10 11.5 C 4.5 17 4.5 25 10 30.5 C 15.5 36 24 35.5 28.5 32"
        stroke={`url(#${gradId}-grad)`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Dynamiczny wektor V skierowany do przodu w prawo */}
      <path
        d="M 17 14.5 L 25.5 23 L 35 10"
        stroke={`url(#${gradId}-accent)`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
