import React, { useId } from 'react';

/**
 * Sygnet CVelocity — pełna geometria z księgi znaku: podwójna pętla „C"
 * (Vault Loop) przecięta maską przeplotu, podwójny chevron „V" (Supersonic
 * Shockwave) i trzy linie pędu. Cały rysunek jest pochylony `skewX(-10)`,
 * bo to pochylenie niesie „prędkość" — bez niego znak wygląda jak logo banku.
 *
 * `useId` dla maski to konieczność, nie ozdoba: statyczne `id` kolidowałoby
 * przy dwóch egzemplarzach w DOM (pasek boczny + szuflada mobilna), a druga
 * definicja maski wygrywa i wycina pierwszemu egzemplarzowi niewłaściwy
 * fragment litery.
 *
 * Kolory idą z tokenów `--mark-ink` / `--mark-accent` (`tokens.css`), więc
 * znak podąża za motywem. `onDark` jest wyłącznie nadpisaniem dla powierzchni,
 * które są ciemne niezależnie od motywu (kafelek z gradientem, landing) —
 * nie jest drugim, równoległym zestawem kolorów.
 *
 * `speedLines={false}` to nie kaprys: linie pędu zajmują lewą trzecią część
 * kadru, więc na kafelku 24 px zjadały skalę litery i znak robił się nieczytelny
 * (sprawdzone zrzutem paska bocznego). Poniżej ~48 px rysujemy sam monogram
 * w ciaśniejszym kadrze.
 */
export interface CVelocityMarkProps {
  className?: string;
  /** Wymusza jasną kreskę — dla powierzchni ciemnych w obu motywach. */
  onDark?: boolean;
  /** Linie pędu z lewej. Wyłącz na małych rozmiarach (kafelek w nawigacji). */
  speedLines?: boolean;
}

export const CVelocityMark: React.FC<CVelocityMarkProps> = ({
  className = 'w-8 h-8',
  onDark = false,
  speedLines = true,
}) => {
  const maskId = useId();
  const ink = onDark ? '#FFFFFF' : 'var(--mark-ink)';

  return (
    <svg
      viewBox={speedLines ? '-220 -160 440 320' : '-130 -120 320 240'}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-300" y="-300" width="600" height="600">
          <rect x="-300" y="-300" width="600" height="600" fill="#ffffff" />
          <path
            d="M 20 -75 L 110 0 L 20 75"
            fill="none"
            stroke="#000000"
            strokeWidth="31"
            strokeLinecap="round"
            strokeLinejoin="miter"
            strokeMiterlimit="10"
          />
        </mask>
      </defs>

      <g transform="skewX(-10)">
        {/* Podwójna pętla C — maska robi miejsce na przeplot z wektorem V. */}
        <g
          mask={`url(#${maskId})`}
          stroke={ink}
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="miter"
        >
          <path d="M 30 -75 A 80 80 0 1 0 30 75" />
          <path d="M -25 -52 A 55 55 0 1 0 -25 52" />
        </g>

        {/* Chevron V — akcent marki, drugi lżejszy dla efektu pędu. */}
        <g
          stroke="var(--mark-accent)"
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="miter"
          strokeMiterlimit="10"
        >
          <path d="M 20 -75 L 110 0 L 20 75" />
          <path d="M 75 -75 L 165 0 L 75 75" opacity="0.85" />
        </g>

        {/* Linie pędu z lewej — cieńsze i przygaszone, żeby nie konkurowały. */}
        {speedLines && (
          <g stroke={ink} strokeWidth="6" strokeLinecap="round" opacity={onDark ? 0.4 : 0.25}>
            <line x1="-165" y1="-28" x2="-115" y2="-28" />
            <line x1="-185" y1="0" x2="-125" y2="0" />
            <line x1="-165" y1="28" x2="-115" y2="28" />
          </g>
        )}
      </g>
    </svg>
  );
};
