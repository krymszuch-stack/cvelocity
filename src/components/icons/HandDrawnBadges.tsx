import React from 'react';

/**
 * Rysowane odznaki benefitów — lekkie SVG, zero zależności.
 *
 * Estetyka „doodle" jest tu celowa: matryca benefitów to najbardziej ludzka
 * część kokpitu, a ikony z tego samego zestawu co reszta interfejsu (ostre,
 * techniczne) czytały się jak audyt. Kreska jest nierówna, bo ma być.
 *
 * Kolory: kontur to `currentColor` (kafelek steruje nim klasą tekstu), akcenty
 * to koral marki i morski kolor opieki medycznej. Nie ma tu trzeciego zestawu
 * kolorów obok tokenów — same akcenty pochodzą z księgi znaku.
 *
 * Grubość kreski trzymamy w paśmie 1.8–2.2 dla konturu; grubsze pociągnięcia
 * (do 3.2) są zarezerwowane dla elementu, który ma czytać się z 32 px.
 */

const ACCENT = '#F26440';
const MEDICAL = '#38BDF8';

export interface BadgeIconProps {
  className?: string;
}

const svgProps = {
  viewBox: '0 0 48 48',
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
  'aria-hidden': true,
  focusable: false,
};

/** Karta sportowa: hantel z lekko krzywą sztangą i gwiazdką energii. */
export const BadgeMultiSport: React.FC<BadgeIconProps> = ({ className = '' }) => (
  <svg {...svgProps} className={className} stroke="currentColor">
    <path d="M7 20.5c-.6 2.4-.5 5 .2 7.3" />
    <path d="M11 16.8c-1.2 4.7-1.2 9.6.1 14.3" />
    <path d="M41 20.4c.7 2.4.7 5 .1 7.4" />
    <path d="M37 16.6c1.4 4.8 1.4 9.8.1 14.6" />
    <path d="M13 24.2c6.6-.7 15.3-.8 22 .1" stroke={ACCENT} strokeWidth="3" />
    {/* Gwiazdka energii — iskra nad sztangą. */}
    <g stroke={ACCENT} strokeWidth="2.2">
      <path d="M24 8.4v4.6" />
      <path d="M19.6 10.4l2 3.1" />
      <path d="M28.4 10.4l-2 3.1" />
    </g>
    <path d="M16.5 37.5c5-1.2 10.4-1.2 15.4.2" strokeDasharray="2 3" />
  </svg>
);

/** Opieka medyczna: szkicowana tarcza z krzyżem i sercem. */
export const BadgeLuxmed: React.FC<BadgeIconProps> = ({ className = '' }) => (
  <svg {...svgProps} className={className} stroke="currentColor">
    <path
      d="M24 5.5c5 2.7 9.4 4 14 4.2.6 9.8-1 20.7-13.7 26.6C11.4 30.5 9.6 19.6 10.2 9.7c4.6-.2 8.9-1.5 13.8-4.2Z"
      stroke={MEDICAL}
      strokeWidth="2.1"
    />
    <path d="M24 13.4v11.4" stroke={ACCENT} strokeWidth="3.2" />
    <path d="M18.3 19.1h11.4" stroke={ACCENT} strokeWidth="3.2" />
    {/* Serce — opieka, nie tylko procedura. */}
    <path
      d="M24 44c-3.4-2.5-6-4.8-6-7.4 0-1.9 1.5-3.2 3.2-3.2 1.2 0 2.2.6 2.8 1.6.6-1 1.6-1.6 2.8-1.6 1.7 0 3.2 1.3 3.2 3.2 0 2.6-2.6 4.9-6 7.4Z"
      stroke={ACCENT}
      strokeWidth="2"
    />
    <path d="M12.4 39.6c1.6-.5 3.2-.8 4.8-.9" strokeDasharray="2 3" />
    <path d="M30.8 38.7c1.6.1 3.2.4 4.8.9" strokeDasharray="2 3" />
  </svg>
);

export interface DrivingLicenseProps extends BadgeIconProps {
  /**
   * Kategoria na plakietce. Domena to prace fizyczne, nie tylko biuro:
   * monter odpada na SEP-ie i UDT tak samo jak kierowca na kategorii C.
   */
  category?: string;
}

/** Uprawnienia: kierownica i plakietka z kategorią (B / C / UDT / SEP). */
export const BadgeDrivingLicense: React.FC<DrivingLicenseProps> = ({
  className = '',
  category = 'B',
}) => (
  <svg {...svgProps} className={className} stroke="currentColor">
    <path d="M6.5 12.4c11.7-1 23.4-1 35 .2.7 7.6.6 15.2-.2 22.8-11.6 1-23.2 1-34.7-.1-.8-7.6-.8-15.2-.1-22.9Z" />
    {/* Kierownica — obręcz, piasta i trzy ramiona. */}
    <circle cx="17.4" cy="24" r="7" strokeWidth="2.1" />
    <circle cx="17.4" cy="24" r="2.3" strokeWidth="2.1" />
    <path d="M17.4 17.1v4.6M11.7 27.3l3.6-2.1M23.1 27.3l-3.6-2.1" strokeWidth="2.1" />
    {/* Plakietka kategorii. */}
    <rect
      x="27.2"
      y="17.6"
      width="12.6"
      height="12.8"
      rx="3"
      stroke={ACCENT}
      strokeWidth="2.1"
      transform="rotate(-2 33.5 24)"
    />
    <text
      x="33.5"
      y="28.4"
      textAnchor="middle"
      fill={ACCENT}
      stroke="none"
      fontSize={category.length > 1 ? 7 : 10}
      fontWeight="800"
      fontFamily="ui-monospace, SFMono-Regular, monospace"
    >
      {category}
    </text>
    <path d="M27.6 34.2c3.1-.3 6.2-.3 9.3 0" strokeDasharray="2 3" />
  </svg>
);

/** Dojazd: auto w korku, zegar i chmurka spalin. */
export const BadgeCommute: React.FC<BadgeIconProps> = ({ className = '' }) => (
  <svg {...svgProps} className={className} stroke="currentColor">
    <path d="M6.6 29.4c-.4-3.3.4-5.1 2.6-5.7 1.6-3.3 3-5.6 4.3-6.6 5.3-1 10.6-1 15.9.1 1.4 1 2.8 3.2 4.2 6.5 2.2.6 3.1 2.4 2.7 5.7-9.9.9-19.8.9-29.7 0Z" />
    <path d="M12.9 24.2c6.2-.6 12.4-.6 18.6.1" strokeDasharray="2 3" />
    <circle cx="13.6" cy="31.9" r="2.5" />
    <circle cx="29.9" cy="31.9" r="2.5" />
    {/* Drugie auto w korku — zarys tuż za pierwszym. */}
    <path d="M9.4 41.4c-.3-2.2.3-3.4 1.8-3.8 1-2.1 1.9-3.6 2.8-4.2 3.4-.7 6.8-.7 10.2.1" opacity="0.55" />
    {/* Chmurka spalin. */}
    <path
      d="M5.2 20.6c-1.6-.3-2.3-1.3-2-2.6.3-1.2 1.4-1.7 2.7-1.4.2-1.4 1.2-2.2 2.6-1.9 1.2.3 1.8 1.2 1.7 2.4"
      opacity="0.6"
      strokeDasharray="2 2.5"
    />
    <circle cx="38.6" cy="14.2" r="6.4" stroke={ACCENT} strokeWidth="2.2" />
    <path d="M38.6 10.6v3.8l2.6 1.6" stroke={ACCENT} strokeWidth="2.2" />
  </svg>
);

/** Wyżywienie: miska z parą w kształcie serca i sztućce. */
export const BadgeFood: React.FC<BadgeIconProps> = ({ className = '' }) => (
  <svg {...svgProps} className={className} stroke="currentColor">
    {/* Miska. */}
    <path d="M9.8 26.4c9.4-1 18.9-1 28.4.1-.6 6.7-4.9 11.4-11.3 12.9-1.9.4-3.9.4-5.8 0-6.4-1.5-10.7-6.2-11.3-13Z" />
    <path d="M9.6 26.6c9.7-.8 19.4-.8 29 .1" strokeDasharray="2 3" />
    <path d="M13.6 41.6c7-1 13.9-1 20.9.2" strokeDasharray="2 3" />
    {/* Para w kształcie serca. */}
    <path
      d="M24 20.4c-3-2.3-5.2-4.2-5.2-6.4 0-1.7 1.3-2.9 2.8-2.9 1 0 1.9.5 2.4 1.4.5-.9 1.4-1.4 2.4-1.4 1.5 0 2.8 1.2 2.8 2.9 0 2.2-2.2 4.1-5.2 6.4Z"
      stroke={ACCENT}
      strokeWidth="2.2"
    />
    {/* Sztućce po bokach. */}
    <path d="M6.2 16.4c-.5 4 .3 7.9.9 11.9M5.4 16.2c.4 2 1.3 2.1 1.7 0" opacity="0.8" />
    <path d="M42.2 16.2c.6 4-.2 8-.8 12M42.2 16.2c-1.4 1.3-1.5 3.6.1 4.6" opacity="0.8" />
  </svg>
);

/** Sprzęt: monitor, ergonomiczne krzesło i kubek kawy. */
export const BadgeEquipment: React.FC<BadgeIconProps> = ({ className = '' }) => (
  <svg {...svgProps} className={className} stroke="currentColor">
    <path d="M11.4 9.6c8.5-.9 17-.9 25.4.1.8 5.4.7 10.9-.2 16.3-8.4.9-16.8.9-25.1-.1-.8-5.4-.9-10.8-.1-16.3Z" />
    <path d="M15.6 14.2c4.6-.5 9.2-.5 13.8.1" stroke={ACCENT} strokeWidth="2.2" />
    <path d="M15.7 19.4c3.2-.4 6.4-.4 9.6 0" strokeDasharray="2 3" />
    <path d="M24 26.2v3.6M19.8 30.4c2.9-.4 5.7-.4 8.6 0" />
    {/* Krzesło — oparcie, siedzisko i noga. */}
    <path d="M9.2 40.2c.3-3.6.7-6.4 1.3-8.3 2.6-.5 5.2-.5 7.8 0 .6 1.9 1 4.7 1.2 8.3" opacity="0.85" />
    <path d="M9.4 40.2c3.4-.5 6.8-.5 10.2.1M14.4 40.4v4.1M11.6 45.2c1.9-.4 3.8-.4 5.7 0" opacity="0.85" />
    {/* Kubek kawy. */}
    <path d="M31.4 34.6c3.2-.4 6.4-.4 9.6.1-.2 4.1-1.8 6.4-4.8 6.6-3-.2-4.6-2.5-4.8-6.7Z" />
    <path d="M41 36c1.6-.4 2.5.2 2.5 1.6 0 1.4-.9 2.1-2.4 1.9" />
  </svg>
);

export const BADGE_ICONS = {
  SPORT: BadgeMultiSport,
  MEDICAL: BadgeLuxmed,
  DRIVING_LICENSE: BadgeDrivingLicense,
  COMMUTE: BadgeCommute,
  FOOD: BadgeFood,
  EQUIPMENT: BadgeEquipment,
} as const;

export type BadgeKey = keyof typeof BADGE_ICONS;
