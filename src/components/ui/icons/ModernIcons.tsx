import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/** Modernist Sparkles / AI Co-Pilot Icon */
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
    <path d="M12 2.5L14.4 8.6L20.5 11L14.4 13.4L12 19.5L9.6 13.4L3.5 11L9.6 8.6L12 2.5Z" />
    <path d="M19 16L20 18.5L22.5 19.5L20 20.5L19 23L18 20.5L15.5 19.5L18 18.5L19 16Z" opacity="0.85" />
    <circle cx="5" cy="5" r="1.2" fill="currentColor" />
  </svg>
);

/** Modernist Vault / Database Storage Icon */
export const IconVault: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
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
    <rect x="3" y="4" width="18" height="6" rx="2" />
    <rect x="3" y="14" width="18" height="6" rx="2" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" />
    <line x1="7" y1="17" x2="7.01" y2="17" strokeWidth="2.5" />
    <path d="M14 7H17" opacity="0.6" />
    <path d="M14 17H17" opacity="0.6" />
  </svg>
);

/** Modernist Job Matcher / Briefcase Icon */
export const IconMatcher: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
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
    <rect x="3" y="7" width="18" height="14" rx="3" />
    <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" />
    <path d="M3 12H21" opacity="0.4" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/** Modernist Application Jet / Pipeline Icon */
export const IconApplications: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
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
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

/** Modernist Parser & Ingestion Icon */
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
    <path d="M4 16V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V16" />
    <polyline points="16 8 12 4 8 8" />
    <line x1="12" y1="4" x2="12" y2="16" />
    <circle cx="12" cy="4" r="1" fill="currentColor" />
  </svg>
);

/** Modernist Profiler / Equalizer Filters Icon */
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
    <line x1="4" y1="6" x2="20" y2="6" opacity="0.4" />
    <line x1="4" y1="12" x2="20" y2="12" opacity="0.4" />
    <line x1="4" y1="18" x2="20" y2="18" opacity="0.4" />
    <circle cx="9" cy="6" r="2.5" fill="currentColor" fillOpacity="0.15" />
    <circle cx="15" cy="12" r="2.5" fill="currentColor" fillOpacity="0.15" />
    <circle cx="8" cy="18" r="2.5" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

/** Modernist Pricing & Stripe Card Icon */
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
    <rect x="6" y="14" width="3" height="2" rx="0.5" fill="currentColor" />
    <line x1="12" y1="15" x2="18" y2="15" opacity="0.6" />
  </svg>
);

/** Modernist Home / Compass Icon */
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
    <path d="M9 21V12H15V21" />
  </svg>
);

/** Modernist Shield Security Badge */
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

/** Modernist Energy Zap Token */
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
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

/** Modernist Palette Design Theme */
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
    <circle cx="7.5" cy="9.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
    <circle cx="16.5" cy="9.5" r="1.2" fill="currentColor" />
  </svg>
);

/** Modernist Radar ATS Sonar Icon */
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
    <circle cx="12" cy="12" r="5" opacity="0.6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="12" y1="12" x2="19" y2="5" strokeWidth="2" />
  </svg>
);

/** Modernist Command Palette Key Icon */
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
