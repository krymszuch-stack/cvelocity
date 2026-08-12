import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';
import { MasterVault, ConsistencyCheckIssue } from '../types';
import { FileText, Upload, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Layout, Image, Check, X, Info, FileCode, Briefcase, GraduationCap, Lightbulb } from 'lucide-react';
import { eliminateSlogans } from '../lib/slotFillingEngine';
import { StatusBadge } from './ui/StatusBadge';
import { extractTextFromAnyFile } from '../lib/cvUniversalParser';

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
      const res = await apiFetch('/api/parse-cv', {
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



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileReading(true);
    setErrorMsg(null);

    try {
      const { text, format } = await extractTextFromAnyFile(file);

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
    <div className="bg-surface border border-line rounded-xl p-6 text-ink shadow-xs space-y-6">
      <div className="flex items-center space-x-3 border-b border-line pb-4">
        <div className="p-2.5 bg-brand-soft border border-brand-300 rounded-xl text-brand-fg">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-ink">Importuj CV</h2>
          <p className="text-xs text-muted">
            Automatyczna konwersja surowego dokumentu do Bazy CV
          </p>
        </div>
      </div>

      {/* Input section */}
      <div className="space-y-4">
        {/* LinkedIn Import Guide Banner */}
        <div className="p-3.5 bg-brand-soft border border-brand-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink">
          <div className="flex items-start space-x-2.5">
            <div className="p-1.5 bg-brand-600 text-white rounded-lg shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-brand-fg flex items-center space-x-1.5">
                <span>Jak importować dane z LinkedIn?</span>
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                1. Profil &rarr; 2. Więcej / More &rarr; 3. Zapisz do PDF &rarr; 4. Wgraj plik poniżej.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-muted">
            Wklej treść lub wgraj plik <span className="text-brand-fg font-bold">.pdf .docx .rtf .txt .json .csv</span>
          </label>
          <label className={`cursor-pointer px-3.5 py-2 rounded-xl border border-brand-300 bg-brand-soft hover:bg-brand-soft/80 text-brand-fg font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 shrink-0 ${isFileReading ? 'opacity-50 pointer-events-none' : ''}`}>
            {isFileReading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Odczytywanie...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-brand-fg" />
                <span>Wybierz Plik (PDF/DOCX/RTF/JSON)</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.rtf,.txt,.text,.md,.csv,.json"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        <textarea
          rows={6}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Wklej tutaj surowy tekst swojego dotychczasowego CV, profilu LinkedIn lub opisu 'O mnie'..."
          className="w-full bg-sunken border border-line rounded-xl p-4 text-xs font-mono text-ink focus:outline-none focus:border-brand-500 focus:bg-surface"
        />

        {/* Pre-Parse File Geometry Diagnostic Tool */}
        {geometryResult && (
          <div className="bg-sunken border border-line text-ink rounded-xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center space-x-2">
                <Layout className="w-4 h-4 text-brand-fg" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Diagnostyka Geometrii Pliku i Układu (Pre-Parse Audit)
                </h3>
              </div>
              <StatusBadge variant={geometryResult.passed ? 'success' : 'warning'} className="text-[10px]">
                {geometryResult.passed ? 'BEZPIECZNY DLA ATS' : 'RYZYKO BŁĘDÓW PARSERA'}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Check 1: Layout */}
              <div className="bg-surface border border-line p-2.5 rounded-lg flex items-center space-x-2">
                {geometryResult.isTwoColumnDetected ? (
                  <X className="w-4 h-4 text-danger-fg shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-success-fg shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-ink">Układ Strumienia</div>
                  <div className="text-[10px] text-muted">
                    {geometryResult.isTwoColumnDetected ? 'Wykryto 2 kolumny' : 'Jednokolumnowy ok'}
                  </div>
                </div>
              </div>

              {/* Check 2: Graphic elements */}
              <div className="bg-surface border border-line p-2.5 rounded-lg flex items-center space-x-2">
                {geometryResult.hasGraphicElements ? (
                  <X className="w-4 h-4 text-danger-fg shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-success-fg shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-ink">Obrazy / Grafik / SVG</div>
                  <div className="text-[10px] text-muted">
                    {geometryResult.hasGraphicElements ? 'Niewykrywalne elementy' : 'Brak grafik/gwiazdek'}
                  </div>
                </div>
              </div>

              {/* Check 3: Standard headers */}
              <div className="bg-surface border border-line p-2.5 rounded-lg flex items-center space-x-2">
                {geometryResult.hasNonStandardHeaders ? (
                  <X className="w-4 h-4 text-warning-fg shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-success-fg shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-ink">Standard Sekcji</div>
                  <div className="text-[10px] text-muted">
                    {geometryResult.hasNonStandardHeaders ? 'Niestandardowe nazwy' : 'Standardowe nagłówki'}
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings List */}
            {geometryResult.warnings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {geometryResult.warnings.map((warn, i) => (
                  <div key={i} className="text-[11px] text-warning-fg bg-warning-soft border border-warning-500/30 p-2 rounded flex items-start space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning-fg shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="bg-danger-soft border border-danger-500/30 text-danger-fg text-xs p-3 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleParseDocument}
          disabled={isLoading}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-2xs disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analizowanie pliku przez Gemini AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-warning-fg" />
              <span>Sparsuj i Zapisz w Bazie CV</span>
            </>
          )}
        </button>
      </div>

      {/* Consistency Verification Report */}
      {parsedPreview && (
        <div className="bg-sunken border border-line rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-warning-fg" />
              <h3 className="text-sm font-bold text-ink">Weryfikator Spójności Profilu</h3>
            </div>
            <span className="text-xs text-success-fg font-mono font-bold">
              Sparsowano pomyślnie!
            </span>
          </div>

          <div className="space-y-2">
            {consistencyIssues.length === 0 ? (
              <div className="text-xs text-success-fg font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Brak błędów spójności i wagi sloganu! Dane zachowują 100% rygoru.</span>
              </div>
            ) : (
              consistencyIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    issue.severity === 'HIGH'
                      ? 'bg-danger-soft border-danger-500/30 text-danger-fg'
                      : 'bg-warning-soft border-warning-500/30 text-warning-fg'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{issue.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-line font-bold text-ink">
                      {issue.severity}
                    </span>
                  </div>
                  <p>{issue.description}</p>
                  <p className="text-[11px] opacity-90 font-mono flex items-start gap-1">
                    <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>Sugestia: {issue.suggestion}</span>
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Extracted Data Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* History Preview */}
            <div className="bg-surface border border-line rounded-lg p-3 space-y-2 text-xs">
              <div className="font-bold text-ink flex items-center justify-between border-b border-line pb-1.5">
                <span className="flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-brand-fg" />
                  <span>Doświadczenie Zawodowe</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-brand-soft text-brand-fg font-mono font-bold text-[10px] sv-tnum">
                  {parsedPreview.history?.length || 0} stanowisk
                </span>
              </div>
              {parsedPreview.history && parsedPreview.history.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {parsedPreview.history.map((h, i) => (
                    <div key={i} className="text-[11px] text-muted border-b border-line last:border-0 pb-1">
                      <div className="font-semibold text-ink">{h.role} <span className="text-muted font-normal">@ {h.company}</span></div>
                      <div className="text-[10px] text-subtle font-mono sv-tnum">{h.startDate} - {h.endDate || 'Obecnie'} • {h.highlights?.length || 0} wskaźników</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-subtle italic">Nie wykryto stanowisk w tekście.</div>
              )}
            </div>

            {/* Education Preview */}
            <div className="bg-surface border border-line rounded-lg p-3 space-y-2 text-xs">
              <div className="font-bold text-ink flex items-center justify-between border-b border-line pb-1.5">
                <span className="flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-success-fg" />
                  <span>Wykształcenie & Uczelnie</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-success-soft text-success-fg font-mono font-bold text-[10px] sv-tnum">
                  {parsedPreview.education?.length || 0} wpisów
                </span>
              </div>
              {parsedPreview.education && parsedPreview.education.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {parsedPreview.education.map((e, i) => (
                    <div key={i} className="text-[11px] text-muted border-b border-line last:border-0 pb-1">
                      <div className="font-semibold text-ink">{e.degree} {e.fieldOfStudy ? `- ${e.fieldOfStudy}` : ''}</div>
                      <div className="text-[10px] text-subtle sv-tnum">{e.institution} ({e.startDate} - {e.endDate})</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-subtle italic">Nie wykryto uczelni w tekście.</div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={applyChanges}
              className="px-5 py-2.5 bg-success-600 hover:bg-success-700 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-2xs"
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


