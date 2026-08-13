import React from 'react';
import { Lightbulb } from 'lucide-react';

interface AdvisorButtonProps {
  onClick: () => void;
  label?: string;
  title?: string;
  className?: string;
}

/** Shared "Ask AI Advisor" trigger — replaces the button previously duplicated in Header, JobMatcher, and CVWordBuilder. */
export const AdvisorButton: React.FC<AdvisorButtonProps> = ({
  onClick,
  label = 'Doradca AI',
  title = 'Zapytaj Doradcę AI',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-warning-soft hover:bg-warning-500/20 border border-warning-500/30 text-xs text-warning-fg transition-all active:scale-95 shadow-xs group ${className}`}
    >
      <Lightbulb className="w-4 h-4 text-warning-500 group-hover:scale-110 transition-transform" />
      <span className="font-bold hidden sm:inline">{label}</span>
    </button>
  );
};
