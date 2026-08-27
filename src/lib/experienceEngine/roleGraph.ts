import { RoleKnowledgeNode } from './types';

export const ROLE_GRAPH: Record<string, RoleKnowledgeNode> = {
  software_engineer: {
    roleId: 'software_engineer',
    label: 'Software Engineer / Programista',
    areas: [
      { id: 'backend', label: 'Backend / Mikroserwisy' },
      { id: 'frontend', label: 'Frontend / UI & UX' },
      { id: 'fullstack', label: 'Full-stack Development' },
      { id: 'cloud_devops', label: 'Cloud & DevOps' },
      { id: 'testing', label: 'Testy & Jakość (QA)' },
      { id: 'data', label: 'Bazy Danych & Integracje' },
    ],
    actions: {
      backend: ['projektowałem', 'rozwijałem', 'implementowałem', 'optymalizowałem', 'integrowałem', 'utrzymywałem'],
      frontend: ['tworzyłem', 'implementowałem', 'modernizowałem', 'optymalizowałem', 'projektowałem'],
      fullstack: ['projektowałem', 'budowałem', 'rozwijałem', 'integrowałem', 'wdrażałem'],
      cloud_devops: ['wdrażałem', 'konfigurowałem', 'automatyzowałem', 'monitorowałem', 'skalowałem', 'zabezpieczałem'],
      testing: ['testowałem', 'automatyzowałem testy', 'analizowałem błędy', 'podnosiłem pokrycie testami'],
      data: ['projektowałem schematy', 'optymalizowałem zapytania', 'integrowałem bazy danych', 'zarządzałem migracjami'],
    },
    objects: {
      backend: ['usługi backendowe', 'API REST / GraphQL', 'mikroserwisy', 'mechanizmy autoryzacji', 'moduły biznesowe'],
      frontend: ['interfejsy użytkownika', 'komponenty UI', 'responsywne widoki aplikacji', 'stan aplikacji i formularze'],
      fullstack: ['kompletne aplikacje webowe', 'moduły klient-serwer', 'panele administracyjne', 'architekturę end-to-end'],
      cloud_devops: ['pipeline’y CI/CD', 'kontenery Docker i klastry K8s', 'infrastrukturę chmurową', 'monitoring i logowanie'],
      testing: ['testy jednostkowe i e2e', 'scenariusze testowe', 'procesy automatyzacji jakości', 'raporty błędów'],
      data: ['relacyjne bazy danych SQL', 'struktury NoSQL', 'indeksy i procedury składowane', 'potoki danych'],
    },
    outcomes: {
      backend: [
        'zwiększając stabilność i przepustowość aplikacji',
        'skracając czas odpowiedzi API',
        'zapewniając bezawaryjną komunikację między usługami',
        'ułatwiając skalowanie systemu',
      ],
      frontend: [
        'podnosząc intuicyjność i wygodę użytkowników',
        'zmniejszając czas ładowania widoków',
        'zapewniając pełną zgodność z wytycznymi dostępności',
      ],
      cloud_devops: [
        'skracając czas wdrożeń produkcyjnych',
        'eliminując przestoje techniczne wdrożeń',
        'obniżając koszty zasobów chmurowych',
      ],
      default: [
        'poprawiając jakość i stabilność kodu',
        'usprawniając procesy wytwórcze w zespole',
        'gwarantując wysokie standardy techniczne',
      ],
    },
    defaultTech: {
      backend: ['Java', 'Spring Boot', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
      frontend: ['React', 'TypeScript', 'TailwindCSS', 'Next.js', 'HTML5/CSS3'],
      cloud_devops: ['Docker', 'Kubernetes', 'AWS', 'GitHub Actions', 'Terraform', 'Prometheus'],
      default: ['Git', 'REST API', 'SQL', 'CI/CD'],
    },
  },

  trades_technician: {
    roleId: 'trades_technician',
    label: 'Monter / Instalator / Technik / Serwisant',
    areas: [
      { id: 'installation', label: 'Montaż & Instalacje' },
      { id: 'service', label: 'Serwis & Diagnostyka Usterek' },
      { id: 'maintenance', label: 'Utrzymanie Ruchu & Przeglądy' },
      { id: 'automation', label: 'Automatyka & Pomiary' },
    ],
    actions: {
      installation: ['montowałem', 'układałem', 'instalowałem', 'podłączałem', 'uruchamiałem'],
      service: ['diagnozowałem', 'naprawiałem', 'wymieniałem', 'kalibrowałem', 'serwisowałem'],
      maintenance: ['prowadziłem przeglądy', 'nadzorowałem pracę', 'konserwowałem', 'usuwałem awarie'],
      automation: ['programowałem', 'konfigurowałem sterowniki', 'wykonywałem pomiary', 'testowałem pętle'],
    },
    objects: {
      installation: ['instalacje sanitarne i grzewcze', 'rozdzielnice elektryczne', 'urządzenia HVAC i pompy ciepła', 'trasy kablowe'],
      service: ['podzespoły mechaniczne', 'układy zasilania i sterowania', 'aparaturę kontrolno-pomiarową', 'armaturę przemysłową'],
      maintenance: ['linie produkcyjne', 'park maszynowy', 'urządzenia ciśnieniowe', 'systemy wentylacji i chłodnictwa'],
      automation: ['sterowniki PLC', 'falowniki i czujniki', 'układy automatyki budynkowej', 'szafy sterownicze'],
    },
    outcomes: {
      installation: [
        'zapewniając pełną szczelność i zgodność z normami',
        'terminowo oddając instalacje do odbioru technicznego',
        'gwarantując bezawaryjną pracę systemów',
      ],
      service: [
        'minimalizując czas przestojów technologicznych',
        'szybko lokalizując i eliminując źródło usterki',
        'przywracając parametry znamionowe urządzeń',
      ],
      default: [
        'z zachowaniem najwyższych standardów BHP',
        'zgodnie z dokumentacją DTR i schematami technicznymi',
      ],
    },
    defaultTech: {
      installation: ['Zgrzewanie elektrooporowe', 'Próby ciśnieniowe', 'SEP 1kV', 'Lutowanie twarde'],
      automation: ['Siemens S7', 'PLC', 'Pomiary elektryczne', 'Schematy elektryczne'],
      default: ['Narzędzia diagnostyczne', 'Dokumentacja DTR', 'BHP'],
    },
  },

  medical_specialist: {
    roleId: 'medical_specialist',
    label: 'Lekarz / Pielęgniarka / Ratownik Medyczny',
    areas: [
      { id: 'diagnostics', label: 'Diagnostyka & Badania' },
      { id: 'procedures', label: 'Zabiegi & Terapia' },
      { id: 'emergency', label: 'Stany Nagłe & Triage' },
      { id: 'documentation', label: 'Dokumentacja & Standardy' },
    ],
    actions: {
      diagnostics: ['prowadziłem', 'badałem', 'diagnozowałem', 'interpretowałem wyniki', 'kwalifikowałem'],
      procedures: ['wykonywałem', 'prowadziłem farmakoterapię', 'asystowałem przy zabiegach', 'zakładałem wkłucia'],
      emergency: ['prowadziłem resuscytację', 'zaopatrywałem urazy', 'koordynowałem procedurę triage', 'stabilizowałem stan'],
      documentation: ['prowadziłem dokumentację EDM', 'wdrażałem procedury', 'edukowałem pacjentów'],
    },
    objects: {
      diagnostics: ['badania USG / EKG', 'wyniki badań laboratoryjnych i obrazowych', 'wywiady lekarskie', 'plany terapeutyczne'],
      procedures: ['procedury zabiegowe', 'iniekcje i wlewy dożylne', 'terapie celowane', 'pielęgnację ran i drenaży'],
      emergency: ['stany zagrożenia życia', 'pacjentów w stanach nagłych', 'aparaturę podtrzymującą życie', 'transport medyczny'],
      documentation: ['elektroniczną dokumentację medyczną (EDM)', 'protokoły zabiegowe', 'zalecenia wypisowe'],
    },
    outcomes: {
      default: [
        'zapewniając najwyższy standard bezpieczeństwa pacjentów',
        'zgodnie z aktualną wiedzą medyczną (EBM)',
        'usprawniając obieg informacji w zespole terapeutycznym',
      ],
    },
    defaultTech: {
      default: ['Systemy EDM (Asseco/Kamsoft)', 'Aparatura USG/EKG', 'Procedury BLS/ALS'],
    },
  },

  general_role: {
    roleId: 'general_role',
    label: 'Stanowisko Ogólne / Biurowe / Specjalistyczne',
    areas: [
      { id: 'operations', label: 'Operacje & Koordynacja' },
      { id: 'analysis', label: 'Analiza & Raportowanie' },
      { id: 'clients', label: 'Obsługa Klienta / B2B' },
      { id: 'projects', label: 'Projekty & Wdrożenia' },
    ],
    actions: {
      operations: ['koordynowałem', 'optymalizowałem', 'nadzorowałem', 'organizowałem'],
      analysis: ['analizowałem', 'tworzyłem raporty', 'weryfikowałem dane', 'modelowałem'],
      clients: ['budowałem relacje', 'prowadziłem negocjacje', 'doradzałem', 'pozyskiwałem'],
      projects: ['prowadziłem', 'wdrażałem', 'monitorowałem harmonogram', 'rozliczałem'],
    },
    objects: {
      operations: ['procesy operacyjne', 'obieg dokumentów', 'harmonogramy prac', 'procedury firmowe'],
      analysis: ['raporty wskaźnikowe KPI', 'zestawienia finansowe', 'bazy danych klientów', 'zapotrzebowanie'],
      clients: ['klientów kluczowych (B2B)', 'kontrakty handlowe', 'zapytania ofertowe', 'reklamacje i zgłoszenia'],
      projects: ['projekty wdrożeniowe', 'budżety projektowe', 'zespoły wykonawcze', 'etapy realizacji'],
    },
    outcomes: {
      default: [
        'podnosząc efektywność procesów operacyjnych',
        'gwarantując terminowość realizacji zadań',
        'zwiększając satysfakcję i retencję klientów',
      ],
    },
    defaultTech: {
      default: ['MS Excel / Google Sheets', 'Systemy CRM / ERP', 'Jira / Trello'],
    },
  },
};

/**
 * Wybiera najlepszy węzeł grafu stanowiska na podstawie tytułu roli.
 */
export function resolveRoleKnowledgeNode(roleTitle: string): RoleKnowledgeNode {
  if (!roleTitle || typeof roleTitle !== 'string') {
    return ROLE_GRAPH.general_role;
  }
  const norm = roleTitle.toLowerCase();

  // 1. Programowanie / IT
  if (/(programi|develop|engineer|software|frontend|backend|fullstack|devops|cloud|qa|tester|architekt|kod|web)/i.test(norm)) {
    return ROLE_GRAPH.software_engineer;
  }

  // 2. Monter / Technik / Elektryk / Mechanik
  if (/(monter|instalator|technik|serwisant|elektryk|mechanik|hydraulik|spawacz|utrzyman|budowl|operator)/i.test(norm)) {
    return ROLE_GRAPH.trades_technician;
  }

  // 3. Medycyna
  if (/(lekarz|doktor|pielęg|ratownik|farmaceut|medyc|fizjoterap|stomatolog)/i.test(norm)) {
    return ROLE_GRAPH.medical_specialist;
  }

  return ROLE_GRAPH.general_role;
}
