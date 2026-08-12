import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';
import { Lightbulb, BookOpen, MessageSquare, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Search, Cpu } from 'lucide-react';
import { MasterVault } from '../types';
import { INDUSTRY_SLANG_DICTIONARY, normalizeSlangInText } from '../data/synonymsDictionary';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface GeminiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault?: MasterVault;
  jobContext?: string;
  initialQuestion?: string;
}

export const GeminiAdvisorModal: React.FC<GeminiAdvisorModalProps> = ({
  isOpen,
  onClose,
  vault,
  jobContext,
  initialQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'qa' | 'slang' | 'audit'>('qa');
  const [question, setQuestion] = useState(initialQuestion || '');
  const [loading, setLoading] = useState(false);
  const [advisorResponse, setAdvisorResponse] = useState<{
    explanation: string;
    tips: string[];
    slangAnalysis?: string;
    actionItems: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Slang dictionary state
  const [slangSearch, setSlangSearch] = useState('');
  const [testSentence, setTestSentence] = useState('Pracowałem na infolinii pekao i ogarniałem reklamacje oraz klepanie przelewów.');
  const [testResult, setTestResult] = useState<ReturnType<typeof normalizeSlangInText> | null>(null);

  useEffect(() => {
    if (initialQuestion && isOpen) {
      setQuestion(initialQuestion);
      handleAskGemini(initialQuestion);
    }
  }, [initialQuestion, isOpen]);

  const handleAskGemini = async (queryToAsk?: string) => {
    const q = (queryToAsk || question).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/advisor/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          cvContext: vault ? {
            name: vault.personalInfo?.fullName,
            title: vault.personalInfo?.title,
            summary: vault.personalInfo?.summary,
            skills: vault.skillsMatrix?.hardSkills,
            history: vault.history?.map((h) => ({ company: h.company, role: h.role, highlights: h.highlights.map((hl) => hl.text) })),
          } : undefined,
          jobContext: jobContext || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Błąd podczas łączenia z Doradcą Gemini AI.');
      }

      setAdvisorResponse(data.advice);
    } catch (err: any) {
      console.error('Gemini Advisor Error:', err);
      setError(err.message || 'Nie udało się połączyć z API Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const PRESET_QUESTIONS = [
    'Czemu potoczne słowa i slang obniżają wynik w systemach ATS?',
    'Jak opisać stanowisko w Bank Pekao Direct / PKO BP / ING bez szumu słownego?',
    'Dlaczego warto zamieniać wyrażenia ogólne na twarde wskaźniki (metrics)?',
    'Jak sformułować doświadczenie w HVAC (serwis piecyków gazowych Junkers/Vaillant)?',
    'Jakie twarde umiejętności są najchętniej wyłapywane przez rekruterów IT?',
  ];

  const filteredSlangEntries = INDUSTRY_SLANG_DICTIONARY.filter(
    (item) =>
      item.slang.toLowerCase().includes(slangSearch.toLowerCase()) ||
      item.formalTerm.toLowerCase().includes(slangSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(slangSearch.toLowerCase())
  );

  const handleTestSlangSentence = () => {
    const res = normalizeSlangInText(testSentence);
    setTestResult(res);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doradca Gemini & Samouczek CV"
      subtitle="Ucz się standardów ATS, poznaj powody zmian ('Czemu tak a nie tak') i eliminuj slang branżowy."
      icon={Lightbulb}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full text-xs text-muted">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-warning-fg" />
            <span>Zasilany przez Gemini 3.6 Flash – Twój osobisty samouczek ATS</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Zamknij Samouczek
          </Button>
        </div>
      }
    >
      {/* Tab Selection */}
      <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-line">
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'qa'
              ? 'border-brand-600 text-brand-fg bg-brand-soft rounded-t-lg'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-brand-fg" />
          <span>Zapytań Gemini: Samouczek</span>
        </button>

        <button
          onClick={() => setActiveTab('slang')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'slang'
              ? 'border-brand-600 text-brand-fg bg-brand-soft rounded-t-lg'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <BookOpen className="w-4 h-4 text-brand-fg" />
          <span>Słownik Slangu Branżowego</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-fg bg-brand-soft rounded-t-lg'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Sparkles className="w-4 h-4 text-success-fg" />
          <span>Zasady & Dobre Praktyki ATS</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="space-y-6">
        {/* TAB 1: Gemini Q&A Teacher */}
        {activeTab === 'qa' && (
          <div className="space-y-6">
            {/* Question Input Box */}
            <div className="bg-sunken p-4 rounded-xl border border-line space-y-3">
              <label className="block text-xs font-semibold text-ink flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-brand-fg" />
                  <span>Zadaj pytanie Doradcy AI: np. "Dlaczego zamieniać słowa potoczne?":</span>
                </span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Wpisz pytanie dotyczące budowy CV, opisu ról lub wymogów ATS..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAskGemini()}
                  className="flex-1 bg-surface border border-line rounded-lg px-3.5 py-2 text-xs text-ink placeholder-subtle focus:outline-none focus:border-brand-500"
                />
                <button
                  onClick={() => handleAskGemini()}
                  disabled={loading || !question.trim()}
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center space-x-2 transition-all disabled:opacity-50 shrink-0"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analizuję...</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      <span>Zapytaj Gemini</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preset Prompt Chips */}
              <div className="pt-2">
                <span className="text-[11px] text-muted font-semibold block mb-2">Przykładowe tematy samouczka:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_QUESTIONS.map((pq, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuestion(pq);
                        handleAskGemini(pq);
                      }}
                      className="text-[11px] text-brand-fg bg-brand-soft hover:bg-brand-soft/80 border border-brand-300 px-3 py-1 rounded-full transition-colors text-left inline-flex items-center gap-1.5"
                    >
                      <Lightbulb className="w-3 h-3 shrink-0" />
                      {pq}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Response Display Box */}
            {error && (
              <div className="p-4 rounded-xl bg-danger-soft border border-danger-500/30 text-danger-fg text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-danger-fg shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Błąd komunikacji z Gemini API:</span>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

            {advisorResponse && (
              <div className="bg-sunken p-5 rounded-xl border border-line space-y-5 animate-fade-in">
                <div className="flex items-center space-x-2 border-b border-line pb-3">
                  <Cpu className="w-5 h-5 text-brand-fg" />
                  <h3 className="font-bold text-sm text-ink">
                    Wyjaśnienie i Lekcja Doradcy Gemini:
                  </h3>
                </div>

                {/* Main Explanation */}
                <div className="prose prose-invert prose-sm text-ink text-xs leading-relaxed space-y-2 whitespace-pre-line">
                  {advisorResponse.explanation}
                </div>

                {/* Slang analysis if present */}
                {advisorResponse.slangAnalysis && (
                  <div className="p-3 bg-warning-soft border border-warning-500/30 rounded-lg text-xs text-warning-fg">
                    <span className="font-bold text-warning-fg flex items-center gap-1.5 mb-1"><Search className="w-3.5 h-3.5 shrink-0" />Analiza Slangu Branżowego:</span>
                    {advisorResponse.slangAnalysis}
                  </div>
                )}

                {/* Tips list */}
                {advisorResponse.tips && advisorResponse.tips.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-ink flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-success-fg" />
                      <span>Wskazówki Samouczka:</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-muted pl-4 list-disc">
                      {advisorResponse.tips.map((tip, idx) => (
                        <li key={idx} className="text-ink">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {advisorResponse.actionItems && advisorResponse.actionItems.length > 0 && (
                  <div className="p-3.5 bg-brand-soft border border-brand-300 rounded-lg space-y-2">
                    <span className="text-xs font-bold text-brand-fg flex items-center space-x-1.5">
                      <ArrowRight className="w-4 h-4 text-brand-fg" />
                      <span>Rekomendowane Kroki w Twoim CV:</span>
                    </span>
                    <div className="space-y-1 text-xs text-ink">
                      {advisorResponse.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-fg text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Slang Dictionary & Tester */}
        {activeTab === 'slang' && (
          <div className="space-y-6">
            {/* Interactive Slang Tester */}
            <div className="bg-sunken p-4 rounded-xl border border-line space-y-3">
              <h3 className="text-xs font-bold text-ink flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-fg" />
                <span>Tester Słownika Slangu na Żywo:</span>
              </h3>
              <p className="text-xs text-muted">
                Wklej zdanie ze swojego CV zawierające potoczizmy (np. "dłubanie w piecach", "infolinia pekao"), aby zobaczyć automatyczną konwersję na terminologię ATS oraz powód zamiany.
              </p>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={testSentence}
                  onChange={(e) => setTestSentence(e.target.value)}
                  className="flex-1 bg-surface border border-line rounded-lg px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-brand-500"
                />
                <button
                  onClick={handleTestSlangSentence}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shrink-0"
                >
                  <span>Normalizuj Tekst</span>
                </button>
              </div>

              {testResult && (
                <div className="mt-3 p-3 bg-surface border border-line rounded-lg space-y-2 text-xs">
                  <div>
                    <span className="text-muted font-semibold block">Przekształcony tekst ATS:</span>
                    <p className="text-success-fg font-medium mt-0.5">{testResult.normalizedText}</p>
                  </div>

                  {testResult.replacements.length > 0 ? (
                    <div className="pt-2 border-t border-line space-y-2">
                      <span className="text-brand-fg font-semibold block">Wykryte i zamienione zwroty slangu: <span className="sv-tnum">{testResult.replacements.length}</span></span>
                      {testResult.replacements.map((rep, idx) => (
                        <div key={idx} className="p-2.5 bg-sunken rounded-lg border border-line space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="line-through text-danger-fg">{rep.slang}</span>
                            <ArrowRight className="w-3 h-3 text-subtle mx-2" />
                            <span className="text-success-fg font-bold">{rep.formalTerm}</span>
                          </div>
                          <p className="text-[11px] text-muted italic flex items-start gap-1"><Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-warning-fg" />Powód: {rep.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted">Brak wykrytych potoczizmów z bazy słownika w tym zdaniu.</p>
                  )}
                </div>
              )}
            </div>

            {/* Slang Dictionary Browser */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink">
                  Baza Słownika Slangu i Ekwiwalentów (<span className="sv-tnum">{filteredSlangEntries.length}</span> haseł):
                </h3>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-subtle absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={slangSearch}
                    onChange={(e) => setSlangSearch(e.target.value)}
                    placeholder="Szukaj slangu (np. pekao, junkers)..."
                    className="w-full bg-sunken border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink placeholder-subtle focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredSlangEntries.map((entry, idx) => (
                  <div key={idx} className="p-3.5 bg-sunken border border-line rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-raised border border-line text-[10px] text-muted font-semibold">
                        {entry.category}
                      </span>
                      <span className="text-[10px] text-danger-fg line-through font-mono">
                        "{entry.slang}"
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted block font-semibold">Formuła Oficjalna ATS:</span>
                      <p className="text-success-fg font-bold text-xs mt-0.5">{entry.formalTerm}</p>
                    </div>
                    <div className="pt-2 border-t border-line text-[11px] text-muted">
                      <span className="text-brand-fg font-semibold">Dlaczego ta zmiana?</span>
                      <p className="mt-0.5">{entry.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ATS Rules & Best Practices */}
        {activeTab === 'audit' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-brand-soft border border-brand-300 rounded-xl space-y-2">
              <h3 className="font-bold text-sm text-brand-fg flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-fg" />
                <span>Dlaczego Systemy ATS Wykluczają Slang i Bierność?</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Systemy ATS (Applicant Tracking Systems) to oprogramowanie rekrutacyjne stosowane przez korporacje, banki (np. Pekao, PKO BP, ING) oraz firmy technologiczne do wstępnej selekcji nadesłanych życiorysów. Wykorzystują one algorytmy dopasowania fraz kluczowych.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-sunken border border-line rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-ink font-bold">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  <span>Zasada 1: Oficjalne Nazwy Jednostek & Akronimy</span>
                </div>
                <p className="text-muted leading-relaxed">
                  Używanie formalnych nazw struktur (np. <i>"Pekao Direct"</i> zamiast <i>"infolinia banku"</i>, <i>"SEP G3"</i> zamiast <i>"uprawnienia na gaz"</i>) daje sygnał rekruterowi, że znasz procedury korporacyjne.
                </p>
              </div>

              <div className="p-4 bg-sunken border border-line rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-ink font-bold">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  <span>Zasada 2: Liczby i Wskaźniki Metrics ROI</span>
                </div>
                <p className="text-muted leading-relaxed">
                  Przykłady ze wskaźnikami (np. <i>"Obsługa 45+ zgłoszeń dziennie przy zachowaniu SLA 98%"</i>) natychmiast budują wiarygodność i zwiększają ocenę punktową o 25-35%.
                </p>
              </div>

              <div className="p-4 bg-sunken border border-line rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-ink font-bold">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  <span>Zasada 3: Bezpieczeństwo Prawne RODO/KNF</span>
                </div>
                <p className="text-muted leading-relaxed">
                  W sektorze bankowym i finansowym dodanie fraz takich jak <i>"Weryfikacja tożsamości KYC / AML"</i> i <i>"Zgodność ze standardami KNF"</i> gwarantuje przejście automatycznych filtrów zgodności.
                </p>
              </div>

              <div className="p-4 bg-sunken border border-line rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-ink font-bold">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  <span>Zasada 4: Czasowniki Działania</span>
                </div>
                <p className="text-muted leading-relaxed">
                  Każdy punktor w CV rozpoczynaj od mocnego czasownika w 1. osobie liczby pojedynczej: <i>"Wdrożyłem"</i>, <i>"Zoptymalizowałem"</i>, <i>"Przeprowadziłem"</i>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

