import { WorkExperience, Education, Certification } from '../types';
import { sanitizeTextInput } from './securityGuardrails';
import * as mammoth from 'mammoth';

/**
 * PDF.js is loaded on demand: importing it at module scope pulls in browser-only globals
 * (DOMMatrix) that break Node-based tests, and keeps the large library out of the initial bundle.
 */
async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjsLib;
}

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
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let pdfText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageItems = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      pdfText += pageItems + '\n';
    }
    if (pdfText.trim().length < 20) {
      throw new Error(
        'Nie udało się odczytać tekstu z tego pliku PDF. Prawdopodobnie jest to skan lub dokument zabezpieczony — wklej treść CV ręcznie.'
      );
    }
    return { text: pdfText, format: 'PDF' };
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

const SECTION_PATTERNS: Record<string, RegExp> = {
  experience: /^\s*(doświadczenie(\s+zawodowe)?|praktyka\s+zawodowa|work\s+experience|employment(\s+history)?|professional\s+experience)\s*:?\s*$/i,
  education: /^\s*(wykształcenie|edukacja|education|academic\s+background)\s*:?\s*$/i,
  certifications: /^\s*(certyfikaty|certyfikacje|uprawnienia|kursy|szkolenia|certifications?|licenses?)\s*:?\s*$/i,
  skills: /^\s*(umiejętności|kompetencje|kwalifikacje|skills|technologie)\s*:?\s*$/i,
  softSkills: /^\s*(umiejętności\s+miękkie|kompetencje\s+miękkie|soft\s+skills)\s*:?\s*$/i,
  summary: /^\s*(podsumowanie|o\s+mnie|o\s+sobie|profil(\s+zawodowy)?|summary|about)\s*:?\s*$/i,
};

/**
 * Splits CV text into labelled sections. Lines before any recognised heading land in `header`.
 */
function splitIntoSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = { header: [] };
  let current = 'header';

  for (const line of lines) {
    const matched = Object.entries(SECTION_PATTERNS).find(([, pattern]) => pattern.test(line));
    if (matched) {
      current = matched[0];
      if (!sections[current]) sections[current] = [];
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  }

  return sections;
}

const DATE_RANGE = /((?:0?[1-9]|1[0-2])[./-])?((?:19|20)\d{2})\s*(?:[-–—]|do|to)\s*((?:(?:0?[1-9]|1[0-2])[./-])?(?:19|20)\d{2}|obecnie|present|nadal|teraz)/i;

function normaliseDate(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/^(obecnie|present|nadal|teraz)$/i.test(trimmed)) return 'Obecnie';
  return trimmed.replace(/[./]/g, '-');
}

/**
 * Parses entries that follow the common "Employer — Role, 2020 - 2023" shape.
 * Returns an empty array when nothing matches — it never invents an entry.
 */
function parseExperienceEntries(sectionLines: string[]): WorkExperience[] {
  const entries: WorkExperience[] = [];

  const ENTRY_SEPARATOR = /\s+[-–—]\s+|\s*\|\s*/;

  sectionLines.forEach((line, index) => {
    const dateMatch = line.match(DATE_RANGE);
    // An entry header carries either a date range or an "Employer — Role" separator.
    if (!dateMatch && !ENTRY_SEPARATOR.test(line)) return;

    const withoutDates = line.replace(DATE_RANGE, '').replace(/[|(),;]+\s*$/, '').trim();
    const parts = withoutDates.split(ENTRY_SEPARATOR).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return;

    const startDate = dateMatch ? normaliseDate(`${dateMatch[1] ?? ''}${dateMatch[2] ?? ''}`) : '';
    const endDate = dateMatch ? normaliseDate(dateMatch[3]) : '';
    const followUp = sectionLines[index + 1];
    const isFollowUpAnEntry = followUp && (DATE_RANGE.test(followUp) || ENTRY_SEPARATOR.test(followUp));

    entries.push({
      id: `exp_parsed_${Date.now()}_${entries.length}`,
      company: parts[0],
      role: parts[1] ?? '',
      location: '',
      startDate,
      endDate,
      isCurrent: endDate === 'Obecnie',
      description: followUp && !isFollowUpAnEntry ? followUp : undefined,
      highlights: [],
    });
  });

  return entries;
}

/**
 * Parses education entries. Returns an empty array when the section is absent or unparseable.
 */
function parseEducationEntries(sectionLines: string[]): Education[] {
  const entries: Education[] = [];

  sectionLines.forEach((line) => {
    const dateMatch = line.match(DATE_RANGE);
    const withoutDates = line.replace(DATE_RANGE, '').replace(/[|(),;]+\s*$/, '').trim();
    const parts = withoutDates.split(/\s+[-–—]\s+|\s*\|\s*|\s*,\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return;

    entries.push({
      id: `edu_parsed_${Date.now()}_${entries.length}`,
      institution: parts[0],
      degree: parts[1] ?? '',
      fieldOfStudy: parts[2] ?? '',
      startDate: dateMatch ? normaliseDate(`${dateMatch[1] ?? ''}${dateMatch[2] ?? ''}`) : '',
      endDate: dateMatch ? normaliseDate(dateMatch[3]) : '',
    });
  });

  return entries;
}

/**
 * Parses certifications. Returns an empty array when none are present in the source document.
 */
function parseCertificationEntries(sectionLines: string[]): Certification[] {
  return sectionLines
    .map((line) => line.replace(/^[-•*•]\s*/, '').trim())
    .filter((line) => line.length > 2)
    .map((line, index) => {
      const yearMatch = line.match(/(19|20)\d{2}/);
      const withoutYear = line.replace(/[(,|-]?\s*(19|20)\d{2}\s*[),|]?/, '').trim();
      const parts = withoutYear.split(/\s+[-–—]\s+|\s*\|\s*|\s*,\s*/).map((p) => p.trim()).filter(Boolean);

      return {
        id: `cert_parsed_${Date.now()}_${index}`,
        name: parts[0] ?? withoutYear,
        issuer: parts[1] ?? '',
        date: yearMatch ? yearMatch[0] : undefined,
      };
    });
}

/**
 * Splits a skills section into individual entries (comma, bullet or slash separated).
 */
function parseSkillList(sectionLines: string[]): string[] {
  return sectionLines
    .flatMap((line) => line.replace(/^[-•*•]\s*/, '').split(/[,;/|]/))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 1 && entry.length < 40);
}

/**
 * Structural Semantic Parser - Converts unformatted text into a structured MasterVault.
 *
 * Contract: every field is derived from the source document. When a section is absent or
 * cannot be parsed the field stays empty — this parser must never invent placeholder content.
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
  const title = titleMatch ? titleMatch[0].trim() : '';

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
  const sections = splitIntoSections(lines);
  const summary = summaryMatch
    ? summaryMatch[1].trim()
    : (sections.summary ?? []).join(' ').trim();

  // 7. Section-driven extraction — absent sections stay empty rather than being invented
  const history = parseExperienceEntries(sections.experience ?? []);
  const education = parseEducationEntries(sections.education ?? []);
  const certifications = parseCertificationEntries(sections.certifications ?? []);
  const softSkills = parseSkillList(sections.softSkills ?? []);

  // 8. Extract Location (only when explicitly labelled)
  const locationMatch = clean.match(/(?:lokalizacja|miejscowość|adres|location):\s*([^\n]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : '';

  return {
    personalInfo: {
      fullName,
      title,
      email,
      phone,
      location,
      summary,
    },
    hardSkills: Array.from(new Set([...hardSkills, ...parseSkillList(sections.skills ?? [])])),
    softSkills,
    toolsAndTech: Array.from(new Set(toolsAndTech)),
    certifications,
    history,
    education,
    rawText: clean,
    detectedFormat: format,
  };
}
