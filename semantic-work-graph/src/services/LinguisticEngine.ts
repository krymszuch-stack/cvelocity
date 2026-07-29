import { JargonMapper } from './JargonMapper.js';
import { OrthographyChecker } from './OrthographyChecker.js';

export interface VerbalTransformation {
  actionVerb: string;
  actionNoun: string;
  actorProfession: string;
}

export const VERBAL_NOUN_MAP: VerbalTransformation[] = [
  { actionVerb: 'serwisować', actionNoun: 'serwisowanie', actorProfession: 'serwisant' },
  { actionVerb: 'montować', actionNoun: 'montaż', actorProfession: 'monter' },
  { actionVerb: 'spawać', actionNoun: 'spawanie', actorProfession: 'spawacz' },
  { actionVerb: 'naprawiać', actionNoun: 'naprawa', actorProfession: 'mechanik' },
  { actionVerb: 'programować', actionNoun: 'programowanie', actorProfession: 'programista' },
  { actionVerb: 'projektować', actionNoun: 'projektowanie', actorProfession: 'projektant' },
  { actionVerb: 'zarządzać', actionNoun: 'zarządzanie', actorProfession: 'administrator' },
  { actionVerb: 'diagnozować', actionNoun: 'diagnostyka', actorProfession: 'diagnosta' },
];

export class LinguisticEngine {
  private jargonMapper: JargonMapper;
  private orthographyChecker: OrthographyChecker;

  constructor() {
    this.jargonMapper = new JargonMapper();
    this.orthographyChecker = new OrthographyChecker();
  }

  /**
   * Complete Morphological & Linguistic Pipeline:
   * 1. Orthographic typo correction
   * 2. Jargon & anglicism canonical mapping
   * 3. Verbal-case & declension noun/verb transformations
   */
  public processQuery(rawInput: string): {
    original: string;
    corrected: string;
    canonicalJargon: string;
    verbalNouns: string[];
    actorProfessions: string[];
    phoneticKey: string;
  } {
    // Step 1: Orthography check
    const { correctedText } = this.orthographyChecker.correctOrthography(rawInput);

    // Step 2: Jargon & Anglicism normalization
    const { canonicalText } = this.jargonMapper.normalizeJargon(correctedText);

    // Step 3: Verbal-case transformation
    const verbalNouns: string[] = [];
    const actorProfessions: string[] = [];
    const lowerTokens = canonicalText.toLowerCase().split(/\s+/);

    lowerTokens.forEach((token) => {
      VERBAL_NOUN_MAP.forEach((rule) => {
        if (
          token.includes(rule.actionVerb) ||
          token.includes(rule.actionNoun) ||
          token.includes(rule.actorProfession)
        ) {
          if (!verbalNouns.includes(rule.actionNoun)) verbalNouns.push(rule.actionNoun);
          if (!actorProfessions.includes(rule.actorProfession)) actorProfessions.push(rule.actorProfession);
        }
      });
    });

    // Step 4: Phonetic key
    const phoneticKey = this.orthographyChecker.generatePhoneticKey(canonicalText);

    return {
      original: rawInput,
      corrected: correctedText,
      canonicalJargon: canonicalText,
      verbalNouns,
      actorProfessions,
      phoneticKey,
    };
  }
}
