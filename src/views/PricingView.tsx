import React, { useState } from 'react';
import {
  IconShield,
  IconZap,
  IconSparkles,
  IconVault,
  IconDocument,
  IconCheckCircle,
  IconLock,
  IconArrowRight,
  IconAlertTriangle,
  IconParser,
  IconPalette,
  IconRadar,
} from '../components/ui/icons/ModernIcons';
import { motion, AnimatePresence } from 'motion/react';
import { PricingCard } from '../components/ui/PricingCard';
import {
  StripeCheckoutModal,
  StripeCheckoutProduct,
} from '../components/payments/StripeCheckoutModal';
import { useAuthStore } from '../store/useAuthStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';

type PricingSubTab = 'pricing' | 'features' | 'validation';

export const PricingView: React.FC = () => {
  const { subscription, usage, consumeAi, consumeImport, setSubscription } = useAuthStore();
  const [activeSubTab, setActiveSubTab] = useState<PricingSubTab>('pricing');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedProduct, setSelectedProduct] = useState<StripeCheckoutProduct | null>(null);

  const isPro = subscription.status === 'active' || subscription.status === 'trialing';

  const subTabs = [
    { id: 'pricing' as PricingSubTab, label: 'Cennik & Plany', icon: IconZap as any },
    { id: 'features' as PricingSubTab, label: 'Funkcje Premium & Dema', icon: IconSparkles as any },
    { id: 'validation' as PricingSubTab, label: 'Standardy Uczciwości (Win-Win)', icon: IconShield as any },
  ];

  const handleOpenProCheckout = () => {
    setSelectedProduct({
      sku: billingCycle === 'monthly' ? 'price_cvelocity_pro_monthly' : 'price_cvelocity_pro_annual',
      title: billingCycle === 'monthly' ? 'CVELOCITY Pro (Miesięczny)' : 'CVELOCITY Pro (Roczny -20%)',
      price: billingCycle === 'monthly' ? '49 zł' : '39 zł',
      period: '/ miesiąc brutto',
      recurring: true,
      trialDays: 30,
    });
  };

  const handleOpenTemplateCheckout = (tplName: string = 'Executive') => {
    setSelectedProduct({
      sku: `price_cvelocity_template_${tplName.toLowerCase()}`,
      title: `Szablon ${tplName} A4 (Jednorazowo)`,
      price: '19 zł',
      period: 'jednorazowo',
      recurring: false,
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Hero Header */}
      <div className="space-y-4">
        <PageHeader
          title="Przejrzysty Cennik & Monetyzacja Win-Win"
          description="Rdzeń aplikacji (edycja CV, audytor ATS, eksport PDF) jest w 100% bezpłatny. Płacisz wyłącznie za zaoszczędzony czas, automatyzację i zaawansowane funkcje AI."
          badge="CVELOCITY PRICING"
        />

        {/* Big Hero KPI Banner matching prototyp-monetyzacji.html */}
        <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-line bg-surface/90 p-6 sm:p-8 backdrop-blur-xl shadow-raised">
          <div className="font-mono text-6xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 via-violet to-violet-2 bg-clip-text text-transparent">
            92%
          </div>
          <div className="max-w-md border-l border-line pl-6 text-xs sm:text-sm text-muted leading-relaxed">
            <b className="text-ink font-semibold">Oszczędności czasu:</b> użytkownicy CVELOCITY Pro tworzą perfekcyjnie dopasowane CV i listy motywacyjne w mniej niż 3 minuty na ofertę.
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isPro ? (
              <div className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-2 text-xs font-bold text-success-fg">
                <IconCheckCircle className="h-4 w-4" />
                <span>Twój aktywny plan: PRO</span>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={IconSparkles as any}
                onClick={handleOpenProCheckout}
              >
                Wypróbuj Pro przez 30 dni
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex justify-center">
        <Tabs<PricingSubTab>
          items={subTabs}
          active={activeSubTab}
          onChange={setActiveSubTab}
          className="max-w-xl"
        />
      </div>

      {/* TAB 1: CENNIK & PLANY */}
      {activeSubTab === 'pricing' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
          className="space-y-8"
        >
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span
              onClick={() => setBillingCycle('monthly')}
              className={`cursor-pointer text-xs font-bold ${
                billingCycle === 'monthly' ? 'text-ink' : 'text-muted'
              }`}
            >
              Rozliczenie miesięczne
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
              className={`relative h-6 w-11 rounded-full border border-line transition-colors ${
                billingCycle === 'annual' ? 'bg-brand-600' : 'bg-sunken'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              onClick={() => setBillingCycle('annual')}
              className={`cursor-pointer text-xs font-bold ${
                billingCycle === 'annual' ? 'text-ink' : 'text-muted'
              }`}
            >
              Rozliczenie roczne{' '}
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success-fg">
                Oszczędzasz 20%
              </span>
            </span>
          </div>

          {/* 3 Pricing Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* FREE PLAN */}
            <PricingCard
              title="CVELOCITY Free"
              price="0 zł"
              period="/ na zawsze"
              description="Kompletny fundament dla każdego kandydata aktywnie poszukującego pracy."
              features={[
                'Pełny edytor Master Vault',
                'Ręczny parser i wklejanie tekstu CV',
                'Symulator ATS & Score Ring 0-100%',
                'Darmowy eksport PDF i DOCX (szablony bazowe)',
                'Pipeline zgłoszeń (CRM)',
                '1 darmowy Instant-Import pliku / mc',
                '5 darmowych operacji AI / mc',
              ]}
              excluded={[
                'Nielimitowane importy plików PDF/DOCX',
                'Nielimitowany asystent AI Gap-Fixer',
                'Szablony Executive & Creative',
                'Analityka Pro Insights',
              ]}
              disabled={!isPro}
              ctaLabel={!isPro ? 'Twój obecny plan' : 'Plan Podstawowy'}
              onSelect={() => {}}
            />

            {/* PRO PLAN */}
            <PricingCard
              title="CVELOCITY Pro"
              price={billingCycle === 'monthly' ? '49 zł' : '39 zł'}
              period="/ miesiąc brutto"
              isPopular={true}
              description="Dla specjalistów i inżynierów aplikujących na wiele stanowisk jednocześnie."
              features={[
                'Wszystko co w planie Free',
                'Nielimitowany Instant-Import (PDF, DOCX)',
                'Nielimitowany asystent AI Gap-Fixer',
                'Pełny dostęp do wszystkich szablonów A4',
                'Pro Insights (trendy, wskaźniki odpowiedzi)',
                '30 dni darmowego okresu próbnego',
                'Anulowanie w 2 kliknięciach (Stripe Portal)',
              ]}
              ctaLabel={isPro ? 'Twój aktywny plan' : 'Rozpocznij 30 dni za darmo'}
              disabled={isPro}
              onSelect={handleOpenProCheckout}
            />

            {/* SINGLE TEMPLATE */}
            <PricingCard
              title="Szablony Jednorazowe"
              price="19 zł"
              period="/ jednorazowo"
              description="Dla osób poszukujących wyłącznie unikalnego szablonu wizualnego bez abonamentu."
              features={[
                'Dożywotni dostęp do wybranego szablonu',
                'Szablony Executive / Creative',
                'Edycja WYSIWYG w czasie rzeczywistym',
                'Eksport PDF & DOCX w wysokiej rozdzielczości',
                'Brak subskrypcji i cyklicznych opłat',
                'Opcjonalny pakiet 5 szablonów za 79 zł',
              ]}
              excluded={[
                'Nielimitowane operacje AI',
                'Automatyczny Instant-Import z plików',
              ]}
              ctaLabel="Kup wybrany szablon"
              onSelect={() => handleOpenTemplateCheckout('Executive')}
            />
          </div>

          {/* Feature Comparison Table */}
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 space-y-5">
            <h3 className="text-base font-bold text-ink">Szczegółowe Porównanie Funkcji</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-line text-muted uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Funkcjonalność</th>
                    <th className="pb-3 font-semibold">Free</th>
                    <th className="pb-3 font-semibold text-brand-fg">Pro</th>
                    <th className="pb-3 font-semibold">Jednorazowo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  <tr>
                    <td className="py-3 text-ink font-sans">Tworzenie i edycja Master Vault</td>
                    <td className="py-3 text-success-fg">Nielimitowane</td>
                    <td className="py-3 text-success-fg">Nielimitowane</td>
                    <td className="py-3 text-success-fg">Nielimitowane</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-ink font-sans">Audyt ATS i analiza luk (Score Ring)</td>
                    <td className="py-3 text-success-fg">Darmowe</td>
                    <td className="py-3 text-success-fg">Darmowe</td>
                    <td className="py-3 text-success-fg">Darmowe</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-ink font-sans">Eksport PDF / DOCX</td>
                    <td className="py-3 text-success-fg">Darmowy (Modern/Minimal)</td>
                    <td className="py-3 text-success-fg">Wszystkie szablony</td>
                    <td className="py-3 text-success-fg">Zakupiony szablon</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-ink font-sans">Instant-Import z plików CV</td>
                    <td className="py-3 text-muted">1 plik / mc</td>
                    <td className="py-3 text-success-fg font-bold">Nielimitowane</td>
                    <td className="py-3 text-muted">1 plik / mc</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-ink font-sans">Optymalizacje AI Gap-Fixer</td>
                    <td className="py-3 text-muted">5 ulepszeń / mc</td>
                    <td className="py-3 text-success-fg font-bold">Nielimitowane</td>
                    <td className="py-3 text-muted">5 ulepszeń / mc</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-ink font-sans">Analityka Pro Insights CRM</td>
                    <td className="py-3 text-muted">Podstawowa</td>
                    <td className="py-3 text-success-fg font-bold">Trendy & Prognozy</td>
                    <td className="py-3 text-muted">Podstawowa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: FUNKCJE PREMIUM & DEMA */}
      {activeSubTab === 'features' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Feature 1: Instant-Import */}
            <div className="rounded-3xl border border-line bg-elevated p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <IconParser className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">1. Instant-Import CV</h3>
                    <p className="text-xs text-muted">Oszczędność ~1h ręcznego przepisywania</p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-brand-fg">
                  1 free / mc • Pro
                </span>
              </div>

              <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-center text-xs text-muted">
                <p>Upuść plik PDF/DOCX, a silnik automatycznie zmapuje go do Master Vault.</p>
                <div className="mt-2 font-mono text-[11px] text-ink">
                  Pozostało na Twoim koncie: <b>{isPro ? 'Nielimitowane' : `${usage.importUses} / 1`}</b>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Wklejanie tekstu: <b>Zawsze darmowe</b></span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenProCheckout}
                >
                  Odblokuj nielimitowane
                </Button>
              </div>
            </div>

            {/* Feature 2: AI Gap-Fixer */}
            <div className="rounded-3xl border border-line bg-elevated p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <IconSparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">2. AI Gap-Fixer</h3>
                    <p className="text-xs text-muted">Inteligentne uzupełnianie słów kluczowych ATS</p>
                  </div>
                </div>
                <span className="rounded-full bg-success-soft px-2.5 py-0.5 font-mono text-[10px] font-bold text-success-fg">
                  5 free / mc • Pro
                </span>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-4 text-xs space-y-2">
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Miesięczny limit ulepszeń AI:</span>
                  <b>{isPro ? 'Nielimitowane' : `${usage.aiUses} / 5`}</b>
                </div>
                <p className="text-muted text-[11px]">
                  Zamiast zgadywać, dlaczego system odrzuca aplikację, AI wskaże brakujące narzędzia i sformułowania.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Koszt tokenów: <b>Pokrywany w Pro</b></span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenProCheckout}
                >
                  Subskrybuj Pro
                </Button>
              </div>
            </div>

            {/* Feature 3: Template Marketplace */}
            <div className="rounded-3xl border border-line bg-elevated p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <IconPalette className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">3. Marketplace Szablonów A4</h3>
                    <p className="text-xs text-muted">Modern/Minimal free • Executive/Creative 19 zł</p>
                  </div>
                </div>
                <span className="rounded-full bg-sunken px-2.5 py-0.5 font-mono text-[10px] font-bold text-muted">
                  Jednorazowo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="rounded-xl border border-line bg-surface p-3">
                  <span className="text-success-fg font-bold">Modern & Minimal</span>
                  <div className="text-[10px] text-muted">0 zł na zawsze</div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3">
                  <span className="text-brand-fg font-bold">Executive & Creative</span>
                  <div className="text-[10px] text-muted">19 zł / sztuka</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Eksport PDF: <b>Zawsze darmowy</b></span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenTemplateCheckout('Executive')}
                >
                  Kup szablon (19 zł)
                </Button>
              </div>
            </div>

            {/* Feature 4: Pro Insights CRM */}
            <div className="rounded-3xl border border-line bg-elevated p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <IconRadar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">4. Pro Insights CRM</h3>
                    <p className="text-xs text-muted">Trendy odpowiedzi rekruterów i analityka</p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-brand-fg">
                  Trial 30 dni
                </span>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-4 text-xs space-y-2">
                <p className="text-muted text-[11px]">
                  Podstawowy rejestr aplikacji jest darmowy. Pro Insights dodaje wykresy konwersji i estymację czasu do oferty.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Okres próbny: <b>30 dni za 0 zł</b></span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenProCheckout}
                >
                  Aktywuj trial
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 3: STANDARDY UCZCIWOŚCI & KODEKS WIN-WIN */}
      {activeSubTab === 'validation' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
          className="space-y-6"
        >
          {/* 4 Ethical Pillars */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <IconZap className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-ink">Realny Problem</h4>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Eliminacja ręcznego przepisywania dokumentów i wielogodzinnego dopasowywania słów kluczowych.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <IconRadar className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-ink">Mierzalny Efekt</h4>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Wzrost wskaźnika przejścia przez filtry ATS z ~40% do ponad 90% na każdym zgłoszeniu.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <IconVault className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-ink">Pełna Opcjonalność</h4>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Darmowy plan pozostaje w 100% użyteczny. Żadnych blokad dostępu do Twoich własnych danych.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <IconShield className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-ink">Zero Dark Patterns</h4>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Ceny brutto z VAT, brak sztucznej pilności i rezygnacja z subskrypcji w 2 kliknięciach.
              </p>
            </div>
          </div>

          {/* Ethics Checklist from WALIDACJA.md */}
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 space-y-4">
            <h3 className="text-sm font-bold text-ink">Checklista Etyki i Ochrony Użytkownika</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-elevated p-3 border border-line">
                <IconCheckCircle className="h-4 w-4 text-success-fg shrink-0" />
                <span>Brak ukrytych kosztów – ceny brutto z VAT widoczne przed płatnością</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-elevated p-3 border border-line">
                <IconCheckCircle className="h-4 w-4 text-success-fg shrink-0" />
                <span>Anulowanie subskrypcji w $\le$ 2 kliknięciach przez Stripe Customer Portal</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-elevated p-3 border border-line">
                <IconCheckCircle className="h-4 w-4 text-success-fg shrink-0" />
                <span>Brak confirmshamingu („Nie, nie chcę lepszej pracy”)</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-elevated p-3 border border-line">
                <IconCheckCircle className="h-4 w-4 text-success-fg shrink-0" />
                <span>Darmowy rdzeń aplikacji – tworzenie CV i eksport PDF zawsze bezpłatne</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stripe Checkout Modal Instance */}
      {selectedProduct && (
        <StripeCheckoutModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          onUnlocked={() => {
            alert(`Pomyślnie aktywowano: ${selectedProduct.title}`);
          }}
        />
      )}
    </div>
  );
};
