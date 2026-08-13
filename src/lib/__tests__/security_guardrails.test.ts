import { describe, it, expect } from 'vitest';
import { sanitizeTextInput, scanProfanity, validateSecurityPayload } from '../securityGuardrails';

describe('securityGuardrails (Sanitization, XSS Prevention & Profanity Scan)', () => {
  describe('sanitizeTextInput', () => {
    it('1. Strips HTML script tags and HTML elements', () => {
      const raw = 'Hello <script>alert("XSS")</script> World <b>bold</b>';
      const clean = sanitizeTextInput(raw);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<b>');
      expect(clean).toBe('Hello alert("XSS") World bold');
    });

    it('2. Neutralizes javascript: protocols and dangerous DOM handlers', () => {
      const raw = '<a href="javascript:alert(1)" onclick="eval(1)">Link</a>';
      const clean = sanitizeTextInput(raw);

      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('onclick=');
      expect(clean).not.toContain('eval(');
    });
  });

  describe('scanProfanity', () => {
    it('1. Detects and masks vulgar words', () => {
      const { isVulgar, detectedWords, sanitizedText } = scanProfanity('To jest kurwa niesamowite');

      expect(isVulgar).toBe(true);
      expect(detectedWords.length).toBe(1);
      expect(sanitizedText).toContain('***');
    });

    it('2. Leaves clean text intact', () => {
      const { isVulgar, sanitizedText } = scanProfanity('Profesjonalne CV i doświadczenie');

      expect(isVulgar).toBe(false);
      expect(sanitizedText).toBe('Profesjonalne CV i doświadczenie');
    });
  });

  describe('validateSecurityPayload', () => {
    it('1. Validates payload and reports profanity errors while sanitizing strings', () => {
      const payload = {
        title: 'Senior Developer <script>alert(1)</script>',
        summary: 'Tekst z chujowy słowem',
        score: 95,
      };

      const result = validateSecurityPayload(payload);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.sanitizedData.title).toBe('Senior Developer alert(1)');
      expect(result.sanitizedData.summary).toContain('***');
      expect(result.sanitizedData.score).toBe(95);
    });
  });
});
