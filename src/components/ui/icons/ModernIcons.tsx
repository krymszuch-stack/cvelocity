import React from 'react';

/**
 * Ikony pojęć produktowych pochodzą teraz z autorskiego zestawu
 * `src/components/icons/CvelIcons.tsx` — skarbiec, celownik, trening
 * i pipeline rysuje język marki, nie generyczna teczka z Lucide.
 *
 * Re-eksport, a nie przepisanie importów w kilkunastu plikach: reguła 3
 * z `AGENTS.md` chce jednego źródła prawdy na fakt, a reguła 4 — poprawki
 * klasy zamiast wystąpienia. Nowy kod powinien importować wprost z `CvelIcons`.
 */
export {
  IconVault,
  IconMatcher,
  IconTrainer,
  IconTrainer as IconBrain,
  IconPipeline,
  IconPipeline as IconApplications,
  IconHeatmap,
  IconGamificationXP,
  IconCompanyIntel,
} from '../../icons/CvelIcons';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/** 1. Modernist Sparkles / AI Co-Pilot Icon */
export const IconSparkles: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-200 ${className}`}
    {...props}
  >
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
    <path d="M19 16L19.8 18.2L22 19L19.8 19.8L19 22L18.2 19.8L16 19L18.2 18.2L19 16Z" opacity="0.85" />
    <circle cx="5" cy="5" r="1" fill="currentColor" />
  </svg>
);



/** 5. Modernist Parser & Ingestion Icon */
export const IconParser: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4 15V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V15" />
    <polyline points="16 7.5 12 3.5 8 7.5" />
    <line x1="12" y1="3.5" x2="12" y2="15" />
    <circle cx="12" cy="3.5" r="0.8" fill="currentColor" />
  </svg>
);

/** 6. Modernist Profiler / Equalizer Filters Icon */
export const IconProfiler: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="4" y1="6" x2="20" y2="6" opacity="0.3" />
    <line x1="4" y1="12" x2="20" y2="12" opacity="0.3" />
    <line x1="4" y1="18" x2="20" y2="18" opacity="0.3" />
    <circle cx="9" cy="6" r="2.5" fill="currentColor" fillOpacity="0.15" />
    <circle cx="15" cy="12" r="2.5" fill="currentColor" fillOpacity="0.15" />
    <circle cx="8" cy="18" r="2.5" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

/** 7. Modernist Pricing & Stripe Card Icon */
export const IconPricing: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
    <rect x="6" y="14" width="3.5" height="2.5" rx="0.75" fill="currentColor" fillOpacity="0.2" />
    <line x1="12" y1="15.5" x2="18" y2="15.5" opacity="0.5" />
  </svg>
);

/** 8. Modernist Home / Compass Icon */
export const IconHome: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 10.5L12 3L21 10.5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V10.5Z" />
    <path d="M9 21V12.5H15V21" opacity="0.8" />
  </svg>
);

/** 9. Modernist Shield Security Badge */
export const IconShield: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 2L20 6V12C20 17.5 16.5 21.5 12 23C7.5 21.5 4 17.5 4 12V6L12 2Z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

/** 10. Modernist Energy Zap Token */
export const IconZap: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

/** 11. Modernist Palette Design Theme */
export const IconPalette: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 14.5 4.5 16.5 6.5 16.5C7.5 16.5 7.8 17.2 7.8 18C7.8 19.7 9.7 21 12 21Z" />
    <circle cx="7.5" cy="9.5" r="1.3" fill="currentColor" />
    <circle cx="12" cy="7.5" r="1.3" fill="currentColor" />
    <circle cx="16.5" cy="9.5" r="1.3" fill="currentColor" />
  </svg>
);

/** 12. Modernist Radar ATS Sonar Icon */
export const IconRadar: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" opacity="0.5" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    <line x1="12" y1="12" x2="19" y2="5" strokeWidth="2" />
  </svg>
);

/** 13. Modernist Command Palette Key Icon */
export const IconCommand: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
);

/** 14. Modernist Document / FileText Icon */
export const IconDocument: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" opacity="0.6" />
    <line x1="8" y1="17" x2="13" y2="17" opacity="0.6" />
  </svg>
);

/** 15. Modernist Check Circle */
export const IconCheckCircle: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <polyline points="8.5 12 11 14.5 15.5 9.5" />
  </svg>
);

/** 16. Modernist Alert Triangle */
export const IconAlertTriangle: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M10.29 3.86L1.82 18C1.45 18.64 1.91 19.45 2.65 19.45H21.35C22.09 19.45 22.55 18.64 22.18 18L13.71 3.86C13.34 3.22 12.66 3.22 12.29 3.86L10.29 3.86Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="16.5" r="0.75" fill="currentColor" />
  </svg>
);

/** 17. Modernist Arrow Right */
export const IconArrowRight: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

/** 18. Modernist Lock Icon */
export const IconLock: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="11" width="18" height="11" rx="2.5" />
    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" />
    <circle cx="12" cy="16" r="1.2" fill="currentColor" />
  </svg>
);

/** 19. Modernist Moon Icon */
export const IconMoon: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 11.33 20.93 10.68 20.79 10.05C19.86 11.23 18.39 12 16.75 12C13.85 12 11.5 9.65 11.5 6.75C11.5 5.11 12.27 3.64 13.45 2.71C12.98 2.85 12.49 3 12 3Z" />
  </svg>
);

/** 20. Modernist Sun Icon */
export const IconSun: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="4.5" />
    <line x1="12" y1="2" x2="12" y2="4.5" />
    <line x1="12" y1="19.5" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="6" y2="6" />
    <line x1="18" y1="18" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="4.5" y2="12" />
    <line x1="19.5" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="6" y2="18" />
    <line x1="18" y1="6" x2="19.78" y2="4.22" />
  </svg>
);

