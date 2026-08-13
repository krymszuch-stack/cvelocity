import { describe, it, expect } from 'vitest';
import { parseComprehensiveLinkedInProfile } from '../linkedinParser';

describe('linkedinParser (LinkedIn Profile Importer & Archetype Extraction)', () => {
  it('1. Extracts profile handle and name from valid LinkedIn URL', () => {
    const profile = parseComprehensiveLinkedInProfile('https://www.linkedin.com/in/jan-kowalski-dev');

    expect(profile.url).toBe('https://www.linkedin.com/in/jan-kowalski-dev');
    expect(profile.fullName).toBe('Jan Kowalski Dev');
    expect(profile.title).toContain('Software Engineer');
    expect(profile.hardSkills.length).toBeGreaterThan(0);
    expect(profile.history.length).toBeGreaterThan(0);
    expect(profile.certifications.length).toBeGreaterThan(0);
  });

  it('2. Respects user-provided currentFullName over handle parsing', () => {
    const profile = parseComprehensiveLinkedInProfile(
      'https://www.linkedin.com/in/jkowalski-tech',
      'Janina Kowalska'
    );

    expect(profile.fullName).toBe('Janina Kowalska');
  });

  it('3. Does not hallucinate fake names when URL lacks handle and name is missing (AGENTS.md §8.3)', () => {
    const profile = parseComprehensiveLinkedInProfile('https://linkedin.com/in/');

    expect(profile.fullName).toBe('Specjalista');
  });
});
