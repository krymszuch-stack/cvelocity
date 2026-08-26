import React from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import {
  IconMatcher,
  IconBrain,
  IconApplications,
  IconVault,
  IconSparkles,
} from '../ui/icons/ModernIcons';
import { NavItem } from './NavItem';
import { Tooltip } from '../ui/Tooltip';
import { CVelocityLogo } from '../CVelocityLogo';
import { LevelWidget } from '../gamification/LevelWidget';
import { NAV_SECTIONS, NavSectionId, NavTabId } from '../../lib/navigation';

/**
 * Ikona na sekcję. Osobna mapa, bo `NAV_SECTIONS` opisuje strukturę produktu
 * i nie ma powodu, żeby wiedziało cokolwiek o komponentach ikon.
 */
const SECTION_ICONS: Record<NavSectionId, typeof IconVault> = {
  profil: IconVault,
  aplikuj: IconMatcher,
  trenuj: IconBrain,
  pipeline: IconApplications,
};

export interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAdvisor: () => void;
  onOpenAuthModal: () => void;
  /** Które sekcje są już dostępne. Brak wpisu znaczy „dostępna". */
  unlockedSections?: Partial<Record<NavSectionId, boolean>>;
  /** Czemu sekcja jest jeszcze zamknięta — pokazywane w podpowiedzi. */
  lockReasons?: Partial<Record<NavSectionId, string>>;
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
  unlockedSections,
  lockReasons,
  isAuthenticated = false,
  userEmail,
  planStatus = 'free',
  className = '',
}) => {
  return (
    <div
      /* `transition-[width]`, nie `transition-all`: animujemy wyłącznie
         szerokość kolumny. `transition-all` przy zwijaniu ruszało też paddingi
         i kolory, przez co etykiety skakały w połowie klatek. */
      className={`flex h-full flex-col justify-between overflow-hidden p-3.5 transition-[width] duration-[var(--duration-ui)] ease-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Top Section: Brand & Navigation */}
      <div className="space-y-4">
        {/* Brand Logo & Collapse Toggle */}
        <div className="flex h-10 items-center justify-between px-1.5">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50"
              aria-label="Ekran startowy — Twój następny krok"
            >
              <CVelocityLogo />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className="mx-auto cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50"
              aria-label="Ekran startowy — Twój następny krok"
            >
              <CVelocityLogo collapsed showBadge={false} />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Rozwiń pasek boczny' : 'Zwiń pasek boczny'}
            className="hidden lg:flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors duration-[var(--duration-fast)] ease-out hover:bg-brand-500/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50"
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Poziom kariery tuż pod logo: postęp ma być widoczny bez wchodzenia
            w osobny ekran, inaczej gamifikacja istnieje tylko w momencie
            przyznania punktów. */}
        <LevelWidget isCollapsed={isCollapsed} />

        {/* Navigation Items Group */}

        {/* Cztery kroki jednej podróży zamiast ośmiu równorzędnych narzędzi.
            Kolejność jest kolejnością, w jakiej się ich używa, a nie listą
            posortowaną według ważności modułu. */}
        <nav className="flex flex-col gap-1 pt-2" aria-label="Główna nawigacja">
          {NAV_SECTIONS.map((section, index) => {
            const isLocked = unlockedSections?.[section.id] === false;

            return (
              <NavItem
                key={section.id}
                icon={SECTION_ICONS[section.id] as any}
                label={section.label}
                badge={String(index + 1)}
                badgeVariant="brand"
                hint={section.hint}
                isLocked={isLocked}
                lockedReason={lockReasons?.[section.id]}
                isActive={activeTab === section.id}
                isCollapsed={isCollapsed}
                onClick={() => onSelectTab(section.id)}
              />
            );
          })}
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
        {/* Pigułka konta była `div`em z `onClick` — niedostępna z klawiatury
            i niewidoczna dla czytnika jako akcja. Teraz jest przyciskiem,
            a podpowiedź idzie przez `Tooltip`, nie przez natywny `title`. */}
        <Tooltip
          content={isAuthenticated ? userEmail : 'Zaloguj się'}
          side={isCollapsed ? 'right' : 'top'}
          className="w-full"
        >
        <button
          type="button"
          onClick={onOpenAuthModal}
          className={`flex w-full min-h-[2.75rem] cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface p-2 text-left transition-colors duration-[var(--duration-fast)] ease-out hover:border-brand-500/30 hover:bg-brand-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50 ${
            isCollapsed ? 'justify-center' : ''
          }`}
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
              <p className="truncate text-label font-semibold text-ink">
                {isAuthenticated ? userEmail : 'Logowanie / Konto'}
              </p>
              <p className="truncate font-mono text-[10px] text-muted">
                {/* `trialing` przewiduje typ i przychodzi ze Stripe, więc musi
                    mieć własną etykietę — inaczej osoba na okresie próbnym
                    widzi „Plan Podstawowy”, choć płaci za Pro po trialu. */}
                {planStatus === 'active'
                  ? 'Plan Pro aktywny'
                  : planStatus === 'trialing'
                  ? 'Plan Pro — okres próbny'
                  : 'Plan Podstawowy'}
              </p>
            </div>
          )}
        </button>
        </Tooltip>
      </div>
    </div>
  );
};
