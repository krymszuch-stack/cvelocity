import React from 'react';
import { CVelocityMark } from './CVelocityMark';

/**
 * Logotyp: sygnet na kafelku z gradientem + typografia i odznaka wersji.
 *
 * Kafelek jest zawsze ciemny (gradient granat → `#0F172A`), dlatego sygnet
 * dostaje `onDark` — inaczej w jasnym motywie granatowa kreska zlałaby się
 * z tłem kafelka.
 *
 * Kontener ma stałe wymiary (`h-9 w-9`), a wariant `collapsed` chowa całą
 * typografię zamiast ją zwężać. Zwężany napis przeskakiwał w trakcie animacji
 * paska bocznego — reguła 4 z `AGENTS.md` (poprawiaj klasę, nie wystąpienie).
 */
export interface LogoProps {
  className?: string;
  showBadge?: boolean;
  /** Sam kafelek ze znakiem — pasek boczny w wersji zwiniętej. */
  collapsed?: boolean;
}

export const CVelocityLogo: React.FC<LogoProps> = ({
  className = '',
  showBadge = true,
  collapsed = false,
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-gradient-to-br from-[#1E3A5F] to-[#0F172A] p-1.5 shadow-[0_0_15px_rgba(242,100,64,0.15)]">
      <CVelocityMark className="h-full w-full" onDark speedLines={false} />
    </div>

    {!collapsed && (
      <div className="flex items-center">
        <span className="font-sans text-base font-black tracking-tight text-mark-ink">
          CV<span className="text-mark-accent">ELOCITY</span>
        </span>
        {showBadge && (
          <span className="ml-1.5 rounded border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#F26440]">
            v2.0
          </span>
        )}
      </div>
    )}
  </div>
);
