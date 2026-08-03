import React from 'react';
import {
  Shield, Zap, Database, FileText, UserCog, ChevronLeft, LucideIcon, Lightbulb, X,
} from 'lucide-react';
import { AppTab } from '../../types';

export interface NavItem {
  id: AppTab;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'matcher', label: 'Dopasuj Ofertę', icon: Zap, description: 'Analiza i dopasowanie CV do ogłoszenia' },
  { id: 'vault', label: 'Baza CV', icon: Database, description: 'Twój Master Vault — dane źródłowe' },
  { id: 'parser', label: 'Wczytaj Plik', icon: FileText, description: 'Import CV z PDF / DOCX / LinkedIn' },
  { id: 'profiler', label: 'Profiler', icon: UserCog, description: 'Preferencje stylu i ton wypowiedzi' },
];

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  vaultReady: boolean;
  /** Mobile drawer state — on desktop the sidebar is always in flow. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAdvisor: (question?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  onToggleCollapse,
  vaultReady,
  mobileOpen,
  onCloseMobile,
  onOpenAdvisor,
}) => {
  const width = collapsed ? 'lg:w-[76px]' : 'lg:w-[264px]';

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen shrink-0
                    bg-surface border-r border-line flex flex-col
                    transition-[width,transform] duration-300 ease-out
                    w-[264px] ${width}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 h-16 px-4 border-b border-line shrink-0 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-md shadow-brand-600/25">
            <Shield className="w-[18px] h-[18px] text-white" />
          </div>
          <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="font-extrabold text-[15px] text-ink tracking-tight leading-none">SkillVault</div>
            <div className="text-[10px] text-subtle font-semibold uppercase tracking-wider mt-1">
              CV & ATS Studio
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="ml-auto lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-sunken"
            aria-label="Zamknij menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className={`text-[10px] font-bold text-subtle uppercase tracking-wider px-3 pt-2 pb-2 ${collapsed ? 'lg:hidden' : ''}`}>
            Sekcje
          </p>

          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-sm font-semibold transition-all duration-150
                            ${collapsed ? 'lg:justify-center lg:px-0' : ''}
                            ${
                              isActive
                                ? 'bg-brand-soft text-brand-fg'
                                : 'text-muted hover:bg-sunken hover:text-ink'
                            }`}
              >
                {/* Active rail */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-500" />
                )}
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                {item.id === 'vault' && vaultReady && (
                  <span
                    className={`ml-auto w-1.5 h-1.5 rounded-full bg-success-500 shrink-0 ${collapsed ? 'lg:hidden' : ''}`}
                    title="Vault zawiera dane"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Advisor CTA + collapse */}
        <div className="p-3 border-t border-line shrink-0 space-y-2">
          {collapsed ? (
            <button
              onClick={() => onOpenAdvisor()}
              title="Doradca AI"
              className="hidden lg:flex w-full h-10 rounded-xl bg-warning-soft text-warning-fg border border-warning-500/25
                         items-center justify-center hover:border-warning-500/50 transition-colors"
            >
              <Lightbulb className="w-[18px] h-[18px]" />
            </button>
          ) : (
            <button
              onClick={() => onOpenAdvisor()}
              className="w-full text-left rounded-xl border border-warning-500/25 bg-warning-soft p-3
                         hover:border-warning-500/50 transition-colors group"
            >
              <div className="flex items-center gap-2 text-warning-fg">
                <Lightbulb className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Doradca AI</span>
              </div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Zapytaj o zasady ATS i dobór słów.
              </p>
            </button>
          )}

          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold
                        text-subtle hover:text-ink hover:bg-sunken transition-colors
                        ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            <span className={collapsed ? 'hidden' : ''}>Zwiń panel</span>
          </button>
        </div>
      </aside>
    </>
  );
};
