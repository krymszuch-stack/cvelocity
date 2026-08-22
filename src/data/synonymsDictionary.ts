/**
 * Internal Synonyms & Industry Equivalence Dictionary
 * 
 * Normalizes title variations, banking/corporate acronyms, sector terminology,
 * brand equivalences (e.g. Bank Pekao vs PKO BP vs ING vs mBank), and prevents
 * keyword noise, slang errors or duplicate skill clutter in CV generation.
 */

export interface PositionSynonymGroup {
  id: string;
  canonicalTitle: string;
  industry: string;
  aliases: string[];
  corporateEquivalents: {
    pekao?: string;
    pkoBp?: string;
    ing?: string;
    mbank?: string;
    santander?: string;
    general?: string[];
  };
  keywordSynonyms: Record<string, string[]>;
}

export interface IndustrySlangEntry {
  slang: string;
  formalTerm: string;
  category: string;
  reason: string;
}

export const INDUSTRY_SLANG_DICTIONARY: IndustrySlangEntry[] = [
  // Bankowość & Finanse
  {
    slang: 'klepanie przelewów',
    formalTerm: 'Realizacja i weryfikacja transakcji finansowych oraz zleceń płatniczych',
    category: 'Bankowość & Finanse',
    reason: 'Słowo "klepanie" obniża rangę stanowiska. Formuła "Realizacja i weryfikacja transakcji" wskazuje na znajomość procedur transakcyjnych.',
  },
  {
    slang: 'infolinia pekao',
    formalTerm: 'Obsługa klientów detalicznych i obsługa procedur w Pekao Direct (Bank Pekao S.A.)',
    category: 'Bankowość & Finanse',
    reason: 'Nazwa "Pekao Direct" to oficjalna jednostka Contact Center w strukturze Banku Pekao S.A., co budzi większe zaufanie rekrutera.',
  },
  {
    slang: 'odbieranie telefonów w pko',
    formalTerm: 'Obsługa przychodzących zgłoszeń klientów indywidualnych w PKO Banku Polskim',
    category: 'Bankowość & Finanse',
    reason: 'Bierność ("odbieranie") zastąpiono aktywnym zarządzeniem relacją ("Obsługa przychodzących zgłoszeń").',
  },
  {
    slang: 'wciskanie kredytów',
    formalTerm: 'Badanie potrzeb finansowych oraz doradztwo w zakresie produktów kredytowych i pożyczkowych',
    category: 'Bankowość & Finanse',
    reason: 'Określenia potoczne dyskwalifikują w systemach ATS. Doradztwo i badanie potrzeb to standard KNF.',
  },
  {
    slang: 'ogarnianie reklamacji',
    formalTerm: 'Procesowanie i deeskalacja zgłoszeń reklamacyjnych zgodnie ze standardami SLA i KNF',
    category: 'Bankowość & Finanse',
    reason: 'Podanie akronimów SLA i KNF poświadcza procesową dojrzałość kandydata.',
  },

  // Gaz, Instalacje & HVAC
  {
    slang: 'junkersy',
    formalTerm: 'Serwis, przeglądy i konserwacja gazowych podgrzewaczy wody oraz kotłów',
    category: 'Instalacje & HVAC',
    reason: '"Junkers" to marka, ale potocznie używana jako nazwa urządzenia. W CV podajemy precyzyjny typ urządzeń i marki.',
  },
  {
    slang: 'sprawdzanie czy nie kadzi gaz',
    formalTerm: 'Wykończenie próby szczelności instalacji gazowej analizatorem i detektorem gazu',
    category: 'Instalacje & HVAC',
    reason: 'W branży gazowej liczy się operowanie nazewnictwem z przepisów dozoru technicznego (SEP G3, próba szczelności).',
  },
  {
    slang: 'dłubanie w piecach',
    formalTerm: 'Diagnostyka układów hydraulicznych, wymiana podzespołów i czyszczenie komory spalania',
    category: 'Instalacje & HVAC',
    reason: 'Techniczne określenia podzespołów (komora spalania, układ hydrauliczny) są punktowane przez rekruterów technicznych.',
  },

  // IT & Software
  {
    slang: 'klepanie kodu',
    formalTerm: 'Tworzenie i rozwój czystego kodu (Clean Code) oraz architektury aplikacji',
    category: 'IT & Software',
    reason: 'Zwrot "klepanie kodu" sugeruje brak dbałości o jakość. Inżynieria wymaga pojęć takich jak Clean Code i architektur.',
  },
  {
    slang: 'stawianie stron na wordpressie',
    formalTerm: 'Wdrażanie, konfiguracja oraz optymalizacja serwisów www z wykorzystaniem CMS WordPress',
    category: 'IT & Software',
    reason: 'Wdrażanie i optymalizacja brzmią profesjonalnie i akcentują wartość biznesową.',
  },
  {
    slang: 'gasiłem pożary w sieci',
    formalTerm: 'Reagowanie na incydenty sieciowe oraz przywracanie dostępności usług (Incident Management)',
    category: 'IT & Software',
    reason: 'Wspominamy o standardach ITSM / Incident Management zamiast kolokwializmów.',
  },

  // Budownictwo & Wykończenia
  {
    slang: 'kafelkowanie',
    formalTerm: 'Precyzyjny montaż okładzin ceramicznych, gresu wielkoformatowego i spieków kwarcowych',
    category: 'Budownictwo',
    reason: 'Słowo "kafelkowanie" jest przestarzałe. Branża stosuje podział na gres wielkoformatowy, spieki i ukosowanie 45°.',
  },
  {
    slang: 'zacinanie narożników',
    formalTerm: 'Ukosowanie krawędzi płytek pod kątem 45 stopni (szlifowanie typu Jolly)',
    category: 'Budownictwo',
    reason: 'Nazwa "Jolly" lub "ukosowanie 45°" to profesjonalny termin znany wykonawcom i architektom.',
  },

  // Logistyka & Transport
  {
    slang: 'szukanie ładunków na giełdzie',
    formalTerm: 'Pozyskiwanie frachtów oraz optymalizacja załadunków w serwisach Trans.eu i TimoCom',
    category: 'Logistyka & Transport',
    reason: 'Wymienienie konkretnych platform giełdowych (Trans.eu, TimoCom) podnosi wartość profilu spedycyjnego.',
  },
  {
    slang: 'pilnowanie kierowców',
    formalTerm: 'Monitorowanie czasu pracy kierowców oraz zgodności z rozporządzeniem AETR i tachografem',
    category: 'Logistyka & Transport',
    reason: 'Wskazanie norm prawnych (AETR, tachograf cyfrowy) podkreśla odpowiedzialność formalną.',
  },

  // Tłumaczenia & Języki
  {
    slang: 'tłumaczenie papierów',
    formalTerm: 'Sporządzanie przekładów poświadczonych i urzędowych wpisywanych do Repertorium Tłumacza Przysięgłego',
    category: 'Języki & Przekład',
    reason: 'Tłumacz przysięgły operuje terminologią prawniczą i ewidencyjną (Repertorium, Klauzula Poświadczeniowa).',
  },
];

export const POSITION_SYNONYM_GROUPS: PositionSynonymGroup[] = [
  {
    id: 'banking_customer_advisor',
    canonicalTitle: 'Inspektor / Doradca Klienta w Bankowości (Contact Center & Oddział)',
    industry: 'Bankowość & Finanse',
    aliases: [
      'Inspektor ds. Obsługi Klienta',
      'Doradca Klienta Indywidualnego',
      'Konsultant ds. Finansów',
      'Specjalista ds. Obsługi Klienta Bankowego',
      'Doradca Klienta Bankowego',
      'Konsultant Infolinii Bankowej',
      'Agent Contact Center Banku',
      'Banker / Retail Banking Specialist',
    ],
    corporateEquivalents: {
      pekao: 'Inspektor / Młodszy Inspektor ds. Obsługi Klienta i Procedur Bankowych (Bank Pekao S.A.)',
      pkoBp: 'Doradca Klienta Indywidualnego / Specjalista ds. Sprzedaży Produktów Bankowych (PKO BP)',
      ing: 'Konsultant ds. Finansów i Bankowości Elektronicznej (ING Bank Śląski)',
      mbank: 'Specjalista ds. Obsługi Klienta i Zgłoszeń SLA (mBank S.A.)',
      santander: 'Doradca Klienta w Oddziale / Contact Center (Santander Bank Polska)',
      general: ['Pekao Direct', 'PKO BP Infolinia', 'ING Contact Center', 'mBank Call Center'],
    },
    keywordSynonyms: {
      kyc: ['KYC', 'Know Your Customer', 'Weryfikacja Tożsamości Klienta', 'Identyfikacja Klienta'],
      aml: ['AML', 'Anti-Money Laundering', 'Przeciwdziałanie Praniu Pieniędzy', 'Weryfikacja Transakcyjna'],
      sla: ['SLA', 'Service Level Agreement', 'Standard Czasu Obsługi Zgłoszeń', 'Reżim Czasowy Zgłoszenia'],
      bik: ['BIK', 'Biuro Informacji Kredytowej', 'Weryfikacja Historii Kredytowej BIK'],
      knf: ['KNF', 'Komisja Nadzoru Finansowego', 'Wytyczne KNF', 'Standardy Nadzorcze KNF'],
      rodo: ['RODO', 'GDPR', 'Ochrona Danych Osobowych', 'Poufność Transakcyjna'],
      deescalation: ['Deeskalacja', 'Rozwiązywanie Konfliktów', 'Obsługa Reklamacji', 'Zarządzanie Trudnym Klientem'],
    },
  },
  {
    id: 'hvac_gas_service',
    canonicalTitle: 'Monter & Serwisant Piecyków i Kotłów Gazowych (HVAC)',
    industry: 'Instalacje, Gaz & HVAC',
    aliases: [
      'Monter Piecyków Gazowych',
      'Serwisant Kotłów Gazowych',
      'Technik Urządzeń Grzewczych',
      'Instalator Gazowy',
      'Hydraulik Gazowy',
      'Monter Instalacji Sanitarnych i Gazowych',
      'Technik Serwisu Kotłowni',
    ],
    corporateEquivalents: {
      general: ['Autoryzowany Serwisant Junkers / Bosch', 'Partner Vaillant / Saunier Duval', 'Serwisant Ariston / Viessmann'],
    },
    keywordSynonyms: {
      sep_g3: ['SEP G3', 'Uprawnienia Gazowe G3', 'Dozór i Eksploatacja Gazowa G3', 'Kwalifikacja E/D G3'],
      sep_g1: ['SEP G1', 'Uprawnienia Elektryczne do 1kV', 'Kwalifikacja E/D G1'],
      spaliny: ['Analiza Spalin', 'Badanie Emisji Testo', 'Analizator Spalin Testo 300', 'Pomiar CO/CO2'],
      szczelnosc: ['Próba Szczelności Gazowej', 'Detekcja Nieszczelności', 'Próba Ciśnieniowa Gazowa', 'Manometr U-rurkowy'],
      kotly: ['Kocioł Gazowy', 'Piecyk Gazowy', 'Junkers', 'Wymiennik Ciepła', 'Komora Spalania', 'Palnik Gazowy'],
    },
  },
  {
    id: 'it_frontend_developer',
    canonicalTitle: 'Frontend Developer (React / TypeScript)',
    industry: 'IT & Software Engineering',
    aliases: [
      'Frontend Developer',
      'React Developer',
      'Programista Frontend',
      'Inżynier Frontend',
      'JavaScript / TypeScript Developer',
      'Web Developer (Frontend)',
      'UI Software Engineer',
    ],
    corporateEquivalents: {
      general: ['Frontend Engineer', 'React Software Developer', 'Fullstack JS Developer (Frontend Focus)'],
    },
    keywordSynonyms: {
      react: ['React 19', 'React.js', 'React Native', 'Hooks', 'Context API', 'Redux', 'Zustand'],
      typescript: ['TypeScript', 'TS', 'Strict Type-Safety', 'Generics'],
      tailwind: ['Tailwind CSS', 'Tailwind v4', 'Utility-First CSS', 'Shadcn UI', 'Responsive Design'],
      rest: ['REST API', 'GraphQL', 'Fetch API', 'Axios', 'Integracja Backendowa'],
    },
  },
  {
    id: 'it_helpdesk_hardware',
    canonicalTitle: 'Technik IT & Serwisant Hardware / Sieci (E.12 / E.13)',
    industry: 'IT & Wparcie Techniczne',
    aliases: [
      'Technik IT',
      'Serwisant Hardware',
      'Specjalista Helpdesk',
      'Technik Komputerowy',
      'Inżynier Wsparcia IT',
      'Administrator Stacji Roboczych',
      'Młodszy Administrator Sieci',
    ],
    corporateEquivalents: {
      pekao: 'Technik Wsparcia IT / Helpdesk (Polsat / Interia / Pekao IT)',
      general: ['IT Support Specialist', 'Field Service Technician', 'Desktop Support Engineer'],
    },
    keywordSynonyms: {
      kwalifikacje_it: ['E.12', 'E.13', 'INF.02', 'INF.03', 'Kwalifikacje Zawodowe IT'],
      ad: ['Active Directory', 'AD', 'Zarządzanie Kontami AD', 'Domain Controller'],
      lan: ['LAN', 'WAN', 'VLAN', 'Zarabianie Skrętki RJ45', 'Routery Cisco / MikroTik'],
      diagnoza: ['Diagnostyka Hardware', 'Naprawa Płyt Głównych', 'Wymiana Podzespołów', 'MemTest86'],
    },
  },
  {
    id: 'translation_sworn',
    canonicalTitle: 'Tłumacz Przysięgły / Poświadczony',
    industry: 'Języki & Przekładoznawstwo',
    aliases: [
      'Tłumacz Przysięgły',
      'Tłumacz Poświadczony',
      'Sworn Translator',
      'Tłumacz Urzędowy',
      'Tłumacz Sądowy',
      'Certified Legal Translator',
    ],
    corporateEquivalents: {
      general: ['Tłumacz Przysięgły wpisany na Listę Ministra Sprawiedliwości (MS)', 'Członek TEPIS'],
    },
    keywordSynonyms: {
      ms_wpis: ['Wpis na Listę Tłumaczy Przysięgłych MS', 'Uprawnienia Tłumacza Przysięgłego', 'Pieczęć Tłumacza'],
      repertorium: ['Repertorium Tłumacza', 'Rejestr Wpisów Poświadczonych', 'Klauzula Poświadczeniowa'],
      cat_tools: ['Trados Studio', 'memoQ', 'Wordfast', 'Narzędzia CAT'],
    },
  },
  {
    id: 'construction_tiler',
    canonicalTitle: 'Glazurnik & Fachowiec Wykończeniowy',
    industry: 'Budownictwo & Wykończenia',
    aliases: [
      'Glazurnik',
      'Fliziarz',
      'Kafelkarz',
      'Monter Płytek',
      'Glazurnik Wielkoformatowy',
      'Specjalista Prac Wykończeniowych',
      'Fachowiec Glazurniczy',
    ],
    corporateEquivalents: {
      general: ['Autoryzowany Wykonawca Mapei / Atlas / Knauf'],
    },
    keywordSynonyms: {
      szlifowanie: ['Szlifowanie 45°', 'Ukosowanie Krawędzi', 'Jolly', 'Faza 45 stopni'],
      hydroizolacja: ['Hydroizolacja', 'Folia w Płynie', 'Taśmy Uszczelniające', 'Mapei Mapegum'],
      wielki_format: ['Płytki Wielkoformatowe', 'Gres Slim', 'Spiek Kwarcowy', 'Raimondi System'],
    },
  },
  {
    id: 'automotive_mechanic',
    canonicalTitle: 'Mechanik & Diagnosta Samochodowy',
    industry: 'Motoryzacja & Mechanika',
    aliases: [
      'Mechanik Samochodowy',
      'Diagnosta Samochodowy',
      'Elektromechanik Pojazdowy',
      'Serwisant Aut',
      'Mechanik Pojazdów Osobowych',
    ],
    corporateEquivalents: {
      general: ['Diagnosta Bosch Car Service', 'Mechanik ASO Audi/VW/BMW', 'Specjalista Texa Diagnostyka'],
    },
    keywordSynonyms: {
      kts: ['Bosch KTS', 'Texa IDC5', 'Autel MaxiSys', 'Diagnostyka OBD2', 'Komputer Samochodowy'],
      rozrzad: ['Wymiana Rozrządu', 'Pasek Rozrządu Mokry/Suchy', 'Łańcuch Rozrządu', 'Nastawnik Fazy'],
      geometria: ['Geometria 3D', 'Ustawianie Zbieżności', 'Stacja Geometrii Hunter'],
    },
  },
  {
    id: 'logistics_dispatcher',
    canonicalTitle: 'Spedytor Międzynarodowy & Dysponent Floty',
    industry: 'Logistyka & Transport',
    aliases: [
      'Spedytor Międzynarodowy',
      'Dysponent Floty',
      'Koordynator Transportu',
      'Freight Forwarder',
      'Spedytor Drogowy FTL/LTL',
      'Logistyk Transportowy',
    ],
    corporateEquivalents: {
      general: ['Spedytor Trans.eu / TimoCom', 'Dysponent Floty TIR', 'Koordynator Logistyki Międzynarodowej'],
    },
    keywordSynonyms: {
      giełdy: ['Trans.eu', 'TimoCom', 'CargoCore', 'Giełdy Transportowe'],
      czas_pracy: ['Czas Pracy Kierowców', 'AETR', 'Tachograf Cyfrowy', 'Karta Kierowcy'],
      ftl_ltl: ['FTL', 'LTL', 'Przewozy Całopojazdowe', 'Doładunki', 'Fracht Międzynarodowy'],
    },
  },
];

/**
 * Normalizes a text string by removing diacritics, extra spaces, and common stop words
 */
export function normalizeTerm(term: string): string {
  if (!term) return '';
  return term
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove Polish accents for matching
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Finds synonymous equivalents for a position title or company context
 */
export function findPositionAliases(searchQuery: string): {
  matchedGroup?: PositionSynonymGroup;
  canonicalTitle?: string;
  allAliases: string[];
} {
  const normalizedQuery = normalizeTerm(searchQuery);
  if (!normalizedQuery) return { allAliases: [] };

  for (const group of POSITION_SYNONYM_GROUPS) {
    const allGroupTerms = [
      group.canonicalTitle,
      ...group.aliases,
      ...Object.values(group.corporateEquivalents).flatMap(v => Array.isArray(v) ? v : [v]),
    ].map(normalizeTerm);

    const hasMatch = allGroupTerms.some(term => term.includes(normalizedQuery) || normalizedQuery.includes(term));
    if (hasMatch) {
      return {
        matchedGroup: group,
        canonicalTitle: group.canonicalTitle,
        allAliases: Array.from(new Set([
          group.canonicalTitle,
          ...group.aliases,
          ...Object.values(group.corporateEquivalents).flatMap(v => Array.isArray(v) ? v : [v]),
        ])),
      };
    }
  }

  return { allAliases: [searchQuery] };
}

/**
 * Deduplicates synonymous terms to avoid noise in generated CV skills/keywords
 */
export function deduplicateSynonymousTerms(terms: string[]): string[] {
  if (!terms || terms.length === 0) return [];

  const result: string[] = [];
  const seenGroupIds = new Set<string>();

  for (const rawTerm of terms) {
    const norm = normalizeTerm(rawTerm);
    let matchedGroupKey: string | null = null;

    // Check against all keyword synonym buckets across groups
    for (const group of POSITION_SYNONYM_GROUPS) {
      for (const [key, synonyms] of Object.entries(group.keywordSynonyms)) {
        if (synonyms.some(s => normalizeTerm(s) === norm)) {
          matchedGroupKey = `${group.id}_${key}`;
          break;
        }
      }
      if (matchedGroupKey) break;
    }

    if (matchedGroupKey) {
      if (!seenGroupIds.has(matchedGroupKey)) {
        seenGroupIds.add(matchedGroupKey);
        result.push(rawTerm);
      }
    } else {
      // Check exact normalized duplicates
      const exists = result.some(existing => normalizeTerm(existing) === norm);
      if (!exists) {
        result.push(rawTerm);
      }
    }
  }

  return result;
}

/**
 * Normalizes slang terms in text and provides explanation of why they were replaced
 */
export function normalizeSlangInText(rawText: string): {
  normalizedText: string;
  replacements: Array<{ slang: string; formalTerm: string; reason: string; category: string }>;
} {
  if (!rawText) return { normalizedText: '', replacements: [] };

  let currentText = rawText;
  const replacements: Array<{ slang: string; formalTerm: string; reason: string; category: string }> = [];

  for (const entry of INDUSTRY_SLANG_DICTIONARY) {
    const escapedSlang = entry.slang.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSlang}\\b`, 'gi');
    if (regex.test(currentText)) {
      currentText = currentText.replace(regex, entry.formalTerm);
      replacements.push({
        slang: entry.slang,
        formalTerm: entry.formalTerm,
        reason: entry.reason,
        category: entry.category,
      });
    }
  }

  return {
    normalizedText: currentText,
    replacements,
  };
}

/**
 * Maps bank-specific role descriptions to a unified standard for Pekao, PKO BP, ING, mBank, Santander
 */
export function getNormalizedBankRole(bankName: string, roleQuery: string): string {
  const normBank = bankName.toLowerCase();
  const bankGroup = POSITION_SYNONYM_GROUPS.find(g => g.id === 'banking_customer_advisor');
  
  if (!bankGroup) return roleQuery;

  if (normBank.includes('pekao')) {
    return bankGroup.corporateEquivalents.pekao || roleQuery;
  } else if (normBank.includes('pko')) {
    return bankGroup.corporateEquivalents.pkoBp || roleQuery;
  } else if (normBank.includes('ing')) {
    return bankGroup.corporateEquivalents.ing || roleQuery;
  } else if (normBank.includes('mbank')) {
    return bankGroup.corporateEquivalents.mbank || roleQuery;
  } else if (normBank.includes('santander')) {
    return bankGroup.corporateEquivalents.santander || roleQuery;
  }

  return bankGroup.canonicalTitle;
}
