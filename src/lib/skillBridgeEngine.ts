import { SkillBridge, MasterVault } from '../types';

interface BridgeDefinition {
  targetSkillRegex: RegExp;
  targetSkillName: string;
  adjacentSkills: string[];
  conceptualEquivalence: string;
  templateTalkingPoint: (target: string, adjacent: string, vaultContext?: string) => string;
  learningCurveDays: number;
  baseConfidence: number;
}

/**
 * Matryca mostów kompetencyjnych łącząca brakujące umiejętności z umiejętnościami pokrewnymi
 * (obejmuje IT, architekturę systemów oraz branże techniczno-inżynieryjne zgodnie z Regułą 8).
 */
const BRIDGE_DEFINITIONS: BridgeDefinition[] = [
  // IT & Architektura
  {
    targetSkillRegex: /\b(?:kafka|apache\s+kafka)\b/i,
    targetSkillName: 'Kafka',
    adjacentSkills: ['RabbitMQ', 'Redis', 'AWS SQS', 'Event-Driven', 'Microservices', 'Node.js', 'PostgreSQL'],
    conceptualEquivalence: 'Wzorzec Publish/Subscribe, partycjonowanie wiadomości, zarządzanie offsetami i asynchroniczne strumienie zdarzeń.',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Chociaż w ostatnim środowisku produkcyjnym pracowałem głównie z ${adjacent}${ctx ? ` (${ctx})` : ''}, architektura przetwarzania asynchronicznego i zarządzania strumieniami zdarzeń jest analogiczna w ${target}. Opanowanie konfiguracji klastra i specyfiki partycji to dla mnie kwestia paru dni.`,
    learningCurveDays: 5,
    baseConfidence: 92,
  },
  {
    targetSkillRegex: /\b(?:aws|amazon\s+web\s+services)\b/i,
    targetSkillName: 'AWS',
    adjacentSkills: ['GCP', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
    conceptualEquivalence: 'Podstawowe prymitywy chmurowe (IAM, Object Storage S3/GCS, Compute EC2/GCE, Serverless Lambda/Cloud Functions).',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Posiadam solidne doświadczenie w chmurze ${adjacent}${ctx ? ` (${ctx})` : ''}. Mechanizmy IAM, sieci VPC, bezserwerowe funkcje i skalowanie kontenerów w ${target} mają bezpośrednie odpowiedniki, co pozwala mi na bezproblemowy transfer wiedzy.`,
    learningCurveDays: 7,
    baseConfidence: 90,
  },
  {
    targetSkillRegex: /\b(?:kubernetes|k8s)\b/i,
    targetSkillName: 'Kubernetes',
    adjacentSkills: ['Docker', 'Docker Compose', 'CI/CD', 'Konteneryzacja', 'Linux', 'Microservices'],
    conceptualEquivalence: 'Cykl życia kontenera, izolacja zasobów cgroups/namespaces, definicje manifestów deklaratywnych i routing sieciowy.',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Moje doświadczenie w ${adjacent}${ctx ? ` (${ctx})` : ''} obejmuje pełną konteneryzację aplikacji i optymalizację obrazów. Koncepcje Deploymentów, Service'ów i Ingressów w ${target} są dla mnie naturalnym rozwinięciem orkiestracji wielousługowej.`,
    learningCurveDays: 6,
    baseConfidence: 88,
  },
  {
    targetSkillRegex: /\b(?:graphql)\b/i,
    targetSkillName: 'GraphQL',
    adjacentSkills: ['REST API', 'TypeScript', 'gRPC', 'PostgreSQL', 'SQL', 'Node.js'],
    conceptualEquivalence: 'Deklaratywne pobieranie danych, silne typowanie schematów (Schema First), optymalizacja zapytań i eliminacja over-fetchingu.',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Mając zaawansowaną znajomość ${adjacent}${ctx ? ` (${ctx})` : ''}, zasady modelowania relacji i tworzenia resolverów w ${target} są dla mnie w pełni zrozumiałe. Potrafię natychmiast projektować schematy i integrować zapytania.`,
    learningCurveDays: 3,
    baseConfidence: 95,
  },
  {
    targetSkillRegex: /\b(?:typescript|ts)\b/i,
    targetSkillName: 'TypeScript',
    adjacentSkills: ['JavaScript', 'React', 'Node.js', 'Java', 'C#', 'C++'],
    conceptualEquivalence: 'Typowanie statyczne, interfejsy, typy generyczne i analiza kodu w czasie kompilacji.',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Pracując intensywnie w ${adjacent}${ctx ? ` (${ctx})` : ''}, wykorzystuję zasady typowania statycznego i programowania obiektowego. Przejście na ${target} to dla mnie naturalny krok podnoszący bezpieczeństwo refaktoryzacji.`,
    learningCurveDays: 3,
    baseConfidence: 96,
  },

  // Branże techniczne & Prace inżynieryjne (Reguła 8)
  {
    targetSkillRegex: /\b(?:spawanie\s+tig|metoda\s+141|tig)\b/i,
    targetSkillName: 'Spawanie TIG (141)',
    adjacentSkills: ['Spawanie MIG/MAG', 'Metoda 135', 'Ślusarstwo', 'Rysunek techniczny', 'Obróbka metali'],
    conceptualEquivalence: 'Prowadzenie jeziorka spawalniczego, dobór parametrów prądowych, osłona gazowa i kontrola przetopu złącza.',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Posiadam udokumentowaną praktykę w ${adjacent}${ctx ? ` (${ctx})` : ''}. Rozumiem zachowanie metalu i wymogi wizualnej oceny spoin (VT), dzięki czemu adaptacja do specyfiki ${target} przebiega sprawnie i zgodnie z normami.`,
    learningCurveDays: 7,
    baseConfidence: 89,
  },
  {
    targetSkillRegex: /\b(?:sep\s+g2|cieplne|uprawnienia\s+cieplne)\b/i,
    targetSkillName: 'SEP G2 (Cieplne)',
    adjacentSkills: ['SEP G1', 'Uprawnienia elektryczne', 'BHP', 'Utrzymanie Ruchu', 'Prewencja'],
    conceptualEquivalence: 'Procedury bezpiecznego dopuszczenia do pracy, normy eksploatacji maszyn i instalacji przemysłowych.',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Dysponuję uprawnieniami ${adjacent}${ctx ? ` (${ctx})` : ''} oraz wieloletnim rygorem pracy w strefach niebezpiecznych. Procedury bezpieczeństwa i przepisy dozorowe w ${target} opierają się na identycznym standardzie odpowiedzialności.`,
    learningCurveDays: 4,
    baseConfidence: 93,
  },
  {
    targetSkillRegex: /\b(?:siemens|s7-1200|s7-1500|step\s*7|tia\s+portal)\b/i,
    targetSkillName: 'Sterowniki Siemens S7 / TIA Portal',
    adjacentSkills: ['Automatyka', 'Omron', 'Allen-Bradley', 'Utrzymanie Ruchu', 'Diagnostyka maszyn', 'Schematy elektryczne'],
    conceptualEquivalence: 'Logika drabinkowa (LAD), diagramy blokowe (FBD), obsługa wejść/wyjść I/O oraz diagnostyka sygnałów.',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Znam środowiska automatyki ${adjacent}${ctx ? ` (${ctx})` : ''}. Logika sterowania sygnałami cyfrowymi i analogowymi oraz diagnostyka pętli sterowania w ${target} jest bezpośrednio tożsama.`,
    learningCurveDays: 5,
    baseConfidence: 91,
  },
  {
    targetSkillRegex: /\b(?:sap\s+wms|sap\s+erp)\b/i,
    targetSkillName: 'SAP WMS / ERP',
    adjacentSkills: ['WMS', 'Comarch ERP', 'Gospodarka Magazynowa', 'Skanery kodów', 'Inwentaryzacja'],
    conceptualEquivalence: 'Zarządzanie stanami magazynowymi, lokalizacje regałowe, ścieżki zbiórki i obieg dokumentów PZ/WZ.',
    templateTalkingPoint: (target, adjacent, ctx) =>
      `Prowadziłem operacje magazynowe w systemach ${adjacent}${ctx ? ` (${ctx})` : ''}. Cały proces logistyczny — przyjęcie, alokacja, kompletacja i wydanie — w ${target} bazuje na tych samych zasadach przepływu towaru.`,
    learningCurveDays: 4,
    baseConfidence: 94,
  },
];

/**
 * Pobiera wszystkie zarejestrowane umiejętności, technologie i uprawnienia kandydata z MasterVault.
 */
export function getAllCandidateSkills(vault: MasterVault): string[] {
  const skillsSet = new Set<string>();

  // 1. Z macierzy umiejętności
  (vault.skillsMatrix?.hardSkills || []).forEach((s) => skillsSet.add(s));
  (vault.skillsMatrix?.toolsAndTech || []).forEach((s) => skillsSet.add(s));
  (vault.skillsMatrix?.softSkills || []).forEach((s) => skillsSet.add(s));

  // 2. Z historii zatrudnienia
  (vault.history || []).forEach((exp) => {
    (exp.highlights || []).forEach((hl) => {
      if (hl.tool) skillsSet.add(hl.tool);
      (hl.keywords || []).forEach((k) => skillsSet.add(k));
    });
  });

  // 3. Z projektów
  (vault.projects || []).forEach((proj) => {
    (proj.techStack || []).forEach((t) => skillsSet.add(t));
  });

  // 4. Z uprawnień profiler
  (vault.profiler?.licenses || []).forEach((lic) => skillsSet.add(lic));

  return Array.from(skillsSet);
}

/**
 * Buduje most kompetencyjny dla pojedynczej brakującej umiejętności.
 */
export function findSkillBridgeForGap(
  missingSkill: string,
  vault: MasterVault
): SkillBridge | undefined {
  const candidateSkills = getAllCandidateSkills(vault);
  const candLowerMap = new Map(candidateSkills.map((s) => [s.toLowerCase(), s]));

  for (const def of BRIDGE_DEFINITIONS) {
    if (def.targetSkillRegex.test(missingSkill)) {
      // Szukamy najlepszej umiejętności pokrewnej posiadanej przez kandydata
      let foundAdjacent: string | undefined;
      for (const adj of def.adjacentSkills) {
        if (candLowerMap.has(adj.toLowerCase())) {
          foundAdjacent = candLowerMap.get(adj.toLowerCase());
          break;
        }
      }

      // Jeśli nie znaleziono bezpośrednio, bierzemy pierwszą najbardziej prawdopodobną z definicji
      const adjacentSkill = foundAdjacent || def.adjacentSkills[0];

      // Szukamy dowodu z MasterVault (np. projektu lub firmy)
      let evidenceFromVault: string | undefined;
      for (const exp of vault.history || []) {
        const matchHl = (exp.highlights || []).find(
          (hl) =>
            hl.tool?.toLowerCase() === adjacentSkill.toLowerCase() ||
            hl.keywords?.some((k) => k.toLowerCase() === adjacentSkill.toLowerCase())
        );
        if (matchHl) {
          evidenceFromVault = `${exp.company} (${exp.role})`;
          break;
        }
      }

      const talkingPoint = def.templateTalkingPoint(
        missingSkill,
        adjacentSkill,
        evidenceFromVault
      );

      return {
        id: `bridge_${missingSkill.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        missingSkill,
        adjacentSkill,
        conceptualEquivalence: def.conceptualEquivalence,
        bridgeExplanation: `Brak ${missingSkill} jest w 100% zrównoważony przez znajomość ${adjacentSkill}.`,
        talkingPoint,
        evidenceFromVault,
        learningCurveDays: def.learningCurveDays,
        confidenceScore: def.baseConfidence,
      };
    }
  }

  // Most domyślny / generyczny oparty na solidnych podstawach inżynieryjnych
  const fallbackAdjacent = candidateSkills[0] || 'powiązane technologie projektowe';
  return {
    id: `bridge_generic_${missingSkill.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    missingSkill,
    adjacentSkill: fallbackAdjacent,
    conceptualEquivalence: 'Transferowalność fundamentalnych wzorców inżynieryjnych i sprawdzona szybkość adaptacji nowych narzędzi.',
    bridgeExplanation: `Solidne podstawy w ${fallbackAdjacent} pozwalają na błyskawiczne wdrożenie w specyfikę ${missingSkill}.`,
    talkingPoint: `Chociaż dotychczas skupiałem się na ${fallbackAdjacent}, fundamentalne prymitywy i architektura ${missingSkill} są tożsame. W moich projektach wielokrotnie udowodniłem zdolność szybkiego przyswajania nowych standardów bez kompromisów jakościowych.`,
    learningCurveDays: 7,
    confidenceScore: 85,
  };
}

/**
 * Generuje listę mostów kompetencyjnych dla podanej listy brakujących umiejętności.
 */
export function generateSkillBridges(
  missingSkills: string[],
  vault: MasterVault
): SkillBridge[] {
  if (!missingSkills || missingSkills.length === 0) return [];
  const uniqueMissing = Array.from(new Set(missingSkills.map((s) => s.trim()))).filter(Boolean);
  return uniqueMissing
    .map((skill) => findSkillBridgeForGap(skill, vault))
    .filter((b): b is SkillBridge => Boolean(b));
}

export const findOrGenerateBridge = findSkillBridgeForGap;

export function getCommonSkillsList(): string[] {
  return [
    'AWS',
    'Kafka',
    'Kubernetes',
    'GraphQL',
    'TypeScript',
    'Docker',
    'PostgreSQL',
    'Redis',
    'Terraform',
    'React',
    'SEP',
    'UDT',
    'Next.js',
    'Rust',
  ];
}

