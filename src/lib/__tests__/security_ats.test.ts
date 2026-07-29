import { describe, it, expect } from 'vitest';
import { sanitizeTextInput, scanProfanity } from '../securityGuardrails';
import { calculateAdvancedATSScore } from '../atsScorer';

describe('Security Guardrails & ATS Scoring Suite', () => {
  it('powinien odfiltrować skrypty XSS i niebezpieczne URIs', () => {
    const maliciousInput = '<script>alert("hacked")</script><a href="javascript:alert(1)">Link</a>';
    const clean = sanitizeTextInput(maliciousInput);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('javascript:');
  });

  it('powinien wykrywać i filtrować słowa wulgarne (PL/EN)', () => {
    const vulgarText = 'To jest bardzo kurwa słaby tekst';
    const scan = scanProfanity(vulgarText);

    expect(scan.isVulgar).toBe(true);
    expect(scan.sanitizedText).toContain('***');
  });

  it('powinien precyzyjnie wyliczyć wskaźnik ATS Score dla profilu CV', () => {
    const mockVault: any = {
      personalInfo: { title: 'Senior Frontend Developer', summary: 'Doświadczony inżynier oprogramowania' },
      skillsMatrix: { hardSkills: ['React', 'TypeScript', 'Tailwind', 'Node.js'], tools: ['Git', 'Vite'] },
      history: [{ id: '1', role: 'Frontend Dev', company: 'Tech', highlights: ['Tworzenie aplikacji React'] }],
    };

    const jobDescription = 'Poszukujemy Senior Frontend Developer ze znajomością React, TypeScript oraz Tailwind';
    const atsScores = calculateAdvancedATSScore(mockVault, jobDescription, 'Senior Frontend Developer');

    expect(atsScores.overallScore).toBeGreaterThan(60);
    expect(atsScores.workdayScore).toBeGreaterThan(60);
    expect(Array.isArray(atsScores.missingKeywords)).toBe(true);
  });
});
