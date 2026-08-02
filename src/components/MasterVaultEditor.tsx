import React, { useState, useEffect } from 'react';
import { MasterVault, WorkExperience, HighlightMetric, Certification, Education, Project } from '../types';
import {
  Database,
  User,
  Wrench,
  Briefcase,
  Lock,
  Download,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  Save,
  CheckCircle,
  Sparkles,
  Linkedin,
  GitMerge,
  RefreshCw,
  Check,
  X,
  Award,
  GraduationCap,
  FolderGit2,
  Globe,
  AlertTriangle,
  Info,
  Upload,
  FileText,
  Puzzle,
  Map,
  Zap,
  Brain,
  ScrollText,
  Factory,
  Settings2,
  BarChart3,
  Phone,
  Code2,
  Languages,
  CheckCircle2,
  Handshake,
  Calculator,
  HardHat,
  Truck,
  Stethoscope,
} from 'lucide-react';
import { AdvisorButton } from './ui/AdvisorButton';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure worker for PDF.js using jsdelivr CDN matching exact installed version (.mjs for pdfjs-dist v4+)
if (typeof window !== 'undefined' && pdfjsLib) {
  const version = pdfjsLib.version || '6.1.200';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}
import { encryptVault, saveVaultToLocalStorage } from '../lib/vaultCrypto';
import { AutocompleteInput } from './AutocompleteInput';
import {
  SPECIALIZATION_CATEGORIES,
  DOMAIN_SPECIALIZATIONS,
  searchSpecializations,
  SpecializationRole,
  DomainCategory,
} from '../data/specializations';
import {
  SUGGESTED_LOCATIONS,
  SUGGESTED_JOB_TITLES,
  SUGGESTED_HARD_SKILLS,
  SUGGESTED_SOFT_SKILLS,
  SUGGESTED_TOOLS_AND_TECH,
} from '../lib/autocompleteSuggestions';
import {
  ThoroughLinkedInProfile,
  parseComprehensiveLinkedInProfile,
  mergeLinkedInIntoVault,
  overwriteVaultWithLinkedIn,
} from '../lib/linkedinParser';

interface MasterVaultEditorProps {
  vault: MasterVault;
  onChange: (updatedVault: MasterVault) => void;
  onOpenAdvisor?: (question?: string) => void;
}

export const MasterVaultEditor: React.FC<MasterVaultEditorProps> = ({ vault, onChange, onOpenAdvisor }) => {
  const [activeSubTab, setActiveSubTab] = useState<'quiz' | 'info' | 'skills' | 'history' | 'edu' | 'security'>('quiz');
  const [quizStep, setQuizStep] = useState<number>(1);
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [aiAuditResults, setAiAuditResults] = useState<{ score: number; suggestions: string[]; issues: string[] } | null>(null);
  const [passkey, setPasskey] = useState('');
  const [isSavedEncrypted, setIsSavedEncrypted] = useState(false);
  const [newSkillText, setNewSkillText] = useState({ hard: '', soft: '', tool: '' });
  const [specSearchQuery, setSpecSearchQuery] = useState('');
  const [selectedSpecCategory, setSelectedSpecCategory] = useState<string>('all');

  // Progressive Mind Map drill-down state (Domain -> SubCategory -> Role -> Terminology Mind Map)
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Toggle individual professional term into skills/tools (0 API tokens)
  const toggleProfessionalTerm = (term: string, categoryType: 'licenses' | 'brands_tools' | 'terminology_skills' | 'metrics') => {
    let targetField: 'hardSkills' | 'softSkills' | 'toolsAndTech' = 'hardSkills';
    if (categoryType === 'brands_tools') targetField = 'toolsAndTech';
    
    const existingList = draftVault.skillsMatrix?.[targetField] || [];
    const exists = existingList.some((s) => s.toLowerCase() === term.toLowerCase());

    if (exists) {
      removeSkill(targetField, term);
    } else {
      addSkill(targetField, term);
    }
  };

  // Living organism local draft state & dirty tracking
  const [draftVault, setDraftVault] = useState<MasterVault>(vault);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Apply specialization template from knowledge base (0 API tokens used)
  const applySpecializationTemplate = (role: SpecializationRole) => {
    const existingHard = draftVault.skillsMatrix?.hardSkills || [];
    const existingSoft = draftVault.skillsMatrix?.softSkills || [];
    const existingTools = draftVault.skillsMatrix?.toolsAndTech || [];

    const newHard = Array.from(new Set([...existingHard, ...role.suggestedHardSkills]));
    const newSoft = Array.from(new Set([...existingSoft, ...role.suggestedSoftSkills]));
    const newTools = Array.from(new Set([...existingTools, ...role.suggestedTools]));

    let newHistory = [...(draftVault.history || [])];
    if (role.sampleCompany) {
      const exists = newHistory.some((h) => h.company === role.sampleCompany);
      if (!exists) {
        newHistory = [
          {
            id: 'exp_' + Date.now(),
            company: role.sampleCompany,
            role: role.title,
            location: 'Kraków',
            startDate: role.samplePeriod?.start || '2023',
            endDate: role.samplePeriod?.end || '2024',
            isCurrent: false,
            highlights: (role.sampleMetrics || []).map((m, idx) => ({
              id: 'm_' + Date.now() + '_' + idx,
              text: m,
              action: 'Obsługa / Realizacja',
              target: 'Standardy jakości',
              tool: 'Systemy dedykowane',
              metric: m,
              keywords: ['SLA', 'Kwalifikacje'],
            })),
          },
          ...newHistory,
        ];
      }
    }

    updateDraft({
      ...draftVault,
      personalInfo: {
        ...draftVault.personalInfo,
        title: draftVault.personalInfo.title || role.title,
      },
      skillsMatrix: {
        ...draftVault.skillsMatrix,
        hardSkills: newHard,
        softSkills: newSoft,
        toolsAndTech: newTools,
      },
      history: newHistory,
      updatedAt: new Date().toISOString(),
    });
  };

  // Clear Helpers
  const clearPersonalInfoField = (field: string) => {
    updateDraft({
      ...draftVault,
      personalInfo: { ...draftVault.personalInfo, [field]: '' },
      updatedAt: new Date().toISOString(),
    });
  };

  const clearSkillsCategory = (type: 'hardSkills' | 'softSkills' | 'toolsAndTech') => {
    updateDraft({
      ...draftVault,
      skillsMatrix: {
        ...draftVault.skillsMatrix,
        [type]: [],
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const clearAllSkills = () => {
    updateDraft({
      ...draftVault,
      skillsMatrix: {
        ...draftVault.skillsMatrix,
        hardSkills: [],
        softSkills: [],
        toolsAndTech: [],
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const clearAllHistory = () => {
    updateDraft({
      ...draftVault,
      history: [],
      updatedAt: new Date().toISOString(),
    });
  };

  const clearAllEducation = () => {
    updateDraft({
      ...draftVault,
      education: [],
      skillsMatrix: {
        ...draftVault.skillsMatrix,
        certifications: [],
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Smart Recommended Job Roles Engine
  const recommendedJobRoles = React.useMemo(() => {
    const allSkills = [
      ...(draftVault.skillsMatrix?.hardSkills || []),
      ...(draftVault.skillsMatrix?.softSkills || []),
      ...(draftVault.skillsMatrix?.toolsAndTech || []),
    ].map((s) => s.toLowerCase());

    const historyRoles = (draftVault.history || [])
      .map((h) => (h.role || '') + ' ' + (h.company || ''))
      .join(' ')
      .toLowerCase();

    const recs = [
      {
        role: 'Specjalista ds. Obsługi Klienta & Contact Center',
        matchScore: allSkills.some((s) => s.includes('klient') || s.includes('obsług') || s.includes('deeskalacj')) || historyRoles.includes('bank') ? 95 : 70,
        description: 'Doskonałe dopasowanie pod reżim procedur bankowych, obsługę zapytania klienta i deeskalację problemów.',
      },
      {
        role: 'Koordynator Zgłoszeń i Procedur SLA',
        matchScore: allSkills.some((s) => s.includes('sla') || s.includes('zgłosze') || s.includes('jira') || s.includes('ticket')) || historyRoles.includes('koordynator') ? 92 : 65,
        description: 'Dopasowanie pod międzydziałową rejestrację i eskalację zgłoszeń ze ścisłym SLA.',
      },
      {
        role: 'Junior / Mid Full-Stack Developer (React & TypeScript)',
        matchScore: allSkills.some((s) => s.includes('react') || s.includes('typescript') || s.includes('node') || s.includes('sql')) ? 90 : 60,
        description: 'Mocny profil w nowoczesnych technologiach webowych React 19, TypeScript oraz Tailwind CSS.',
      },
      {
        role: 'Wsparcie Techniczne IT / Helpdesk (E.12, E.13, OS)',
        matchScore: allSkills.some((s) => s.includes('os') || s.includes('sprzęt') || s.includes('sieci') || s.includes('e.12') || s.includes('helpdesk')) || historyRoles.includes('techniczn') ? 88 : 65,
        description: 'Serwis peryferii, diagnostyka systemowa oraz obsługa powtarzalnych zgłoszeń technicznych.',
      },
    ];

    return recs.sort((a, b) => b.matchScore - a.matchScore);
  }, [draftVault]);

  // AI Verification Audit
  const runAiProfileAudit = () => {
    setIsAiAuditing(true);
    setTimeout(() => {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      if (!draftVault.personalInfo.fullName || draftVault.personalInfo.fullName.length < 3) {
        issues.push('Uzupełnij Imię i Nazwisko');
        score -= 20;
      }
      if (!draftVault.personalInfo.email || !draftVault.personalInfo.email.includes('@')) {
        issues.push('Nieprawidłowy lub brakujący adres e-mail');
        score -= 20;
      }
      if (!draftVault.personalInfo.phone) {
        suggestions.push('Dodaj numer telefonu (np. +48 123 456 789) dla rekrutera');
        score -= 5;
      }
      if (!draftVault.personalInfo.summary || draftVault.personalInfo.summary.length < 25) {
        issues.push('Zbyt krótkie podsumowanie zawodowe (poniżej 25 znaków)');
        score -= 15;
      }
      if ((draftVault.skillsMatrix.hardSkills.length || 0) < 3) {
        issues.push('Mniej niż 3 umiejętności twarde w profilu');
        score -= 15;
      }
      if ((draftVault.history.length || 0) === 0) {
        issues.push('Brak wpisanej historii pracy');
        score -= 20;
      } else {
        const hasMetrics = draftVault.history.some((h) => h.highlights && h.highlights.some((hl) => /\d+/.test(hl.metric || hl.text || '')));
        if (!hasMetrics) {
          suggestions.push('Warto dodać przynajmniej jeden mierzalny wskaźnik % lub liczbowy (np. Jakość 4.40/5.00 lub obsługa SLA)');
        }
      }

      setAiAuditResults({
        score: Math.max(10, score),
        issues,
        suggestions,
      });
      setIsAiAuditing(false);
    }, 500);
  };

  // Calculate profile completeness score for gamified/friendly UX
  const completenessScore = React.useMemo(() => {
    let score = 0;
    if (draftVault?.personalInfo?.fullName) score += 15;
    if (draftVault?.personalInfo?.email) score += 10;
    if (draftVault?.personalInfo?.summary && draftVault.personalInfo.summary.length > 20) score += 15;
    if ((draftVault?.skillsMatrix?.hardSkills?.length || 0) >= 3) score += 20;
    if ((draftVault?.history?.length || 0) >= 1) score += 25;
    if ((draftVault?.education?.length || 0) >= 1) score += 15;
    return Math.min(100, score);
  }, [draftVault]);

  // LinkedIn Detection & Balance Engine state
  const [linkedInSuggestions, setLinkedInSuggestions] = useState<ThoroughLinkedInProfile | null>(null);
  const [processedLinkedInUrl, setProcessedLinkedInUrl] = useState<string>('');
  const [linkedInToast, setLinkedInToast] = useState<string | null>(null);

  // LinkedIn AI Text Paster Modal State
  const [isLinkedInPasterOpen, setIsLinkedInPasterOpen] = useState(false);
  const [pasterText, setPasterText] = useState('');
  const [isParsingPaster, setIsParsingPaster] = useState(false);
  const [pasterParsedData, setPasterParsedData] = useState<Partial<MasterVault> | null>(null);
  const [pasterError, setPasterError] = useState<string | null>(null);

  // Sync draft whenever parent vault prop changes externally
  useEffect(() => {
    setDraftVault(vault);
    setIsDirty(false);
  }, [vault]);

  // Helper to trigger draft updates
  const updateDraft = (newVault: MasterVault) => {
    setDraftVault(newVault);
    setIsDirty(true);
  };

  // Explicit Save Action
  const handleSaveChanges = () => {
    const updated = {
      ...draftVault,
      updatedAt: new Date().toISOString(),
    };
    onChange(updated);
    setDraftVault(updated);
    setIsDirty(false);
    setSaveSuccessMsg('MasterVault zaktualizowany! Wszystkie zmiany zostały zapisane pomyślnie.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Detect LinkedIn URL input and update personalInfo.linkedin cleanly without generating mock/random skills
  const handleLinkedInChange = (urlValue: string) => {
    updatePersonalInfo('linkedin', urlValue);
    setProcessedLinkedInUrl(urlValue);
    setLinkedInSuggestions(null);
  };

  // Scrape LinkedIn URL directly via Server Proxy + Gemini AI Extraction
  const handleTryScrapeLinkedInUrl = async () => {
    const url = draftVault.personalInfo.linkedin;
    if (!url || !url.startsWith('http')) {
      setPasterError('Najpierw wpisz prawidłowy adres URL profilu LinkedIn (np. https://linkedin.com/in/jan-kowalski).');
      setIsLinkedInPasterOpen(true);
      return;
    }

    setIsParsingPaster(true);
    setPasterError(null);
    setPasterParsedData(null);
    setIsLinkedInPasterOpen(true);

    try {
      const response = await fetch('/api/fetch-jd-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.rawJdText && resData.rawJdText.length > 30) {
        // Send fetched real text to Gemini AI for structural extraction
        const parseRes = await fetch('/api/parse-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: resData.rawJdText }),
        });

        const parseData = await parseRes.json();
        const extractedResult = parseData.data || parseData.parsedVault;
        if (parseRes.ok && parseData.success && extractedResult) {
          setPasterParsedData(extractedResult);
        } else {
          throw new Error('Nie udało się wyekstrahować struktury z pobranego tekstu strony.');
        }
      } else {
        if (response.status === 403 || resData.is403Blocked || (resData.error && resData.error.includes('403'))) {
          setPasterError(
            'Portal LinkedIn wymaga zalogowania konta i zablokował bezpośredni odczyt adresu URL. Aby natychmiast zaimportować bezbłędne dane: skopiuj treść swojego profilu z LinkedIn (Ctrl+A / Ctrl+C) i wklej w polu poniżej — Gemini AI bezbłędnie wyodrębni Twoją historię pracy, wykształcenie i umiejętności!'
          );
        } else {
          throw new Error(resData.error || 'Nie udało się pobrać treści z podanego adresu URL.');
        }
      }
    } catch (err: any) {
      setPasterError(
        `${err.message || 'Błąd odczytu URL.'} Wklej treść swojego profilu bezpośrednio w polu poniżej — nasz model AI wyekstrahuje z niej 100% Twoich rzeczywistych danych.`
      );
    } finally {
      setIsParsingPaster(false);
    }
  };

  // Update Personal Info
  const updatePersonalInfo = (field: string, value: string) => {
    updateDraft({
      ...draftVault,
      personalInfo: { ...draftVault.personalInfo, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  // Skill Adding
  const addSkill = (type: 'hardSkills' | 'softSkills' | 'toolsAndTech', value: string) => {
    if (!value.trim()) return;
    const current = draftVault.skillsMatrix[type];
    if (!current.includes(value.trim())) {
      updateDraft({
        ...draftVault,
        skillsMatrix: { ...draftVault.skillsMatrix, [type]: [...current, value.trim()] },
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const removeSkill = (type: 'hardSkills' | 'softSkills' | 'toolsAndTech', skillToRemove: string) => {
    updateDraft({
      ...draftVault,
      skillsMatrix: {
        ...draftVault.skillsMatrix,
        [type]: draftVault.skillsMatrix[type].filter((s) => s !== skillToRemove),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Certifications
  const addCertification = () => {
    const newCert: Certification = {
      id: 'cert_' + Date.now(),
      name: 'Nowy Certyfikat Zawodowy',
      issuer: 'Instytucja / Organizacja',
      date: new Date().toISOString().slice(0, 7),
    };
    updateDraft({
      ...draftVault,
      skillsMatrix: {
        ...draftVault.skillsMatrix,
        certifications: [...draftVault.skillsMatrix.certifications, newCert],
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const removeCertification = (certId: string) => {
    updateDraft({
      ...draftVault,
      skillsMatrix: {
        ...draftVault.skillsMatrix,
        certifications: draftVault.skillsMatrix.certifications.filter((c) => c.id !== certId),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Work Experience
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: 'exp_' + Date.now(),
      company: 'Nowa Firma / Projekt',
      role: 'Stanowisko / Rola',
      location: 'Miasto',
      startDate: '01/2023',
      endDate: 'Obecnie',
      isCurrent: true,
      highlights: [
        {
          id: 'h_' + Date.now(),
          text: 'Zoptymalizowałem zapytania i architekturę danych, zwiększając wydajność o 30%.',
          action: 'Zoptymalizowałem',
          target: 'zapytania i architekturę danych',
          tool: 'SQL, Python',
          metric: 'zwiększenie wydajności o 30%',
          keywords: ['SQL', 'Optimization', 'Performance'],
        },
      ],
    };
    updateDraft({
      ...draftVault,
      history: [newExp, ...draftVault.history],
      updatedAt: new Date().toISOString(),
    });
  };

  const updateExperience = (expId: string, field: string, value: any) => {
    const updatedHistory = draftVault.history.map((exp) =>
      exp.id === expId ? { ...exp, [field]: value } : exp
    );
    updateDraft({ ...draftVault, history: updatedHistory, updatedAt: new Date().toISOString() });
  };

  const addHighlight = (expId: string) => {
    const newHighlight: HighlightMetric = {
      id: 'h_' + Date.now(),
      text: 'Wdrożyłem nową funkcjonalność przy użyciu nowoczesnych narzędzi.',
      action: 'Wdrożyłem',
      target: 'nową funkcjonalność',
      tool: 'Nowoczesny stos technologiczny',
      metric: 'skrócenie czasu wdrażania o 25%',
      keywords: ['Wdrożenie', 'Procesy'],
    };

    const updatedHistory = draftVault.history.map((exp) =>
      exp.id === expId
        ? { ...exp, highlights: [...exp.highlights, newHighlight] }
        : exp
    );
    updateDraft({ ...draftVault, history: updatedHistory, updatedAt: new Date().toISOString() });
  };

  const updateHighlight = (expId: string, hId: string, field: string, value: string) => {
    const updatedHistory = draftVault.history.map((exp) => {
      if (exp.id !== expId) return exp;
      const updatedHighlights = exp.highlights.map((h) =>
        h.id === hId ? { ...h, [field]: value } : h
      );
      return { ...exp, highlights: updatedHighlights };
    });
    updateDraft({ ...draftVault, history: updatedHistory, updatedAt: new Date().toISOString() });
  };

  const removeHighlight = (expId: string, hId: string) => {
    const updatedHistory = draftVault.history.map((exp) => {
      if (exp.id !== expId) return exp;
      return { ...exp, highlights: exp.highlights.filter((h) => h.id !== hId) };
    });
    updateDraft({ ...draftVault, history: updatedHistory, updatedAt: new Date().toISOString() });
  };

  const removeExperience = (expId: string) => {
    updateDraft({
      ...draftVault,
      history: draftVault.history.filter((exp) => exp.id !== expId),
      updatedAt: new Date().toISOString(),
    });
  };

  // Education Helpers
  const addEducation = () => {
    const newEdu: Education = {
      id: 'edu_' + Date.now(),
      institution: 'Nazwa Uczelni / Szkoły',
      degree: 'Magister Inżynier / Licencjat / Inżynier',
      fieldOfStudy: 'Kierunek / Specjalizacja',
      startDate: '2018',
      endDate: '2022',
      description: 'Opis specjalizacji lub osiągnięć akademickich.',
    };
    updateDraft({
      ...draftVault,
      education: [newEdu, ...draftVault.education],
      updatedAt: new Date().toISOString(),
    });
  };

  const updateEducation = (eduId: string, field: keyof Education, value: string) => {
    const updatedEdu = draftVault.education.map((e) =>
      e.id === eduId ? { ...e, [field]: value } : e
    );
    updateDraft({ ...draftVault, education: updatedEdu, updatedAt: new Date().toISOString() });
  };

  const removeEducation = (eduId: string) => {
    updateDraft({
      ...draftVault,
      education: draftVault.education.filter((e) => e.id !== eduId),
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to read PDF text in MasterVaultEditor
  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/cmaps/',
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
  };

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPaster(true);
    setPasterError(null);
    setPasterParsedData(null);

    try {
      const fileName = file.name.toLowerCase();
      let extracted = '';
      if (fileName.endsWith('.pdf')) {
        extracted = await extractPdfText(file);
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        extracted = res.value || '';
      } else {
        extracted = await file.text();
      }

      if (!extracted || extracted.trim().length < 15) {
        throw new Error('Plik nie zawiera dostatecznej ilości tekstu (minimum 15 znaków).');
      }

      setPasterText(extracted);

      // Instantly parse via Gemini AI
      const response = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: extracted }),
      });

      const resData = await response.json();
      const extractedVault = resData.data || resData.parsedVault;
      if (!response.ok || !resData.success || !extractedVault) {
        throw new Error(resData.error || 'Nie udało się przeanalizować zawartości pliku.');
      }

      setPasterParsedData(extractedVault);
    } catch (err: any) {
      setPasterError(`Błąd odczytu pliku (${file.name}): ${err?.message || 'Nieznany błąd'}`);
    } finally {
      setIsParsingPaster(false);
      e.target.value = '';
    }
  };

  // Parse Raw LinkedIn / CV Text with Gemini AI
  const handleParsePasterTextWithAI = async () => {
    if (!pasterText.trim() || pasterText.trim().length < 15) {
      setPasterError('Wklej dłuższy fragment tekstu z profilu LinkedIn lub CV (minimum 15 znaków).');
      return;
    }

    setIsParsingPaster(true);
    setPasterError(null);
    setPasterParsedData(null);

    try {
      const response = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: pasterText }),
      });

      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.statusText}`);
      }

      const resData = await response.json();
      const extractedVault = resData.data || resData.parsedVault;
      if (!resData.success || !extractedVault) {
        throw new Error(resData.error || 'Nie udało się przetworzyć tekstu.');
      }

      setPasterParsedData(extractedVault);
    } catch (err: any) {
      setPasterError(err.message || 'Wystąpił błąd podczas analizy tekstu przez Gemini AI.');
    } finally {
      setIsParsingPaster(false);
    }
  };

  const applyPasterDataToDraft = () => {
    if (!pasterParsedData) return;

    const parsed = pasterParsedData;
    
    // Merge History without exact duplicate company + role
    const existingHistKeys = new Set(draftVault.history.map((h) => `${h.company.toLowerCase().trim()}_${h.role.toLowerCase().trim()}`));
    const newHist = (parsed.history || []).filter((h) => !existingHistKeys.has(`${h.company.toLowerCase().trim()}_${h.role.toLowerCase().trim()}`));
    const isPrevSample = draftVault.history.some((h) => h.company.includes('TechCorp') || h.company.includes('FinTech'));
    const mergedHistory = isPrevSample && parsed.history && parsed.history.length > 0
      ? parsed.history
      : [...parsed.history || [], ...draftVault.history.filter((h) => !(parsed.history || []).some((p) => p.company.toLowerCase().trim() === h.company.toLowerCase().trim() && p.role.toLowerCase().trim() === h.role.toLowerCase().trim()))];

    // Merge Education without duplicate institution + degree
    const existingEduKeys = new Set(draftVault.education.map((e) => `${e.institution.toLowerCase().trim()}_${e.degree.toLowerCase().trim()}`));
    const newEdu = (parsed.education || []).filter((e) => !existingEduKeys.has(`${e.institution.toLowerCase().trim()}_${e.degree.toLowerCase().trim()}`));
    const isPrevEduSample = draftVault.education.some((e) => e.institution.includes('Politechnika Warszawska'));
    const mergedEducation = isPrevEduSample && parsed.education && parsed.education.length > 0
      ? parsed.education
      : [...parsed.education || [], ...newEdu];

    // Merge Certifications
    const existingCertNames = new Set((draftVault.skillsMatrix.certifications || []).map((c) => c.name.toLowerCase().trim()));
    const newCerts = (parsed.skillsMatrix?.certifications || []).filter((c) => !existingCertNames.has(c.name.toLowerCase().trim()));

    // Merge Skills
    const mergedHard = Array.from(new Set([...(parsed.skillsMatrix?.hardSkills || []), ...draftVault.skillsMatrix.hardSkills]));
    const mergedSoft = Array.from(new Set([...(parsed.skillsMatrix?.softSkills || []), ...draftVault.skillsMatrix.softSkills]));
    const mergedTools = Array.from(new Set([...(parsed.skillsMatrix?.toolsAndTech || []), ...draftVault.skillsMatrix.toolsAndTech]));

    updateDraft({
      ...draftVault,
      personalInfo: {
        ...draftVault.personalInfo,
        fullName: parsed.personalInfo?.fullName || draftVault.personalInfo.fullName,
        title: parsed.personalInfo?.title || draftVault.personalInfo.title,
        summary: parsed.personalInfo?.summary || draftVault.personalInfo.summary,
        location: parsed.personalInfo?.location || draftVault.personalInfo.location,
        email: parsed.personalInfo?.email || draftVault.personalInfo.email,
        phone: parsed.personalInfo?.phone || draftVault.personalInfo.phone,
        linkedin: parsed.personalInfo?.linkedin || draftVault.personalInfo.linkedin,
      },
      skillsMatrix: {
        ...draftVault.skillsMatrix,
        hardSkills: mergedHard,
        softSkills: mergedSoft,
        toolsAndTech: mergedTools,
        certifications: [...draftVault.skillsMatrix.certifications, ...newCerts],
      },
      history: mergedHistory.length > 0 ? mergedHistory : draftVault.history,
      education: mergedEducation.length > 0 ? mergedEducation : draftVault.education,
      updatedAt: new Date().toISOString(),
    });

    setIsLinkedInPasterOpen(false);
    setPasterText('');
    setPasterParsedData(null);
    setLinkedInToast('Pomyślnie wyekstrahowano i scalono historię pracy i wykształcenie przez Gemini AI!');
    setTimeout(() => setLinkedInToast(null), 4500);
  };

  // Encrypted File Export
  const handleExportJson = () => {
    const jsonStr = passkey ? encryptVault(draftVault, passkey) : JSON.stringify(draftVault, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = passkey
      ? `MasterVault_Encrypted_${draftVault.personalInfo.fullName.replace(/\s+/g, '_')}.cvvault`
      : `MasterVault_${draftVault.personalInfo.fullName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAES = () => {
    if (!passkey) {
      alert('Wprowadź hasło do szyfrowania AES-256.');
      return;
    }
    saveVaultToLocalStorage(draftVault, passkey);
    setIsSavedEncrypted(true);
    setTimeout(() => setIsSavedEncrypted(false), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-900 shadow-xs space-y-6 relative">
      {/* Toast Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {linkedInToast && (
        <div className="bg-brand-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
            <span>{linkedInToast}</span>
          </div>
          <button onClick={() => setLinkedInToast(null)} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vault Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 relative shadow-xs">
            <User className="w-5 h-5" />
            {isDirty && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Mój Profil Zawodowy & Quiz Kwalifikacji
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Wypełnij Dane
              </span>
            </div>

            {/* Profile Completeness Bar */}
            <div className="flex items-center space-x-3 mt-1.5">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Kompletność Profilu:</span>
                <span className="font-bold text-emerald-600 font-mono">{completenessScore}%</span>
              </div>
              <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${completenessScore}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                (Ostatnia zmiana: {new Date(draftVault.updatedAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })})
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Living Organism Save Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Doradca Gemini Button */}
          {onOpenAdvisor && (
            <AdvisorButton
              onClick={() => onOpenAdvisor('Jak uzupełnić profil zawodowy i podnieść wynik kompletnosci?')}
              label="Doradca Gemini"
              title="Okienko Doradcy — Zapytaj Doradcę Gemini"
            />
          )}

          {/* Main explicit Save button */}
          <button
            onClick={handleSaveChanges}
            disabled={!isDirty}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400 ring-offset-1 animate-pulse'
                : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isDirty ? 'Zapisz Zmiany w Profilu' : 'Profil Zapisany'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Kopia Profilu JSON</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs / User Friendly Step Categories with Scroll Indicator */}
      <div className="relative">
        <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-emerald-200">
          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`flex items-center space-x-2 px-3.5 py-2 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeSubTab === 'quiz'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Puzzle className="w-4 h-4 text-amber-500" />
            <span>Szybki Quiz CV od Zera</span>
          </button>

          <button
            onClick={() => setActiveSubTab('info')}
            className={`flex items-center space-x-2 px-3.5 py-2 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeSubTab === 'info'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>1. Dane Osobowe & LinkedIn</span>
          </button>

          <button
            onClick={() => setActiveSubTab('skills')}
            className={`flex items-center space-x-2 px-3.5 py-2 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeSubTab === 'skills'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4 text-teal-600" />
            <span>2. Quiz Umiejętności: {draftVault.skillsMatrix.hardSkills.length + draftVault.skillsMatrix.softSkills.length + draftVault.skillsMatrix.toolsAndTech.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center space-x-2 px-3.5 py-2 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeSubTab === 'history'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>3. Doświadczenie & Metryki: {draftVault.history.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('edu')}
            className={`flex items-center space-x-2 px-3.5 py-2 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeSubTab === 'edu'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <span>4. Wykształcenie & Certyfikaty: {draftVault.education.length + draftVault.skillsMatrix.certifications.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center space-x-2 px-3.5 py-2 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeSubTab === 'security'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>5. Szyfrowanie & Kopia (AES-256)</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB: Interactive Quiz Builder & AI Audit */}
      {activeSubTab === 'quiz' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-700/60 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-800/60">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/50 rounded-xl text-amber-300">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                    <span>Szybki Quiz Budowy CV od Zera</span>
                    <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                      Krok po Kroku
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Kreator prowadzi Cię przez proces budowania CV od zera, sugeruje dopasowane stanowiska pracy i weryfikuje profil z AI pod kątem rażących błędów!
                  </p>
                </div>
              </div>

              {/* Quiz Reset Button */}
              <button
                type="button"
                onClick={() => {
                  setQuizStep(1);
                }}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-rose-950 hover:text-rose-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Resetuj Quiz</span>
              </button>
            </div>

            {/* Quiz Step Stepper Navigation */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { step: 1, label: '1. Dane', desc: 'Podstawy' },
                { step: 2, label: '2. Historia', desc: 'Gdzie pracowałeś' },
                { step: 3, label: '3. Umiejętności', desc: 'Narzędzia & Skill' },
                { step: 4, label: '4. Rekomendacje', desc: 'Docelowa Rola' },
                { step: 5, label: '5. Weryfikacja AI', desc: 'Audyt Błędów' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setQuizStep(s.step)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    quizStep === s.step
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md ring-2 ring-indigo-400/40'
                      : quizStep > s.step
                      ? 'bg-indigo-950/60 border-emerald-600/60 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[11px] font-extrabold flex items-center justify-between">
                    <span>{s.label}</span>
                    {quizStep > s.step && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </div>
                  <div className="text-[10px] opacity-80 truncate hidden sm:block">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: Podstawy Profilu */}
          {quizStep === 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Krok 1 z 5: Kim jesteś i jakie masz podstawowe dane?</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    clearPersonalInfoField('fullName');
                    clearPersonalInfoField('email');
                    clearPersonalInfoField('phone');
                    clearPersonalInfoField('location');
                    clearPersonalInfoField('title');
                    clearPersonalInfoField('summary');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wyczyść dane krok 1</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Imię i Nazwisko</label>
                    {draftVault.personalInfo.fullName && (
                      <button
                        type="button"
                        onClick={() => clearPersonalInfoField('fullName')}
                        className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>wyczyść</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={draftVault.personalInfo.fullName}
                    onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                    placeholder="Wpisz imię i nazwisko"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Główny Tytuł Zawodowy</label>
                    {draftVault.personalInfo.title && (
                      <button
                        type="button"
                        onClick={() => clearPersonalInfoField('title')}
                        className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>wyczyść</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={draftVault.personalInfo.title}
                    onChange={(e) => updatePersonalInfo('title', e.target.value)}
                    placeholder="np. Specjalista ds. Obsługi Klienta / React Developer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Adres Email</label>
                    {draftVault.personalInfo.email && (
                      <button
                        type="button"
                        onClick={() => clearPersonalInfoField('email')}
                        className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>wyczyść</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    value={draftVault.personalInfo.email}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    placeholder="jan@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Telefon / Miasto</label>
                    {draftVault.personalInfo.phone && (
                      <button
                        type="button"
                        onClick={() => {
                          clearPersonalInfoField('phone');
                          clearPersonalInfoField('location');
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>wyczyść</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={draftVault.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="+48 123 456 789"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={draftVault.personalInfo.location}
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      placeholder="Kraków"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Podsumowanie Zawodowe</label>
                  {draftVault.personalInfo.summary && (
                    <button
                      type="button"
                      onClick={() => clearPersonalInfoField('summary')}
                      className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center space-x-0.5 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>wyczyść opis</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={draftVault.personalInfo.summary}
                  onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                  placeholder="Opisz krótko swoje cele zawodowe, doświadczenie i najważniejsze atuty..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Step 1 Actions */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setQuizStep(2)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>Przejdź do Kroku 2: Historia Pracy</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Historia Gdzie Pracowałeś */}
          {quizStep === 2 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Krok 2 z 5: Gdzie pracowałeś?</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Wybierz gotowy szablon historii doświadczenia lub dodaj własny wpis.
                  </p>
                </div>

                {draftVault.history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllHistory}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Wyczyść całą historię</span>
                  </button>
                )}
              </div>

              {/* Quick pre-fill history presets */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Szybkie szablony historii, kliknij aby dodać:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      company: 'Bank Pekao S.A.',
                      role: 'Inspektor ds. Obsługi Klienta',
                      period: '05.2026 - 07.2026',
                      location: 'Kraków',
                      metrics: 'Wskaźnik jakości: 4.40/5.00',
                    },
                    {
                      company: 'PartWork',
                      role: 'Koordynator Zgłoszeń i Korespondencji',
                      period: '2023',
                      location: 'Kraków',
                      metrics: 'Obsługa procedur SLA & zgłoszeń międzydziałowych',
                    },
                    {
                      company: 'Interia.pl / Grupa Polsat-Interia',
                      role: 'Wsparcie Działu Technicznego',
                      period: '2018',
                      location: 'Kraków',
                      metrics: 'Diagnostyka sprzęt/OS, serwis peryferii',
                    },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        const exists = draftVault.history.some((h) => h.company === preset.company);
                        if (!exists) {
                          const newExp: WorkExperience = {
                            id: 'exp_' + Date.now() + '_' + pIdx,
                            company: preset.company,
                            role: preset.role,
                            location: preset.location,
                            startDate: preset.period.split('-')[0]?.trim() || '2026',
                            endDate: preset.period.split('-')[1]?.trim() || '2026',
                            isCurrent: false,
                            highlights: [{ id: 'm_' + Date.now(), text: preset.metrics, action: 'Obsługa', target: 'Procedury', tool: 'CRM', metric: preset.metrics, keywords: ['SLA'] }],
                          };
                          updateDraft({
                            ...draftVault,
                            history: [newExp, ...draftVault.history],
                            updatedAt: new Date().toISOString(),
                          });
                        }
                      }}
                      className="p-2.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-left transition-all"
                    >
                      <div className="font-bold text-xs text-slate-900">{preset.company}</div>
                      <div className="text-[11px] text-slate-600">{preset.role}</div>
                      <div className="text-[10px] text-indigo-600 font-mono font-semibold mt-1">{preset.metrics}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current History List with Individual Delete Icons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Aktualne Stanowiska w CV: {draftVault.history.length}</span>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Dodaj własne stanowisko</span>
                  </button>
                </div>

                {draftVault.history.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl text-center italic">
                    Brak dodanych stanowisk. Kliknij szablon powyżej lub dodaj własną historię pracy.
                  </div>
                ) : (
                  draftVault.history.map((exp) => (
                    <div key={exp.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 relative shadow-2xs">
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Usuń to stanowisko"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pr-8">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Firma / Miejsce Pracy</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Stanowisko / Rola</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Okres od - do</label>
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              placeholder="05.2026"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900"
                            />
                            <span className="text-slate-400 text-xs">-</span>
                            <input
                              type="text"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                              placeholder="07.2026"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setQuizStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ← Krok 1: Dane
                </button>
                <button
                  type="button"
                  onClick={() => setQuizStep(3)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>Przejdź do Kroku 3: Umiejętności</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Quiz Umiejętności */}
          {quizStep === 3 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Krok 3 z 5: Wybierz swoje Umiejętności i Narzędzia</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kliknij wybraną umiejętność, aby ją dodać lub kliknij kosz, aby ją usunąć.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearAllSkills}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wyczyść wszystkie umiejętności</span>
                </button>
              </div>

              {/* Skill Presets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Obsługa Klienta & Procedury',
                    field: 'hardSkills' as const,
                    items: ['Obsługa Klienta', 'Deeskalacja Problemów', 'Reżim procedur SLA', 'Systemy Bankowe', 'Koordynacja Zgłoszeń'],
                  },
                  {
                    title: 'Programowanie & Web Dev',
                    field: 'toolsAndTech' as const,
                    items: ['TypeScript', 'React 19', 'SQL', 'Git & GitHub', 'Tailwind CSS', 'Node.js', 'REST API'],
                  },
                  {
                    title: 'Języki Obce & Przekładoznawstwo',
                    field: 'hardSkills' as const,
                    items: ['Język Angielski C1', 'Język Rosyjski B2/C1', 'Przekładoznawstwo', 'Terminologia Techniczna'],
                  },
                  {
                    title: 'Umiejętności Miękkie',
                    field: 'softSkills' as const,
                    items: ['Komunikatywność', 'Praca pod presją czasu', 'Rozwiązywanie problemów', 'Skrupulatność & Procedury'],
                  },
                ].map((cat, cIdx) => (
                  <div key={cIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                      <span>{cat.title}</span>
                      <button
                        type="button"
                        onClick={() => clearSkillsCategory(cat.field)}
                        className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-1"
                        title="Wyczyść tę kategorię"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>wyczyść</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map((item) => {
                        const list = draftVault.skillsMatrix[cat.field] || [];
                        const exists = list.some((s) => s.toLowerCase() === item.toLowerCase());
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              if (!exists) {
                                addSkill(cat.field, item);
                              } else {
                                removeSkill(cat.field, item);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                              exists
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>{item}</span>
                            {exists ? (
                              <Trash2 className="w-3 h-3 text-indigo-200 hover:text-rose-300" />
                            ) : (
                              <Plus className="w-3 h-3 text-indigo-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Selected Skills Summary with Delete Badges */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-2">
                <div className="text-xs font-extrabold text-indigo-950 flex items-center justify-between">
                  <span>Aktualnie wybrane umiejętności: {draftVault.skillsMatrix.hardSkills.length + draftVault.skillsMatrix.softSkills.length + draftVault.skillsMatrix.toolsAndTech.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...draftVault.skillsMatrix.hardSkills.map((s) => ({ name: s, type: 'hardSkills' as const })),
                    ...draftVault.skillsMatrix.softSkills.map((s) => ({ name: s, type: 'softSkills' as const })),
                    ...draftVault.skillsMatrix.toolsAndTech.map((s) => ({ name: s, type: 'toolsAndTech' as const })),
                  ].map((sObj, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs text-indigo-900 font-bold flex items-center space-x-1.5 shadow-2xs"
                    >
                      <span>{sObj.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(sObj.type, sObj.name)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Usuń umiejętność"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setQuizStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ← Krok 2: Historia
                </button>
                <button
                  type="button"
                  onClick={() => setQuizStep(4)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>Przejdź do Kroku 4: Rekomendacje Pracodawcy</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Smart Job Recommendations & Specialization Knowledge Base */}
          {quizStep === 4 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-2xs">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Krok 4 z 5: Rekomendacje & Baza Wiedzy Specjalizacji</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Przeglądaj dopasowane role oraz pełną bazę wiedzy specjalizacji bez zużywania tokenów API!
                </p>
              </div>

              {/* Universal Specialization Knowledge Base Explorer (0 Tokens) */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-5 space-y-4 shadow-xl text-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <Map className="w-4 h-4 shrink-0 text-indigo-300" />
                        <span>Zaawansowana Mapa Myśli Słów Profesji & Słownik Dziedzinowy</span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-success-500/20 text-success-500 border border-success-500/40 font-bold px-2.5 py-0.5 rounded-full">
                          <Zap className="w-2.5 h-2.5 shrink-0" />
                          0 Tokenów API
                        </span>
                      </h4>
                      <p className="text-xs text-indigo-200/80">
                        Stopniowe odsłanianie pojęć: Wybierz główną dziedzinę, aby odblokować specyficzne kwalifikacje i marki.
                      </p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[260px]">
                    <input
                      type="text"
                      value={specSearchQuery}
                      onChange={(e) => {
                        setSpecSearchQuery(e.target.value);
                        if (e.target.value.trim()) {
                          setSelectedDomainId(null);
                        }
                      }}
                      placeholder="Szukaj (np. Junkers, SEP, Trados, AML)..."
                      className="w-full bg-slate-800/90 border border-indigo-700/60 rounded-xl pl-3 pr-8 py-1.5 text-xs text-white placeholder-indigo-300/50 focus:outline-none focus:border-indigo-400 shadow-inner"
                    />
                    {specSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSpecSearchQuery('')}
                        className="absolute right-2.5 top-2 text-indigo-300 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* LEVEL 1: Select Main Field/Domain (Progressive Disclosure) */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                    <span>1. Wybierz Główną Dziedzinę</span>
                    {selectedDomainId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDomainId(null);
                          setSelectedRoleId(null);
                        }}
                        className="text-[10px] text-amber-300 underline hover:text-white"
                      >
                        Pokaż wszystkie dziedziny
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {DOMAIN_SPECIALIZATIONS.map((domain) => {
                      const isSelected = selectedDomainId === domain.id;
                      return (
                        <button
                          key={domain.id}
                          type="button"
                          onClick={() => {
                            setSelectedDomainId(domain.id);
                            setSelectedRoleId(null);
                            setSpecSearchQuery('');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all space-y-1 relative overflow-hidden ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 border-indigo-400 ring-2 ring-indigo-300 shadow-lg text-white'
                              : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-indigo-500 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs">{domain.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                          </div>
                          <p className="text-[10px] text-slate-300/80 line-clamp-2 leading-snug">
                            {domain.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* LEVEL 2: Sub-categories and Specialized Roles in Selected Domain */}
                {selectedDomainId && (
                  <div className="pt-2 border-t border-indigo-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-amber-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Odblokowane Wyszukiwanie w Dziedzinie: {DOMAIN_SPECIALIZATIONS.find(d => d.id === selectedDomainId)?.name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {DOMAIN_SPECIALIZATIONS.find((d) => d.id === selectedDomainId)
                        ?.subCategories.flatMap((sub) => sub.roles)
                        .map((role) => {
                          const isRoleSelected = selectedRoleId === role.id;
                          const isImported = draftVault.personalInfo.title === role.title;

                          return (
                            <div
                              key={role.id}
                              className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                                isRoleSelected
                                  ? 'bg-indigo-900/60 border-indigo-400 ring-2 ring-indigo-400/50'
                                  : 'bg-slate-800/80 border-slate-700 hover:border-indigo-400'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-bold text-xs text-white flex items-center space-x-2">
                                    <span>{role.title}</span>
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                                      {role.shortCode}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{role.description}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/60">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRoleId(isRoleSelected ? null : role.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                                    isRoleSelected
                                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold'
                                      : 'bg-indigo-700/80 hover:bg-indigo-600 text-white'
                                  }`}
                                >
                                  <Database className="w-3.5 h-3.5" />
                                  <span>{isRoleSelected ? 'Ukryj Mapę Pojęć' : 'Otwórz Mapę Słów Profesji'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => applySpecializationTemplate(role)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                                    isImported
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                  }`}
                                >
                                  {isImported ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                                  <span>{isImported ? 'Zaimportowano' : 'Importuj Profil'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* LEVEL 3: Interactive Mind Map of Professional Vocabulary & Qualifications */}
                {selectedRoleId && (() => {
                  const currentRole = DOMAIN_SPECIALIZATIONS.flatMap((d) => d.subCategories).flatMap((s) => s.roles).find((r) => r.id === selectedRoleId);
                  if (!currentRole || !currentRole.detailedDictionary) return null;

                  return (
                    <div className="pt-3 border-t border-indigo-800 space-y-3 bg-slate-900/90 p-4 rounded-xl border border-amber-500/40 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <h5 className="text-xs font-extrabold text-amber-300">
                              Doprecyzowana Mapa Słów i Kwalifikacji: {currentRole.title}
                            </h5>
                            <p className="text-[10px] text-slate-300">
                              Kliknij dowolne pojęcie, markę lub uprawnienie, aby błyskawicznie dodać je do swojego CV!
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedRoleId(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Zamknij Mapę
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {currentRole.detailedDictionary.map((dictCat, dictIdx) => (
                          <div key={dictIdx} className="bg-slate-950/80 border border-indigo-900/60 rounded-xl p-3 space-y-2">
                            <div className="text-[11px] font-extrabold text-indigo-200 flex items-center space-x-1.5">
                              {dictCat.type === 'licenses' && <ScrollText className="w-3.5 h-3.5 shrink-0" />}
                              {dictCat.type === 'brands_tools' && <Factory className="w-3.5 h-3.5 shrink-0" />}
                              {dictCat.type === 'terminology_skills' && <Settings2 className="w-3.5 h-3.5 shrink-0" />}
                              {dictCat.type === 'metrics' && <BarChart3 className="w-3.5 h-3.5 shrink-0" />}
                              <span>{dictCat.title}</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {dictCat.items.map((item, itemIdx) => {
                                const isSkillAdded = (draftVault.skillsMatrix?.hardSkills || [])
                                  .concat(draftVault.skillsMatrix?.toolsAndTech || [])
                                  .some((s) => s.toLowerCase() === item.toLowerCase());

                                return (
                                  <button
                                    key={itemIdx}
                                    type="button"
                                    onClick={() => toggleProfessionalTerm(item, dictCat.type)}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition-all flex items-center space-x-1.5 ${
                                      isSkillAdded
                                        ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-sm'
                                        : 'bg-slate-900 text-indigo-100 border-indigo-800/80 hover:border-amber-400 hover:bg-slate-800'
                                    }`}
                                  >
                                    {isSkillAdded ? <Check className="w-3 h-3 shrink-0" /> : <Plus className="w-3 h-3 shrink-0" />}
                                    <span>{item}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Search Results fallback if searching globally */}
                {specSearchQuery.trim() && (
                  <div className="pt-2 border-t border-indigo-900/60 space-y-2">
                    <div className="text-xs font-extrabold text-indigo-300">Wyniki wyszukiwania dla "{specSearchQuery}":</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {searchSpecializations(specSearchQuery).map((role) => (
                        <div key={role.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white">{role.title}</div>
                            <div className="text-[10px] text-indigo-300">{role.category}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => applySpecializationTemplate(role)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                          >
                            Importuj
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Job Roles (Match engine) */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-900">
                  Dopasowania rekomendowane dla aktualnego profilu ({draftVault.personalInfo.fullName || 'Użytkownik'}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {recommendedJobRoles.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className={`p-4 rounded-xl border transition-all space-y-2 relative ${
                        draftVault.personalInfo.title === rec.role
                          ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300'
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold text-slate-900">{rec.role}</div>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {rec.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                      <button
                        type="button"
                        onClick={() => updatePersonalInfo('title', rec.role)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 ${
                          draftVault.personalInfo.title === rec.role
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {draftVault.personalInfo.title === rec.role ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Wybrane jako docelowe stanowisko</span>
                          </>
                        ) : (
                          <span>Ustaw jako moją główną rolę</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setQuizStep(3)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ← Krok 3: Umiejętności
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuizStep(5);
                    runAiProfileAudit();
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>Przejdź do Kroku 5: Weryfikacja AI & Audyt</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Weryfikacja AI i Audyt Błędów */}
          {quizStep === 5 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-2xs">
              <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span>Krok 5 z 5: Końcowa Weryfikacja AI</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Moduł weryfikacyjny AI skanuje Twój profil w celu wyeliminowania rażących błędów i niedociągnięć.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runAiProfileAudit}
                  disabled={isAiAuditing}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAiAuditing ? 'animate-spin' : ''}`} />
                  <span>Ponownie przetestuj profil AI</span>
                </button>
              </div>

              {/* Audit Results Container */}
              {isAiAuditing ? (
                <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  <div className="text-xs font-bold text-slate-800">Skanning danych profilowych z użyciem AI...</div>
                  <div className="text-[11px] text-slate-500">Sprawdzamy poprawność adresu e-mail, podsumowania, wskaźników i umiejętności.</div>
                </div>
              ) : aiAuditResults ? (
                <div className="space-y-4">
                  {/* Score Indicator */}
                  <div className="flex items-center space-x-4 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
                    <div className="text-3xl font-black font-mono text-indigo-400 bg-slate-950 px-4 py-2 rounded-xl border border-indigo-500/30">
                      {aiAuditResults.score}/100
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        {aiAuditResults.score >= 80 ? <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-warning-500 shrink-0" />}
                        Wynik Audytu Jakości CV: {aiAuditResults.score >= 80 ? 'Wskazanie Bardzo Dobre' : 'Wymaga Poprawek'}
                      </div>
                      <div className="text-xs text-slate-300">
                        {aiAuditResults.score >= 80
                          ? 'Twój profil jest gotowy do udostępnienia rekruterom i pobrania w formacie PDF/JSON!'
                          : 'Wykryto kilka elementów wymagających uzupełnienia przed wysłaniem CV.'}
                      </div>
                    </div>
                  </div>

                  {/* Detected Issues */}
                  {aiAuditResults.issues.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-bold text-rose-900 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Wykryte Rażące Błędy i Niedociągnięcia: {aiAuditResults.issues.length}</span>
                      </div>
                      <ul className="space-y-1 pl-5 list-disc text-xs text-rose-800">
                        {aiAuditResults.issues.map((iss, iIdx) => (
                          <li key={iIdx}>{iss}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {aiAuditResults.suggestions.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Rekomendowane Udoskonalenia: {aiAuditResults.suggestions.length}</span>
                      </div>
                      <ul className="space-y-1 pl-5 list-disc text-xs text-amber-900">
                        {aiAuditResults.suggestions.map((sug, sIdx) => (
                          <li key={sIdx}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Auto-Fix Actions */}
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-indigo-950">Zakończono Budowę CV w Quizie</div>
                      <div className="text-[11px] text-indigo-700">Wszystkie zmiany zostały automatycznie zapisane w Twojej lokalnej wersji roboczej.</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany i Przejdź do Profilu</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Navigation Back */}
              <div className="flex justify-start pt-2">
                <button
                  type="button"
                  onClick={() => setQuizStep(4)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ← Krok 4: Rekomendacje
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 1: Personal Info & LinkedIn Integration */}
      {activeSubTab === 'info' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Imię i Nazwisko</label>
                {draftVault.personalInfo.fullName && (
                  <button
                    type="button"
                    onClick={() => clearPersonalInfoField('fullName')}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-0.5"
                    title="Wyczyść to pole"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>wyczyść</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={draftVault.personalInfo.fullName}
                onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <AutocompleteInput
                label="Tytuł Zawodowy / Rola"
                value={draftVault.personalInfo.title}
                onChange={(val) => updatePersonalInfo('title', val)}
                suggestions={SUGGESTED_JOB_TITLES}
                placeholder="np. Senior Full-Stack Engineer"
                showQuickPills
                maxPills={4}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Email</label>
                {draftVault.personalInfo.email && (
                  <button
                    type="button"
                    onClick={() => clearPersonalInfoField('email')}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-0.5"
                    title="Wyczyść to pole"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>wyczyść</span>
                  </button>
                )}
              </div>
              <input
                type="email"
                value={draftVault.personalInfo.email}
                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Telefon</label>
                {draftVault.personalInfo.phone && (
                  <button
                    type="button"
                    onClick={() => clearPersonalInfoField('phone')}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-0.5"
                    title="Wyczyść to pole"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>wyczyść</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={draftVault.personalInfo.phone}
                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <AutocompleteInput
                label="Lokalizacja"
                value={draftVault.personalInfo.location}
                onChange={(val) => updatePersonalInfo('location', val)}
                suggestions={SUGGESTED_LOCATIONS}
                placeholder="np. Warszawa / Zdalnie"
                showQuickPills
                maxPills={4}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Linkedin className="w-3.5 h-3.5 text-sky-600" />
                <span>LinkedIn / Profil URL</span>
              </label>
              <input
                type="text"
                value={draftVault.personalInfo.linkedin || ''}
                onChange={(e) => handleLinkedInChange(e.target.value)}
                placeholder="np. https://linkedin.com/in/jan-kowalski"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />

              {/* Helper Card for Authentic LinkedIn AI Import */}
              {draftVault.personalInfo.linkedin && draftVault.personalInfo.linkedin.includes('linkedin.com') && (
                <div className="mt-2.5 p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2 text-xs text-slate-800 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 font-bold text-sky-900">
                    <Linkedin className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Import Prawdziwego Profilu LinkedIn bez Losowych Danych</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Strony profilowe LinkedIn wymagają zalogowania, przez co serwisy zewnętrzne nie mogą z samego adresu URL pobrać pełnych informacji. Aby zapewnić <strong>100% autentyczne dane</strong> (historii pracy, wykształcenia i umiejętności) bez generowania sztucznych/losowych tekstów:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsLinkedInPasterOpen(true)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Przenieś profil przez AI Wklej Tekst</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTryScrapeLinkedInUrl}
                      disabled={isParsingPaster}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>Spróbuj pobrać z linku Proxy Scraper</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Podsumowanie Zawodowe (Master Summary)
            </label>
            <textarea
              rows={3}
              value={draftVault.personalInfo.summary}
              onChange={(e) => updatePersonalInfo('summary', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Skills Matrix & Interactive Quiz */}
      {activeSubTab === 'skills' && (
        <div className="space-y-6">
          {/* INTERACTIVE QUIZ FILLER CARD */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 border border-indigo-700/80 rounded-2xl p-5 text-white shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-indigo-800/80">
              <div className="p-2 bg-indigo-800 rounded-lg text-amber-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Szybki Quiz Kompetencji i Umiejętności</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    1-Kliknięcie
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Kliknij przycisk poniżej, aby błyskawicznie dodać pasującą umiejętność do swojego profilu!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {[
                {
                  category: 'Obsługa Klienta & Contact Center',
                  icon: Phone,
                  items: ['Obsługa Klienta', 'Deeskalacja Problemów', 'Reżim procedur SLA', 'Systemy Bankowe', 'Ticketing (Jira/Zendesk)', 'Koordynacja Zgłoszeń'],
                  targetField: 'hardSkills' as const,
                },
                {
                  category: 'Sprzedaż & Handel',
                  icon: Handshake,
                  items: ['Negocjacje Handlowe', 'B2B Sales & Lead Generation', 'Key Account Management', 'Zarządzanie Lejkiem Sprzedażowym', 'Budowanie Relacji z Klientem'],
                  targetField: 'hardSkills' as const,
                },
                {
                  category: 'Finanse & Księgowość',
                  icon: Calculator,
                  items: ['Księgowość Pełna (UoR / MSSF)', 'Rozliczenia Podatkowe (PIT / CIT / VAT)', 'Analiza Wskaźnikowa i RFi', 'Modelowanie Finansowe', 'Excel Zaawansowany (VBA / Power Query)'],
                  targetField: 'hardSkills' as const,
                },
                {
                  category: 'Budownictwo & Rzemiosło',
                  icon: HardHat,
                  items: ['Czytanie Dokumentacji Technicznej', 'Prace Wykończeniowe', 'Uprawnienia SEP', 'Obsługa Maszyn Budowlanych', 'BHP na Budowie'],
                  targetField: 'hardSkills' as const,
                },
                {
                  category: 'Produkcja, Motoryzacja & CNC',
                  icon: Wrench,
                  items: ['Obsługa i Programowanie CNC', 'Spawanie TIG/MAG', 'Diagnostyka Techniczna', 'Utrzymanie Ruchu', 'Lean Manufacturing / ISO 9001'],
                  targetField: 'hardSkills' as const,
                },
                {
                  category: 'Logistyka & Transport',
                  icon: Truck,
                  items: ['Zarządzanie Łańcuchem Dostaw (SCM)', 'Obsługa Wózka Widłowego', 'Spedycja i Dokumentacja Transportowa', 'Zarządzanie Magazynem (WMS)', 'Planowanie Tras'],
                  targetField: 'hardSkills' as const,
                },
                {
                  category: 'Medycyna & Opieka',
                  icon: Stethoscope,
                  items: ['Opieka nad Pacjentem', 'Dokumentacja Medyczna', 'Procedury Sanitarno-Epidemiologiczne', 'Pierwsza Pomoc', 'Farmakologia Podstawowa'],
                  targetField: 'hardSkills' as const,
                },
                {
                  category: 'Technologia & Programowanie',
                  icon: Code2,
                  items: ['TypeScript', 'React 19', 'SQL', 'Git & GitHub', 'Tailwind CSS', 'Node.js', 'REST API', 'Excel (VLOOKUP/Pivot)'],
                  targetField: 'toolsAndTech' as const,
                },
                {
                  category: 'Języki & Przekładoznawstwo',
                  icon: Languages,
                  items: ['Język Angielski C1', 'Język Rosyjski B2/C1', 'Przekładoznawstwo', 'Adaptacja Językowa', 'Terminologia Techniczna'],
                  targetField: 'hardSkills' as const,
                },
                {
                  category: 'Umiejętności Miękkie',
                  icon: Brain,
                  items: ['Komunikatywność', 'Praca pod presją czasu', 'Rozwiązywanie problemów', 'Skrupulatność & Procedury', 'Praca zespołowa'],
                  targetField: 'softSkills' as const,
                },
              ].map((group, gIdx) => (
                <div key={gIdx} className="bg-slate-950/70 border border-indigo-800/50 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 justify-between">
                    <span className="flex items-center gap-1.5"><group.icon className="w-3.5 h-3.5 shrink-0" />{group.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => {
                      const list = draftVault.skillsMatrix[group.targetField] || [];
                      const exists = list.some((s) => s.toLowerCase() === item.toLowerCase());
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            if (!exists) {
                              addSkill(group.targetField, item);
                            } else {
                              removeSkill(group.targetField, item);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 border ${
                            exists
                              ? 'bg-emerald-950 border-emerald-600 text-emerald-300 shadow-xs'
                              : 'bg-indigo-950/80 hover:bg-indigo-800 border-indigo-700/80 text-indigo-200 hover:text-white'
                          }`}
                        >
                          {exists ? (
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Plus className="w-3 h-3 text-cyan-400 shrink-0" />
                          )}
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hard Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">Umiejętności Twarde</label>
            <div className="flex gap-2 mb-3 items-end">
              <div className="flex-1">
                <AutocompleteInput
                  value={newSkillText.hard}
                  onChange={(val) => setNewSkillText({ ...newSkillText, hard: val })}
                  onSelectSuggestion={(selected) => {
                    addSkill('hardSkills', selected);
                    setNewSkillText({ ...newSkillText, hard: '' });
                  }}
                  onKeyDownEnter={() => {
                    addSkill('hardSkills', newSkillText.hard);
                    setNewSkillText({ ...newSkillText, hard: '' });
                  }}
                  suggestions={SUGGESTED_HARD_SKILLS}
                  placeholder="Dodaj umiejętność twardą (np. TypeScript, SQL)..."
                  showQuickPills
                  maxPills={8}
                />
              </div>
              <button
                onClick={() => {
                  addSkill('hardSkills', newSkillText.hard);
                  setNewSkillText({ ...newSkillText, hard: '' });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs shrink-0 font-bold self-start mt-5"
              >
                Dodaj
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {draftVault.skillsMatrix.hardSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center space-x-1.5 font-medium"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill('hardSkills', skill)}
                    className="text-slate-400 hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Soft Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">Umiejętności Miękkie</label>
            <div className="flex gap-2 mb-3 items-end">
              <div className="flex-1">
                <AutocompleteInput
                  value={newSkillText.soft}
                  onChange={(val) => setNewSkillText({ ...newSkillText, soft: val })}
                  onSelectSuggestion={(selected) => {
                    addSkill('softSkills', selected);
                    setNewSkillText({ ...newSkillText, soft: '' });
                  }}
                  onKeyDownEnter={() => {
                    addSkill('softSkills', newSkillText.soft);
                    setNewSkillText({ ...newSkillText, soft: '' });
                  }}
                  suggestions={SUGGESTED_SOFT_SKILLS}
                  placeholder="Dodaj umiejętność miękką (np. Komunikatywność)..."
                  showQuickPills
                  maxPills={8}
                />
              </div>
              <button
                onClick={() => {
                  addSkill('softSkills', newSkillText.soft);
                  setNewSkillText({ ...newSkillText, soft: '' });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs shrink-0 font-bold self-start mt-5"
              >
                Dodaj
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {draftVault.skillsMatrix.softSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center space-x-1.5 font-medium"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill('softSkills', skill)}
                    className="text-slate-400 hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tools & Tech */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">Narzędzia i Technologie</label>
            <div className="flex gap-2 mb-3 items-end">
              <div className="flex-1">
                <AutocompleteInput
                  value={newSkillText.tool}
                  onChange={(val) => setNewSkillText({ ...newSkillText, tool: val })}
                  onSelectSuggestion={(selected) => {
                    addSkill('toolsAndTech', selected);
                    setNewSkillText({ ...newSkillText, tool: '' });
                  }}
                  onKeyDownEnter={() => {
                    addSkill('toolsAndTech', newSkillText.tool);
                    setNewSkillText({ ...newSkillText, tool: '' });
                  }}
                  suggestions={SUGGESTED_TOOLS_AND_TECH}
                  placeholder="Dodaj narzędzie (np. Docker, Git, Jira)..."
                  showQuickPills
                  maxPills={8}
                />
              </div>
              <button
                onClick={() => {
                  addSkill('toolsAndTech', newSkillText.tool);
                  setNewSkillText({ ...newSkillText, tool: '' });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs shrink-0 font-bold self-start mt-5"
              >
                Dodaj
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {draftVault.skillsMatrix.toolsAndTech.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center space-x-1.5 font-medium"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill('toolsAndTech', skill)}
                    className="text-slate-400 hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Work History with Slot Metrics */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Uporządkowana historia stanowisk wraz z precyzyjnymi wskaźnikami ilościowymi (Slot Filling).
            </p>
            <button
              onClick={addExperience}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj Stanowisko</span>
            </button>
          </div>

          <div className="space-y-6">
            {draftVault.history.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 relative"
              >
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Firma</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <AutocompleteInput
                      label="Stanowisko"
                      value={exp.role}
                      onChange={(val) => updateExperience(exp.id, 'role', val)}
                      suggestions={SUGGESTED_JOB_TITLES}
                      placeholder="np. Senior Frontend Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Okres Rozpoczęcia</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      placeholder="MM/YYYY"
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Okres Zakończenia</label>
                    <input
                      type="text"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      placeholder="MM/YYYY lub Obecnie"
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Highlights List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Osiągnięcia i Wskaźniki (Sloty: Akcja + Cel + Narzędzie + Wskaźnik)
                    </span>
                    <button
                      onClick={() => addHighlight(exp.id)}
                      className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Dodaj Osiągnięcie</span>
                    </button>
                  </div>

                  {exp.highlights.map((h) => (
                    <div
                      key={h.id}
                      className="bg-white border border-slate-200 p-3 rounded-lg space-y-2 relative"
                    >
                      <button
                        onClick={() => removeHighlight(exp.id, h.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="text-xs text-slate-900 font-medium pr-6">{h.text}</div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Akcja:</span>
                          <input
                            type="text"
                            value={h.action}
                            onChange={(e) => updateHighlight(exp.id, h.id, 'action', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <span className="text-slate-500 block">Cel/Obiekt:</span>
                          <input
                            type="text"
                            value={h.target}
                            onChange={(e) => updateHighlight(exp.id, h.id, 'target', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <span className="text-slate-500 block">Narzędzie/Narzędzia:</span>
                          <input
                            type="text"
                            value={h.tool}
                            onChange={(e) => updateHighlight(exp.id, h.id, 'tool', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <span className="text-slate-500 block">Wskaźnik Liczba:</span>
                          <input
                            type="text"
                            value={h.metric}
                            onChange={(e) => updateHighlight(exp.id, h.id, 'metric', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-emerald-700 font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Education, Certifications & Projects */}
      {activeSubTab === 'edu' && (
        <div className="space-y-6">
          {/* Education Editor */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Edukacja & Wykształcenie: {draftVault.education.length}</h4>
              </div>
              <button
                onClick={addEducation}
                className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj Uczelnię / Szkołę</span>
              </button>
            </div>

            {draftVault.education.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 italic text-center">Brak dodanego wykształcenia. Kliknij "Dodaj Uczelnię" lub zaimportuj profil z LinkedIn.</div>
            ) : (
              <div className="space-y-3">
                {draftVault.education.map((edu) => (
                  <div key={edu.id} className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-2 relative shadow-2xs">
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs pr-6">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Uczelnia / Szkoła</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Stopień / Tytuł</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          placeholder="np. Licencjat / Technik Informatyk"
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kierunek / Wydział</label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                          placeholder="np. Przekładoznawstwo / Informatyka"
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Lata Nauki od - do</label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                            placeholder="2018"
                            className="w-1/2 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-900 font-mono text-center"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                            placeholder="2022"
                            className="w-1/2 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-900 font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Certyfikaty Zawodowe: {draftVault.skillsMatrix.certifications.length}</span>
              </label>
              <button
                onClick={addCertification}
                className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj Certyfikat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {draftVault.skillsMatrix.certifications.map((cert) => (
                <div key={cert.id} className="bg-white border border-slate-200 p-3.5 rounded-xl relative space-y-1 shadow-2xs">
                  <button
                    onClick={() => removeCertification(cert.id)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="font-bold text-xs text-slate-900 pr-6">{cert.name}</div>
                  <div className="text-[11px] text-slate-500">{cert.issuer} ({cert.date || 'Brak daty'})</div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <FolderGit2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">Kluczowe Projekty Poboczne: {draftVault.projects.length}</h4>
            </div>
            {draftVault.projects.map((proj) => (
              <div key={proj.id} className="bg-white border border-slate-200 p-3 rounded-xl space-y-1 text-xs shadow-2xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{proj.name}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{proj.role}</span>
                </div>
                <div className="text-slate-600 text-[11px]">{proj.description}</div>
                {proj.metrics && <div className="text-success-700 font-mono font-bold text-[10px] pt-1 flex items-center gap-1"><BarChart3 className="w-3 h-3 shrink-0" />{proj.metrics}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AES Security */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Szyfrowanie Bazy Danych AES-256</h3>
              <p className="text-xs text-slate-500">
                Szyfruj Master Vault lokalnie w przeglądarce za pomocą indywidualnego klucza.
              </p>
            </div>
          </div>

          <div className="max-w-md space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hasło Szyfrujące Passkey</label>
              <div className="relative">
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Wprowadź tajne hasło dla klucza AES..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 pr-10 focus:outline-none focus:border-indigo-500"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveAES}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Zapisz w LocalStorage Szyfrowane AES</span>
              </button>

              {isSavedEncrypted && (
                <span className="text-xs text-success-500 font-bold animate-fade-in flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Zapisano pomyślnie!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Save Bar for Living Organism feedback when scrolled */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-40 bg-slate-900 border border-indigo-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Masz niezapisane zmiany w MasterVault</p>
              <p className="text-[10px] text-slate-400">Kliknij przycisk, aby zsynchronizować organizm żywy.</p>
            </div>
          </div>
          <button
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Zapisz Zmiany</span>
          </button>
        </div>
      )}
      {/* LinkedIn / CV AI Text Paster Modal */}
      {isLinkedInPasterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-slate-900 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <Linkedin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Import Profilu LinkedIn przez Gemini AI
                  </h3>
                  <p className="text-xs text-slate-500">
                    Wgraj oficjalny eksport PDF z profilu LinkedIn lub wklej skopiowaną treść
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkedInPasterOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LinkedIn PDF Upload Guide / Quick Dropzone */}
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-sky-950 flex items-center justify-between">
                <span>Metoda 1: Oficjalny Plik PDF z LinkedIn Rekomendowane</span>
                <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-mono font-bold">100% Precyzja</span>
              </div>
              <p className="text-[11px] text-slate-600">
                W LinkedIn wejdź na Twój profil &rarr; kliknij <strong>Więcej / More</strong> &rarr; wybierz <strong>Zapisz do PDF</strong>.
              </p>
              <label className={`mt-1 cursor-pointer w-full py-2 bg-white border border-sky-300 hover:border-sky-500 hover:bg-sky-100/50 rounded-lg text-sky-800 font-bold text-xs flex items-center justify-center space-x-2 transition-colors ${isParsingPaster ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Wgraj wyeksportowany plik PDF z LinkedIn</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleModalFileUpload}
                  disabled={isParsingPaster}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-700">
                Metoda 2: Skopiowany Tekst Profilu (Doświadczenie, Uczelnie, Umiejętności)
              </label>
              <textarea
                rows={5}
                value={pasterText}
                onChange={(e) => setPasterText(e.target.value)}
                placeholder="Wklej tutaj treść skopiowaną z profilu LinkedIn, np.:&#10;DOŚWIADCZENIE:&#10;Senior Developer @ Company X (2020 - obecnie)...&#10;WYKSZTAŁCENIE:&#10;Politechnika Warszawska, Magister Inżynier Informatyki (2015 - 2020)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            {pasterError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pasterError}</span>
              </div>
            )}

            {/* Parsed Preview inside Modal */}
            {pasterParsedData && (
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Przeanalizowano pomyślnie przez Gemini AI!</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pasterParsedData.history?.length || 0} stanowisk • {pasterParsedData.education?.length || 0} uczelni
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase block">Doświadczenie: {pasterParsedData.history?.length || 0}</span>
                    {(pasterParsedData.history || []).slice(0, 3).map((h, idx) => (
                      <div key={idx} className="text-[11px] text-slate-200 border-b border-slate-800/50 pb-1 last:border-0">
                        <div className="font-semibold">{h.role}</div>
                        <div className="text-[10px] text-slate-400">{h.company} ({h.startDate} - {h.endDate})</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">Wykształcenie: {pasterParsedData.education?.length || 0}</span>
                    {(pasterParsedData.education || []).slice(0, 3).map((e, idx) => (
                      <div key={idx} className="text-[11px] text-slate-200 border-b border-slate-800/50 pb-1 last:border-0">
                        <div className="font-semibold">{e.degree} - {e.fieldOfStudy}</div>
                        <div className="text-[10px] text-slate-400">{e.institution} ({e.startDate} - {e.endDate})</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLinkedInPasterOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Anuluj
              </button>

              {!pasterParsedData ? (
                <button
                  type="button"
                  onClick={handleParsePasterTextWithAI}
                  disabled={isParsingPaster}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                >
                  {isParsingPaster ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analizowanie tekstu przez Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Ekstrahuj Dane przez AI</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyPasterDataToDraft}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Scal Wyekstrahowane Dane z MasterVault</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
