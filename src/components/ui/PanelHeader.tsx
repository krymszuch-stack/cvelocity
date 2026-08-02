import React from 'react';

interface PanelHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Shared dark gradient section header — replaces the duplicated `from-slate-900 via-indigo-950 to-slate-900` panel headers. */
export const PanelHeader: React.FC<PanelHeaderProps> = ({ icon, title, subtitle, actions, className = '' }) => {
  return (
    <div
      className={`bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-xl px-4 py-3.5 border border-brand-800/40 shadow-md flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-brand-400 shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h3 className="font-bold text-sm truncate">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
};
