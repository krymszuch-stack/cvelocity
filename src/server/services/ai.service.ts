import {
  parseRawCvToVault,
  optimizeDeltaPhrases,
  parseJobDescriptionWithGemini,
  generateCoverLetterWithFlash,
} from '../gemini';
import {
  MasterVault,
} from '../../types';
import {
  DeltaOptimizeResponse,
  InterviewPrepResponse,
} from '../../types/api';

export class AiService {
  /**
   * Parse raw text of resume into MasterVault data structure
   */
  async parseCv(rawText: string): Promise<Partial<MasterVault>> {
    return parseRawCvToVault(rawText);
  }

  /**
   * Parse Job Description text into structured requirements
   */
  async parseJd(rawJdText: string) {
    return parseJobDescriptionWithGemini(rawJdText);
  }

  /**
   * Optimize a single highlight sentence using STAR methodology
   */
  async optimizeDeltaPhrase(
    originalBullet: string,
    targetRole?: string,
    keywords: string[] = []
  ): Promise<DeltaOptimizeResponse> {
    try {
      const result = await optimizeDeltaPhrases(
        keywords,
        originalBullet,
        targetRole || 'Inżynier Oprogramowania'
      );
      if (result && result.optimizedText) {
        return {
          optimizedBullet: result.optimizedText,
          tokensSaved: 180,
          method: 'GEMINI_DELTA',
        };
      }
    } catch (e) {
      console.warn('Gemini delta optimize fallback to local STAR slot template:', e);
    }

    // Local deterministic fallback
    const rolePrefix = targetRole ? `w kontekście roli ${targetRole}` : '';
    const kwText = keywords.length > 0 ? ` z wykorzystaniem ${keywords.slice(0, 3).join(', ')}` : '';
    return {
      optimizedBullet: `Zrealizowałem ${originalBullet.trim().replace(/^[-•*]\s*/, '')}${kwText} ${rolePrefix}, osiągając wymierną poprawę kluczowych wskaźników wydajnościowych.`,
      tokensSaved: 220,
      method: 'SLOT_FILLING',
    };
  }

  /**
   * Generate Anti-Template Cover Letter
   */
  async generateCoverLetter(
    targetRole: string,
    companyName: string,
    jobDescription: string,
    vault: MasterVault
  ) {
    return generateCoverLetterWithFlash(
      vault,
      targetRole,
      companyName,
      jobDescription
    );
  }

  /**
   * Generate comprehensive Interview Preparation pack
   */
  async generateInterviewPrep(
    targetRole: string,
    companyName: string,
    jobDescription: string,
    vault: MasterVault
  ): Promise<InterviewPrepResponse> {
    const hardSkills = vault.skillsMatrix?.hardSkills || ['TypeScript', 'React'];
    const primarySkill = hardSkills[0] || 'Architektura';

    return {
      questions: [
        {
          question: `W jaki sposób optymalizujesz wydajność i skalowalność w projektach opartych o ${primarySkill}?`,
          difficulty: 'Wymagające',
          category: 'Techniczne',
          answerTip: `Wskaż konkretne metryki ze swojego profilu w ${companyName}, np. profilowanie renderów i redukcję obciążenia backendu.`,
        },
        {
          question: `Opisz wyzwanie architektoniczne, w którym musiałeś wdrożyć rozwiązanie pod presją czasu w roli ${targetRole}.`,
          difficulty: 'Średnie',
          category: 'Behawioralne (STAR)',
          answerTip: 'Zastosuj metodę STAR: kontekst sytuacji, zadanie inżynierskie, wdrożone akcje i mierzalny rezultat.',
        },
        {
          question: `Jakie dobre praktyki CI/CD i testowania automatycznego stosujesz w codziennej pracy?`,
          difficulty: 'Średnie',
          category: 'Procesy & Jakość',
          answerTip: 'Wymień testy jednostkowe Vitest/Jest, automatyzację pipeline w GitHub Actions oraz audyty bezpieczeństwa.',
        },
      ],
      starSuggestions: (vault.history || []).slice(0, 2).map((h) => ({
        situation: `Projekt ${h.role} w firmie ${h.company}.`,
        task: 'Poprawa stabilności systemu i automatyzacja procesów.',
        action: 'Wdrożenie architektury modularnej oraz optymalizacji zapytań.',
        result: h.highlights[0]?.text || 'Znaczące skrócenie czasu odpowiedzi aplikacji.',
      })),
      glossary: [
        { term: 'Lematyzacja ATS', definition: 'Sprowadzanie słów do formy podstawowej przez parser rekutacyjny.' },
        { term: 'Metryka STAR', definition: 'Struktura odpowiedzi na pytania rekrutacyjne: Situation, Task, Action, Result.' },
        { term: 'Recency Bias', definition: 'Faworyzowanie przez algorytmy ATS umiejętności używanych w najnowszym zatrudnieniu.' },
      ],
    };
  }
}

export const aiService = new AiService();
