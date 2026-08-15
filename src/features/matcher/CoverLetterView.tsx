import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Printer,
  Sparkles,
  Zap,
  Target,
  Award,
} from 'lucide-react';
import { CoverLetter } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export interface CoverLetterViewProps {
  coverLetter: CoverLetter;
  className?: string;
}

export const CoverLetterView: React.FC<CoverLetterViewProps> = ({
  coverLetter,
  className = '',
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter.fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Controls & Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-elevated p-4 shadow-raised">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Anti-Template Cover Letter (0-Token Engine)
            </h3>
            <p className="text-[11px] text-muted">
              Wygenerowany bez szablonowych fraz z bezpośrednim odniesieniem do wymagań oferty.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={isCopied ? Check : Copy}
            onClick={handleCopy}
          >
            {isCopied ? 'Skopiowano treść' : 'Kopiuj list'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Drukuj / PDF
          </Button>
        </div>
      </div>

      {/* 3 Strategic Blocks Overview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-fg">
            <Target className="h-3.5 w-3.5" />
            <span>1. Haczyk Strategiczny</span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed line-clamp-3">
            {coverLetter.hook}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-success-fg">
            <Award className="h-3.5 w-3.5" />
            <span>2. Twarde Dowody (STAR)</span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed line-clamp-3">
            {coverLetter.proofPoints.join(' ')}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet">
            <Sparkles className="h-3.5 w-3.5" />
            <span>3. Call to Action</span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed line-clamp-3">
            {coverLetter.callToAction}
          </p>
        </div>
      </div>

      {/* Full Document Paper Container */}
      <Card tone="raised" className="p-8 sm:p-12 space-y-6">
        <div className="border-b border-line pb-4">
          <h2 className="text-lg font-bold text-ink">
            Aplikacja na stanowisko: {coverLetter.targetJobTitle}
          </h2>
          <p className="text-xs text-muted">
            Firma: <strong className="text-ink">{coverLetter.companyName}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-line/60 bg-sunken p-6 font-sans text-xs text-ink leading-relaxed whitespace-pre-wrap">
          {coverLetter.fullText}
        </div>
      </Card>
    </div>
  );
};
