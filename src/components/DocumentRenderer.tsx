import React, { useState, useRef } from 'react';
import { MasterVault, TailoredResume } from '../types';
import {
  Printer,
  Download,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Dices,
  Image as ImageIcon,
  UserCheck,
  Palette,
  Briefcase,
  Layout,
  Upload,
  X,
  Camera,
  Layers,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DocumentRendererProps {
  resume: TailoredResume;
  vault: MasterVault;
}

export type RenderVariant = 'ATS_SAFE' | 'ATS_VISUAL_PHOTO' | 'PRINT_READY' | 'EXECUTIVE_MODERN';

export interface DesignTheme {
  id: string;
  name: string;
  primaryColor: string; // Tailwind color class or hex
  primaryBg: string;
  textColor: string;
  accentBg: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  photoShape: 'circle' | 'rounded' | 'square' | 'ring';
  accentStyle: 'line' | 'left_bar' | 'badge' | 'dashed';
  paperBg: 'white' | 'cream' | 'cool' | 'warm';
}

const PALETTES = [
  {
    id: 'emerald',
    name: 'Szmaragdowy Tech',
    primaryColor: '#059669',
    primaryBg: '#ecfdf5',
    textColor: '#065f46',
    accentBg: '#d1fae5',
    borderColor: '#a7f3d0',
    badgeBg: '#059669',
    badgeText: '#ffffff',
  },
  {
    id: 'indigo',
    name: 'Nowoczesne Indygo',
    primaryColor: '#4f46e5',
    primaryBg: '#e0e7ff',
    textColor: '#3730a3',
    accentBg: '#c7d2fe',
    borderColor: '#a5b4fc',
    badgeBg: '#4f46e5',
    badgeText: '#ffffff',
  },
  {
    id: 'navy',
    name: 'Elegancki Granat',
    primaryColor: '#1e3a8a',
    primaryBg: '#eff6ff',
    textColor: '#1e40af',
    accentBg: '#dbeafe',
    borderColor: '#bfdbfe',
    badgeBg: '#1e3a8a',
    badgeText: '#ffffff',
  },
  {
    id: 'burgundy',
    name: 'Królewski Bordo',
    primaryColor: '#881337',
    primaryBg: '#fff1f2',
    textColor: '#9f1239',
    accentBg: '#ffe4e6',
    borderColor: '#fecdd3',
    badgeBg: '#881337',
    badgeText: '#ffffff',
  },
  {
    id: 'teal',
    name: 'Morski Cyjan',
    primaryColor: '#0d9488',
    primaryBg: '#ccfbf1',
    textColor: '#0f766e',
    accentBg: '#99f6e4',
    borderColor: '#5eead4',
    badgeBg: '#0d9488',
    badgeText: '#ffffff',
  },
  {
    id: 'monochrome',
    name: 'Monochromatyczny Antracyt',
    primaryColor: '#111827',
    primaryBg: '#f3f4f6',
    textColor: '#1f2937',
    accentBg: '#e5e7eb',
    borderColor: '#d1d5db',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'amber',
    name: 'Bursztynowy Miedź',
    primaryColor: '#d97706',
    primaryBg: '#fef3c7',
    textColor: '#b45309',
    accentBg: '#fde68a',
    borderColor: '#fcd34d',
    badgeBg: '#d97706',
    badgeText: '#ffffff',
  },
  {
    id: 'slate',
    name: 'Grafitowy Klasik',
    primaryColor: '#334155',
    primaryBg: '#f1f5f9',
    textColor: '#1e293b',
    accentBg: '#e2e8f0',
    borderColor: '#cbd5e1',
    badgeBg: '#334155',
    badgeText: '#ffffff',
  },
];

const FONTS = [
  { id: 'sans', name: 'Nowoczesny Sans (Inter)', cssClass: 'font-sans' },
  { id: 'serif', name: 'Szeryfowy Elegance (Playfair/Merriweather)', cssClass: 'font-serif' },
  { id: 'mono', name: 'Inżynieryjny Tech-Mono', cssClass: 'font-mono' },
];

const PHOTO_SHAPES = [
  { id: 'circle', name: 'Koło', cssClass: 'rounded-full border-2 border-white shadow-md' },
  { id: 'rounded', name: 'Zaokrąglony Kwadrat', cssClass: 'rounded-2xl border-2 border-white shadow-md' },
  { id: 'square', name: 'Prosty Kwadrat', cssClass: 'rounded-md border-2 border-white shadow-md' },
  { id: 'ring', name: 'Podwójny Ring', cssClass: 'rounded-full ring-4 ring-offset-2 shadow-lg' },
];

const ACCENT_STYLES = [
  { id: 'line', name: 'Linia Dolna' },
  { id: 'left_bar', name: 'Lewy Pasek' },
  { id: 'badge', name: 'Pigułka / Badge' },
  { id: 'dashed', name: 'Przerywana' },
];

const PAPER_BACKGROUNDS = [
  { id: 'white', name: 'Kreda (Czysta Biel)', bgClass: 'bg-white', hex: '#ffffff' },
  { id: 'cream', name: 'Papier Książkowy (Ciepły Krem)', bgClass: 'bg-[#fdfbf7]', hex: '#fdfbf7' },
  { id: 'cool', name: 'Chłodny Diament', bgClass: 'bg-[#f8fafc]', hex: '#f8fafc' },
  { id: 'warm', name: 'Satynowy Piasek', bgClass: 'bg-[#faf8f5]', hex: '#faf8f5' },
];

const getDeduplicatedExpHighlights = (exp: any, resume: TailoredResume): string[] => {
  const matched = (resume.selectedHighlights || []).filter(
    (h) => h.experienceId === exp.id || (h.company && exp.company && h.company.toLowerCase().trim() === exp.company.toLowerCase().trim())
  );
  let list: string[] = [];
  if (matched.length > 0) {
    list = matched.map((h) => h.optimizedText);
  } else if (exp.highlights && exp.highlights.length > 0) {
    list = exp.highlights.map((h: any) => (typeof h === 'string' ? h : h.text));
  }
  return Array.from(new Set(list.map((s) => s.trim()).filter((s) => s.length > 0)));
};

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({ resume, vault }) => {
  const [renderVariant, setRenderVariant] = useState<RenderVariant>('ATS_SAFE');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  // Photo state (custom override or from vault)
  const [photoUrl, setPhotoUrl] = useState<string>(
    vault.personalInfo.photoUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  );
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Active Design Theme State
  const [currentPaletteIndex, setCurrentPaletteIndex] = useState(0);
  const [currentFontIndex, setCurrentFontIndex] = useState(0);
  const [currentPhotoShapeIndex, setCurrentPhotoShapeIndex] = useState(0);
  const [currentAccentIndex, setCurrentAccentIndex] = useState(0);
  const [currentPaperIndex, setCurrentPaperIndex] = useState(0);

  const activePalette = PALETTES[currentPaletteIndex];
  const activeFont = FONTS[currentFontIndex];
  const activePhotoShape = PHOTO_SHAPES[currentPhotoShapeIndex];
  const activeAccent = ACCENT_STYLES[currentAccentIndex];
  const activePaper = PAPER_BACKGROUNDS[currentPaperIndex];

  // Randomize Design Generator (Mix-and-Match Engine)
  const handleRandomizeDesign = () => {
    setCurrentPaletteIndex(Math.floor(Math.random() * PALETTES.length));
    setCurrentFontIndex(Math.floor(Math.random() * FONTS.length));
    setCurrentPhotoShapeIndex(Math.floor(Math.random() * PHOTO_SHAPES.length));
    setCurrentAccentIndex(Math.floor(Math.random() * ACCENT_STYLES.length));
    setCurrentPaperIndex(Math.floor(Math.random() * PAPER_BACKGROUNDS.length));
  };

  const handleCopyRawText = () => {
    let raw = `${vault.personalInfo.fullName}\n${vault.personalInfo.title}\nEmail: ${vault.personalInfo.email} | Tel: ${vault.personalInfo.phone} | ${vault.personalInfo.location}\n\n`;
    raw += `PODSUMOWANIE ZAWODOWE:\n${resume.summary}\n\n`;
    raw += `DOŚWIADCZENIE ZAWODOWE:\n`;
    resume.selectedHighlights.forEach((h) => {
      raw += `• ${h.role} (${h.company}) - ${h.optimizedText}\n`;
    });
    raw += `\nUMIEJĘTNOŚCI TWARDE:\n${resume.skillsMatched.hardSkills.join(', ')}\n`;
    raw += `NARZĘDZIA I TECHNOLOGIE:\n${resume.skillsMatched.toolsAndTech.join(', ')}\n`;

    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!docRef.current) return;
    setIsExporting(true);

    try {
      const element = docRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: activePaper.hex,
        onclone: (clonedDoc) => {
          // Helper canvas context for exact browser color conversion of oklch / modern CSS colors to hex/rgb
          const colorCanvas = clonedDoc.createElement('canvas');
          colorCanvas.width = 1;
          colorCanvas.height = 1;
          const ctx = colorCanvas.getContext('2d');

          const convertToRgb = (colorStr: string): string => {
            if (!ctx) return 'rgb(30, 41, 59)';
            try {
              ctx.fillStyle = '#000000';
              ctx.fillStyle = colorStr;
              let res = ctx.fillStyle;
              if (res && res !== '#000000') return res;

              ctx.fillStyle = '#ffffff';
              ctx.fillStyle = colorStr;
              res = ctx.fillStyle;
              if (res && res !== '#ffffff') return res;

              return 'rgb(30, 41, 59)';
            } catch {
              return 'rgb(30, 41, 59)';
            }
          };

          const replaceOklchInText = (text: string): string => {
            if (!text || !text.includes('oklch')) return text;
            return text.replace(/oklch\((?:[^()]+|\([^()]*\))*\)/gi, (match) => {
              const rgb = convertToRgb(match);
              return rgb.includes('oklch') ? 'rgb(30, 41, 59)' : rgb;
            });
          };

          // 1. Process all document stylesheets to inline and sanitize rules
          const allStyleTexts: string[] = [];
          Array.from(document.styleSheets).forEach((sheet) => {
            try {
              const rules = Array.from(sheet.cssRules || []);
              const sheetCss = rules.map((r) => r.cssText).join('\n');
              if (sheetCss) {
                allStyleTexts.push(sheetCss);
              }
            } catch {
              // Ignore unaccessible cross-origin stylesheets
            }
          });

          // 2. Remove linked stylesheets from clonedDoc to prevent html2canvas from re-parsing raw oklch CSS
          const linkTags = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
          linkTags.forEach((link) => link.remove());

          // 3. Clean existing <style> tags in clonedDoc
          const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
          styleTags.forEach((styleTag) => {
            const cssText = styleTag.innerHTML || styleTag.textContent || '';
            if (cssText.includes('oklch')) {
              const cleanedCss = replaceOklchInText(cssText);
              const newStyleTag = clonedDoc.createElement('style');
              newStyleTag.textContent = cleanedCss;
              if (styleTag.parentNode) {
                styleTag.parentNode.replaceChild(newStyleTag, styleTag);
              }
            }
          });

          // 4. Inject combined sanitized style tag into clonedDoc head
          if (allStyleTexts.length > 0) {
            const combinedCss = allStyleTexts.join('\n');
            if (combinedCss.includes('oklch')) {
              const sanitizedCss = replaceOklchInText(combinedCss);
              const masterStyleTag = clonedDoc.createElement('style');
              masterStyleTag.textContent = sanitizedCss;
              clonedDoc.head.appendChild(masterStyleTag);
            }
          }

          // 5. Sanitize inline style attributes and computed colors on all DOM elements in cloned document
          const allElements = Array.from(clonedDoc.querySelectorAll('*'));
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const styleAttr = el.getAttribute('style');
              if (styleAttr && styleAttr.includes('oklch')) {
                el.setAttribute('style', replaceOklchInText(styleAttr));
              }
              try {
                const computed = window.getComputedStyle(el);
                ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
                  const val = computed.getPropertyValue(prop);
                  if (val && val.includes('oklch')) {
                    el.style.setProperty(prop, convertToRgb(val), 'important');
                  }
                });
              } catch {
                // Ignore computed style errors
              }
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CV_${vault.personalInfo.fullName.replace(/\s+/g, '_')}_${renderVariant}.pdf`);
    } catch (err) {
      console.error('Błąd podczas generowania PDF:', err);
      alert('Wystąpił błąd podczas generowania pliku PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
          setIsPhotoModalOpen(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim().startsWith('http')) {
      setPhotoUrl(customUrlInput.trim());
      setCustomUrlInput('');
      setIsPhotoModalOpen(false);
    } else {
      alert('Wklej prawidłowy adres URL do zdjęcia (http/https).');
    }
  };

  // Helper to render dynamic section header according to active accent style
  const renderSectionHeader = (title: string) => {
    switch (activeAccent.id) {
      case 'left_bar':
        return (
          <h2
            className={`text-xs font-bold uppercase tracking-wider pl-2.5 my-2 border-l-4`}
            style={{
              borderColor: activePalette.primaryColor,
              color: activePalette.textColor,
            }}
          >
            {title}
          </h2>
        );
      case 'badge':
        return (
          <div className="mb-2.5">
            <span
              className="inline-block px-3 py-1 rounded-md text-[11px] font-extrabold tracking-wider uppercase shadow-2xs"
              style={{
                backgroundColor: activePalette.badgeBg,
                color: activePalette.badgeText,
              }}
            >
              {title}
            </span>
          </div>
        );
      case 'dashed':
        return (
          <h2
            className={`text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 border-dashed`}
            style={{
              borderColor: activePalette.borderColor,
              color: activePalette.textColor,
            }}
          >
            {title}
          </h2>
        );
      case 'line':
      default:
        return (
          <h2
            className={`text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2`}
            style={{
              borderColor: activePalette.primaryColor,
              color: activePalette.textColor,
            }}
          >
            {title}
          </h2>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar & Style Mixer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Top Controls: Render Variant Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Layout className="w-4 h-4 text-indigo-600" />
              <span>Wariant Renderowania:</span>
            </span>
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1">
              <button
                onClick={() => setRenderVariant('ATS_SAFE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  renderVariant === 'ATS_SAFE'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ATS-Safe Klasyczny</span>
              </button>

              <button
                onClick={() => setRenderVariant('ATS_VISUAL_PHOTO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  renderVariant === 'ATS_VISUAL_PHOTO'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>ATS-Safe Wizualny + Zdjęcie</span>
              </button>

              <button
                onClick={() => setRenderVariant('PRINT_READY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  renderVariant === 'PRINT_READY'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Print-Ready 2-Kolumny</span>
              </button>

              <button
                onClick={() => setRenderVariant('EXECUTIVE_MODERN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  renderVariant === 'EXECUTIVE_MODERN'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Executive Modern</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyRawText}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Kopiuj Tekst</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Drukuj</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Pobierz PDF</span>
            </button>
          </div>
        </div>

        {/* Bottom Toolbar: Randomizer / Design Mixer */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <button
              onClick={handleRandomizeDesign}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-transform active:scale-95 shrink-0"
            >
              <Dices className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>🎲 LOSUJ DESIGN</span>
            </button>

            {/* Photo Edit Button */}
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>Zmień Zdjęcie Kandidata</span>
            </button>

            {/* Current Active Style Badges */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-600 flex-wrap gap-y-1">
              <span className="font-semibold text-slate-800 flex items-center space-x-1">
                <Palette className="w-3 h-3 text-indigo-500" />
                <span>Styl:</span>
              </span>
              <span
                className="px-2 py-0.5 rounded font-bold border text-[10px]"
                style={{
                  backgroundColor: activePalette.primaryBg,
                  color: activePalette.textColor,
                  borderColor: activePalette.borderColor,
                }}
              >
                {activePalette.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-medium text-[10px]">
                Font: {activeFont.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-medium text-[10px]">
                Papier: {activePaper.name}
              </span>
            </div>
          </div>

          {/* Quick Palette Picker Buttons */}
          <div className="flex items-center space-x-1 shrink-0 overflow-x-auto py-0.5">
            {PALETTES.map((pal, idx) => (
              <button
                key={pal.id}
                onClick={() => setCurrentPaletteIndex(idx)}
                title={pal.name}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  idx === currentPaletteIndex ? 'scale-125 border-slate-900 shadow-sm' : 'border-white hover:scale-110'
                }`}
                style={{ backgroundColor: pal.primaryColor }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RENDER CANVAS CONTAINER */}
      <div className="bg-slate-300/60 p-4 sm:p-8 rounded-2xl border border-slate-300 overflow-x-auto flex justify-center">
        <div
          ref={docRef}
          className={`w-[210mm] min-h-[297mm] p-10 shadow-2xl printable-area transition-all ${activeFont.cssClass} ${activePaper.bgClass}`}
          style={{ boxSizing: 'border-box' }}
        >
          {/* ========================================================
              VARIANT 1: ATS_SAFE (Classic 1-Column, Pure OCR Readability)
             ======================================================== */}
          {renderVariant === 'ATS_SAFE' && (
            <div className="space-y-6 text-slate-900 text-xs leading-relaxed">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
                  {vault.personalInfo.fullName}
                </h1>
                <p className="text-sm font-semibold text-slate-700 mt-1">{vault.personalInfo.title}</p>
                <div className="text-slate-600 text-xs mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Email: {vault.personalInfo.email}</span>
                  <span>Tel: {vault.personalInfo.phone}</span>
                  <span>Lokalizacja: {vault.personalInfo.location}</span>
                  {vault.personalInfo.linkedin && <span>LinkedIn: {vault.personalInfo.linkedin}</span>}
                </div>
              </div>

              {/* Summary */}
              <div>
                {renderSectionHeader('Podsumowanie Zawodowe')}
                <p className="text-slate-800 text-xs text-justify">{resume.summary}</p>
              </div>

              {/* Work Experience */}
              <div>
                {renderSectionHeader('Doświadczenie Zawodowe')}
                <div className="space-y-4">
                  {vault.history.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between items-baseline font-bold text-slate-900">
                        <span>
                          {exp.role} | {exp.company}
                        </span>
                        <span className="text-slate-600 font-normal font-mono text-[11px]">
                          {exp.startDate} - {exp.endDate}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] italic">{exp.location}</div>
                      <ul className="list-disc list-inside text-slate-800 space-y-1 pl-1">
                        {getDeduplicatedExpHighlights(exp, resume).map((text, i) => (
                          <li key={i} className="text-xs">
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Matrix */}
              <div>
                {renderSectionHeader('Umiejętności & Narzędzia')}
                <div className="space-y-1 text-slate-800">
                  <div>
                    <span className="font-bold">Umiejętności Twarde: </span>
                    <span>{resume.skillsMatched.hardSkills.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-bold">Narzędzia i Technologie: </span>
                    <span>{resume.skillsMatched.toolsAndTech.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-bold">Kompetencje Miękkie: </span>
                    <span>{resume.skillsMatched.softSkills.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Education */}
              {vault.education.length > 0 && (
                <div>
                  {renderSectionHeader('Wykształcenie')}
                  <div className="space-y-2">
                    {vault.education.map((edu) => (
                      <div key={edu.id} className="flex justify-between">
                        <div>
                          <div className="font-bold text-slate-900">
                            {edu.degree} - {edu.fieldOfStudy}
                          </div>
                          <div className="text-slate-600">{edu.institution}</div>
                        </div>
                        <div className="font-mono text-slate-500 text-[11px]">
                          {edu.startDate} - {edu.endDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              VARIANT 2: ATS_VISUAL_PHOTO (ATS-Safe Visual with Photo Header)
             ======================================================== */}
          {renderVariant === 'ATS_VISUAL_PHOTO' && (
            <div className="space-y-6 text-slate-900 text-xs leading-relaxed">
              {/* Top Banner Header with Photo */}
              <div
                className="p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs border"
                style={{
                  backgroundColor: activePalette.primaryBg,
                  borderColor: activePalette.borderColor,
                }}
              >
                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
                    style={{
                      backgroundColor: activePalette.badgeBg,
                      color: activePalette.badgeText,
                    }}
                  >
                    CV Zweryfikowane ATS-Safe
                  </span>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {vault.personalInfo.fullName}
                  </h1>
                  <p className="text-sm font-bold" style={{ color: activePalette.primaryColor }}>
                    {vault.personalInfo.title}
                  </p>
                  <div className="text-slate-700 text-[11px] flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 font-medium">
                    <span>📍 {vault.personalInfo.location}</span>
                    <span>✉️ {vault.personalInfo.email}</span>
                    <span>📞 {vault.personalInfo.phone}</span>
                    {vault.personalInfo.linkedin && <span>🔗 {vault.personalInfo.linkedin}</span>}
                  </div>
                </div>

                {/* Candidate Photo */}
                <div className="shrink-0">
                  <img
                    src={photoUrl}
                    alt={vault.personalInfo.fullName}
                    className={`w-28 h-28 object-cover ${activePhotoShape.cssClass}`}
                    onError={(e) => {
                      // Fallback avatar
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                {renderSectionHeader('Podsumowanie Zawodowe')}
                <p className="text-slate-800 text-xs text-justify leading-relaxed">{resume.summary}</p>
              </div>

              {/* Work Experience */}
              <div>
                {renderSectionHeader('Doświadczenie Zawodowe')}
                <div className="space-y-4">
                  {vault.history.map((exp) => (
                    <div key={exp.id} className="space-y-1.5">
                      <div className="flex justify-between items-baseline font-bold">
                        <span className="text-slate-900 text-sm">{exp.role}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {exp.startDate} - {exp.endDate}
                        </span>
                      </div>
                      <div className="font-semibold text-xs" style={{ color: activePalette.primaryColor }}>
                        {exp.company} • <span className="text-slate-500 font-normal">{exp.location}</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-800 space-y-1 pl-1">
                        {getDeduplicatedExpHighlights(exp, resume).map((text, i) => (
                          <li key={i} className="text-xs leading-relaxed">
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Matrix Badges */}
              <div>
                {renderSectionHeader('Kluczowe Umiejętności i Technologie')}
                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-slate-900 block mb-1 text-[11px] uppercase">
                      Twarde Kompetencje Techniczne:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.skillsMatched.hardSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold border"
                          style={{
                            backgroundColor: activePalette.primaryBg,
                            color: activePalette.textColor,
                            borderColor: activePalette.borderColor,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block mb-1 text-[11px] uppercase">
                      Narzędzia i Środowisko:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.skillsMatched.toolsAndTech.map((tool, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Education */}
              {vault.education.length > 0 && (
                <div>
                  {renderSectionHeader('Wykształcenie')}
                  <div className="space-y-2">
                    {vault.education.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-900">
                            {edu.degree} - {edu.fieldOfStudy}
                          </div>
                          <div className="text-slate-600">{edu.institution}</div>
                        </div>
                        <div className="font-mono text-slate-500 text-[11px]">
                          {edu.startDate} - {edu.endDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              VARIANT 3: PRINT_READY (Balanced 2-Column Print Ready)
             ======================================================== */}
          {renderVariant === 'PRINT_READY' && (
            <div className="grid grid-cols-12 gap-6 text-xs">
              {/* Left Sidebar */}
              <div
                className="col-span-4 p-5 rounded-2xl space-y-6 border"
                style={{
                  backgroundColor: activePalette.primaryBg,
                  borderColor: activePalette.borderColor,
                }}
              >
                <div className="text-center space-y-3">
                  <img
                    src={photoUrl}
                    alt={vault.personalInfo.fullName}
                    className={`w-24 h-24 mx-auto object-cover ${activePhotoShape.cssClass}`}
                  />
                  <div>
                    <h1 className="text-lg font-extrabold text-slate-900">{vault.personalInfo.fullName}</h1>
                    <p className="text-xs font-bold mt-1" style={{ color: activePalette.primaryColor }}>
                      {vault.personalInfo.title}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] text-slate-700 border-t border-slate-300 pt-3">
                  <div>📍 {vault.personalInfo.location}</div>
                  <div>✉️ {vault.personalInfo.email}</div>
                  <div>📞 {vault.personalInfo.phone}</div>
                  {vault.personalInfo.linkedin && <div>🔗 {vault.personalInfo.linkedin}</div>}
                </div>

                <div className="border-t border-slate-300 pt-3 space-y-2">
                  <h3 className="font-bold uppercase text-[11px] text-slate-900">Narzędzia & Tech</h3>
                  <div className="flex flex-wrap gap-1">
                    {resume.skillsMatched.toolsAndTech.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 bg-white rounded border text-[10px] text-slate-800 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-3 space-y-2">
                  <h3 className="font-bold uppercase text-[11px] text-slate-900">Języki Obce</h3>
                  <div className="space-y-1 text-[11px]">
                    {vault.profiler.languages.map((l) => (
                      <div key={l.id} className="flex justify-between">
                        <span className="font-medium text-slate-800">{l.language}</span>
                        <span className="text-slate-600">{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="col-span-8 space-y-6">
                <div>
                  {renderSectionHeader('Podsumowanie Zawodowe')}
                  <p className="text-slate-800 text-xs leading-relaxed">{resume.summary}</p>
                </div>

                <div>
                  {renderSectionHeader('Doświadczenie Zawodowe')}
                  <div className="space-y-4">
                    {vault.history.map((exp) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{exp.role}</span>
                          <span className="text-slate-500 font-normal text-[11px]">
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </div>
                        <div className="font-medium text-[11px]" style={{ color: activePalette.primaryColor }}>
                          {exp.company}
                        </div>
                        <ul className="list-disc list-inside text-slate-800 text-[11px] space-y-1 pl-1">
                          {getDeduplicatedExpHighlights(exp, resume).map((text, i) => (
                            <li key={i}>{text}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {vault.education.length > 0 && (
                  <div>
                    {renderSectionHeader('Wykształcenie')}
                    {vault.education.map((edu) => (
                      <div key={edu.id} className="text-xs space-y-0.5">
                        <div className="font-bold text-slate-900">
                          {edu.degree} - {edu.fieldOfStudy}
                        </div>
                        <div className="text-slate-600">
                          {edu.institution} ({edu.startDate} - {edu.endDate})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              VARIANT 4: EXECUTIVE_MODERN (Executive Dark/Accent Banner)
             ======================================================== */}
          {renderVariant === 'EXECUTIVE_MODERN' && (
            <div className="space-y-6 text-xs text-slate-900">
              {/* Executive Dark/Accent Header */}
              <div
                className="p-8 rounded-2xl text-white shadow-lg flex items-center justify-between gap-6 relative overflow-hidden"
                style={{ backgroundColor: activePalette.primaryColor }}
              >
                <div className="space-y-2 z-10">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white">
                    Executive Profile CV
                  </span>
                  <h1 className="text-3xl font-extrabold tracking-tight">{vault.personalInfo.fullName}</h1>
                  <p className="text-sm font-semibold opacity-90">{vault.personalInfo.title}</p>
                  <div className="text-xs opacity-80 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                    <span>✉️ {vault.personalInfo.email}</span>
                    <span>📞 {vault.personalInfo.phone}</span>
                    <span>📍 {vault.personalInfo.location}</span>
                  </div>
                </div>

                {/* Candidate Photo in Banner */}
                <div className="z-10 shrink-0">
                  <img
                    src={photoUrl}
                    alt={vault.personalInfo.fullName}
                    className={`w-28 h-28 object-cover ring-4 ring-white/30 shadow-2xl ${activePhotoShape.cssClass}`}
                  />
                </div>
              </div>

              {/* Executive Grid */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 space-y-6">
                  <div>
                    {renderSectionHeader('Podsumowanie Menedżerskie / Executive Summary')}
                    <p className="text-slate-800 text-xs text-justify leading-relaxed">{resume.summary}</p>
                  </div>

                  <div>
                    {renderSectionHeader('Historia Kariery i Osiągnięcia')}
                    <div className="space-y-4">
                      {vault.history.map((exp) => (
                        <div key={exp.id} className="space-y-1 border-l-2 pl-3" style={{ borderColor: activePalette.primaryColor }}>
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{exp.role}</span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                          <div className="font-semibold text-xs" style={{ color: activePalette.primaryColor }}>
                            {exp.company}
                          </div>
                          <ul className="list-disc list-inside text-slate-800 space-y-1 text-xs">
                            {getDeduplicatedExpHighlights(exp, resume).map((text, i) => (
                              <li key={i}>{text}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-4 space-y-6">
                  <div
                    className="p-4 rounded-xl border space-y-3"
                    style={{
                      backgroundColor: activePalette.primaryBg,
                      borderColor: activePalette.borderColor,
                    }}
                  >
                    <h3 className="font-bold text-xs uppercase text-slate-900">Ekspertyza Twarda</h3>
                    <div className="flex flex-wrap gap-1">
                      {resume.skillsMatched.hardSkills.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-white text-slate-800 text-[10px] font-bold border border-slate-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {vault.education.length > 0 && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <h3 className="font-bold text-xs uppercase text-slate-900">Edukacja</h3>
                      {vault.education.map((edu) => (
                        <div key={edu.id} className="text-xs">
                          <div className="font-bold text-slate-900">{edu.degree}</div>
                          <div className="text-slate-600 text-[11px]">{edu.institution}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PHOTO EDIT MODAL */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zarządzaj Zdjęciem Kandidata</h3>
            </div>

            {/* Current Photo Preview */}
            <div className="text-center space-y-2">
              <img src={photoUrl} alt="Preview" className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-indigo-600 shadow-md" />
              <p className="text-xs text-slate-500">Podgląd aktualnego zdjęcia w dokumentach</p>
            </div>

            {/* Upload File Option */}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <label className="block text-xs font-bold text-slate-700">1. Wgraj własny plik ze zdjęciem PNG/JPG:</label>
              <label className="flex items-center justify-center space-x-2 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Wybierz Plik ze Zdjęciem</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* URL Option */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <label className="block text-xs font-bold text-slate-700">2. LUB Wklej bezpośredni adres URL:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleApplyCustomUrl}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors"
                >
                  Zapisz URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
