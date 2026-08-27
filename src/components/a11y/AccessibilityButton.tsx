import React from 'react';
import { Eye, SunMedium } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useAccessibility } from '../../providers/AccessibilityProvider';

export interface AccessibilityButtonProps {
  onClick: () => void;
  className?: string;
}

export const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({
  onClick,
  className = '',
}) => {
  const { isAnyEnabled, settings } = useAccessibility();

  return (
    <Tooltip
      content={
        settings.highContrast
          ? 'Ułatwienia dostępności aktywne (Wysoki kontrast)'
          : 'Dostępność i wysoki kontrast (WCAG 2.1)'
      }
      side="top"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Otwórz menu dostępności i ułatwień dla osób słabowidzących"
        className={`relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
          isAnyEnabled
            ? 'border-brand-500 bg-brand-500/10 text-brand-600 font-bold'
            : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
        } ${className}`}
      >
        {settings.highContrast ? (
          <SunMedium className="h-4 w-4 text-brand-600" />
        ) : (
          <Eye className="h-4 w-4" />
        )}

        {isAnyEnabled && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-surface" />
        )}
      </button>
    </Tooltip>
  );
};
