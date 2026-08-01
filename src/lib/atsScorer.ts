import { MasterVault } from '../types';
import { extractSlotsFromHighlight, eliminateSlogans } from './slotFillingEngine';

export interface ATSVendorScores {
  overallScore: number;
  workdayScore: number;
  greenhouseScore: number;
  leverScore: number;
  taleoScore: number;
  icimsScore: number;
  hardSkillsMatchCount: number;
  totalRequiredHardSkills: number;
  jobTitleMatchScore: number;
  recencyScore: number;
  formattingScore: number;
  missingKeywords: string[];
}

export function calculateAdvancedATSScore(vault: MasterVault, jobDescription: string, targetJobTitle: string): ATSVendorScores {
  if (!jobDescription || !vault) {
    return {
      overallScore: 50,
      workdayScore: 50,
      greenhouseScore: 50,
      leverScore: 50,
      taleoScore: 50,
      icimsScore: 50,
      hardSkillsMatchCount: 0,
      totalRequiredHardSkills: 0,
      jobTitleMatchScore: 50,
      recencyScore: 50,
      formattingScore: 100,
      missingKeywords: [],
    };
  }

  const lowerJd = jobDescription.toLowerCase();
  const lowerTitle = (targetJobTitle || vault.personalInfo.title || '').toLowerCase();
  const userTitle = (vault.personalInfo.title || '').toLowerCase();

  // 1. Hard Skills & Keyword Extraction
  const rawTokens = lowerJd.match(/\b[a-zA-Z0-9#+.-]{3,}\b/g) || [];
  const stopWords = new Set(['oraz', 'pracy', 'dla', 'firme', 'firmy', 'jest', 'naszym', 'szukamy', 'osoby', 'opisie', 'stanowiska', 'wymagania', 'oferujemy', 'praca', 'współpraca', 'będziesz', 'zespół', 'prosimy', 'doświadczenia']);
  const candidateKeywords = Array.from(new Set(rawTokens.filter((t: string) => !stopWords.has(t) && t.length > 2)));

  const vaultSkills = new Set([
    ...vault.skillsMatrix.hardSkills.map((s) => s.toLowerCase()),
    ...(vault.skillsMatrix.toolsAndTech || []).map((t) => t.toLowerCase()),
  ]);

  const matchedKeywords = candidateKeywords.filter((kw) => vaultSkills.has(kw));
  const missingKeywords = candidateKeywords.filter((kw) => !vaultSkills.has(kw));

  const keywordMatchRatio = candidateKeywords.length === 0 ? 1 : matchedKeywords.length / candidateKeywords.length;
  const hardSkillsScore = Math.min(100, Math.round(keywordMatchRatio * 100));

  // 2. Job Title Alignment (25% Weight)
  let jobTitleMatchScore = 40;
  if (userTitle && lowerTitle) {
    if (userTitle === lowerTitle) jobTitleMatchScore = 100;
    else if (userTitle.includes(lowerTitle) || lowerTitle.includes(userTitle)) jobTitleMatchScore = 85;
    else {
      const userWords = userTitle.split(/\s+/);
      const targetWords = lowerTitle.split(/\s+/);
      const common = userWords.filter((w) => targetWords.includes(w));
      if (common.length > 0) jobTitleMatchScore = 70;
    }
  }

  // 3. Recency & Experience Length (20% Weight)
  let recencyScore = 60;
  if (vault.history && vault.history.length > 0) {
    recencyScore = Math.min(100, 60 + vault.history.length * 10);
  }

  // 4. Formatting & Slogan Purification Penalty (15% Weight)
  const summaryFluff = eliminateSlogans(vault.personalInfo.summary || '').slogansRemoved.length;
  const formattingScore = Math.max(50, 100 - summaryFluff * 10);

  // Overall Weighted Score Calculation
  const overallScore = Math.round(
    hardSkillsScore * 0.4 +
    jobTitleMatchScore * 0.25 +
    recencyScore * 0.2 +
    formattingScore * 0.15
  );

  // Vendor Specific Simulation Weight Tuning
  const workdayScore = Math.min(100, Math.round(overallScore * 1.02));
  const greenhouseScore = Math.min(100, Math.round(overallScore * 0.96));
  const leverScore = Math.min(100, Math.round(overallScore * 0.98));
  const taleoScore = Math.min(100, Math.round(overallScore * 1.05));
  const icimsScore = Math.min(100, Math.round(overallScore * 0.94));

  return {
    overallScore,
    workdayScore,
    greenhouseScore,
    leverScore,
    taleoScore,
    icimsScore,
    hardSkillsMatchCount: matchedKeywords.length,
    totalRequiredHardSkills: candidateKeywords.length,
    jobTitleMatchScore,
    recencyScore,
    formattingScore,
    missingKeywords: missingKeywords.slice(0, 10),
  };
}
