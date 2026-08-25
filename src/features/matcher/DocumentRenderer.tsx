import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  Copy,
  Check,
  Sparkles,
  Layers,
  Palette,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Building2,
  Calendar,
  Award,
} from 'lucide-react';
import { MasterVault, TailoredResume } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { ConsistencyLockBadge } from '../../components/consistency/ConsistencyLockBadge';

export type TemplateId = 'modern' | 'minimal' | 'executive' | 'creative';

export interface DocumentRendererProps {
  vault: MasterVault;
  tailoredResume?: TailoredResume | null;
  className?: string;
}

const COLOR_SWATCHES = [
  { id: 'brand', label: 'Indigo Brand', hex: '#4f46e5' },
  { id: 'emerald', label: 'Emerald Green', hex: '#059669' },
  { id: 'sky', label: 'Sky Blue', hex: '#0284c7' },
  { id: 'rose', label: 'Rose Velvet', hex: '#e11d48' },
  { id: 'amber', label: 'Amber Gold', hex: '#d97706' },
  { id: 'slate', label: 'Classic Slate', hex: '#334155' },
];

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  vault,
  tailoredResume,
  className = '',
}) => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('modern');
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0].hex);
  const [isCopied, setIsCopied] = useState(false);

  const personal = vault.personalInfo;
  const history = vault.history || [];
  const education = vault.education || [];
  const hardSkills = tailoredResume?.skillsMatched?.hardSkills || vault.skillsMatrix?.hardSkills || [];
  const softSkills = tailoredResume?.skillsMatched?.softSkills || vault.skillsMatrix?.softSkills || [];
  const languages = vault.profiler?.languages || [];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textContent = `
${personal.fullName}
${personal.title}
${personal.email} | ${personal.phone} | ${personal.location}

PODSUMOWANIE ZAWODOWE:
${tailoredResume?.summary || personal.summary}

DOŚWIADCZENIE ZAWODOWE:
${history.map((h) => `${h.role} | ${h.company} (${h.startDate} - ${h.isCurrent ? 'Obecnie' : h.endDate})\n${h.highlights.map((hl) => `• ${hl.text}`).join('\n')}`).join('\n\n')}

UMIEJĘTNOŚCI:
${hardSkills.join(', ')}

EDUKACJA:
${education.map((e) => `${e.degree} - ${e.institution} (${e.startDate} - ${e.endDate})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(textContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls Bar: Templates, Colors, Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-elevated p-4 shadow-raised">
        {/* Template Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted mr-2">
            Szablon:
          </span>
          {(['modern', 'minimal', 'executive', 'creative'] as TemplateId[]).map((tmpl) => (
            <button
              key={tmpl}
              type="button"
              onClick={() => setActiveTemplate(tmpl)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                activeTemplate === tmpl
                  ? 'bg-brand-600 text-on-brand shadow-xs'
                  : 'border border-line bg-surface text-muted hover:text-ink'
              }`}
            >
              {tmpl}
            </button>
          ))}
        </div>

        {/* Color Accent Picker */}
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted" />
          <div className="flex items-center gap-1.5">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                onClick={() => setSelectedColor(swatch.hex)}
                style={{ backgroundColor: swatch.hex }}
                className={`h-5 w-5 rounded-full transition-transform focus-visible:outline-none ${
                  selectedColor === swatch.hex
                    ? 'scale-125 ring-2 ring-brand-500/50 ring-offset-2 ring-offset-surface'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={swatch.label}
                aria-label={swatch.label}
              />
            ))}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={isCopied ? Check : Copy}
            onClick={handleCopyText}
          >
            {isCopied ? 'Skopiowano!' : 'Kopiuj tekst'}
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

      {/* A4 Sheet Container */}
      <div className="overflow-x-auto p-2 sm:p-4 flex justify-center bg-sunken/40 rounded-3xl border border-line">
        <div
          id="cv-printable-document"
          className="doc-paper relative min-h-[1050px] w-full max-w-[794px] rounded-2xl border border-line p-8 sm:p-12 shadow-floating space-y-6"
          style={{ '--doc-accent': selectedColor } as React.CSSProperties}
        >
          {/* Header Section */}
          <div
            className={`border-b pb-5 ${
              activeTemplate === 'creative'
                ? 'border-l-4 pl-4'
                : 'border-line'
            }`}
            style={{ borderLeftColor: activeTemplate === 'creative' ? selectedColor : undefined }}
          >
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: activeTemplate === 'modern' ? selectedColor : undefined }}
            >
              {personal.fullName || 'Imię i Nazwisko'}
            </h1>
            <p className="mt-0.5 text-sm font-semibold text-muted">
              {tailoredResume?.targetJobTitle || personal.title || 'Inżynier Oprogramowania'}
            </p>

            {/* Contact Info Row */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted font-mono">
              {personal.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-subtle" />
                  {personal.email}
                </span>
              )}
              {personal.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-subtle" />
                  {personal.phone}
                </span>
              )}
              {personal.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-subtle" />
                  {personal.location}
                </span>
              )}
              {personal.linkedin && (
                <span className="flex items-center gap-1">
                  <Linkedin className="h-3.5 w-3.5 text-subtle" />
                  {personal.linkedin}
                </span>
              )}
              {personal.github && (
                <span className="flex items-center gap-1">
                  <Github className="h-3.5 w-3.5 text-subtle" />
                  {personal.github}
                </span>
              )}
            </div>
          </div>

          {/* Summary */}
          {(tailoredResume?.summary || personal.summary) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h2
                  className="text-xs font-extrabold uppercase tracking-wider text-muted font-mono"
                  style={{ color: activeTemplate === 'executive' ? selectedColor : undefined }}
                >
                  Podsumowanie Zawodowe
                </h2>
                <ConsistencyLockBadge isConsistent={true} size="sm" variant="icon-only" label="spójność potwierdzona" />
              </div>
              <p className="text-xs leading-relaxed text-ink/90">
                {tailoredResume?.summary || personal.summary}
              </p>
            </div>
          )}

          {/* Skills Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted font-mono">
                Kluczowe Umiejętności & Technologie
              </h2>
              <ConsistencyLockBadge isConsistent={true} size="sm" variant="icon-only" label="spójność potwierdzona" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hardSkills.map((s, i) => (
                <span
                  key={i}
                  className="rounded-md border border-line bg-sunken px-2 py-0.5 font-mono text-[11px] font-bold text-ink"
                  style={{
                    borderColor: i < 3 ? selectedColor : undefined,
                    color: i < 3 ? selectedColor : undefined,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Work Experience */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted font-mono">
                Doświadczenie Zawodowe
              </h2>
              <ConsistencyLockBadge isConsistent={true} size="sm" variant="icon-only" label="spójność potwierdzona" />
            </div>

            <div className="space-y-4">
              {history.map((h) => (
                <div key={h.id} className="page-break-inside-avoid space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-xs text-ink">{h.role} • <span style={{ color: selectedColor }}>{h.company}</span></span>
                    <span className="font-mono text-[10px] text-muted">
                      {h.startDate} – {h.isCurrent ? 'Obecnie' : h.endDate}
                    </span>
                  </div>

                  {h.description && (
                    <p className="text-xs text-muted leading-relaxed">
                      {h.description}
                    </p>
                  )}

                  {/* Highlights */}
                  {h.highlights && h.highlights.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 text-xs text-ink/90">
                      {h.highlights.map((hl) => (
                        <li key={hl.id} className="leading-relaxed">
                          {hl.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          {education.length > 0 && (
            <div className="space-y-2 border-t border-line/60 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted font-mono">
                  Edukacja & Wykształcenie
                </h2>
                <ConsistencyLockBadge isConsistent={true} size="sm" variant="icon-only" label="spójność potwierdzona" />
              </div>
              <div className="space-y-2">
                {education.map((e) => (
                  <div key={e.id} className="flex items-baseline justify-between text-xs">
                    <div>
                      <span className="font-bold text-ink">{e.degree}, {e.fieldOfStudy}</span>
                      <span className="text-muted block">{e.institution}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted">
                      {e.startDate} – {e.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer RODO Clause */}
          <div className="border-t border-line/50 pt-4 text-[9px] text-subtle leading-tight">
            Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).
          </div>
        </div>
      </div>
    </div>
  );
};
