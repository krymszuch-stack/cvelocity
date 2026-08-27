import { describe, it, expect } from 'vitest';
import {
  resolveRoleKnowledgeNode,
  generateExperienceVariants,
  formatActionWord,
  validateExperienceFact,
  ExperienceFact,
} from '../experienceEngine';

describe('Silnik Mikro-Wywiadu Doświadczenia (ExperienceEngine)', () => {
  it('poprawnie rozpoznaje węzeł grafu dla roli Software Engineer', () => {
    const node = resolveRoleKnowledgeNode('Senior Fullstack Engineer');
    expect(node.roleId).toBe('software_engineer');
    expect(node.areas.map((a) => a.id)).toContain('backend');
    expect(node.actions.backend).toContain('projektowałem');
  });

  it('poprawnie rozpoznaje węzeł grafu dla roli technicznej (monter / technik)', () => {
    const node = resolveRoleKnowledgeNode('Monter Instalacji HVAC');
    expect(node.roleId).toBe('trades_technician');
    expect(node.areas.map((a) => a.id)).toContain('installation');
    expect(node.actions.installation).toContain('montowałem');
  });

  it('poprawnie odmienia polskie czasowniki w stylach impersonal / male / female', () => {
    expect(formatActionWord('projektowałem', 'impersonal')).toBe('Projektowanie');
    expect(formatActionWord('projektowałem', 'first_person_m')).toBe('Projektowałem');
    expect(formatActionWord('projektowałem', 'first_person_f')).toBe('Projektowałam');

    expect(formatActionWord('wdrażałem', 'impersonal')).toBe('Wdrażanie');
    expect(formatActionWord('optymalizowałem', 'impersonal')).toBe('Optymalizacja');
  });

  it('generuje kompletne, niepuste warianty opisu doświadczenia na podstawie faktów', () => {
    const sampleFact: ExperienceFact = {
      role: 'Software Engineer',
      area: 'Backend',
      action: 'rozwijałem',
      objects: ['usługi backendowe', 'API REST'],
      technologies: ['Java', 'Spring Boot', 'PostgreSQL'],
      outcome: 'podnosząc stabilność i skalowalność aplikacji',
      metric: 'skrócenie czasu odpowiedzi o 30%',
      narrativeStyle: 'impersonal',
      verifiedByUser: true,
    };

    const validation = validateExperienceFact(sampleFact);
    expect(validation.isValid).toBe(true);

    const variants = generateExperienceVariants(sampleFact);
    expect(variants.length).toBe(3);

    const formal = variants[0];
    expect(formal.styleName).toBe('Formalny (Bezosobowy)');
    expect(formal.fullParagraph).toContain('Rozwój');
    expect(formal.fullParagraph).toContain('usługi backendowe oraz API REST');
    expect(formal.fullParagraph).toContain('Java, Spring Boot oraz PostgreSQL');
    expect(formal.fullParagraph).toContain('skrócenie czasu odpowiedzi o 30%');
  });

  it('odrzuca niekompletny fakt bez wymaganej akcji lub obiektów', () => {
    const badFact: ExperienceFact = {
      role: 'Tester',
      area: 'QA',
      action: '',
      objects: [],
      technologies: [],
      narrativeStyle: 'impersonal',
      verifiedByUser: false,
    };

    const validation = validateExperienceFact(badFact);
    expect(validation.isValid).toBe(false);
  });
});
