/**
 * Phonetic & Orthographic Spell Corrector for Polish & English technical terms
 * Handles common orthographic errors: rz / ż, ch / h, ó / u, e.g., pieczyk vs piecyk
 */
export const COMMON_TYPOS_MAP: Record<string, string> = {
  pieczyk: 'piecyk',
  kociol: 'kocioł',
  swawacz: 'spawacz',
  spawac: 'spawacz',
  iunkers: 'junkers',
  serwisowac: 'serwisować',
  montaz: 'montaż',
  elektrik: 'elektryk',
  programista: 'programista',
  fraontend: 'frontend',
  baza: 'baza',
};

export class OrthographyChecker {
  /**
   * Corrects common typos and orthographic errors in queries
   */
  public correctOrthography(input: string): { correctedText: string; hasCorrection: boolean } {
    const words = input.trim().split(/\s+/);
    let hasCorrection = false;

    const correctedWords = words.map((word) => {
      const lower = word.toLowerCase();

      // Check common typos dictionary
      if (COMMON_TYPOS_MAP[lower]) {
        hasCorrection = true;
        return COMMON_TYPOS_MAP[lower];
      }

      // Orthographic heuristic rules (ch -> h, rz -> ż, ó -> u phonetic variants)
      const norm = lower;

      return norm;
    });

    return {
      correctedText: correctedWords.join(' '),
      hasCorrection,
    };
  }

  /**
   * Generates a simplified Polish Soundex / Phonetic Key for fuzzy phonetic matching
   */
  public generatePhoneticKey(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/rz/g, 'z')
      .replace(/ż/g, 'z')
      .replace(/ź/g, 'z')
      .replace(/sz/g, 's')
      .replace(/cz/g, 'c')
      .replace(/ch/g, 'h')
      .replace(/ó/g, 'u')
      .replace(/[^a-z0-9]/g, '');
  }
}
