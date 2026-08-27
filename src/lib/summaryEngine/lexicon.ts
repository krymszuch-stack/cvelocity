import { SeniorityLevel } from './types';

export interface LexiconBank {
  adjectives: Record<SeniorityLevel, string[]>;
  achieveVerbs: Record<string, string[]>;
  connectors: string[];
  impactPhrases: Record<string, string[]>;
  valuePrefixes: string[];
}

export const LEXICON: LexiconBank = {
  adjectives: {
    junior: [
      'ambitny i zmotywowany',
      'dokładny i systematyczny',
      'szybko uczący się i zaangażowany',
      'skoncentrowany na rozwoju',
    ],
    mid: [
      'samodzielny i rzetelny',
      'zorientowany na wysoką jakość',
      'doświadczony i skrupulatny',
      'efektywny i pragmatyczny',
    ],
    senior: [
      'doświadczony i wszechstronny',
      'zaawansowany merytorycznie',
      'wysoko wykwalifikowany',
      'ekspercki i zorientowany na rezultaty',
    ],
    lead: [
      'strategiczny i decyzyjny',
      'doświadczony lider i mentor',
      'zorientowany na architekturę i cele biznesowe',
      'kompleksowo zarządzający projektami',
    ],
  },

  achieveVerbs: {
    it: [
      'projektowałem i wdrażałem',
      'optymalizowałem i skalowałem',
      'zautomatyzowałem procesy oraz',
      'rozwijałem i modernizowałem',
      'integrowałem i zabezpieczałem',
    ],
    trades: [
      'montowałem i serwisowałem',
      'diagnozowałem usterki i usuwałem',
      'prowadziłem prace instalacyjne oraz',
      'modernizowałem i kalibrowałem',
      'nadzorowałem eksploatację urządzeń oraz',
    ],
    medical: [
      'prowadziłem diagnostykę i terapię',
      'wykonywałem procedury zabiegowe oraz',
      'koordynowałem opiekę medyczną i',
      'wdrażałem standardy kliniczne oraz',
    ],
    sales: [
      'budowałem relacje biznesowe i pozyskiwałem',
      'negocjowałem kontrakty handlowe oraz',
      'skalowałem wolumen sprzedaży i',
      'zarządzałem portfelem kluczowych klientów oraz',
    ],
    general: [
      'optymalizowałem procedury i koordynowałem',
      'skutecznie realizowałem projekty oraz',
      'usprawniałem organizację pracy i',
      'wdrażałem nowe standardy,',
    ],
  },

  connectors: [
    'ze szczególnym naciskiem na',
    'ze specjalizacją w obszarze',
    'ukierunkowany na',
    'specjalizujący się w zakresie',
    'zorientowany na efektywność w',
  ],

  impactPhrases: {
    it: [
      'skracając czas wdrożeń i podnosząc stabilność',
      'obniżając koszty infrastruktury i usuwając dług techniczny',
      'zwiększając niezawodność systemów i zadowolenie użytkowników',
      'eliminując wąskie gardła w architekturze',
    ],
    trades: [
      'minimalizując przestoje techniczne i gwarantując bezawaryjność',
      'zapewniając pełną zgodność z normami BHP i dokumentacją',
      'skracając czas realizacji prac montażowych',
      'podnosząc bezpieczeństwo i kulturę techniczną',
    ],
    medical: [
      'zapewniając najwyższy standard bezpieczeństwa pacjentów',
      'zgodnie z najnowszymi wytycznymi evidence-based medicine',
      'usprawniając obieg dokumentacji i procedury oddziałowe',
    ],
    sales: [
      'konsekwentnie realizując i przekraczając cele kwartalne',
      'zwiększając marżowość i retencję klientów B2B',
      'skracając cykl decyzyjny w procesie sprzedażowym',
    ],
    general: [
      'podnosząc efektywność operacyjną całego zespołu',
      'gwarantując terminowość i rzetelność realizacji zadań',
      'optymalizując koszty i czas wykonania procesów',
    ],
  },

  valuePrefixes: [
    'W codziennej pracy stawiam na',
    'Wyróżnia mnie',
    'Kluczowym atutem jest',
    'Moim priorytetem pozostaje',
  ],
};
