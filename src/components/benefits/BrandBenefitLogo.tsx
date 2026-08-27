import React, { useState } from 'react';
import { BADGE_ICONS, BadgeKey } from '../icons/HandDrawnBadges';

/**
 * Rejestr domen marek benefitowych dla pobierania oficjalnych znaków.
 *
 * Uwaga prawna: Wszelkie znaki towarowe i logotypy należą do ich właścicieli
 * i są używane wyłącznie w celach informacyjno-identyfikacyjnych.
 */
export const BRAND_DOMAINS: Record<string, { domain: string; name: string; fallbackBadgeKey: BadgeKey }> = {
  multisport: { domain: 'benefitsystems.pl', name: 'MultiSport / Benefit Systems', fallbackBadgeKey: 'SPORT_MULTISPORT' },
  pzu: { domain: 'pzu.pl', name: 'PZU / PZU Zdrowie', fallbackBadgeKey: 'SPORT_PZU' },
  pzusport: { domain: 'pzu.pl', name: 'PZU Sport', fallbackBadgeKey: 'SPORT_PZU' },
  luxmed: { domain: 'luxmed.pl', name: 'Grupa LUX MED', fallbackBadgeKey: 'MEDICAL_LUXMED' },
  medicover: { domain: 'medicover.pl', name: 'Medicover Polska', fallbackBadgeKey: 'MEDICAL_MEDICOVER' },
  enelmed: { domain: 'enel.pl', name: 'Centrum Medyczne ENEL-MED', fallbackBadgeKey: 'MEDICAL_ENELMED' },
  mybenefit: { domain: 'mybenefit.pl', name: 'Kafeteria MyBenefit', fallbackBadgeKey: 'MYBENEFIT' },
  sodexo: { domain: 'pl.sodexo.com', name: 'Sodexo Pass / Pluxee', fallbackBadgeKey: 'FOOD_LUNCH' },
  edenred: { domain: 'edenred.pl', name: 'Edenred Polska', fallbackBadgeKey: 'FOOD_LUNCH' },
  mindgram: { domain: 'mindgram.com', name: 'Mindgram Wellbeing', fallbackBadgeKey: 'WELLBEING' },
};

export interface BrandBenefitLogoProps {
  benefitKey: BadgeKey;
  brandKey?: string;
  className?: string;
  altText?: string;
}

export const BrandBenefitLogo: React.FC<BrandBenefitLogoProps> = ({
  benefitKey,
  brandKey,
  className = 'h-10 w-10',
  altText,
}) => {
  const [imageError, setImageError] = useState(false);

  const brandInfo = brandKey ? BRAND_DOMAINS[brandKey.toLowerCase()] : null;
  const FallbackIcon = BADGE_ICONS[benefitKey] || BADGE_ICONS.SPORT;

  if (!brandInfo || imageError) {
    return <FallbackIcon className={className} />;
  }

  // Oficjalny punkt pobierania ikony marki z domeny
  const logoUrl = `https://www.google.com/s2/favicons?domain=${brandInfo.domain}&sz=128`;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-surface/40 p-1 ${className}`}>
      <img
        src={logoUrl}
        alt={altText || brandInfo.name}
        onError={() => setImageError(true)}
        className="h-full w-full object-contain filter drop-shadow-sm"
        loading="lazy"
      />
    </div>
  );
};
