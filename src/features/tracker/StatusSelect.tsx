import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ApplicationStatus } from '../../types';

// Typ mieszka w `src/types`, bo czyta go też silnik „następnego kroku".
// Re-eksport, żeby wywołania `from './StatusSelect'` dalej działały.
export type { ApplicationStatus };

export interface StatusSelectProps {
  status: ApplicationStatus;
  onChange: (newStatus: ApplicationStatus) => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Wysłana: {
    label: 'Wysłana',
    bg: 'bg-sunken',
    text: 'text-muted',
    border: 'border-line',
    dot: 'bg-muted',
  },
  Rozmowa: {
    label: 'Rozmowa',
    bg: 'bg-brand-50',
    text: 'text-brand-fg',
    border: 'border-brand-200',
    dot: 'bg-brand-600',
  },
  Oferta: {
    label: 'Oferta',
    bg: 'bg-success-soft',
    text: 'text-success-fg',
    border: 'border-success/30',
    dot: 'bg-success',
  },
  Odrzucona: {
    label: 'Odrzucona',
    bg: 'bg-danger-soft',
    text: 'text-danger-fg',
    border: 'border-danger/30',
    dot: 'bg-danger',
  },
};

export const StatusSelect: React.FC<StatusSelectProps> = ({
  status,
  onChange,
  className = '',
}) => {
  const current = STATUS_CONFIG[status] || STATUS_CONFIG.Wysłana;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as ApplicationStatus)}
        aria-label="Zmień status aplikacji"
        className={`appearance-none rounded-xl border px-3 py-1.5 pr-7 font-mono text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer ${current.bg} ${current.text} ${current.border}`}
      >
        <option value="Wysłana">Wysłana</option>
        <option value="Rozmowa">Rozmowa</option>
        <option value="Oferta">Oferta</option>
        <option value="Odrzucona">Odrzucona</option>
      </select>

      <ChevronDown className={`pointer-events-none absolute right-2 h-3.5 w-3.5 ${current.text}`} />
    </div>
  );
};
