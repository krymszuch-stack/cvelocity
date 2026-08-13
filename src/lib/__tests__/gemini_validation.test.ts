import { describe, it, expect } from 'vitest';
import {
  safeParseAndValidateJsonResponse,
  cvParserResponseSchema,
  optimizeDeltaPhrasesResponseSchema,
  jobDescriptionResponseSchema,
  advisorEducationalAdviceResponseSchema,
  coverLetterResponseSchema,
  interviewCheatSheetResponseSchema,
  parseJobDescriptionWithGemini,
} from '../../server/gemini';

describe('Gemini Response Validation and Fallback Tests', () => {
  it('powinien poprawnie sparsować poprawny JSON zgodny ze schematem CV Parser', () => {
    const validJson = JSON.stringify({
      personalInfo: {
        fullName: 'Jan Kowalski',
        title: 'Developer',
      },
      skillsMatrix: {
        hardSkills: ['TS', 'JS'],
      },
      history: [],
      education: [],
      profiler: {
        languages: [],
      },
    });

    const fallbackObj = {
      personalInfo: {
        fullName: 'Fallback',
        title: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        linkedin: '',
        github: '',
      },
      skillsMatrix: {
        hardSkills: [] as string[],
        softSkills: [] as string[],
        toolsAndTech: [] as string[],
        certifications: [] as Array<{ id: string; name: string; issuer: string; date: string }>,
      },
      history: [] as Array<{ id: string; role: string; company: string; startDate: string; endDate: string; highlights: any[] }>,
      education: [] as Array<{ id: string; degree: string; institution: string; fieldOfStudy: string; startDate: string; endDate: string }>,
      profiler: {
        languages: [] as Array<{ language: string; level: string }>,
      },
    };
    const result = safeParseAndValidateJsonResponse(validJson, cvParserResponseSchema, fallbackObj);
    expect(result).not.toEqual(fallbackObj);
    expect(result.personalInfo?.fullName).toBe('Jan Kowalski');
    expect(result.skillsMatrix?.hardSkills).toContain('TS');
  });

  it('powinien bezpiecznie zwrócić fallback przy uszkodzonym JSON', () => {
    const malformedJson = '{ "personalInfo": { "fullName": "Jan" '; // brak zamknięcia klamry i cudzysłowu

    const fallbackObj = {
      personalInfo: {
        fullName: 'Fallback',
        title: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        linkedin: '',
        github: '',
      },
      skillsMatrix: {
        hardSkills: [] as string[],
        softSkills: [] as string[],
        toolsAndTech: [] as string[],
        certifications: [] as Array<{ id: string; name: string; issuer: string; date: string }>,
      },
      history: [] as Array<{ id: string; role: string; company: string; startDate: string; endDate: string; highlights: any[] }>,
      education: [] as Array<{ id: string; degree: string; institution: string; fieldOfStudy: string; startDate: string; endDate: string }>,
      profiler: {
        languages: [] as Array<{ language: string; level: string }>,
      },
    };
    const result = safeParseAndValidateJsonResponse(malformedJson, cvParserResponseSchema, fallbackObj);
    expect(result).toEqual(fallbackObj);
  });

  it('powinien bezpiecznie zwrócić fallback, gdy struktura JSON nie odpowiada schematowi Zod', () => {
    // Brak wymaganych pól dla optimizeDeltaPhrasesResponseSchema (optimizedText i keywordsMatched są wymagane)
    const invalidSchemaJson = JSON.stringify({
      somethingElse: 'abc',
    });

    const fallback = { optimizedText: 'original', keywordsMatched: [] };
    const result = safeParseAndValidateJsonResponse(invalidSchemaJson, optimizeDeltaPhrasesResponseSchema, fallback);
    expect(result).toEqual(fallback);
  });

  it('powinien obsługiwać bloki kodu markdown ```json i nadal poprawnie parsować', () => {
    const markdownJson = '```json\n{\n  "optimizedText": "nowy tekst",\n  "keywordsMatched": ["React"]\n}\n```';

    const fallback = { optimizedText: 'original', keywordsMatched: [] };
    const result = safeParseAndValidateJsonResponse(markdownJson, optimizeDeltaPhrasesResponseSchema, fallback);
    expect(result.optimizedText).toBe('nowy tekst');
    expect(result.keywordsMatched).toContain('React');
  });

  it('powinien walidować schemat Advisor Educational Advice i zwracać fallback przy braku pól', () => {
    const invalidJson = JSON.stringify({
      explanation: 'Wyjaśnienie bez tips i actionItems',
    });

    const fallback = {
      explanation: 'default',
      tips: [],
      actionItems: [],
    };

    const result = safeParseAndValidateJsonResponse(invalidJson, advisorEducationalAdviceResponseSchema, fallback);
    expect(result).toEqual(fallback);
  });

  it('powinien walidować schemat Cover Letter i poprawnie parsować prawidłowy format', () => {
    const validJson = JSON.stringify({
      hook: 'Haczyk',
      proofPoints: ['Punkt 1'],
      callToAction: 'CTA',
      fullText: 'Pełny tekst',
    });

    const result = safeParseAndValidateJsonResponse(validJson, coverLetterResponseSchema, null);
    expect(result).not.toBeNull();
    expect(result?.hook).toBe('Haczyk');
  });

  it('powinien walidować schemat Interview Cheat Sheet i zwracać fallback przy błędnym typie pola', () => {
    const invalidJson = JSON.stringify({
      starPoints: [
        {
          requirement: 'Wymaganie',
          situation: 'Sytuacja',
          task: 'Zadanie',
          action: 'Działanie',
          // Brak pola "result"
        }
      ],
      emergencyPhrases: 'To powinno być tablicą, a nie stringiem',
      companyQuestions: [],
    });

    const fallback = {
      starPoints: [],
      emergencyPhrases: [],
      companyQuestions: [],
    };

    const result = safeParseAndValidateJsonResponse(invalidJson, interviewCheatSheetResponseSchema, fallback);
    expect(result).toEqual(fallback);
  });

  it('parseJobDescriptionWithGemini powinien spaść do lokalnego parsera zamiast rzucać błąd, gdy Gemini jest niedostępny', async () => {
    // No GEMINI_API_KEY is set in the test environment, which is the same situation
    // as a 429 rate-limit or an outage in production: previously this call threw and
    // the whole "wklej link do oferty" / "wklej treść ogłoszenia" flow failed with
    // nothing shown to the user, instead of degrading to the local, token-free parser.
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const result = await parseJobDescriptionWithGemini(
        'Senior Frontend Developer\nWymagania: React, TypeScript, Docker.'
      );
      expect(result.requiredHardSkills).toEqual(expect.arrayContaining(['React', 'TypeScript']));
      expect(result.jobTitle).toBeTruthy();
    } finally {
      if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
