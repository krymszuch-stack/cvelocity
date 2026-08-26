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
import { TrustRow } from '../components/ui/TrustChip';
import { LockCover } from '../components/ui/LockCover';
import {
  StripeCheckoutModal,
  StripeCheckoutProduct,
} from '../components/payments/StripeCheckoutModal';
import { useEntitlements, FREE_MONTHLY_IMPORTS, FREE_DAILY_AI_USES } from '../store/useEntitlements';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { showToast } from '../store/useToastStore';

type PricingSubTab = 'pricing' | 'features' | 'validation';

export const PricingView: React.FC = () => {
  const { usage, isPro } = useEntitlements();
  const [activeSubTab, setActiveSubTab] = useState<PricingSubTab>('pricing');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedProduct, setSelectedProduct] = useState<StripeCheckoutProduct | null>(null);


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
      // Częstotliwość odnowienia musi jawnie trafić do modala — hardkod „co miesiąc"
      // kłamałby przy rozliczeniu rocznym.
      interval: billingCycle === 'monthly' ? 'month' : 'year',
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

        {/* Reguła 2 — ekran mówi wprost, że egzekwowanie płatności i okresu próbnego jeszcze
            nie istnieje; przyciski zakupu poniżej nie mogą sugerować działającej ścieżki. */}
        <div className="flex items-start gap-2 rounded-2xl border border-line bg-warning-soft px-4 py-3 text-xs text-warning-fg">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Integracja płatności jest w trakcie podłączania — zakupy i okres próbny nie są jeszcze
            aktywne. Rdzeń aplikacji pozostaje bezpłatny.
          </span>
        </div>

        {/* Hero baner mówi wyłącznie to, co wynika z cennika poniżej — żadnych
            „92% oszczędności”, bo takiego pomiaru nie robimy i liczba z sufitu
            byłaby daną wymyśloną (reguła 1 w AGENTS.md). */}
        <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-line bg-surface/90 p-6 sm:p-8 backdrop-blur-xl shadow-raised">
          <div className="text-brand-grad font-mono text-6xl sm:text-7xl font-extrabold tracking-tight">
            0 zł
          </div>
          <div className="max-w-md border-l border-line pl-6 text-xs sm:text-sm text-muted leading-relaxed">
            <b className="text-ink font-semibold">Rdzeń bezpłatny na zawsze:</b> edycja Master Vault, audyt ATS i eksport PDF. Płacisz tylko za automatyzację i AI.
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
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`cursor-pointer rounded text-label font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50 ${
                billingCycle === 'monthly' ? 'text-ink' : 'text-muted'
              }`}
            >
              Rozliczenie miesięczne
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
              role="switch"
              aria-checked={billingCycle === 'annual'}
              aria-label="Przełącz rozliczenie roczne"
              className={`relative h-6 w-11 cursor-pointer rounded-full border border-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50 ${
                billingCycle === 'annual' ? 'bg-brand-600' : 'bg-sunken'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-[18px] w-[18px] rounded-full bg-on-brand transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`cursor-pointer rounded text-label font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50 ${
                billingCycle === 'annual' ? 'text-ink' : 'text-muted'
              }`}
            >
              Rozliczenie roczne{' '}
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success-fg">
                Oszczędzasz 20%
              </span>
            </button>
          </div>

          {/* 3 Pricing Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* FREE PLAN */}
            <PricingCard
              title="CVELOCITY Free"
              price="0"
              currency="zł"
              period="/ na zawsze"
              description="Kompletny fundament dla każdego kandydata aktywnie poszukującego pracy."
              features={[
                'Pełny edytor Master Vault',
                'Ręczny parser i wklejanie tekstu CV',
                'Symulator ATS & Score Ring 0-100%',
                'Darmowy eksport PDF i DOCX (szablony bazowe)',
                'Pipeline zgłoszeń (CRM)',
                // Liczby z useEntitlements — te same, które egzekwuje licznik;
                // wcześniej tu siedziała osobna kopia i rozjeżdżała się z nią.
                `${FREE_MONTHLY_IMPORTS} darmowy Instant-Import pliku / mc`,
                `${FREE_DAILY_AI_USES} darmowych operacji AI / dzień`,
              ]}
              excluded={[
                'Nielimitowane importy plików PDF/DOCX',
                'Nielimitowany asystent AI Gap-Fixer',
                'Szablony Executive & Creative',
                'Analityka Pro Insights',
              ]}
              // Brak ścieżki downgrade — karta jest nieaktywna bezwarunkowo; etykieta opisuje
              // stan planu, a kliknięcie celowo nic nie robi.
              disabled={true}
              ctaLabel={!isPro ? 'Twój obecny plan' : 'Plan Podstawowy'}
              onSelect={() => {}}
            />

            {/* PRO PLAN */}
            <PricingCard
              title="CVELOCITY Pro"
              price={billingCycle === 'monthly' ? '49' : '39'}
              currency="zł"
              period="/ miesiąc brutto"
              note={
                billingCycle === 'monthly'
                  ? 'Faktura co miesiąc, cena brutto z VAT'
                  : 'Rozliczenie roczne (468 zł brutto)'
              }
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
              price="19"
              currency="zł"
              period="/ jednorazowo"
              note="Płatność jednorazowa, cena brutto z VAT"
              description="Dla osób poszukujących wyłącznie unikalnego szablonu wizualnego bez abonamentu."
              features={[
                'Dożywotni dostęp do wybranego szablonu',
                'Szablony Executive / Creative',
                'Edycja WYSIWYG w czasie rzeczywistym',
                'Eksport PDF & DOCX w wysokiej rozdzielczości',
                'Brak subskrypcji i cyklicznych opłat',
              ]}
              excluded={[
                'Nielimitowane operacje AI',
                'Automatyczny Instant-Import z plików',
              ]}
              ctaLabel="Kup szablon Executive"
              onSelect={() => handleOpenTemplateCheckout('Executive')}
            />
          </div>

          {/* Payment trust signals — shown before checkout, not after */}
          <div className="flex flex-col items-center gap-2 pt-1">
            {/* Bez „SSL 256-BIT" — twierdzenie kryptograficzne bez pokrycia w repo;
                o bezpieczeństwie mówi sąsiedni tekst: kartę obsługuje wyłącznie Stripe. */}
            <TrustRow
              items={['VISA', 'MASTERCARD', 'BLIK', 'APPLE PAY', 'GOOGLE PAY']}
              className="justify-center"
            />
            <p className="text-[11px] text-subtle">
              Płatności obsługuje Stripe. Anulujesz w 2 kliknięciach, bez kontaktu z obsługą.
            </p>
          </div>

          {/* Feature Comparison Table */}
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-bold text-ink">Szczegółowe Porównanie Funkcji</h2>

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
                    <td className="py-3 text-muted">5 ulepszeń / dzień</td>
                    <td className="py-3 text-success-fg font-bold">Nielimitowane</td>
                    <td className="py-3 text-muted">5 ulepszeń / dzień</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-ink font-sans">Analityka Pro Insights CRM</td>
                    <td className="py-3 text-muted">Podstawowa</td>
                    <td className="py-3 text-success-fg font-bold">Planowana (trendy, prognozy)</td>
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
                    <p className="text-xs text-muted">Import z pliku zamiast ręcznego przepisywania</p>
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
                  5 free / dzień • Pro
                </span>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-4 text-xs space-y-2">
                <div className="flex justify-between font-mono text-[11px]">
                  {/* Limit AI jest dobowy — tak rezerwuje go serwer
                      (`reserve_ai_quota`), więc i tu mówimy „dziś”. */}
                  <span>Dzisiejszy limit ulepszeń AI:</span>
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

              <p className="text-[11px] text-muted">
                Podstawowy rejestr aplikacji jest darmowy. Planowane w Pro: wykresy konwersji i estymacja czasu do oferty.
              </p>

              {/* Makieta oznaczona jak w LandingView — zaszyte wysokości słupków ilustrują wygląd
                  wykresu, a nie wynik pomiaru; bez etykiety czytałyby się jak prawdziwa analityka. */}
              <span className="rounded-full bg-sunken px-2.5 py-0.5 font-mono text-[10px] font-bold text-subtle">
                przykładowy wygląd
              </span>

              {/* Teaser: the shape of the data is visible, the values are not */}
              <LockCover
                intensity="data"
                label="Wykresy konwersji dostępne w planie Pro"
                action={
                  <Button variant="primary" size="sm" onClick={handleOpenProCheckout}>
                    Rozpocznij 30 dni za darmo
                  </Button>
                }
              >
                <div className="flex h-[140px] items-end gap-2 bg-surface p-3">
                  {[38, 52, 60, 74, 88, 100].map((h, i) => (
                    <div key={i} className="flex h-full flex-1 flex-col justify-end gap-1.5">
                      <div
                        className={`w-full rounded-t-md rounded-b-sm ${
                          i >= 4 ? 'bg-brand-grad' : i >= 2 ? 'bg-brand-600' : 'bg-brand-200'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-center font-mono text-[9.5px] text-subtle">
                        {['sty', 'lut', 'mar', 'kwi', 'maj', 'cze'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </LockCover>

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
                Symulator ATS pokazuje wynik 0–100% i konkretną listę luk przed wysyłką — poprawiasz dokładnie to, co obniża ocenę, zamiast zgadywać.
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
            <h2 className="text-sm font-bold text-ink">Checklista Etyki i Ochrony Użytkownika</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-elevated p-3 border border-line">
                <IconCheckCircle className="h-4 w-4 text-success-fg shrink-0" />
                <span>Brak ukrytych kosztów – ceny brutto z VAT widoczne przed płatnością</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-elevated p-3 border border-line">
                <IconCheckCircle className="h-4 w-4 text-success-fg shrink-0" />
                <span>Anulowanie subskrypcji w ≤ 2 kliknięciach przez Stripe Customer Portal</span>
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
            showToast('Aktywowano plan', { message: selectedProduct.title });
          }}
        />
      )}
    </div>
  );
};
