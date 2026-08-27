export interface GrammarTemplates {
  styles: {
    id: string;
    styleName: 'Mocne Osiągnięcia' | 'Specjalistyczny' | 'Zorientowany na Wyniki' | 'Kompaktowy' | 'Menedżerski';
    templates: string[];
  }[];
}

export const GRAMMAR: GrammarTemplates = {
  styles: [
    {
      id: 'style_achieve',
      styleName: 'Mocne Osiągnięcia',
      templates: [
        '{ADJ} {TITLE} z {YEARS_CLAUSE} w {DOMAIN}. W dotychczasowej pracy {ACHIEVE_VERB} kluczowe rozwiązania, {IMPACT}. {SKILL_CLAUSE}.',
        '{TITLE} {CONNECTOR} {DOMAIN}. Konsekwentnie {ACHIEVE_VERB} powierzone zadania, {IMPACT}. {SKILL_CLAUSE}.',
      ],
    },
    {
      id: 'style_tech',
      styleName: 'Specjalistyczny',
      templates: [
        '{ADJ} {TITLE} z {YEARS_CLAUSE} praktyki zawodowej. {SKILL_CLAUSE}, z naciskiem na {DOMAIN}. Skutecznie {ACHIEVE_VERB} projekty, {IMPACT}.',
        '{TITLE} {CONNECTOR} {DOMAIN}. Biegle wykorzystuję w praktyce {SKILLS_LIST}. W projektach {ACHIEVE_VERB} rozwiązania, {IMPACT}.',
      ],
    },
    {
      id: 'style_results',
      styleName: 'Zorientowany na Wyniki',
      templates: [
        '{ADJ} {TITLE}, który w dotychczasowej karierze {ACHIEVE_VERB} procesy w {DOMAIN}. {IMPACT_CAPITALIZED}. {SKILL_CLAUSE}.',
        '{TITLE} {CONNECTOR} {DOMAIN}. Nastawiony na mierzalne rezultaty i {IMPACT}. {SKILL_CLAUSE}.',
      ],
    },
    {
      id: 'style_compact',
      styleName: 'Kompaktowy',
      templates: [
        '{ADJ} {TITLE} z {YEARS_CLAUSE} w {DOMAIN}. {SKILL_CLAUSE}. W pracy {ACHIEVE_VERB} rozwiązania, {IMPACT}.',
        '{TITLE} {CONNECTOR} {DOMAIN}. Główne kompetencje to {SKILLS_LIST}. Zawsze {ACHIEVE_VERB} procesy, {IMPACT}.',
      ],
    },
    {
      id: 'style_lead',
      styleName: 'Menedżerski',
      templates: [
        '{ADJ} {TITLE} z ponad {YEARS_CLAUSE} w {DOMAIN}. Doświadczenie obejmuje koordynację prac i wdrażanie standardów, {IMPACT}. {SKILL_CLAUSE}.',
        '{TITLE} {CONNECTOR} {DOMAIN}. Łączę wiedzę techniczną z orientacją na cel, {IMPACT}. Specjalizuję się w {SKILLS_LIST}.',
      ],
    },
  ],
};
