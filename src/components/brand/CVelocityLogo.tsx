import React from 'react';
import { CVelocityMark } from './CVelocityMark';

export interface LogoProps {
  className?: string;
  showBadge?: boolean;
  /** Sam kafelek ze znakiem — pasek boczny w wersji zwiniętej. */
  collapsed?: boolean;
}

export const CVelocityLogo: React.FC<LogoProps> = ({
  className = '',
  showBadge = false,
  collapsed = false,
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface/80 p-1.5 shadow-xs backdrop-blur-xs transition-transform duration-200 group-hover:scale-105">
      <CVelocityMark className="h-full w-full" />
    </div>

    {!collapsed && (
      <div className="flex items-center gap-1.5">
        <span className="font-sans text-base font-extrabold tracking-tight text-ink">
          <span className="bg-gradient-to-r from-[#F26440] to-[#FF7A59] bg-clip-text text-transparent">
            CV
          </span>
          <span>ELOCITY</span>
        </span>
        {showBadge && (
          <span className="rounded-md border border-brand-500/20 bg-brand-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-brand-fg">
            AI
          </span>
        )}
      </div>
    )}
  </div>
);
