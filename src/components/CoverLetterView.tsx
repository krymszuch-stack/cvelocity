import React, { useState, useEffect } from 'react';
import { CoverLetter, MasterVault } from '../types';
import {
  Layers,
  Copy,
  Check,
  Zap,
  Sparkles,
  RefreshCw,
  Plus,
  AlertTriangle,
  Trash2,
  Lightbulb,
  Cpu,
  ShieldCheck,
  Building2,
  Briefcase
} from 'lucide-react';
import { generateAntiTemplateCoverLetter, generateCoverLetterWithAI } from '../lib/coverLetterEngine';

interface CoverLetterViewProps {
  coverLetter: CoverLetter;
  vault?: MasterVault;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  onUpdateCoverLetter?: (updated: CoverLetter) => void;
  onOpenAdvisor?: (question?: string) => void;
}

export const CoverLetterView: React.FC<CoverLetterViewProps> = ({
  coverLetter: initialCoverLetter,
  vault,
  jobTitle = '',
  companyName = '',
  jobDescription = '',
  onUpdateCoverLetter,
  onOpenAdvisor,
}) => {
  const [letter, setLetter] = useState<CoverLetter>(initialCoverLetter);
  const [generationMode, setGenerationMode] = useState<'zero-token' | 'gemini-flash'>('zero-token');
  const [copied, setCopied] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Sync internal state if initial prop changes
  useEffect(() => {
    setLetter(initialCoverLetter);
  }, [initialCoverLetter]);

  // Sync full text whenever sections change
  const updateLetter = (updated: Partial<CoverLetter>) => {
    const nextHook = updated.hook !== undefined ? updated.hook : letter.hook;
    const nextProof = updated.proofPoints !== undefined ? updated.proofPoints : letter.proofPoints;
    const nextCTA = updated.callToAction !== undefined ? updated.callToAction : letter.callToAction;
    const name = vault?.personalInfo?.fullName || 'Kandydat';
    const phone = vault?.personalInfo?.phone;
    const email = vault?.personalInfo?.email;
    const contactLine = [phone && `Tel: ${phone}`, email && `Email: ${email}`].filter(Boolean).join(' | ');

    const newFullText = `${nextHook}\n\nWybrane przykłady moich dotychczasowych rezultatów zawodowych:\n${nextProof.join('\n')}\n\n${nextCTA}\n\nZ poważaniem,\n${name}${contactLine ? `\n${contactLine}` : ''}`;

    const newLetter: CoverLetter = {
      ...letter,
      ...updated,
      hook: nextHook,
      proofPoints: nextProof,
      callToAction: nextCTA,
      fullText: newFullText,
    };

    setLetter(newLetter);
    if (onUpdateCoverLetter) {
      onUpdateCoverLetter(newLetter);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letter.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Zero-Token generation (instant local calculation from loaded/created CV)
  const handleGenerateZeroToken = () => {
    if (!vault) return;
    setAiError(null);
    const newLetter = generateAntiTemplateCoverLetter(
      jobTitle || letter.targetJobTitle,
      companyName || letter.companyName,
      jobDescription,
      vault
    );
    setGenerationMode('zero-token');
    setLetter(newLetter);
    if (onUpdateCoverLetter) {
      onUpdateCoverLetter(newLetter);
    }
  };

  // Gemini 3.6 Flash model generation (lightweight server-side AI synthesis)
  const handleGenerateFlashAI = async () => {
    if (!vault) return;
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const newLetter = await generateCoverLetterWithAI(
        jobTitle || letter.targetJobTitle,
        companyName || letter.companyName,
        jobDescription,
        vault
      );
      setGenerationMode('gemini-flash');
      setLetter(newLetter);
      if (onUpdateCoverLetter) {
        onUpdateCoverLetter(newLetter);
      }
    } catch (err: any) {
      console.error('Błąd generowania AI listu:', err);
      setAiError(err?.message || 'Nie udało się połączyć z modelem Gemini Flash.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleProofChange = (index: number, val: string) => {
    const updatedPoints = [...letter.proofPoints];
    updatedPoints[index] = val;
    updateLetter({ proofPoints: updatedPoints });
  };

  const handleAddProofPoint = () => {
    const updatedPoints = [...letter.proofPoints, '• Nowy konkretny punkt z Twojego CV lub projektu'];
    updateLetter({ proofPoints: updatedPoints });
  };

  const handleRemoveProofPoint = (index: number) => {
    const updatedPoints = letter.proofPoints.filter((_, i) => i !== index);
    updateLetter({ proofPoints: updatedPoints });
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 text-ink shadow-xs space-y-5 animate-fade-in">
      {/* Top Bar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-soft border border-brand-200 rounded-xl text-brand-fg shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-base font-bold text-ink">List Motywacyjny</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                  generationMode === 'zero-token'
                    ? 'bg-success-soft text-success-fg border border-success-500/30'
                    : 'bg-brand-soft text-brand-fg border border-brand-300'
                }`}
              >
                {generationMode === 'zero-token' ? (
                  <>
                    <Zap className="w-3 h-3 text-success-fg" />
                    <span>Zero-Token</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-brand-fg" />
                    <span>Gemini Flash</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <Briefcase className="w-3.5 h-3.5 text-subtle" />
                <span>{jobTitle || letter.targetJobTitle || 'Stanowisko'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-subtle" />
                <span>{companyName || letter.companyName || 'Firma'}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {onOpenAdvisor && (
            <button
              type="button"
              onClick={() => onOpenAdvisor('Jak napisać list motywacyjny bez zbędnych sloganów?')}
              className="px-3 py-2 bg-warning-soft hover:bg-warning-soft/80 border border-warning-500/30 text-warning-fg rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95"
              title="Porada AI"
            >
              <Lightbulb className="w-4 h-4 text-warning-fg" />
              <span>Porada</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Skopiowano!' : 'Kopiuj Tekst'}</span>
          </button>
        </div>
      </div>

      {/* Generator Selector Card: Zero-Token vs Gemini Flash */}
      <div className="bg-sunken border border-line p-3.5 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs font-bold text-ink flex items-center space-x-1.5">
          <Cpu className="w-4 h-4 text-brand-fg" />
          <span>Generowanie z profilu CV:</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleGenerateZeroToken}
            disabled={isGeneratingAI}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all active:scale-95 ${
              generationMode === 'zero-token'
                ? 'bg-success-600 text-white border-success-700 shadow-xs'
                : 'bg-surface text-muted border-line hover:bg-sunken'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-warning-fg" />
            <span>Zero-Token z CV</span>
          </button>

          <button
            onClick={handleGenerateFlashAI}
            disabled={isGeneratingAI}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all active:scale-95 ${
              generationMode === 'gemini-flash'
                ? 'bg-brand-600 text-white border-brand-700 shadow-xs'
                : 'bg-surface text-muted border-line hover:bg-sunken'
            }`}
          >
            {isGeneratingAI ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-200" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            )}
            <span>{isGeneratingAI ? 'Generowanie...' : 'Gemini Flash'}</span>
          </button>
        </div>
      </div>

      {aiError && (
        <div className="p-3 bg-danger-soft border border-danger-500/30 text-danger-fg text-xs flex items-center justify-between rounded-xl">
          <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" />{aiError}</span>
          <button onClick={() => setAiError(null)} className="font-bold underline text-danger-fg">Zamknij</button>
        </div>
      )}

      {/* 3 Structured Sections Display with Live Editability */}
      <div className="space-y-4">
        {/* Section 1: Hook */}
        <div className="bg-sunken border border-line p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-fg">
                1. Haczyk (Hook) – Odniesienie do wyzwań firmy & profilu kandydata
              </span>
            </div>
            <span className="text-[10px] text-subtle italic">Edytowalne poniżej</span>
          </div>
          <textarea
            value={letter.hook}
            onChange={(e) => updateLetter({ hook: e.target.value })}
            rows={3}
            className="w-full text-xs sm:text-sm text-ink leading-relaxed font-sans bg-surface p-3 rounded-lg border border-line focus:outline-none focus:border-brand-500 resize-y"
            placeholder="Wpisz treść haczyka..."
          />
        </div>

        {/* Section 2: Proof Points */}
        <div className="bg-sunken border border-line p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-success-fg">
                2. Dowód (Proof) – Mierzalne osiągnięcia wyciągnięte z CV
              </span>
            </div>
            <button
              onClick={handleAddProofPoint}
              className="px-2 py-1 bg-success-600 hover:bg-success-700 text-white rounded text-[11px] font-bold flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Dodaj Punkt</span>
            </button>
          </div>

          <div className="space-y-2">
            {letter.proofPoints.map((point, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => handleProofChange(idx, e.target.value)}
                  className="flex-1 text-xs sm:text-sm text-ink bg-surface px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-success-500 font-medium"
                />
                <button
                  onClick={() => handleRemoveProofPoint(idx)}
                  className="p-2 text-subtle hover:text-danger-fg rounded-lg transition-colors"
                  title="Usuń ten punkt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Call to Action (CTA) */}
        <div className="bg-sunken border border-line p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-warning-fg">
                3. Call to Action (CTA) – Zaproszenie do kontaktu
              </span>
            </div>
          </div>
          <textarea
            value={letter.callToAction}
            onChange={(e) => updateLetter({ callToAction: e.target.value })}
            rows={2}
            className="w-full text-xs sm:text-sm text-ink leading-relaxed font-sans bg-surface p-3 rounded-lg border border-line focus:outline-none focus:border-warning-500 resize-y"
            placeholder="Wpisz wezwanie do działania..."
          />
        </div>
      </div>

      {/* Full Plain Text Preview & Copy Area */}
      <div className="bg-raised text-ink p-5 rounded-xl space-y-3 border border-line">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-fg flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-success-fg" />
            <span>Gotowa treść listu w formacie tekstowym:</span>
          </label>
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Skopiowano!' : 'Kopiuj Tekst'}</span>
          </button>
        </div>

        <textarea
          value={letter.fullText}
          onChange={(e) => updateLetter({ fullText: e.target.value })}
          rows={10}
          className="w-full font-sans text-xs sm:text-sm text-ink bg-sunken p-4 rounded-lg border border-line leading-relaxed focus:outline-none focus:border-brand-500 font-mono resize-y"
        />
      </div>
    </div>
  );
};
