import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  HelpCircle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

import { MasterVault } from '../../types';

export interface GeminiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
  vault?: MasterVault;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Jak opisać sukcesy w metodzie STAR?',
  'Dlaczego ATS odrzuca PDF z dwoma kolumnami?',
  'Jak podnieść wynik dopasowania dla ról Senior?',
  'Jakie są typowe błędy lematyzacji w języku polskim?',
];

export const GeminiAdvisorModal: React.FC<GeminiAdvisorModalProps> = ({
  isOpen,
  onClose,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'ai',
      text: 'Witaj! Jestem Twoim Doradcą Kariery i Ekspertem ds. Systemów ATS. Wyjaśnię Ci, dlaczego pewne sformułowania w CV zwiększają szanse na zaproszenie na rozmowę, jak unikać pułapek parserów rekrutacyjnych oraz jak skutecznie negocjować widełki finansowe. O co chciałbyś zapytać?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuestion && isOpen) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    // Simulated Advisor Response
    setTimeout(() => {
      let replyText = 'Dobre pytanie! W systemach rekrutacyjnych ATS kluczem jest precyzja słów kluczowych i twarde metryki biznesowe.';

      const qLower = query.toLowerCase();
      if (qLower.includes('star')) {
        replyText = 'Metoda STAR (Situation, Task, Action, Result) to złoty standard. Zamiast pisać "odpowiedzialny za rozwój API", napisz: "Zoptymalizowałem zapytania SQL w PostgreSQL (Action), redukując czas odpowiedzi endpointów o 42% dla 150k użytkowników (Result)". Liczby natychmiast przyciągają uwagę rekrutera!';
      } else if (qLower.includes('kolumn') || qLower.includes('pdf')) {
        replyText = 'Parsery ATS (np. Workday, Taleo) czytają tekst od lewej do prawej. W układzie dwukolumnowym tekst z lewej i prawej kolumny potrafi się zlepić w jeden nieczytelny ciąg, co prowadzi do utraty punktów dopasowania. Szablon jednokolumnowy daje 100% gwarancji poprawnego odczytania.';
      } else if (qLower.includes('senior')) {
        replyText = 'Dla stanowisk Senior / Lead liczy się wpływ na architekturę, mentoring i optymalizację kosztów chmury (FinOps). Zadbaj, aby w najnowszym stanowisku pojawiły się frazy: "Architektura modularna", "Code Review", "Projektowanie systemów rozproszonych" oraz "Wdrażanie standardów bezpieczeństwa".';
      }

      const aiMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Okienko Doradcy Kariery (Gemini Advisor)"
      size="lg"
    >
      <div className="flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-2 pr-3">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] p-4 text-xs leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-on-brand rounded-2xl rounded-tr-none'
                      : 'bg-sunken border border-line text-ink rounded-2xl rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`mt-1.5 block font-mono text-[9px] ${
                      m.sender === 'user' ? 'text-on-brand/70 text-right' : 'text-muted'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-elevated text-ink border border-line">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-muted font-mono"
              >
                <Sparkles className="h-4 w-4 animate-spin text-brand-600" />
                <span>Doradca analizuje i pisze odpowiedź...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="border-t border-line/60 pt-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-brand-300 hover:text-ink focus-visible:outline-none"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-line">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Zadaj pytanie doradcy (np. jak uzasadnić przerwę w karierze)..."
            className="flex-1 rounded-2xl border border-line bg-sunken px-4 py-2.5 text-xs text-ink placeholder:text-subtle focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />

          <Button
            type="button"
            variant="primary"
            size="md"
            icon={Send}
            disabled={!inputVal.trim() || isTyping}
            onClick={() => handleSend()}
          >
            Wyślij
          </Button>
        </div>
      </div>
    </Modal>
  );
};
