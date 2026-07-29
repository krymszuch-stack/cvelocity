/**
 * Bilingual Polish/English Industry Jargon, Acronym & Anglicism Normalizer
 */
export interface JargonMapping {
  canonical: string;
  category: string;
  synonyms: string[];
}

export const JARGON_DICTIONARY: Record<string, JargonMapping> = {
  // IT & Software Engineering Jargon
  frontend: { canonical: 'Frontend', category: 'IT', synonyms: ['front-end', 'front end', 'fe', 'interfejs użytkownika'] },
  backend: { canonical: 'Backend', category: 'IT', synonyms: ['back-end', 'back end', 'be', 'serwer'] },
  fullstack: { canonical: 'Fullstack', category: 'IT', synonyms: ['full-stack', 'full stack', 'programista wszechstronny'] },
  devops: { canonical: 'DevOps', category: 'IT', synonyms: ['dev-ops', 'inżynier operacyjny', 'sysadmin cloud'] },
  sysadmin: { canonical: 'Administrator sieci i systemów', category: 'IT', synonyms: ['admin', 'admin sieci', 'systemowiec'] },
  bug: { canonical: 'błąd oprogramowania', category: 'IT', synonyms: ['usterka', 'defekt', 'bugi'] },
  debugowanie: { canonical: 'debugowanie i optymalizacja', category: 'IT', synonyms: ['szukanie błędów', 'debugin', 'debugowanie'] },
  deploy: { canonical: 'wdrożenie produkcyjne', category: 'IT', synonyms: ['deployowanie', 'deploj', 'publikacja systemowa'] },

  // Construction, HVAC & Plumbing Jargon
  co: { canonical: 'centralne ogrzewanie', category: 'Budownictwo', synonyms: ['c.o.', 'co', 'instalacja co', 'ogrzewanie centralne'] },
  cwu: { canonical: 'ciepła woda użytkowa', category: 'Budownictwo', synonyms: ['c.w.u.', 'cwu', 'woda użytkowa'] },
  hvac: { canonical: 'HVAC i Klimatyzacja', category: 'Budownictwo', synonyms: ['hvac', 'klimatyzacja', 'wentylacja', 'klima'] },
  junkers: { canonical: 'kocioł gazowy / piecyk gazowy', category: 'Budownictwo', synonyms: ['junkers', 'junkersy', 'piecyk gazowy', 'terma gazowa'] },
  podlogowka: { canonical: 'ogrzewanie podłogowe', category: 'Budownictwo', synonyms: ['podłogówka', 'instalacja podłogowa'] },

  // Welding & Industrial Jargon
  tig: { canonical: 'spawanie TIG (metoda 141)', category: 'Technika', synonyms: ['tig', 'spawanie nietopliwą'] },
  mag: { canonical: 'spawanie MAG (metoda 135)', category: 'Technika', synonyms: ['mag', 'mig', 'migomat', 'półautomat'] },
  sla: { canonical: 'Service Level Agreement (SLA)', category: 'Serwis', synonyms: ['sla', 'reżim sla', 'umowa serwisowa'] },

  // Automotive Jargon
  obd: { canonical: 'diagnostyka komputerowa OBD2', category: 'Motoryzacja', synonyms: ['obd2', 'obd', 'komputer diagnostyczny'] },
  rozrzad: { canonical: 'układ rozrządu', category: 'Motoryzacja', synonyms: ['rozrząd', 'wymiana rozrządu'] },
};

export class JargonMapper {
  /**
   * Normalizes incoming search query against industry jargon & anglicism dictionary
   */
  public normalizeJargon(input: string): { canonicalText: string; matchedCategory?: string; isJargonMatched: boolean } {
    const tokens = input.toLowerCase().trim().split(/[\s,.-]+/);
    let matchedCategory: string | undefined;
    let isJargonMatched = false;

    const normalizedTokens = tokens.map((token) => {
      // Direct key lookup
      if (JARGON_DICTIONARY[token]) {
        isJargonMatched = true;
        matchedCategory = JARGON_DICTIONARY[token].category;
        return JARGON_DICTIONARY[token].canonical;
      }

      // Synonym lookup
      for (const entry of Object.values(JARGON_DICTIONARY)) {
        if (entry.synonyms.includes(token)) {
          isJargonMatched = true;
          matchedCategory = entry.category;
          return entry.canonical;
        }
      }

      return token;
    });

    return {
      canonicalText: normalizedTokens.join(' '),
      matchedCategory,
      isJargonMatched,
    };
  }
}
