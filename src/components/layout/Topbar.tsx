import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Palette,
  User,
  Search,
  CreditCard,
  FileText,
  LogIn,
  LogOut,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from '../ThemeToggle';
import { AdvisorButton } from '../ui/AdvisorButton';
import { NAV_SECTIONS, NavTabId } from '../../lib/navigation';
import { useEntitlements } from '../../store/useEntitlements';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../store/useToastStore';

export interface TopbarProps {
  activeTab: NavTabId;
  onOpenMobileMenu: () => void;
  onOpenAdvisor: () => void;
  onOpenAuthModal: () => void;
  onSelectTab?: (tab: NavTabId) => void;
  onOpenDesignTokens?: () => void;
  isAuthenticated?: boolean;
  userEmail?: string;
  className?: string;
}

/**
 * Nazwy sekcji biorą się z `NAV_SECTIONS`, a nie z drugiej ręcznej mapy —
 * poprzednia wersja miała osiem wpisów wypisanych obok listy w pasku bocznym
 * i przy każdej zmianie trzeba było trafić w oba miejsca.
 */
const TAB_NAMES: Record<NavTabId, string> = {
  home: 'Twój następny krok',
  pricing: 'Cennik i pakiety',
  'ats-lab': 'Laboratorium Audytu ATS 360°',
  ...Object.fromEntries(NAV_SECTIONS.map((section) => [section.id, section.label])),
} as Record<NavTabId, string>;

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenAdvisor,
  onOpenAuthModal,
  onSelectTab,
  onOpenDesignTokens,
  isAuthenticated = false,
  userEmail,
  className = '',
}) => {
  const { isPro } = useEntitlements();
  const { logout, user, mode, deleteAccount } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);



  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCustomerPortal = () => {
    showToast('Panel klienta Stripe', {
      message: 'Zarządzanie subskrypcją i faktury będą dostępne po podłączeniu kluczy Stripe.',
      variant: 'info',
    });
    setIsDropdownOpen(false);
  };

  return (
    /* Pasek pływa nad treścią zamiast dzielić ją kreską: odklejony od górnej
       krawędzi, zaokrąglony i półprzezroczysty, żeby poświata tła przechodziła
       pod spodem. Kreska pod paskiem cięłaby ją na pół i spłaszczała kadr.
       `sticky` z odstępem robi resztę — pigułka jedzie z przewijaniem. */
    <header
      className={`glass-panel sticky top-3 z-20 mx-3 flex h-14 items-center justify-between rounded-2xl px-3 shadow-raised sm:mx-4 sm:px-4 lg:mx-6 ${className}`}
    >
      {/* Left: Mobile Toggle & Section Name */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Otwórz menu nawigacji"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-elevated text-muted hover:bg-brand-50 hover:text-ink lg:hidden focus-visible:outline-none"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-line bg-elevated px-2.5 py-1 font-mono text-xs font-semibold text-ink">
            {TAB_NAMES[activeTab] || 'CVELOCITY'}
          </span>
        </div>
      </div>

      {/* Right: Actions matching prototyp-monetyzacji.html */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Search Hint (Cmd+K trigger) */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
          className="hidden sm:flex items-center gap-2 rounded-xl border border-line bg-elevated px-2.5 py-1.5 text-xs text-muted hover:border-line-strong hover:text-ink transition-colors"
          title="Otwórz Command Palette (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Szukaj...</span>
          <span className="rounded border border-line bg-sunken px-1.5 py-px font-mono text-[9px] text-muted">
            Ctrl+K
          </span>
        </button>


        {/* Nie ma tu już przycisków HUD, Pitch i Practice.
            Były widoczne od pierwszej sekundy, każdy z własnym skrótem
            klawiszowym, a dotyczą wyłącznie rozmowy, która została umówiona.
            Przeniesione do Zasobnika Rozmowy na karcie aplikacji w Pipeline —
            pojawiają się tam, gdzie mają sens, i wtedy, gdy mają sens. */}

        {/* Advisor Button with Ping Indicator */}
        <AdvisorButton onClick={onOpenAdvisor} />

        {/* Design Tokens Showcase Button */}
        {onOpenDesignTokens && (
          <motion.button
            type="button"
            onClick={onOpenDesignTokens}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-elevated text-muted hover:text-brand-fg hover:bg-brand-50 focus-visible:outline-none"
            aria-label="Podgląd Tokenów Design System"
            title="Podgląd Tokenów Design System"
          >
            <Palette className="h-4 w-4" />
          </motion.button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Plan Pill & Profile Avatar matching prototyp-monetyzacji.html */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                isPro
                  ? 'bg-brand-grad text-on-brand shadow-brand-glow'
                  : 'bg-sunken text-muted border border-line'
              }`}
            >
              {isPro ? 'Pro' : 'Free'}
            </span>

            <motion.button
              type="button"
              // Menu otwiera się także bez konta: siedzi w nim cennik i
              // logowanie, więc odsyłanie niezalogowanego prosto do modala
              // zamykało mu jedyną drogę do informacji o pakietach.
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-brand-500/30 hover:bg-brand-500/5 focus-visible:outline-none"
              title={isAuthenticated ? userEmail : 'Zaloguj się'}
            >
              {isAuthenticated ? (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-fg">
                    {(user?.name || userEmail || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-mono text-[11px] truncate max-w-[90px]">
                    {user?.name?.split(' ')[0] || userEmail?.split('@')[0]}
                  </span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-muted" />
                  <span className="hidden sm:inline">Konto</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Profile & Stripe Customer Portal Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.16, ease: [0.19, 1, 0.22, 1] }}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-elevated p-1.5 shadow-floating z-50 text-xs"
              >
                <div className="border-b border-line/60 p-2.5">
                  <div className="font-bold text-ink truncate">
                    {isAuthenticated ? user?.name || 'Profil lokalny' : 'Bez profilu'}
                  </div>
                  <div className="font-mono text-[10px] text-muted truncate">
                    {isAuthenticated ? userEmail : 'Dane trzymane w tej przeglądarce'}
                  </div>
                  <div className="mt-1.5">
                    <span
                      className={`inline-block rounded-md px-1.5 py-px font-mono text-[9px] font-bold uppercase ${
                        isPro ? 'bg-brand-50 text-brand-fg border border-brand-200' : 'bg-sunken text-muted'
                      }`}
                    >
                      Plan: {isPro ? 'CVELOCITY Pro' : 'CVELOCITY Free'}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  {/* Cennik zszedł z paska bocznego tutaj: nie jest krokiem
                      w podróży kandydata, więc nie ma czego robić obok
                      czterech sekcji, które nimi są. */}
                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('pricing');
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-ink hover:bg-brand-50 hover:text-brand-fg transition-colors"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-muted" />
                      <span>Cennik i pakiety</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenCustomerPortal}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-ink hover:bg-brand-50 hover:text-brand-fg transition-colors"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-muted" />
                    <span>Zarządzaj subskrypcją</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-subtle" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCustomerPortal}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-ink hover:bg-brand-50 hover:text-brand-fg transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted" />
                    <span>Faktury i rozliczenia</span>
                  </button>
                </div>

                <div className="border-t border-line/60 pt-1">
                  {isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          void logout();
                          setIsDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-ink hover:bg-brand-50 hover:text-brand-fg transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5 text-muted" />
                        <span>{mode === 'cloud' ? 'Wyloguj się' : 'Zamknij profil'}</span>
                      </button>

                      {/*
                        Usuwanie konta musi być osiągalne z interfejsu, a nie
                        tylko istnieć w kodzie — bez tego „prawo do usunięcia"
                        (RODO art. 17) jest deklaracją, nie funkcją. Podwójne
                        potwierdzenie, bo operacja jest nieodwracalna.
                      */}
                      <button
                        type="button"
                        onClick={() => {
                          const pytanie =
                            mode === 'cloud'
                              ? 'Usunąć konto i wszystkie dane z serwera? Tej operacji nie da się cofnąć.'
                              : 'Usunąć profil i wszystkie dane z tej przeglądarki? Tej operacji nie da się cofnąć.';
                          if (!window.confirm(pytanie)) return;

                          setIsDropdownOpen(false);
                          void deleteAccount().then((wynik) => {
                            showToast(
                              wynik.ok ? 'Dane zostały usunięte' : 'Nie udało się usunąć konta',
                              { variant: wynik.ok ? 'success' : 'error' }
                            );
                          });
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-danger-fg hover:bg-danger-soft transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{mode === 'cloud' ? 'Usuń konto' : 'Usuń profil'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAuthModal();
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-ink hover:bg-brand-50 hover:text-brand-fg transition-colors"
                    >
                      <LogIn className="h-3.5 w-3.5 text-muted" />
                      <span>Zaloguj się lub załóż konto</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
