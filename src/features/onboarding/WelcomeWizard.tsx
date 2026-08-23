import React, { useState } from 'react';
import { FolderOpen, FileText, Link as LinkIcon, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterVault } from '../../types';
import { NavTabId } from '../../components/GlobalShell';
import { Button } from '../../components/ui/Button';
import { StorageKeys, readJson, writeJson } from '../../lib/storage';
import { isVaultEmpty } from '../../lib/vaultCompleteness';

export interface WelcomeWizardProps {
  vault: MasterVault;
  onNavigate: (tab: NavTabId) => void;
  className?: string;
}

/**
 * „Nowy" znaczy: żadna sekcja profilu nie ma jeszcze treści. Wystarczy jedna
 * wypełniona, żeby przewodnik zniknął — kto zaczął, ten nie potrzebuje już
 * instrukcji na pół ekranu.
 *
 * Warunek stał tu wcześniej wypisany z ręki i sprawdzał sześć pól. Ta sama
 * rzecz jest teraz liczona przez `measureVaultCompleteness`, więc lokalna
 * kopia znikła: dwie definicje „pustego profilu" rozjechałyby się przy
 * pierwszym dołożeniu sekcji (reguła 3 w `AGENTS.md`).
 */

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({
  vault,
  onNavigate,
  className = '',
}) => {
  // Zamknięcie przewodnika przeżywa przeładowanie strony. Bez tego wracałby
  // przy każdym wejściu na stronę główną, dopóki profil jest pusty — a to
  // dokładnie ten stan, w którym użytkownik ogląda ją najczęściej.
  const [dismissed, setDismissed] = useState(() =>
    readJson<boolean>(StorageKeys.onboardingDismissed, false)
  );

  const handleDismiss = () => {
    setDismissed(true);
    writeJson(StorageKeys.onboardingDismissed, true);
  };

  const steps = [
    {
      tab: 'profil' as const,
      title: '1. Uzupełnij profil',
      description:
        'Dodaj dane, doświadczenie i stack technologiczny, żeby dopasowanie było trafne od pierwszej oferty.',
      icon: FolderOpen,
    },
    {
      tab: 'profil' as const,
      title: '2. Wczytaj CV',
      description:
        'Zaimportuj PDF lub DOCX albo wklej treść CV, a CVelocity uzupełni brakujące pola profilu.',
      icon: FileText,
    },
    {
      tab: 'aplikuj' as const,
      title: '3. Porównaj ofertę',
      description:
        'Wklej ogłoszenie z OLX, Pracuj.pl czy No Fluff Jobs i sprawdź dopasowanie do swojego profilu.',
      icon: LinkIcon,
    },
  ];

  return (
    <AnimatePresence>
      {isVaultEmpty(vault) && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className={`rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5 ${className}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-fg">
                Przewodnik pierwszego uruchomienia
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-ink sm:text-2xl">
                Witaj w CVelocity. Zacznij od najważniejszego kroku.
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onNavigate('profil')}
              >
                Uruchom przewodnik
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                aria-label="Zamknij przewodnik"
                onClick={handleDismiss}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => onNavigate(step.tab)}
                  className="rounded-xl border border-brand-200 bg-surface/80 p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-500"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-fg">
                      <Icon className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-subtle" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-ink">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{step.description}</p>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
