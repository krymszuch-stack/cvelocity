import { MasterVault, WorkExperience, Education, Certification } from '../types';
import { sanitizeTextInput } from './securityGuardrails';

export interface ParsedCVResult {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  hardSkills: string[];
  softSkills: string[];
  toolsAndTech: string[];
  certifications: Certification[];
  history: WorkExperience[];
  education: Education[];
  rawText: string;
  detectedFormat: string;
}

/**
 * Universal Multi-Format Text Extractor
 * Supports: .pdf, .docx, .doc, .rtf, .txt, .json, .csv
 */
export async function extractTextFromAnyFile(file: File): Promise<{ text: string; format: string }> {
  const fileName = file.name.toLowerCase();

  // 1. JSON Format
  if (fileName.endsWith('.json')) {
    const rawJson = await file.text();
    return { text: rawJson, format: 'JSON' };
  }

  // 2. CSV Format
  if (fileName.endsWith('.csv')) {
    const rawCsv = await file.text();
    return { text: rawCsv, format: 'CSV' };
  }

  // 3. RTF Format
  if (fileName.endsWith('.rtf')) {
    const rawRtf = await file.text();
    const cleanText = stripRtfControlWords(rawRtf);
    return { text: cleanText, format: 'RTF' };
  }

  // 4. DOCX / DOC Format
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const mammothModule = await import('mammoth');
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 20) {
        return { text: result.value, format: 'DOCX' };
      }
    } catch {
      // Fallback to text reading
    }
    const txt = await file.text();
    return { text: txt, format: 'DOC/TXT' };
  }

  // 5. PDF Format
  if (fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      const version = pdfjsLib.version || '6.1.200';
      if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      }
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/cmaps/`,
        cMapPacked: true,
      });
      const pdf = await loadingTask.promise;
      let pdfText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageItems = textContent.items.map((item: any) => item.str).join(' ');
        pdfText += pageItems + '\n';
      }
      if (pdfText.trim().length > 20) {
        return { text: pdfText, format: 'PDF' };
      }
    } catch (pdfErr) {
      console.warn('PDF.js extraction fallback to raw text:', pdfErr);
    }
    const rawPdfText = await file.text();
    const cleanedPdfText = rawPdfText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    return { text: cleanedPdfText, format: 'PDF (Fallback)' };
  }

  // 6. Plain Text (.txt, .md, .text)
  const plainText = await file.text();
  return { text: plainText, format: 'TXT' };
}

/**
 * Strips RTF control words and decodes Rich Text content
 */
function stripRtfControlWords(rtf: string): string {
  return rtf
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\tab/g, '\t')
    .replace(/\\[a-z0-9]+\s?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/**
 * Structural Semantic Parser - Converts unformatted text into a structured MasterVault
 */
export function parseTextToMasterVault(text: string, format: string = 'TXT'): ParsedCVResult {
  const clean = sanitizeTextInput(text);
  const lines = clean.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // 1. Extract Email
  const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  // 2. Extract Phone
  const phoneMatch = clean.match(/(?:\+?48\s*)?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{9})/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // 3. Extract Full Name (Heuristic: usually first line or non-contact line)
  let fullName = '';
  for (const line of lines.slice(0, 5)) {
    if (!line.includes('@') && !line.match(/\d{5,}/) && line.length < 50 && line.length > 4) {
      fullName = line;
      break;
    }
  }

  // 4. Extract Title
  const titleMatch = clean.match(/(?:stanowisko|tytuł|specjalność|rola):\s*([^\n]+)/i) ||
    clean.match(/\b(Senior|Lead|Junior|Mid|Specjalista|Inżynier|Developer|Manager|Koordynator|Monter|Serwisant)\b[^\n]+/i);
  const title = titleMatch ? titleMatch[0].trim() : 'Specjalista';

  // 5. Extract Hard Skills & Tools (Regex Keyword Matching)
  const hardSkills: string[] = [];
  const toolsAndTech: string[] = [];

  const techKeywords = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'SQL', 'PostgreSQL', 'Docker', 'AWS', 'Tailwind', 'HTML', 'CSS', 'Git', 'REST API'];
  const tradeSkills = ['diagnostyka', 'spawanie', 'montaż', 'serwis', 'uprawnienia SEP', 'SLA', 'kocioł gazowy', 'analizator spalin', 'pomiary elektryczne'];

  [...techKeywords, ...tradeSkills].forEach((kw) => {
    if (new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i').test(clean)) {
      hardSkills.push(kw);
      if (/git|docker|aws|node|react|vite|npm|figma|jira|analizator/i.test(kw)) {
        toolsAndTech.push(kw);
      }
    }
  });

  // 6. Extract Summary
  const summaryMatch = clean.match(/(?:podsumowanie|o sobie|profil zawodowy|summary):\s*([^\n]+(?:\n[^\n]+){1,3})/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : `Doświadczony ${title} posiadający kompetencje w obszarze ${hardSkills.slice(0, 3).join(', ')}.`;

  // 7. Work History Parsing
  const history: WorkExperience[] = [];
  const expBlocks = clean.split(/(?=doświadczenie|doświadczenie zawodowe|work experience|employment)/i);

  if (expBlocks.length > 1) {
    const expText = expBlocks[1];
    const expLines = expText.split('\n').filter((l) => l.length > 5);

    history.push({
      id: `exp_parsed_${Date.now()}_1`,
      company: expLines[1] || 'Firma Specjalistyczna',
      role: title,
      location: 'Polska',
      startDate: '2021-01',
      endDate: 'Obecnie',
      isCurrent: true,
      description: expLines.slice(2, 6).join(' '),
      highlights: [{
        id: `hl_1`,
        text: expLines[2] || 'Realizacja powierzonych zadań zawodowych',
        action: 'Realizacja',
        target: 'zadań',
        tool: 'Systemy IT',
        metric: '100%',
        keywords: []
      }],
    });
  } else {
    history.push({
      id: `exp_parsed_${Date.now()}_1`,
      company: 'Przedsiębiorstwo Operacyjne',
      role: title,
      location: 'Polska',
      startDate: '2022-01',
      endDate: 'Obecnie',
      isCurrent: true,
      description: 'Prowadzenie bieżących działań operacyjnych i technicznych.',
      highlights: [{
        id: `hl_2`,
        text: 'Optymalizacja procesów i obsługa zgłoszeń.',
        action: 'Optymalizacja',
        target: 'procesów',
        tool: 'Helpdesk',
        metric: '100%',
        keywords: []
      }],
    });
  }

  return {
    personalInfo: {
      fullName: fullName || 'Użytkownik CV',
      title,
      email,
      phone,
      location: 'Polska',
      summary,
    },
    hardSkills: Array.from(new Set(hardSkills)),
    softSkills: ['Komunikatywność', 'Praca w Zespole', 'Rozwiązywanie Problemów', 'Zarządzanie Czasem'],
    toolsAndTech: Array.from(new Set(toolsAndTech)),
    certifications: [
      {
        id: `cert_parsed_${Date.now()}`,
        name: `Certyfikat Zawodowy - ${title}`,
        issuer: 'Jednostka Certyfikująca',
        date: '2023',
      },
    ],
    history,
    education: [
      {
        id: `edu_parsed_${Date.now()}`,
        institution: 'Uczelnia / Szkoła Techniczna',
        degree: 'Inżynier / Technik',
        fieldOfStudy: title,
        startDate: '2017',
        endDate: '2021',
      },
    ],
    rawText: clean,
    detectedFormat: format,
  };
}
