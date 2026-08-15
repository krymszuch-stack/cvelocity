import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterVault, JobOffer } from '../../types';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';

export interface InterviewCheatSheetViewProps {
  vault: MasterVault;
  jobOffer: JobOffer;
  className?: string;
}

interface QuestionItem {
  question: string;
  difficulty: 'Łatwe' | 'Średnie' | 'Wymagające';
  category: 'Techniczne' | 'Behawioralne' | 'Architektura';
  suggestedAnswerTip: string;
}

export const InterviewCheatSheetView: React.FC<InterviewCheatSheetViewProps> = ({
  vault,
  jobOffer,
  className = '',
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    questions: true,
    star: true,
    glossary: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sampleQuestions: QuestionItem[] = [
    {
      question: `Jak podchodzisz do optymalizacji wydajności w aplikacjach opartych o ${(jobOffer.techStack || ['React', 'TypeScript'])[0] || 'React'}?`,
      difficulty: 'Wymagające',
      category: 'Techniczne',
      suggestedAnswerTip: 'Wskaż profilowanie w Chrome DevTools, eliminację niepotrzebnych re-renderów, wirtualizację długich list i code splitting.',
    },
    {
      question: 'Opowiedz o sytuacji, w której musiałeś podjąć trudną decyzję architektoniczną pod presją czasu.',
      difficulty: 'Średnie',
      category: 'Behawioralne',
      suggestedAnswerTip: 'Użyj metody STAR: opisz kontekst awarii lub zmiany wymagań klienta, analizę ryzyk i wdrożony trade-off.',
    },
    {
      question: `W jaki sposób zapewniasz bezpieczeństwo i odporność systemów na awarie w środowisku ${jobOffer.company}?`,
      difficulty: 'Wymagające',
      category: 'Architektura',
      suggestedAnswerTip: 'Wymień mechanizmy Circuit Breaker, walidację danych na wejściu (Zod/Sanitization), rate limiting i monitorowanie metryk.',
    },
  ];

  const glossaryTerms = (jobOffer.techStack || jobOffer.requirements || ['React', 'TypeScript', 'Docker', 'PostgreSQL']).map((term) => ({
    term,
    definition: `Kluczowy element stosu technologicznego wymaganego w ogłoszeniu ${jobOffer.title}.`,
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-elevated p-4 shadow-raised">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <BookOpen className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
            Ściąga na Rozmowę Rekrutacyjną (Interview Cheat Sheet)
          </h3>
          <p className="text-[11px] text-muted">
            Personalizowany zestaw pytań, gotowe historie STAR i glosariusz techniczny dla stanowiska {jobOffer.title}.
          </p>
        </div>
      </div>

      {/* Accordion 1: Probable Interview Questions */}
      <Card tone="raised" className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection('questions')}
          className="flex w-full items-center justify-between text-left focus-visible:outline-none"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-brand-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
              1. Prawdopodobne Pytania Rekrutacyjne ({sampleQuestions.length})
            </h4>
          </div>
          {openSections.questions ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
        </button>

        <AnimatePresence>
          {openSections.questions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-2"
            >
              {sampleQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-line bg-surface p-4 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-ink leading-snug">{q.question}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Chip variant={q.difficulty === 'Wymagające' ? 'danger' : 'warning'} className="text-[10px] py-px">
                        {q.difficulty}
                      </Chip>
                      <Chip variant="neutral" className="text-[10px] py-px">
                        {q.category}
                      </Chip>
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-200/50 bg-brand-50/50 p-2.5 text-[11px] text-brand-fg">
                    <strong>Wskazówka odpowiedzi:</strong> {q.suggestedAnswerTip}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Accordion 2: Candidate's STAR Stories */}
      <Card tone="raised" className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection('star')}
          className="flex w-full items-center justify-between text-left focus-visible:outline-none"
        >
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-success-fg" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
              2. Twoje Gotowe Historie STAR (Z bazy Master Vault)
            </h4>
          </div>
          {openSections.star ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
        </button>

        <AnimatePresence>
          {openSections.star && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-2"
            >
              {vault.history.slice(0, 2).map((h, i) => (
                <div key={h.id} className="rounded-2xl border border-line bg-surface p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="font-bold text-ink">{h.role} w <strong className="text-brand-fg">{h.company}</strong></span>
                    <span className="font-mono text-[10px] text-muted">{h.startDate} – {h.isCurrent ? 'Obecnie' : h.endDate}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-line/60 bg-sunken p-2.5">
                      <span className="font-mono text-[10px] font-bold text-muted block mb-0.5">S (Situation)</span>
                      <p className="text-[11px] text-ink/90">{h.description || 'Skalowanie infrastruktury i platformy'}</p>
                    </div>
                    <div className="rounded-xl border border-line/60 bg-sunken p-2.5">
                      <span className="font-mono text-[10px] font-bold text-muted block mb-0.5">T (Task)</span>
                      <p className="text-[11px] text-ink/90">Redukcja czasu ładowania i optymalizacja API</p>
                    </div>
                    <div className="rounded-xl border border-line/60 bg-sunken p-2.5">
                      <span className="font-mono text-[10px] font-bold text-muted block mb-0.5">A (Action)</span>
                      <p className="text-[11px] text-ink/90">Wdrożenie architektury mikroserwisowej i cache'owania</p>
                    </div>
                    <div className="rounded-xl border border-success/30 bg-success-soft/50 p-2.5">
                      <span className="font-mono text-[10px] font-bold text-success-fg block mb-0.5">R (Result)</span>
                      <p className="text-[11px] text-success-fg font-bold">
                        {h.highlights[0]?.text || '+35% wzrost przepustowości systemu'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Accordion 3: Glossary */}
      <Card tone="raised" className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection('glossary')}
          className="flex w-full items-center justify-between text-left focus-visible:outline-none"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
              3. Glosariusz Słów Kluczowych Oferty ({glossaryTerms.length})
            </h4>
          </div>
          {openSections.glossary ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
        </button>

        <AnimatePresence>
          {openSections.glossary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2"
            >
              {glossaryTerms.map((g, idx) => (
                <div key={idx} className="rounded-xl border border-line bg-surface p-3 text-xs space-y-1">
                  <span className="font-bold text-brand-fg">{g.term}</span>
                  <p className="text-[11px] text-muted">{g.definition}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};
