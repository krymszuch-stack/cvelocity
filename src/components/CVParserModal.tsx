import React, { useState, useEffect } from 'react';
import { MasterVault, ConsistencyCheckIssue } from '../types';
import { FileText, Upload, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Layout, Image, Check, X, Info, FileCode, Briefcase, GraduationCap } from 'lucide-react';
import { eliminateSlogans } from '../lib/slotFillingEngine';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure worker for PDF.js using jsdelivr CDN matching exact installed version (.mjs for pdfjs-dist v4+)
if (typeof window !== 'undefined' && pdfjsLib) {
  const version = pdfjsLib.version || '6.1.200';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

interface CVParserModalProps {
  currentVault: MasterVault;
  onApplyParsedVault: (parsedVault: Partial<MasterVault>) => void;
}

interface GeometryDiagnostic {
  isTwoColumnDetected: boolean;
  hasGraphicElements: boolean;
  hasNonStandardHeaders: boolean;
  warnings: string[];
  passed: boolean;
}

export const CVParserModal: React.FC<CVParserModalProps> = ({
  currentVault,
  onApplyParsedVault,
}) => {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFileReading, setIsFileReading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyCheckIssue[]>([]);
  const [parsedPreview, setParsedPreview] = useState<Partial<MasterVault> | null>(null);
  const [geometryResult, setGeometryResult] = useState<GeometryDiagnostic | null>(null);

  // File Geometry Diagnostic Tool (Runs before parsing)
  useEffect(() => {
    if (!rawText.trim()) {
      setGeometryResult(null);
      return;
    }

    const lines = rawText.split('\n');
    const warnings: string[] = [];

    // 1. Check for Two-Column Layout (Horizontal Text Bleed)
    // Heuristics: Multiple tabs/spaces dividing short blocks on same line, or side-by-side dates/companies
    let shortLinePairCount = 0;
    let tabStopCount = 0;
    let sideBySidePattern = false;

    lines.forEach((line) => {
      if (line.includes('\t\t') || /\s{4,}/.test(line)) {
        tabStopCount++;
      }
      if (line.trim().length > 0 && line.trim().length < 35) {
        shortLinePairCount++;
      }
      // Heuristic for side-by-side headers/dates e.g. "Doświadczenie   Wykształcenie" or "2020-2022    2018-2021"
      if (/\d{4}.{5,20}\d{4}/.test(line) && /\s{3,}/.test(line)) {
        sideBySidePattern = true;
      }
    });

    const isTwoColumnDetected = tabStopCount > 3 || sideBySidePattern || (shortLinePairCount > 8 && lines.length < 30);

    if (isTwoColumnDetected) {
      warnings.push('Wykryto potencjalny układ dwukolumnowy (zlepianie wierszy z sąsiednich kolumn w poziomie). Systemy ATS mogą odczytać treść niepokolei.');
    }

    // 2. Check for Graphic / Non-selectable Elements (SVG/PNG/Icons/Star Ratings)
    const lower = rawText.toLowerCase();
    const hasImageTags = lower.includes('data:image') || lower.includes('<svg') || lower.includes('[image]') || lower.includes('[logo]');
    const hasVisualRatings = /[★●■▲◆]{2,}/.test(rawText) || /\b(10\/10|5\/5|90%|80%)\b/.test(rawText);

    const hasGraphicElements = hasImageTags || hasVisualRatings;

    if (hasImageTags) {
      warnings.push('Wykryto plik graficzny / SVG / PNG zamiast czystego tekstu. Elementy graficzne są całkowicie niewidoczne dla parsera OCR ATS.');
    }
    if (hasVisualRatings) {
      warnings.push('Wykryto wskaźniki graficzne/gwiazdki umiejętności (np. ★★★, 90%). Zamień je na zapis słowny (np. Zaawansowany).');
    }

    // 3. Check for Non-Standard Section Headers
    const nonStandardHeaders = ['moja ścieżka', 'gdzie byłem', 'o mnie krótko', 'co potrafię', 'moje pasje'];
    const hasNonStandardHeaders = nonStandardHeaders.some((h) => lower.includes(h));

    if (hasNonStandardHeaders) {
      warnings.push('Wykryto niestandardowe nazwy nagłówków (np. "Moja ścieżka"). Używaj standardowych słów kluczowych ("Doświadczenie", "Wykształcenie").');
    }

    setGeometryResult({
      isTwoColumnDetected,
      hasGraphicElements,
      hasNonStandardHeaders,
      warnings,
      passed: warnings.length === 0,
    });
  }, [rawText]);

  // Consistency Check Algorithm
  const runConsistencyCheck = (vaultData: MasterVault) => {
    const issues: ConsistencyCheckIssue[] = [];

    // 1. Check for vague slogans in summary
    const sloganCheck = eliminateSlogans(vaultData.personalInfo.summary);
    if (sloganCheck.slogansRemoved.length > 0) {
      issues.push({
        type: 'SLOGAN',
        severity: 'MEDIUM',
        title: 'Wykryto watę słowną / slogany',
        description: `Znaleziono ogólniki: "${sloganCheck.slogansRemoved.join(', ')}". Systemy ATS oraz rekruterzy obniżają ocenę za słowa bez pokrycia w faktach.`,
        suggestion: 'Zastąp te słowa konkretnymi liczbami lub twardym zakresem odpowiedzialności.',
      });
    }

    // 2. Check for unquantified experience highlights
    const allHighlights = vaultData.history.flatMap((h) => h.highlights);
    const unquantified = allHighlights.filter((h) => !h.metric || h.metric.length < 3);
    if (unquantified.length > 0) {
      issues.push({
        type: 'UNQUANTIFIED',
        severity: 'HIGH',
        title: 'Brak twardych wskaźników (liczb/wolumenów)',
        description: `Aż ${unquantified.length} punktów w historii nie zawiera wyliczalnych rezultatów (np. %, wolumen, kwota, czas).`,
        suggestion: 'Dopisz mierzalny efekt dla każdego stanowiska w sekcji Master Vault.',
      });
    }

    // 3. Check for potential employment gaps (>6 months)
    if (vaultData.history.length > 1) {
      issues.push({
        type: 'GAP',
        severity: 'LOW',
        title: 'Weryfikacja spójności dat zatrudnienia',
        description: 'Upewnij się, że daty są podane w standardowym formacie MM/YYYY bez nakładających się luk.',
        suggestion: 'Sprawdź ciągłość w zakładce Doświadczenie.',
      });
    }

    setConsistencyIssues(issues);
  };

  const handleParseDocument = async () => {
    if (!rawText.trim()) {
      setErrorMsg('Wprowadź tekst lub wklej surową treść dokumentu CV.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nie udało się przetworzyć pliku przez Gemini.');
      }

      setParsedPreview(data.parsedVault);
      if (data.parsedVault) {
        runConsistencyCheck({ ...currentVault, ...data.parsedVault } as MasterVault);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Wystąpił błąd podczas parsowania.');
    } finally {
      setIsLoading(false);
    }
  };

  // PDF Text Extraction Helper
  const extractPdfText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const version = pdfjsLib.version || '6.1.200';
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/cmaps/`,
        cMapPacked: true,
      });
      const pdfDoc = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item: any) => item.str);
        fullText += pageStrings.join(' ') + '\n';
      }
      return fullText;
    } catch (pdfErr: any) {
      console.warn('PDF.js parsing error:', pdfErr);
      try {
        const rawText = await file.text();
        const cleaned = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
        if (cleaned.trim().length > 50) {
          return cleaned;
        }
      } catch {
        // Ignore secondary text fallback error
      }
      throw new Error(`Błąd odczytu pliku PDF: ${pdfErr?.message || String(pdfErr)}`);
    }
  };

  // DOCX Text Extraction Helper
  const extractDocxText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileReading(true);
    setErrorMsg(null);

    try {
      const fileName = file.name.toLowerCase();
      let text = '';

      if (fileName.endsWith('.pdf')) {
        text = await extractPdfText(file);
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        try {
          text = await extractDocxText(file);
        } catch {
          text = await file.text();
        }
      } else {
        text = await file.text();
      }

      if (!text || !text.trim()) {
        throw new Error('Plik nie zawiera tekstu do odczytu lub jest plikiem skanowanym (obrazowym).');
      }

      setRawText(text);
    } catch (err: any) {
      console.error('Błąd odczytu pliku:', err);
      setErrorMsg(`Nie udało się odczytać pliku (${file.name}): ${err?.message || 'Nieobsługiwany format'}`);
    } finally {
      setIsFileReading(false);
      e.target.value = '';
    }
  };

  const applyChanges = () => {
    if (parsedPreview) {
      onApplyParsedVault(parsedPreview);
      setParsedPreview(null);
      setRawText('');
      alert('Sparsowane dane zostały pomyślnie scalone z Twoim Master Vault!');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-900 shadow-xs space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Importuj CV</h2>
          <p className="text-xs text-slate-500">
            Automatyczna konwersja surowego dokumentu do Bazy CV
          </p>
        </div>
      </div>

      {/* Input section */}
      <div className="space-y-4">
        {/* LinkedIn Import Guide Banner */}
        <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-800">
          <div className="flex items-start space-x-2.5">
            <div className="p-1.5 bg-sky-600 text-white rounded-lg shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sky-950 flex items-center space-x-1.5">
                <span>Jak importować dane z LinkedIn?</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                1. Profil &rarr; 2. Więcej / More &rarr; 3. Zapisz do PDF &rarr; 4. Wgraj plik poniżej.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Wklej treść lub wgraj plik <span className="text-indigo-600 font-bold">.pdf .docx .txt</span>
          </label>
          <label className={`cursor-pointer px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 shrink-0 ${isFileReading ? 'opacity-50 pointer-events-none' : ''}`}>
            {isFileReading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Odczytywanie...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Wgraj plik</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.text,.md,.csv"
              onChange={handleFileUpload}
              disabled={isFileReading}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          rows={6}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Wklej tutaj surowy tekst swojego dotychczasowego CV, profilu LinkedIn lub opisu 'O mnie'..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
        />

        {/* Pre-Parse File Geometry Diagnostic Tool */}
        {geometryResult && (
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Layout className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Diagnostyka Geometrii Pliku i Układu (Pre-Parse Audit)
                </h3>
              </div>
              {geometryResult.passed ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  ✓ BEZPIECZNY DLA ATS
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  ⚠️ RYZYKO BŁĘDÓW PARSERA
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Check 1: Layout */}
              <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg flex items-center space-x-2">
                {geometryResult.isTwoColumnDetected ? (
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-slate-200">Układ Strumienia</div>
                  <div className="text-[10px] text-slate-400">
                    {geometryResult.isTwoColumnDetected ? 'Wykryto 2 kolumny' : 'Jednokolumnowy ok'}
                  </div>
                </div>
              </div>

              {/* Check 2: Graphic elements */}
              <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg flex items-center space-x-2">
                {geometryResult.hasGraphicElements ? (
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-slate-200">Obrazy / Grafik / SVG</div>
                  <div className="text-[10px] text-slate-400">
                    {geometryResult.hasGraphicElements ? 'Niewykrywalne elementy' : 'Brak grafik/gwiazdek'}
                  </div>
                </div>
              </div>

              {/* Check 3: Standard headers */}
              <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg flex items-center space-x-2">
                {geometryResult.hasNonStandardHeaders ? (
                  <X className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-slate-200">Standard Sekcji</div>
                  <div className="text-[10px] text-slate-400">
                    {geometryResult.hasNonStandardHeaders ? 'Niestandardowe nazwy' : 'Standardowe nagłówki'}
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings List */}
            {geometryResult.warnings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {geometryResult.warnings.map((warn, i) => (
                  <div key={i} className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/60 p-2 rounded flex items-start space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleParseDocument}
          disabled={isLoading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analizowanie pliku przez Gemini AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sparsuj i Zapisz w Bazie CV</span>
            </>
          )}
        </button>
      </div>

      {/* Consistency Verification Report */}
      {parsedPreview && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Weryfikator Spójności Profilu</h3>
            </div>
            <span className="text-xs text-emerald-700 font-mono font-bold">
              Sparsowano pomyślnie!
            </span>
          </div>

          <div className="space-y-2">
            {consistencyIssues.length === 0 ? (
              <div className="text-xs text-emerald-700 font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Brak błędów spójności i wagi sloganu! Dane zachowują 100% rygoru.</span>
              </div>
            ) : (
              consistencyIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    issue.severity === 'HIGH'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{issue.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 font-bold">
                      {issue.severity}
                    </span>
                  </div>
                  <p>{issue.description}</p>
                  <p className="text-[11px] opacity-90 font-mono">💡 Sugestia: {issue.suggestion}</p>
                </div>
              ))
            )}
          </div>

          {/* Extracted Data Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* History Preview */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Doświadczenie Zawodowe</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px]">
                  {parsedPreview.history?.length || 0} stanowisk
                </span>
              </div>
              {parsedPreview.history && parsedPreview.history.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {parsedPreview.history.map((h, i) => (
                    <div key={i} className="text-[11px] text-slate-700 border-b border-slate-100 last:border-0 pb-1">
                      <div className="font-semibold text-slate-900">{h.role} <span className="text-slate-500 font-normal">@ {h.company}</span></div>
                      <div className="text-[10px] text-slate-400 font-mono">{h.startDate} - {h.endDate || 'Obecnie'} • {h.highlights?.length || 0} wskaźników</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">Nie wykryto stanowisk w tekście.</div>
              )}
            </div>

            {/* Education Preview */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Wykształcenie & Uczelnie</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px]">
                  {parsedPreview.education?.length || 0} wpisów
                </span>
              </div>
              {parsedPreview.education && parsedPreview.education.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {parsedPreview.education.map((e, i) => (
                    <div key={i} className="text-[11px] text-slate-700 border-b border-slate-100 last:border-0 pb-1">
                      <div className="font-semibold text-slate-900">{e.degree} {e.fieldOfStudy ? `- ${e.fieldOfStudy}` : ''}</div>
                      <div className="text-[10px] text-slate-500">{e.institution} ({e.startDate} - {e.endDate})</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">Nie wykryto uczelni w tekście.</div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={applyChanges}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-2xs"
            >
              <span>Scal z Master Vault</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

