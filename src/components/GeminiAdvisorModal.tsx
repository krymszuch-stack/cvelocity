import React, { useState, useEffect } from 'react';
import { Lightbulb, BookOpen, MessageSquare, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, X, HelpCircle, Search, Cpu } from 'lucide-react';
import { MasterVault } from '../types';
import { INDUSTRY_SLANG_DICTIONARY, normalizeSlangInText } from '../data/synonymsDictionary';

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

  if (!isOpen) return null;

  const handleAskGemini = async (queryToAsk?: string) => {
    const q = (queryToAsk || question).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/advisor/teach', {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-lg animate-pulse">
              <Lightbulb className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Doradca Gemini & Samouczek CV</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  Full API Mentor
                </span>
              </h2>
              <p className="text-xs text-amber-200/80">
                Ucz się standardów ATS, poznaj powody zmian ("Czemu tak a nie tak") i eliminuj slang branżowy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 px-6 pt-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('qa')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'qa'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Zapytań Gemini: Samouczek</span>
          </button>

          <button
            onClick={() => setActiveTab('slang')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'slang'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Słownik Slangu Branżowego</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'audit'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Zasady & Dobre Praktyki ATS</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Gemini Q&A Teacher */}
          {activeTab === 'qa' && (
            <div className="space-y-6">
              {/* Question Input Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
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
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleAskGemini()}
                    disabled={loading || !question.trim()}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Analizuję...</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4 text-slate-950" />
                        <span>Zapytaj Gemini</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preset Prompt Chips */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-2">Przykładowe tematy samouczka:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_QUESTIONS.map((pq, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuestion(pq);
                          handleAskGemini(pq);
                        }}
                        className="text-[11px] text-amber-200/90 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 px-3 py-1 rounded-full transition-colors text-left inline-flex items-center gap-1.5"
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
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Błąd komunikacji z Gemini API:</span>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              )}

              {advisorResponse && (
                <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 space-y-5 animate-fadeIn">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <Cpu className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-sm text-amber-200">
                      Wyjaśnienie i Lekcja Doradcy Gemini:
                    </h3>
                  </div>

                  {/* Main Explanation Markdown style */}
                  <div className="prose prose-invert prose-sm text-slate-200 text-xs leading-relaxed space-y-2 whitespace-pre-line">
                    {advisorResponse.explanation}
                  </div>

                  {/* Slang analysis if present */}
                  {advisorResponse.slangAnalysis && (
                    <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-lg text-xs text-amber-200">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5 mb-1"><Search className="w-3.5 h-3.5 shrink-0" />Analiza Slangu Branżowego:</span>
                      {advisorResponse.slangAnalysis}
                    </div>
                  )}

                  {/* Tips list */}
                  {advisorResponse.tips && advisorResponse.tips.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Wskazówki Samouczka:</span>
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
                        {advisorResponse.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {advisorResponse.actionItems && advisorResponse.actionItems.length > 0 && (
                    <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-lg space-y-2">
                      <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                        <span>Rekomendowane Kroki w Twoim CV:</span>
                      </span>
                      <div className="space-y-1 text-xs text-slate-200">
                        {advisorResponse.actionItems.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center">
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
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-amber-300 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tester Słownika Slangu na Żywo:</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Wklej zdanie ze swojego CV zawierające potoczizmy (np. "dłubanie w piecach", "infolinia pekao"), aby zobaczyć automatyczną konwersję na terminologię ATS oraz powód zamiany.
                </p>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={testSentence}
                    onChange={(e) => setTestSentence(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleTestSlangSentence}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <span>Normalizuj Tekst</span>
                  </button>
                </div>

                {testResult && (
                  <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block">Przekształcony tekst ATS:</span>
                      <p className="text-emerald-300 font-medium mt-0.5">{testResult.normalizedText}</p>
                    </div>

                    {testResult.replacements.length > 0 ? (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <span className="text-amber-300 font-semibold block">Wykryte i zamienione zwroty slangu: {testResult.replacements.length}</span>
                        {testResult.replacements.map((rep, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="line-through text-red-400">{rep.slang}</span>
                              <ArrowRight className="w-3 h-3 text-slate-500 mx-2" />
                              <span className="text-emerald-400 font-bold">{rep.formalTerm}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 italic flex items-start gap-1"><Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />Powód: {rep.reason}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">Brak wykrytych potoczizmów z bazy słownika w tym zdaniu.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Slang Dictionary Browser */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200">
                    Baza Słownika Slangu i Ekwiwalentów ({filteredSlangEntries.length} haseł):
                  </h3>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={slangSearch}
                      onChange={(e) => setSlangSearch(e.target.value)}
                      placeholder="Szukaj slangu (np. pekao, junkers)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {filteredSlangEntries.map((entry, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                          {entry.category}
                        </span>
                        <span className="text-[10px] text-red-400 line-through font-mono">
                          "{entry.slang}"
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-semibold">Formuła Oficjalna ATS:</span>
                        <p className="text-emerald-400 font-bold text-xs mt-0.5">{entry.formalTerm}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                        <span className="text-amber-300 font-semibold">Dlaczego ta zmiana?</span>
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
              <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2">
                <h3 className="font-bold text-sm text-indigo-200 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Dlaczego Systemy ATS Wykluczają Slang i Bierność?</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Systemy ATS (Applicant Tracking Systems) to oprogramowanie rekrutacyjne stosowane przez korporacje, banki (np. Pekao, PKO BP, ING) oraz firmy technologiczne do wstępnej selekcji nadesłanych życiorysów. Wykorzystują one algorytmy dopasowania fraz kluczowych.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zasada 1: Oficjalne Nazwy Jednostek & Akronimy</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Używanie formalnych nazw struktur (np. <i>"Pekao Direct"</i> zamiast <i>"infolinia banku"</i>, <i>"SEP G3"</i> zamiast <i>"uprawnienia na gaz"</i>) daje sygnał rekruterowi, że znasz procedury korporacyjne.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zasada 2: Liczby i Wskaźniki Metrics ROI</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Przykłady ze wskaźnikami (np. <i>"Obsługa 45+ zgłoszeń dziennie przy zachowaniu SLA 98%"</i>) natychmiast budują wiarygodność i zwiększają ocenę punktową o 25-35%.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zasada 3: Bezpieczeństwo Prawne RODO/KNF</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    W sektorze bankowym i finansowym dodanie fraz takich jak <i>"Weryfikacja tożsamości KYC / AML"</i> i <i>"Zgodność ze standardami KNF"</i> gwarantuje przejście automatycznych filtrów zgodności.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zasada 4: Czasowniki Działania</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Każdy punktor w CV rozpoczynaj od mocnego czasownika w 1. osobie liczby pojedynczej: <i>"Wdrożyłem"</i>, <i>"Zoptymalizowałem"</i>, <i>"Przeprowadziłem"</i>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Zasilany przez Gemini 3.6 Flash – Twój osobisty samouczek ATS</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Zamknij Samouczek
          </button>
        </div>
      </div>
    </div>
  );
};
