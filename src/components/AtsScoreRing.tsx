import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface AtsScoreRingProps {
  score: number; // 0-100
  size?: number; // px, domyślnie 110
  showLabel?: boolean;
  className?: string;
}

export const AtsScoreRing: React.FC<AtsScoreRingProps> = ({
  score,
  size = 110,
  showLabel = true,
  className = '',
}) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = `${strokeDashoffset}`;
      circleRef.current.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
    }
  }, [strokeDashoffset]);

  // Threshold colors mapped to semantic tokens
  const getSemanticColors = () => {
    if (safeScore < 50) {
      return {
        stroke: 'var(--danger)',
        textColor: 'text-danger-fg',
        bgColor: 'bg-danger-soft',
        borderColor: 'border-danger/30',
        label: 'Wymaga uzupełnienia',
      };
    }
    if (safeScore < 80) {
      return {
        stroke: 'var(--warning)',
        textColor: 'text-warning-fg',
        bgColor: 'bg-warning-soft',
        borderColor: 'border-warning/30',
        label: 'Dobre dopasowanie',
      };
    }
    return {
      stroke: 'var(--success)',
      textColor: 'text-success-fg',
      bgColor: 'bg-success-soft',
      borderColor: 'border-success/30',
      label: 'Świetna zgodność ATS',
    };
  };

  const status = getSemanticColors();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      role="progressbar"
      aria-valuenow={safeScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Wynik dopasowania ATS: ${safeScore}%`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          className="h-full w-full -rotate-90 transform"
          viewBox="0 0 100 100"
        >
          {/* Background Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            strokeWidth="8"
            className="stroke-line fill-none opacity-40"
          />
          {/* Animated Value Ring */}
          <circle
            ref={circleRef}
            cx="50"
            cy="50"
            r={radius}
            strokeWidth="8"
            stroke={status.stroke}
            strokeLinecap="round"
            className="fill-none"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference, // initial offset
            }}
          />
        </svg>

        {/* Counter Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            key={safeScore}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="font-mono text-2xl font-black tracking-tight text-ink"
          >
            {safeScore}%
          </motion.span>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-subtle">
            ATS Match
          </span>
        </div>
      </div>

      {showLabel && (
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${status.bgColor} ${status.textColor} ${status.borderColor}`}
        >
          {status.label}
        </span>
      )}
    </div>
  );
};
