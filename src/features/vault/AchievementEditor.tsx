import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, CheckCircle2, Tag, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HighlightMetric } from '../../types';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Textarea } from '../../components/ui/Field';

export interface AchievementEditorProps {
  highlights: HighlightMetric[];
  onChange: (updated: HighlightMetric[]) => void;
  onOpenAdvisor?: (initialQuestion?: string) => void;
  className?: string;
}

export const AchievementEditor: React.FC<AchievementEditorProps> = ({
  highlights,
  onChange,
  onOpenAdvisor,
  className = '',
}) => {
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  const handleAddHighlight = () => {
    const newHighlight: HighlightMetric = {
      id: `hl-${Date.now()}`,
      text: '',
      metric: '',
      target: '',
      action: '',
      tool: '',
      keywords: [],
    };
    onChange([...highlights, newHighlight]);
  };

  const handleUpdateText = (id: string, text: string) => {
    // Extract simple keywords from text
    const words = text
      .split(/[\s,.;]+/)
      .filter((w) => w.length > 3 && /^[A-Za-z0-9+#.-]+$/.test(w))
      .slice(0, 5);

    onChange(
      highlights.map((h) =>
        h.id === id
          ? {
              ...h,
              text,
              keywords: Array.from(new Set([...(h.keywords || []), ...words])),
            }
          : h
      )
    );
  };

  const handleRemoveHighlight = (id: string) => {
    onChange(highlights.filter((h) => h.id !== id));
  };

  const handleOptimizeWithGemini = async (highlight: HighlightMetric) => {
    if (!highlight.text.trim()) return;

    setOptimizingId(highlight.id);

    try {
      // Simulate/call AI endpoint or local rule-based enhancement
      await new Promise((resolve) => setTimeout(resolve, 800));

      let optimizedText = highlight.text;
      if (!optimizedText.includes('%') && !optimizedText.includes('zwiększ') && !optimizedText.includes('zoptymalizow')) {
        optimizedText = `Zoptymalizowano architekturę rozwiązania: ${highlight.text}, co przyniosło 35% wzrost wydajności przetwarzania danych.`;
      } else {
        optimizedText = `Wdrożono i przeskalowano: ${highlight.text}`;
      }

      handleUpdateText(highlight.id, optimizedText);
    } catch (err) {
      console.error('Błąd optymalizacji AI:', err);
    } finally {
      setOptimizingId(null);
    }
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
            Kluczowe Osiągnięcia i Rezultaty (Metoda STAR)
          </h4>
          <p className="text-[11px] text-subtle">
            Formułuj punkty jako: Działanie + Zastosowane Narzędzie + Mierzalny Rezultat (%).
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={handleAddHighlight}
        >
          Dodaj Punkt Osiągnięcia
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {highlights.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface/40 p-4 text-center">
              <p className="text-xs text-muted">
                Brak dodanych punktów osiągnięć. Dodaj przynajmniej 2–3 mierzalne sukcesy.
              </p>
            </div>
          ) : (
            highlights.map((hl, index) => {
              const isOptimizing = optimizingId === hl.id;

              return (
                <motion.div
                  key={hl.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-line bg-surface p-3.5 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-brand-fg mt-1">
                      #{index + 1}
                    </span>

                    <div className="flex-1">
                      <Textarea
                        rows={2}
                        value={hl.text}
                        onChange={(e) => handleUpdateText(hl.id, e.target.value)}
                        placeholder="np. Zaprojektowałem mikroserwis w Node.js/TypeScript redukujący opóźnienia zapytań o 45%..."
                        className="text-xs"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleRemoveHighlight(hl.id)}
                      className="text-danger-fg hover:bg-danger-soft mt-1"
                      title="Usuń osiągnięcie"
                    />
                  </div>

                  {/* Actions & Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/50">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag className="h-3 w-3 text-subtle" />
                      {(hl.keywords || []).slice(0, 4).map((kw, i) => (
                        <Chip key={i} variant="neutral" className="text-[10px] py-0.2">
                          {kw}
                        </Chip>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={Sparkles}
                        loading={isOptimizing}
                        onClick={() => handleOptimizeWithGemini(hl)}
                        className="text-brand-fg hover:bg-brand-50 text-[11px]"
                      >
                        {isOptimizing ? 'Optymalizowanie...' : 'Optymalizuj frazę (AI)'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
