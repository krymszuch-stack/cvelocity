import {
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import {
  IconHome,
  IconMatcher,
  IconBrain,
  IconApplications,
  IconVault,
  IconParser,
  IconProfiler,
  IconPricing,
  IconSparkles,
} from '../ui/icons/ModernIcons';
import { NavItem } from './NavItem';
import { NavTabId } from '../GlobalShell';

export interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAdvisor: () => void;
  onOpenAuthModal: () => void;
  isAuthenticated?: boolean;
  userEmail?: string;
  planStatus?: 'free' | 'trialing' | 'active';
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onOpenAdvisor,
  onOpenAuthModal,
  isAuthenticated = false,
  userEmail,
  planStatus = 'free',
  className = '',
}) => {
  const navItems = [
    { id: 'home' as NavTabId, label: 'Strona Główna', icon: IconHome as any },
    { id: 'matcher' as NavTabId, label: 'Dopasowanie Ofert', icon: IconMatcher as any, badge: 'ATS', badgeVariant: 'brand' as const },
    { id: 'cockpit' as NavTabId, label: 'Kokpit Rozmowy', icon: IconBrain as any, badge: 'Trener', badgeVariant: 'brand' as const },
    { id: 'applications' as NavTabId, label: 'Aplikacje', icon: IconApplications as any, badge: 'CRM', badgeVariant: 'success' as const },
    { id: 'vault' as NavTabId, label: 'Master Vault', icon: IconVault as any, badge: 'Core', badgeVariant: 'brand' as const },
    { id: 'parser' as NavTabId, label: 'Wczytaj CV', icon: IconParser as any },
    { id: 'profiler' as NavTabId, label: 'Filtry i Priorytety', icon: IconProfiler as any },
    { id: 'pricing' as NavTabId, label: 'Cennik & Pakiety', icon: IconPricing as any, badge: 'Pro', badgeVariant: 'brand' as const },
  ];

  return (
    <div
      className={`flex h-full flex-col justify-between p-3.5 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Top Section: Brand & Navigation */}
      <div className="space-y-4">
        {/* Brand Logo & Collapse Toggle */}
        <div className="flex h-10 items-center justify-between px-1.5">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-grad text-on-brand shadow-brand-glow">
                <IconSparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="font-sans text-sm font-extrabold tracking-tight text-ink">
                  CVELOCITY
                </span>
                <span className="ml-1.5 rounded-sm bg-brand-50 px-1 py-px font-mono text-[9px] font-bold text-brand-fg">
                  v2.0
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-brand-grad text-on-brand shadow-brand-glow">
              <IconSparkles className="h-4 w-4" />
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Rozwiń pasek boczny' : 'Zwiń pasek boczny'}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-500/10 hover:text-ink focus-visible:outline-none"
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items Group */}
        <nav className="flex flex-col gap-1 pt-2" aria-label="Główna nawigacja">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              badgeVariant={item.badgeVariant}
              isActive={activeTab === item.id}
              isCollapsed={isCollapsed}
              onClick={() => onSelectTab(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-2 border-t border-line pt-3">
        {/* Quick Advisor Button */}
        <NavItem
          icon={IconSparkles as any}
          label="Zapytaj Doradcę AI"
          isCollapsed={isCollapsed}
          onClick={onOpenAdvisor}
          className="text-brand-fg hover:bg-brand-500/10"
        />

        {/* User Account Pill */}
        <div
          onClick={onOpenAuthModal}
          className={`flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface p-2 transition-all hover:border-brand-500/30 hover:bg-brand-500/5 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isAuthenticated ? userEmail : 'Zaloguj się'}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {isAuthenticated ? (
              <ShieldCheck className="h-4 w-4 text-success-fg" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">
                {isAuthenticated ? userEmail : 'Logowanie / Konto'}
              </p>
              <p className="font-mono text-[10px] text-muted">
                {planStatus === 'active' ? 'Plan Pro • Active' : 'Plan Podstawowy'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
