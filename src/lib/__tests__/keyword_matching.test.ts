import { describe, it, expect } from 'vitest';
import { normalizeText, matchesKeyword } from '../keywordMatching';

describe('keywordMatching (Text Normalization & Unicode Boundary Matching)', () => {
  describe('normalizeText', () => {
    it('1. Lowercases, trims, and collapses multiple spaces', () => {
      expect(normalizeText('  TypeScript   React  \n Node.js ')).toBe('typescript react node.js');
    });

    it('2. Handles empty or null strings gracefully', () => {
      expect(normalizeText('')).toBe('');
    });
  });

  describe('matchesKeyword', () => {
    it('1. Matches exact and word boundary keywords correctly', () => {
      expect(matchesKeyword('Znajomość języka TypeScript oraz React.js', 'TypeScript')).toBe(true);
      expect(matchesKeyword('Znajomość narzędzia Git w projektach', 'Git')).toBe(true);
    });

    it('2. Prevents false positive substring matches inside other words', () => {
      expect(matchesKeyword('Marketing cyfrowy i media digital', 'git')).toBe(false);
      expect(matchesKeyword('Sprzedaż B2B oraz B2C', 'b2')).toBe(false);
    });

    it('3. Matches Polish stemmed variations', () => {
      expect(matchesKeyword('Doświadczenie w programowaniu aplikacji', 'programowanie')).toBe(true);
      expect(matchesKeyword('Zarządzanie projektami informatycznymi', 'zarządzania')).toBe(true);
    });

    it('4. Rejects single-character needles unless specifically allowed (R or C)', () => {
      expect(matchesKeyword('Język C oraz R w analizie danych', 'R')).toBe(true);
      expect(matchesKeyword('Język C oraz R w analizie danych', 'C')).toBe(true);
      expect(matchesKeyword('Projekt z technologią X', 'a')).toBe(false);
    });
  });
});
