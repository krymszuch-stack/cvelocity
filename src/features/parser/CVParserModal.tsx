import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterVault } from '../../types';
import { DropZone } from './DropZone';
import { DiffView } from './DiffView';
import { extractTextFromAnyFile, parseTextToMasterVault, ParsedCVResult } from '../../lib/cvUniversalParser';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Tabs } from '../../components/ui/Tabs';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { StripeCheckoutModal } from '../../components/payments/StripeCheckoutModal';

export interface CVParserModalProps {
  currentVault: MasterVault;
  onApplyParsedVault: (parsed: Partial<MasterVault>) => void;
  className?: string;
}

type IngestMode = 'file' | 'rawText';

export const CVParserModal: React.FC<CVParserModalProps> = ({
  currentVault,
  onApplyParsedVault,
  className = '',
}) => {
  const [ingestMode, setIngestMode] = useState<IngestMode>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedCVResult | null>(null);
  const [successToast, setSuccessToast] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { subscription, usage, consumeImport } = useAuthStore();
  const isPro = subscription.status === 'active' || subscription.status === 'trialing';

  const ingestTabs = [
    { id: 'file' as IngestMode, label: 'Plik z dysku (PDF/DOCX)', icon: UploadCloud },
    { id: 'rawText' as IngestMode, label: 'Wklej surowy tekst (Darmowe)', icon: FileCode },
  ];

  const handleStartParsing = async () => {
    let textToParse = rawText;

    if (ingestMode === 'file') {
      if (!selectedFile) {
        alert('Proszę najpierw wybrać lub upuścić plik.');
        return;
      }

      // Check import limit
      const canProceed = consumeImport();
      if (!canProceed) {
        setIsCheckoutOpen(true);
        return;
      }

      setIsProcessing(true);
      setParseProgress(20);
      setStatusMessage('Odczytywanie struktury pliku...');

      try {
        const extracted = await extractTextFromAnyFile(selectedFile);
        textToParse = extracted.text;
      } catch (err) {
        alert('Błąd podczas odczytu pliku. Spróbuj wkleić tekst ręcznie.');
        setIsProcessing(false);
        return;
      }
    } else {
      if (!rawText.trim() || rawText.trim().length < 30) {
        alert('Wklejony tekst jest zbyt krótki do przeprowadzenia analizy.');
        return;
      }
      setIsProcessing(true);
    }

    setParseProgress(50);
    setStatusMessage('Analiza sekcji, ról oraz słów kluczowych ATS...');

    await new Promise((resolve) => setTimeout(resolve, 600));

    setParseProgress(80);
    setStatusMessage('Formatowanie widoku porównawczego (Diff)...');

    const result = parseTextToMasterVault(textToParse);
    if (selectedFile) {
      result.detectedFormat = selectedFile.name.split('.').pop()?.toUpperCase() || 'Plik';
    } else {
      result.detectedFormat = 'Wklejony Tekst';
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    setParseProgress(100);
    setIsProcessing(false);
    setParsedResult(result);
  };

  const handleApplyMerge = (strategy: 'merge' | 'replace') => {
    if (!parsedResult) return;

    const payload: Partial<MasterVault> = {
      personalInfo: {
        ...currentVault.personalInfo,
        ...(parsedResult.personalInfo.fullName ? { fullName: parsedResult.personalInfo.fullName } : {}),
        ...(parsedResult.personalInfo.title ? { title: parsedResult.personalInfo.title } : {}),
        ...(parsedResult.personalInfo.email ? { email: parsedResult.personalInfo.email } : {}),
        ...(parsedResult.personalInfo.location ? { location: parsedResult.personalInfo.location } : {}),
        ...(parsedResult.personalInfo.summary ? { summary: parsedResult.personalInfo.summary } : {}),
      },
      skillsMatrix: {
        ...currentVault.skillsMatrix,
        hardSkills:
          strategy === 'replace'
            ? parsedResult.hardSkills
            : Array.from(new Set([...(currentVault.skillsMatrix?.hardSkills || []), ...parsedResult.hardSkills])),
        softSkills:
          strategy === 'replace'
            ? parsedResult.softSkills
            : Array.from(new Set([...(currentVault.skillsMatrix?.softSkills || []), ...parsedResult.softSkills])),
      },
      history:
        strategy === 'replace'
          ? parsedResult.history
          : [...(parsedResult.history || []), ...(currentVault.history || [])],
      education:
        strategy === 'replace'
          ? parsedResult.education
          : [...(parsedResult.education || []), ...(currentVault.education || [])],
    };

    onApplyParsedVault(payload);
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      setParsedResult(null);
      setSelectedFile(null);
      setRawText('');
    }, 2500);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <PageHeader
        title="Wczytywanie & Scalanie Dokumentu CV"
        description="Zaimportuj dotychczasowe CV w dowolnym formacie (PDF, DOCX, TXT), a silnik automatycznie wyekstrahuje historię, umiejętności i dane kontaktowe do porównania z Master Vault."
        badge="Universal Ingestion"
      />

      {/* Success Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success-soft p-4 text-xs font-bold text-success-fg shadow-raised"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              Profil kandydata w Master Vault został pomyślnie zaktualizowany! Dane zostały scalone.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {!parsedResult ? (
        <div className="space-y-6">
          {/* Tabs: File vs Raw Text */}
          <div className="flex flex-col items-center gap-2">
            <Tabs<IngestMode>
              items={ingestTabs}
              active={ingestMode}
              onChange={setIngestMode}
              className="max-w-md"
            />

            {/* Fair Quota Indicator */}
            {ingestMode === 'file' && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
                {isPro ? (
                  <span className="text-success-fg font-bold">Plan PRO: Nielimitowany Instant-Import</span>
                ) : usage.importUses > 0 ? (
                  <span>Pozostało darmowych importów pliku w tym miesiącu: <b className="text-ink">{usage.importUses}</b></span>
                ) : (
                  <span className="text-warning-fg font-bold">Wykorzystano miesięczny limit 1 pliku (Wklejanie tekstu nadal darmowe!)</span>
                )}
              </div>
            )}
          </div>

          {/* Ingest Box */}
          <Card tone="raised" className="space-y-4">
            {ingestMode === 'file' ? (
              <DropZone
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                isProcessing={isProcessing}
              />
            ) : (
              <div className="space-y-2">
                <Textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Wklej tutaj pełną treść swojego dokumentu CV (tekst z PDF, LinkedIn lub Notatnika)..."
                  className="font-mono text-xs"
                />
                <p className="font-mono text-[11px] text-muted">
                  Znaków: {rawText.length} • Słów: {rawText.trim().split(/\s+/).filter(Boolean).length} • Wklejanie tekstu jest w 100% bezpłatne i bez limitu.
                </p>
              </div>
            )}

            {/* Parsing Progress Bar */}
            {isProcessing && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span className="flex items-center gap-1.5 text-brand-fg">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    {statusMessage}
                  </span>
                  <span className="font-mono">{parseProgress}%</span>
                </div>
                <ProgressBar value={parseProgress} max={100} showLabel={false} barColor="bg-brand-600" />
              </div>
            )}

            {/* Action Trigger */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                loading={isProcessing}
                disabled={isProcessing || (ingestMode === 'file' && !selectedFile) || (ingestMode === 'rawText' && rawText.length < 30)}
                onClick={handleStartParsing}
              >
                {isProcessing ? 'Parsowanie dokumentu...' : 'Rozpocznij Parsowanie i Przygotuj Diff'}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        /* Diff View Mode */
        <DiffView
          currentVault={currentVault}
          parsedData={parsedResult}
          onApplyMerge={handleApplyMerge}
          onCancel={() => setParsedResult(null)}
        />
      )}

      {/* Stripe Checkout Modal for Instant Import Upgrade */}
      {isCheckoutOpen && (
        <StripeCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={{
            sku: 'price_cvelocity_pro_monthly',
            title: 'CVELOCITY Pro (Nielimitowany Instant-Import)',
            price: '49 zł',
            period: '/ miesiąc brutto',
            recurring: true,
            trialDays: 30,
          }}
          onUnlocked={() => {
            alert('Odblokowano plan Pro! Możesz teraz importować pliki bez limitu.');
          }}
        />
      )}
    </div>
  );
};
