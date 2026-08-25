import React, { useId } from 'react';

/**
 * Sygnet CVelocity — granatowe „C" (Vault Loop) i pomarańczowy wektor „V"
 * (Supersonic Shockwave) na kafelku z gradientem.
 *
 * Kolory nie są zaszyte w klasach: pochodzą z tokenów `--mark-*`
 * (`tokens.css`), więc komponent podąża za motywem tak samo jak reszta
 * paska bocznego. Warianty plikowe znaku leżą w `public/brand/`.
 *
 * `useId` dla maski SVG jest tu koniecznością, nie ozdobą: statyczne
 * `id="cv-mini-mask"` kolidowałoby przy dwóch egzemplarzach na stronie
 * (pasek boczny + ekran mobilny), a druga definicja maski wygrywa w DOM
 * i potrafi wyciąć złemu egzemplarzowi niewłaściwą część literki.
 */
export interface LogoProps {
  className?: string;
  showBadge?: boolean;
  /** Sam kafelek ze znakiem, bez typografii — wąż nawigacji w wersji zwiniętej. */
  collapsed?: boolean;
}

export const CVelocityLogo: React.FC<LogoProps> = ({
  className = '',
  showBadge = true,
  collapsed = false,
}) => {
  const maskId = useId();

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="bg-mark-tile shadow-mark-glow flex h-8 w-8 shrink-0 items-center justify-center rounded-xl p-1">
        <svg viewBox="-220 -160 440 320" className="h-full w-full" fill="none" aria-hidden="true">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-300" y="-300" width="600" height="600">
              <rect x="-300" y="-300" width="600" height="600" fill="#ffffff" />
              <path d="M 20 -75 L 110 0 L 20 75" fill="none" stroke="#000000" strokeWidth="35" strokeLinecap="round" />
            </mask>
          </defs>
          <g transform="skewX(-10)">
            {/* C — jasne na ciemnym kafelku; maska odcina miejsce na wektor V. */}
            <g mask={`url(#${maskId})`} stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round">
              <path d="M 30 -75 A 80 80 0 1 0 30 75" />
            </g>
            {/* V — akcent #F26440 z księgi znaku (token --mark-accent). */}
            <g stroke="var(--mark-accent)" strokeWidth="20" strokeLinecap="round">
              <path d="M 20 -75 L 110 0 L 20 75" />
            </g>
          </g>
        </svg>
      </div>

      {!collapsed && (
        <div className="flex items-center">
          <span className="font-sans text-sm font-black tracking-tight text-mark-ink">
            CV<span className="text-mark-accent">ELOCITY</span>
          </span>
          {showBadge && (
            <span className="ml-1.5 rounded-sm border border-mark-accent/20 bg-mark-accent/10 px-1 py-px font-mono text-[9px] font-bold text-mark-accent">
              v2.0
            </span>
          )}
        </div>
      )}
    </div>
  );
};
