import { WorkExperience, Education, Certification } from '../types';
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
  skillsMatrix: {
    hardSkills: string[];
    softSkills: string[];
    toolsAndTech: string[];
    certifications: Certification[];
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

  if (fileName.endsWith('.json')) {
    const rawJson = await file.text();
    return { text: rawJson, format: 'JSON' };
  }

  if (fileName.endsWith('.csv')) {
    const rawCsv = await file.text();
    return { text: rawCsv, format: 'CSV' };
  }

  if (fileName.endsWith('.rtf')) {
    const rawRtf = await file.text();
    return { text: stripRtfControlWords(rawRtf), format: 'RTF' };
  }

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
      // fallback to raw text below
    }
    const txt = await file.text();
    return { text: txt, format: 'DOC/TXT' };
  }

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
    return { text: rawPdfText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' '), format: 'PDF (Fallback)' };
  }

  const plainText = await file.text();
  return { text: plainText, format: 'TXT' };
}

function stripRtfControlWords(rtf: string): string {
  return rtf
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\tab/g, '\t')
    .replace(/\\[a-z0-9]+\s?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function getSectionLines(lines: string[], markers: RegExp[]): string[] {
  const matchIndex = lines.findIndex((line) => markers.some((marker) => marker.test(line)));
  if (matchIndex === -1) return [];

  const start = matchIndex + 1;
  const nextSectionIndex = lines.slice(start).findIndex((line) => /(wykształcenie|education|experience|doświadczenie|umiejętności|skills|certyfik|języki|languages)/i.test(line));
  const end = nextSectionIndex === -1 ? lines.length : start + nextSectionIndex;
  return lines.slice(start, end).filter((line) => line.trim().length > 0);
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function extractFullName(lines: string[]): string {
  const candidateLines = lines.filter((line) => {
    if (line.length > 60 || line.length < 3) return false;
    if (line.includes('@') || /\d/.test(line)) return false;
    if (/^(cv|curriculum vitae|resume|career summary|summary)$/i.test(line)) return false;
    return /^[A-ZĄĆĘŁŃÓŚŻŹ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŻŹ' .-]+$/.test(line);
  });

  return candidateLines[0] || '';
}

function extractTitle(clean: string, lines: string[]): string {
  const direct = clean.match(/(?:stanowisko|tytuł|position|role|job title)\s*[:\-]\s*([^\n]+)/i);
  if (direct && direct[1]) return direct[1].trim();

  const roleLine = lines.find((line) => /(?:Senior|Lead|Junior|Mid|Specjalista|Inżynier|Developer|Manager|Designer|Analyst|Technician|Koordynator|Monter|Serwisant|Engineer)/i.test(line));
  if (roleLine) return roleLine.replace(/^[-•*\s]+/, '').trim();

  return '';
}

function extractLocation(clean: string): string {
  const locationMatch = clean.match(/(?:lokalizacja|location|miasto|adres)\s*[:\-]\s*([^\n]+)/i) ||
    clean.match(/([A-ZĄĆĘŁŃÓŚŻŹ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŻŹ][a-ząćęłńóśźż]+)*,\s*(?:Polska|PL|USA|UK|Germany|France))/i);
  return locationMatch ? locationMatch[1]?.trim() || locationMatch[0].trim() : '';
}

function extractSummary(clean: string): string {
  const summaryMatch = clean.match(/(?:podsumowanie|profile|o mnie|about me|profil zawodowy|summary)\s*[:\-]\s*([^\n]+(?:\n[^\n]+){0,3})/i);
  if (summaryMatch && summaryMatch[1]) return summaryMatch[1].replace(/\s+/g, ' ').trim();

  const lines = clean.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const index = lines.findIndex((line) => /podsumowanie|profil zawodowy|o mnie|about me|summary/i.test(line));
  if (index >= 0) {
    const nextLines = lines.slice(index + 1, index + 5).join(' ');
    if (nextLines.trim()) return nextLines.replace(/\s+/g, ' ').trim();
  }

  return '';
}

function extractSkills(clean: string): { hardSkills: string[]; toolsAndTech: string[] } {
  const hardSkills: string[] = [];
  const toolsAndTech: string[] = [];
  const keywordPool = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Azure',
    'Git', 'REST API', 'HTML', 'CSS', 'Tailwind', 'Figma', 'Next.js', 'Vue', 'Angular', 'Java', 'C#', 'PHP', 'Laravel',
    'Microsoft Excel', 'Power BI', 'SAP', 'Oracle', 'Linux', 'Windows', 'SLA', 'spawanie', 'montaż', 'serwis', 'diagnostyka',
    'automatyk', 'uprawnienia SEP', 'kocioł gazowy', 'analizator spalin', 'pomiary elektryczne', 'BOM', 'PLC'
  ];

  for (const keyword of keywordPool) {
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\./g, '\\.')}\\b`, 'i');
    if (pattern.test(clean)) {
      hardSkills.push(keyword);
      if (/react|typescript|javascript|node|docker|aws|azure|git|figma|tailwind|next|vue|angular|sql|postgres|mongodb|sap|excel|power bi|linux|windows|plc|python|java|c#|php|laravel|analizator|kocioł|pomiary|automatyk/i.test(keyword)) {
        toolsAndTech.push(keyword);
      }
    }
  }

  return {
    hardSkills: dedupe(hardSkills),
    toolsAndTech: dedupe(toolsAndTech),
  };
}

function extractWorkExperience(clean: string, lines: string[], fallbackTitle: string): WorkExperience[] {
  const history: WorkExperience[] = [];
  const sectionMarkers = [/doświadczenie|experience|employment|career|work history|praktyka/i];
  const experienceLines = getSectionLines(lines, sectionMarkers);

  const candidateEntries: Array<{ company: string; role: string; startDate: string; endDate: string; description: string }> = [];

  for (const line of experienceLines.length ? experienceLines : lines) {
    if (!line || line.length > 180) continue;

    const directMatch = line.match(/^(.*?)(?:\s[-–—|]\s*|\s+at\s+)(.+)$/i);
    if (!directMatch) continue;

    const company = directMatch[1].trim();
    const role = directMatch[2].trim();
    if (!company || !role || /^(email|telefon|tel|adres|location|portfolio|linkedin|github)$/i.test(company)) continue;
    if (/\d{4}|obecnie|present|marzec|styczeń|luty|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(company)) continue;

    candidateEntries.push({
      company,
      role,
      startDate: '',
      endDate: '',
      description: '',
    });
  }

  if (candidateEntries.length > 0) {
    candidateEntries.slice(0, 4).forEach((entry, index) => {
      history.push({
        id: `exp_${Date.now()}_${index}`,
        company: entry.company,
        role: entry.role || fallbackTitle || '',
        location: extractLocation(clean) || '',
        startDate: entry.startDate,
        endDate: entry.endDate,
        isCurrent: /obecnie|present/i.test(entry.endDate),
        description: entry.description || '',
        highlights: [{
          id: `hl_${Date.now()}_${index}`,
          text: entry.description || '',
          action: '',
          target: '',
          tool: '',
          metric: '',
          keywords: [],
        }],
      });
    });
    return history;
  }

  return [];
}

function extractEducation(clean: string, lines: string[]): Education[] {
  const eduSection = getSectionLines(lines, [/wykształcenie|education|edukacja|szkolenie|training/i]);
  if (eduSection.length === 0) return [];

  const institution = eduSection.find((line) => /uniwersytet|politechnika|akademia|college|school|szkoła|institut|wyższa/i.test(line));
  const degree = eduSection.find((line) => /inżynier|magister|licencjat|technikum|studia|dyplom|podyplom|masters|bachelor|engineer/i.test(line));

  if (!institution && !degree) return [];

  return [{
    id: `edu_${Date.now()}`,
    institution: institution || '',
    degree: degree || '',
    fieldOfStudy: degree || '',
    startDate: '',
    endDate: '',
  }];
}

function extractCertifications(clean: string): Certification[] {
  const lines = clean.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const certs: Certification[] = [];

  for (const line of lines) {
    const certMatch = line.match(/(?:certyfikat|certificate|certification)\s*[:\-]?\s*(.+)/i);
    if (certMatch && certMatch[1]) {
      certs.push({
        id: `cert_${Date.now()}_${certs.length}`,
        name: certMatch[1].trim(),
        issuer: '',
        date: '',
      });
    }
  }

  return certs;
}

/**
 * Structural Semantic Parser - Converts unformatted text into a structured MasterVault
 */
export function parseTextToMasterVault(text: string, format: string = 'TXT'): ParsedCVResult {
  const clean = sanitizeTextInput(text);
  const lines = clean.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

  const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const phoneMatch = clean.match(/(?:\+?48\s*)?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{9})/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  const fullName = extractFullName(lines);
  const title = extractTitle(clean, lines) || '';
  const summary = extractSummary(clean) || '';
  const location = extractLocation(clean);
  const skillSet = extractSkills(clean);
  const history = extractWorkExperience(clean, lines, title);
  const education = extractEducation(clean, lines);
  const certifications = extractCertifications(clean);

  const skillsMatrix = {
    hardSkills: skillSet.hardSkills,
    softSkills: [],
    toolsAndTech: skillSet.toolsAndTech,
    certifications,
  };

  return {
    personalInfo: {
      fullName: fullName || '',
      title,
      email,
      phone,
      location: location || '',
      summary,
    },
    skillsMatrix,
    hardSkills: skillSet.hardSkills,
    softSkills: [],
    toolsAndTech: skillSet.toolsAndTech,
    certifications,
    history,
    education,
    rawText: clean,
    detectedFormat: format,
  };
}
