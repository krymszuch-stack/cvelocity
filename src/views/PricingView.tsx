import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle2,
  Lock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PricingCard } from '../components/ui/PricingCard';
import {
  StripeCheckoutModal,
  StripeCheckoutProduct,
} from '../components/payments/StripeCheckoutModal';
import { useAuthStore } from '../store/useAuthStore';
import { PageHeader } from '../components/ui/PageHeader';

export const PricingView: React.FC = () => {
  const { subscription, usage } = useAuthStore();
  const [selectedProduct, setSelectedProduct] = useState<StripeCheckoutProduct | null>(null);

  const isPro = subscription.status === 'active' || subscription.status === 'trialing';

  const handleOpenProCheckout = () => {
    setSelectedProduct({
      sku: 'price_cvelocity_pro_monthly',
      title: 'CVELOCITY Pro (Subskrypcja)',
      price: '49 zł',
      period: '/ miesiąc',
      recurring: true,
      trialDays: 30,
    });
  };

  const handleOpenTemplateCheckout = () => {
    setSelectedProduct({
      sku: 'price_cvelocity_template_single',
      title: 'Szablon Executive A4 (Jednorazowo)',
      price: '19 zł',
      period: 'jednorazowo',
      recurring: false,
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-4 sm:p-6 lg:p-8">
      {/* Hero Header */}
      <div className="space-y-4">
        <PageHeader
          title="Przejrzysty Cennik & Monetyzacja Win-Win"
          description="Rdzeń aplikacji (edycja CV, audytor ATS, eksport PDF) jest w 100% bezpłatny. Płacisz wyłącznie za zaoszczędzony czas, automatyzację i zaawansowane funkcje AI."
          badge="CVELOCITY PRICING"
        />

        {/* Big Hero KPI Banner */}
        <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-line bg-surface/80 p-6 sm:p-8 backdrop-blur-xl shadow-raised">
          <div className="font-mono text-6xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 via-violet to-violet-2 bg-clip-text text-transparent">
            92%
          </div>
          <div className="max-w-md border-l border-line pl-6 text-xs sm:text-sm text-muted leading-relaxed">
            <b className="text-ink font-semibold">Oszczędności czasu:</b> użytkownicy CVELOCITY Pro tworzą perfekcyjnie dopasowane CV i listy motywacyjne w mniej niż 3 minuty na ofertę.
          </div>
          {isPro && (
            <div className="ml-auto flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-2 text-xs font-bold text-success-fg">
              <CheckCircle2 className="h-4 w-4" />
              <span>Twój aktywny plan: PRO</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Ethical Pillars */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Clock className="h-4 w-4" />
          </div>
          <h4 className="text-xs font-bold text-ink">Realny Problem</h4>
          <p className="mt-1 text-[11px] text-muted leading-relaxed">
            Eliminacja ręcznego przepisywania dokumentów i wielogodzinnego dopasowywania słów kluczowych.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h4 className="text-xs font-bold text-ink">Mierzalny Efekt</h4>
          <p className="mt-1 text-[11px] text-muted leading-relaxed">
            Wzrost wskaźnika przejścia przez filtry ATS z ~40% do ponad 90% na każdym zgłoszeniu.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Layers className="h-4 w-4" />
          </div>
          <h4 className="text-xs font-bold text-ink">Pełna Opcjonalność</h4>
          <p className="mt-1 text-[11px] text-muted leading-relaxed">
            Darmowy plan pozostaje w 100% użyteczny. Żadnych blokad dostępu do Twoich własnych danych.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-elevated p-5 shadow-xs">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h4 className="text-xs font-bold text-ink">Zero Dark Patterns</h4>
          <p className="mt-1 text-[11px] text-muted leading-relaxed">
            Ceny brutto z VAT, brak sztucznej pilności i rezygnacja z subskrypcji w 2 kliknięciach.
          </p>
        </div>
      </div>

      {/* 3 Main Pricing Cards Grid */}
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
          price="49 zł"
          period="/ miesiąc brutto"
          isPopular={true}
          description="Dla inżynierów i specjalistów aplikujących na wiele stanowisk jednocześnie."
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
          onSelect={handleOpenTemplateCheckout}
        />
      </div>

      {/* Feature Comparison Table */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 space-y-5">
        <h3 className="text-base font-bold text-ink">Szczegółowe Porównanie Planów</h3>

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
            </tbody>
          </table>
        </div>
      </div>

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
