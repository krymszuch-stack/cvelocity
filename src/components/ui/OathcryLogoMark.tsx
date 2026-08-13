import React from 'react';

interface OathcryLogoMarkProps {
  className?: string;
}

/**
 * Official Oathcry Brand Logo Mark (Infinity Loop 'oa' + Gold Growth Arrow & Spark Star)
 */
export const OathcryLogoMark: React.FC<OathcryLogoMarkProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Oathcry Logo"
    >
      {/* Infinity Loop 'oa' Base Structure */}
      <path
        d="M 28,58 C 16,58 12,42 24,42 C 34,42 42,58 54,58 C 66,58 72,42 60,42 C 48,42 40,58 28,58 Z"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-95"
      />

      {/* Upward Growth Sweeping Arrow Targetting the North Star */}
      <path
        d="M 40,55 Q 52,38 65,26"
        stroke="#D4AF37"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 58,25 L 67,24 L 64,33 Z"
        fill="#D4AF37"
      />

      {/* Glowing Gold 4-Point Spark Star (North Star) */}
      <path
        d="M 74,18 Q 74,10 74,10 Q 74,18 82,18 Q 74,18 74,26 Q 74,18 66,18 Q 74,18 74,10 Z"
        fill="#F59E0B"
      />
      <circle cx="74" cy="18" r="2.5" fill="#FFF" opacity="0.9" />
    </svg>
  );
};
