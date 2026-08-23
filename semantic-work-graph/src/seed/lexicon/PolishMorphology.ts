import { MorphEntry } from '../../repositories/SqliteGraphRepository.js';

/**
 * Generator kuratorowanego korpusu morfologicznego języka polskiego.
 *
 * Pełny słownik pochodzi z PoliMorf (IPI PAN). Ten moduł pełni dwie role:
 *  1. **Awaryjne źródło offline** — gdy pobranie PoliMorf jest niemożliwe
 *     (brak sieci, zmiana adresu wydania), lematyzacja nadal działa dla
 *     słownictwa krytycznego dla CV: czasowników akcji i rzeczowników IT.
 *  2. **Warstwa dziedzinowa** — PoliMorf nie zna słów typu „mikroserwis”,
 *     „konteneryzacja” czy „backend”. Te wpisy dokładamy zawsze, niezależnie
 *     od tego, czy korpus ogólny udało się pobrać.
 *
 * Formy generujemy deklaratywnie z tabel wzorców. Każdy wzorzec pokrywa
 * regularny paradygmat; nieregularności podajemy jawnie w `extraForms`,
 * zamiast rozbudowywać reguły o wyjątki, których i tak nie da się domknąć.
 */

/** Części mowy dopuszczone w słowniku (zgodne z filtrem importu PoliMorf). */
export type PosTag = 'subst' | 'verb' | 'fin' | 'praet' | 'ger' | 'adj';

/** Priorytet rozstrzygania kolizji form wewnątrz korpusu kuratorowanego. */
const POS_RANK: Record<PosTag, number> = { ger: 0, subst: 1, praet: 2, fin: 3, verb: 4, adj: 5 };

// ---------------------------------------------------------------------------
// Czasowniki
// ---------------------------------------------------------------------------

interface VerbSpec {
  /** Bezokolicznik = lemat. */
  lemma: string;
  /** Rzeczownik odczasownikowy, jeśli reguła sufiksowa daje zły wynik. */
  gerund?: string | null;
  /** Formy nieregularne dopisywane wprost (forma -> tag). */
  extraForms?: Array<[string, PosTag]>;
  /** Wyłącza generowanie form osobowych (dla czasowników o nieregularnej koniugacji). */
  skipFinite?: boolean;
}

type VerbClass = 'owac' | 'ywac' | 'ac' | 'ic' | 'yc' | 'other';

function classifyVerb(lemma: string): VerbClass {
  if (lemma.endsWith('ować')) return 'owac';
  if (lemma.endsWith('ywać') || lemma.endsWith('iwać')) return 'ywac';
  if (lemma.endsWith('ać')) return 'ac';
  if (lemma.endsWith('ić')) return 'ic';
  if (lemma.endsWith('yć')) return 'yc';
  return 'other';
}

/**
 * Rzeczownik odczasownikowy: „zarządzać” → „zarządzanie”, „wdrożyć” → „wdrożenie”,
 * „uruchomić” → „uruchomienie”.
 */
function deriveGerund(lemma: string, cls: VerbClass): string | null {
  switch (cls) {
    case 'owac':
    case 'ywac':
    case 'ac':
      return `${lemma.slice(0, -1)}nie`;
    case 'ic':
      return `${lemma.slice(0, -2)}ienie`;
    case 'yc':
      return `${lemma.slice(0, -2)}enie`;
    default:
      return null;
  }
}

/** Czas przeszły — wspólny dla wszystkich klas regularnych: temat = lemat bez „ć”. */
function derivePraeteritum(lemma: string): string[] {
  const base = lemma.slice(0, -1);
  return [
    `${base}łem`,
    `${base}łam`,
    `${base}łeś`,
    `${base}łaś`,
    `${base}ł`,
    `${base}ła`,
    `${base}ło`,
    `${base}li`,
    `${base}ły`,
    `${base}liśmy`,
    `${base}łyśmy`,
    `${base}liście`,
    `${base}łyście`,
  ];
}

/** Formy osobowe czasu teraźniejszego/przyszłego prostego. */
function deriveFinite(lemma: string, cls: VerbClass): string[] {
  switch (cls) {
    case 'owac':
    case 'ywac': {
      // -ować / -ywać / -iwać dają ten sam paradygmat -uję:
      // programować -> programuję, utrzymywać -> utrzymuję, obsługiwać -> obsługuję.
      const stem = lemma.slice(0, -4);
      return ['uję', 'ujesz', 'uje', 'ujemy', 'ujecie', 'ują'].map((s) => stem + s);
    }
    case 'ac': {
      const stem = lemma.slice(0, -2); // zarządzać -> zarządz
      return ['am', 'asz', 'a', 'amy', 'acie', 'ają'].map((s) => stem + s);
    }
    case 'ic': {
      const stem = lemma.slice(0, -2); // uruchomić -> uruchom
      return ['ię', 'isz', 'i', 'imy', 'icie', 'ią'].map((s) => stem + s);
    }
    case 'yc': {
      const stem = lemma.slice(0, -2); // wdrożyć -> wdroż
      return ['ę', 'ysz', 'y', 'ymy', 'ycie', 'ą'].map((s) => stem + s);
    }
    default:
      return [];
  }
}

/** Odmiana rzeczownika odczasownikowego rodzaju nijakiego („wdrożenie”). */
function declineGerund(gerund: string): string[] {
  if (!gerund.endsWith('e')) return [gerund];
  const stem = gerund.slice(0, -1); // wdrożenie -> wdrożeni
  const forms = [
    gerund,
    `${stem}a`,
    `${stem}u`,
    `${stem}em`,
    `${stem}om`,
    `${stem}ami`,
    `${stem}ach`,
  ];

  // Dopełniacz l.mn. zmiękcza wygłos tematu:
  // wdrożenie -> wdrożeń, osiągnięcie -> osiągnięć, narzędzie -> narzędzi.
  if (gerund.endsWith('nie')) forms.push(`${gerund.slice(0, -3)}ń`);
  else if (gerund.endsWith('cie')) forms.push(`${gerund.slice(0, -3)}ć`);
  else forms.push(stem);

  return forms;
}

/**
 * Czasowniki akcji spotykane w polskich CV. Lista celowo obejmuje pary aspektowe
 * (np. „wdrażać” / „wdrożyć”), bo kandydaci używają obu wymiennie.
 */
export const ACTION_VERBS: VerbSpec[] = [
  { lemma: 'zarządzać' },
  { lemma: 'kierować' },
  { lemma: 'nadzorować' },
  { lemma: 'koordynować' },
  { lemma: 'planować' },
  { lemma: 'organizować' },
  { lemma: 'delegować' },
  { lemma: 'motywować' },
  { lemma: 'rekrutować' },
  { lemma: 'szkolić' },
  { lemma: 'mentorować' },
  { lemma: 'prowadzić' },
  { lemma: 'wdrażać' },
  { lemma: 'wdrożyć' },
  { lemma: 'implementować' },
  { lemma: 'zaimplementować' },
  { lemma: 'programować' },
  { lemma: 'oprogramować' },
  { lemma: 'projektować' },
  { lemma: 'zaprojektować' },
  { lemma: 'tworzyć' },
  { lemma: 'stworzyć' },
  { lemma: 'budować' },
  { lemma: 'zbudować' },
  { lemma: 'rozwijać' },
  { lemma: 'utrzymywać' },
  { lemma: 'obsługiwać' },
  { lemma: 'testować' },
  { lemma: 'przetestować' },
  { lemma: 'weryfikować' },
  { lemma: 'walidować' },
  { lemma: 'analizować' },
  { lemma: 'przeanalizować' },
  { lemma: 'optymalizować' },
  { lemma: 'zoptymalizować' },
  { lemma: 'automatyzować' },
  { lemma: 'zautomatyzować' },
  { lemma: 'integrować' },
  { lemma: 'zintegrować' },
  { lemma: 'konfigurować' },
  { lemma: 'skonfigurować' },
  { lemma: 'instalować' },
  { lemma: 'zainstalować' },
  { lemma: 'migrować' },
  { lemma: 'zmigrować' },
  { lemma: 'skalować' },
  { lemma: 'monitorować' },
  { lemma: 'refaktoryzować' },
  { lemma: 'debugować' },
  { lemma: 'dokumentować' },
  { lemma: 'udokumentować' },
  { lemma: 'raportować' },
  { lemma: 'prezentować' },
  { lemma: 'negocjować' },
  { lemma: 'konsultować' },
  { lemma: 'doradzać' },
  { lemma: 'audytować' },
  { lemma: 'kontrolować' },
  { lemma: 'certyfikować' },
  { lemma: 'standaryzować' },
  { lemma: 'modernizować' },
  { lemma: 'archiwizować' },
  { lemma: 'wizualizować' },
  { lemma: 'modelować' },
  { lemma: 'realizować' },
  { lemma: 'zrealizować' },
  { lemma: 'opracowywać' },
  { lemma: 'opracować' },
  { lemma: 'wykonywać' },
  { lemma: 'przeprowadzać' },
  { lemma: 'przeprowadzić' },
  { lemma: 'usprawnić' },
  { lemma: 'usprawniać' },
  { lemma: 'poprawić' },
  { lemma: 'poprawiać' },
  { lemma: 'przyspieszyć' },
  { lemma: 'zwiększyć' },
  { lemma: 'zwiększać' },
  { lemma: 'zmniejszyć' },
  { lemma: 'obniżyć' },
  { lemma: 'redukować' },
  { lemma: 'zredukować' },
  { lemma: 'uruchomić' },
  { lemma: 'uruchamiać' },
  { lemma: 'serwisować' },
  { lemma: 'montować' },
  { lemma: 'zamontować' },
  { lemma: 'naprawiać' },
  { lemma: 'naprawić' },
  { lemma: 'diagnozować' },
  { lemma: 'spawać' },
  { lemma: 'współpracować' },
  { lemma: 'wspierać' },
  { lemma: 'dostarczać' },
  { lemma: 'dostarczyć' },
  { lemma: 'zapewniać' },
  { lemma: 'zapewnić' },
  { lemma: 'badać' },
  { lemma: 'sterować' },
  {
    // Koniugacja typu -ąć jest nieregularna (ą/ę w temacie), więc podajemy formy wprost.
    lemma: 'osiągnąć',
    gerund: 'osiągnięcie',
    skipFinite: true,
    extraForms: [
      ['osiągnąłem', 'praet'],
      ['osiągnęłam', 'praet'],
      ['osiągnął', 'praet'],
      ['osiągnęła', 'praet'],
      ['osiągnęli', 'praet'],
      ['osiągnęły', 'praet'],
      ['osiągnę', 'fin'],
      ['osiągniesz', 'fin'],
      ['osiągnie', 'fin'],
      ['osiągniemy', 'fin'],
      ['osiągną', 'fin'],
    ],
  },
  {
    lemma: 'osiągać',
  },
];

// ---------------------------------------------------------------------------
// Rzeczowniki
// ---------------------------------------------------------------------------

type NounPattern =
  /** Rodzaj męskorzeczowy twardy: system, projekt, mikroserwis. */
  | 'm3'
  /** Rodzaj męskoosobowy twardy: programista (patrz `m1-a`), klient, inżynier. */
  | 'm1'
  /** Rodzaj męskoosobowy zakończony na -a: programista, specjalista, doradca. */
  | 'm1-a'
  /** Rodzaj żeński twardy: baza, metoda, chmura. */
  | 'f-hard'
  /** Rodzaj żeński miękki: aplikacja, funkcja, wydajność (patrz `f-osc`). */
  | 'f-soft'
  /** Rodzaj żeński na -ość: wydajność, jakość. */
  | 'f-osc'
  /** Rodzaj nijaki twardy: środowisko, źródło. */
  | 'n-hard'
  /** Rodzaj nijaki miękki (także odczasownikowy): rozwiązanie, narzędzie. */
  | 'n-soft';

interface NounSpec {
  lemma: string;
  pattern: NounPattern;
  /** Końcówka dopełniacza l.poj. dla wzorca m3: „-a” (serwera) albo „-u” (systemu). */
  gen?: 'a' | 'u';
  /** Temat przypadków zależnych, gdy zachodzi oboczność (zespół → zespoł-, błąd → błęd-). */
  obliqueStem?: string;
  /** Formy nieregularne dopisywane wprost. */
  extraForms?: string[];
}

/** Miejscownik l.poj. wzorca m3 — zmiękczenie tematu zależne od wygłosu. */
function locativeM3(stem: string): string | null {
  if (/(st)$/.test(stem)) return `${stem.slice(0, -2)}ście`;
  if (/(k|g|ch|c|cz|sz|ż|rz|dz|j|l)$/.test(stem)) return `${stem}u`;
  if (stem.endsWith('t')) return `${stem.slice(0, -1)}cie`;
  if (stem.endsWith('d')) return `${stem.slice(0, -1)}dzie`;
  if (stem.endsWith('r')) return `${stem.slice(0, -1)}rze`;
  if (stem.endsWith('ł')) return `${stem.slice(0, -1)}le`;
  if (/(b|p|w|m|n|s|z|f)$/.test(stem)) return `${stem}ie`;
  return null;
}

/** Mianownik l.mn. wzorca m3 — po tematach na k/g końcówka „-i”, inaczej „-y”. */
function pluralM3(stem: string): string {
  return /(k|g)$/.test(stem) ? `${stem}i` : `${stem}y`;
}

/**
 * Mianownik l.mn. rodzaju męskoosobowego. Wygłos tematu ulega zmiękczeniu:
 * użytkownik → użytkownicy, klient → klienci, inżynier → inżynierowie.
 */
function pluralM1(stem: string): string {
  if (stem.endsWith('st')) return `${stem.slice(0, -2)}ści`; // programista -> programiści
  if (stem.endsWith('k')) return `${stem.slice(0, -1)}cy`;
  if (stem.endsWith('g')) return `${stem.slice(0, -1)}dzy`;
  if (stem.endsWith('t')) return `${stem.slice(0, -1)}ci`;
  if (stem.endsWith('d')) return `${stem.slice(0, -1)}dzi`;
  if (stem.endsWith('r')) return `${stem.slice(0, -1)}rzy`;
  if (stem.endsWith('ec')) return `${stem.slice(0, -2)}cy`;
  return `${stem}i`;
}

function declineNoun(spec: NounSpec): string[] {
  const { lemma, pattern } = spec;
  const forms = new Set<string>([lemma, ...(spec.extraForms ?? [])]);

  switch (pattern) {
    case 'm3': {
      const stem = spec.obliqueStem ?? lemma;
      forms.add(stem + (spec.gen ?? 'u'));
      forms.add(`${stem}owi`);
      forms.add(/(k|g)$/.test(stem) ? `${stem}iem` : `${stem}em`);
      forms.add(`${stem}ów`);
      forms.add(`${stem}om`);
      forms.add(`${stem}ami`);
      forms.add(`${stem}ach`);
      forms.add(pluralM3(stem));
      const loc = locativeM3(stem);
      if (loc) forms.add(loc);
      break;
    }
    case 'm1': {
      const stem = spec.obliqueStem ?? lemma;
      forms.add(`${stem}a`); // dopełniacz i biernik l.poj.
      forms.add(`${stem}owi`);
      forms.add(/(k|g)$/.test(stem) ? `${stem}iem` : `${stem}em`);
      forms.add(`${stem}ów`);
      forms.add(`${stem}om`);
      forms.add(`${stem}ami`);
      forms.add(`${stem}ach`);
      forms.add(pluralM1(stem));
      const loc = locativeM3(stem);
      if (loc) forms.add(loc);
      break;
    }
    case 'm1-a': {
      const stem = spec.obliqueStem ?? lemma.slice(0, -1); // programista -> programist
      forms.add(`${stem}y`); // dopełniacz l.poj.
      forms.add(`${stem}ę`);
      forms.add(`${stem}ą`);
      forms.add(`${stem}ów`);
      forms.add(`${stem}om`);
      forms.add(`${stem}ami`);
      forms.add(`${stem}ach`);
      forms.add(pluralM1(stem));
      // Celownik i miejscownik l.poj. dokładają "e" do mianownika l.mn.:
      // programiści -> programiście, klienci -> kliencie.
      const softened = pluralM1(stem);
      if (softened.endsWith('i')) forms.add(`${softened}e`);
      break;
    }
    case 'f-hard': {
      const stem = spec.obliqueStem ?? lemma.slice(0, -1);
      forms.add(/(k|g)$/.test(stem) ? `${stem}i` : `${stem}y`); // dopełniacz l.poj. + mianownik l.mn.
      forms.add(`${stem}ę`);
      forms.add(`${stem}ą`);
      forms.add(stem); // dopełniacz l.mn.: baz, metod, usług
      forms.add(`${stem}om`);
      forms.add(`${stem}ami`);
      forms.add(`${stem}ach`);
      break;
    }
    case 'f-soft': {
      const stem = spec.obliqueStem ?? lemma.slice(0, -1);
      forms.add(`${stem}i`); // dopełniacz/celownik/miejscownik l.poj. + dopełniacz l.mn.
      forms.add(`${stem}ę`);
      forms.add(`${stem}ą`);
      forms.add(`${stem}e`); // mianownik/biernik l.mn.
      forms.add(`${stem}om`);
      forms.add(`${stem}ami`);
      forms.add(`${stem}ach`);
      break;
    }
    case 'f-osc': {
      const base = lemma.slice(0, -2); // wydajność -> wydajno
      forms.add(`${base}ści`);
      forms.add(`${base}ścią`);
      forms.add(`${base}ściom`);
      forms.add(`${base}ściami`);
      forms.add(`${base}ściach`);
      break;
    }
    case 'n-hard': {
      const stem = spec.obliqueStem ?? lemma.slice(0, -1);
      forms.add(`${stem}a`);
      forms.add(`${stem}u`);
      forms.add(/(k|g)$/.test(stem) ? `${stem}iem` : `${stem}em`);
      forms.add(stem); // dopełniacz l.mn.: środowisk, źródeł (nieregularne podajemy wprost)
      forms.add(`${stem}om`);
      forms.add(`${stem}ami`);
      forms.add(`${stem}ach`);
      break;
    }
    case 'n-soft': {
      declineGerund(lemma).forEach((f) => forms.add(f));
      break;
    }
  }

  return [...forms];
}

/**
 * Rzeczowniki dziedzinowe: słownictwo IT/biznesowe, którego nie ma w PoliMorf,
 * oraz najczęstsze rzeczowniki opisujące doświadczenie zawodowe.
 */
export const DOMAIN_NOUNS: NounSpec[] = [
  { lemma: 'mikroserwis', pattern: 'm3', gen: 'u' },
  { lemma: 'monolit', pattern: 'm3', gen: 'u' },
  { lemma: 'kontener', pattern: 'm3', gen: 'a' },
  { lemma: 'serwer', pattern: 'm3', gen: 'a' },
  { lemma: 'klaster', pattern: 'm3', gen: 'a', obliqueStem: 'klastr' },
  { lemma: 'system', pattern: 'm3', gen: 'u' },
  { lemma: 'podsystem', pattern: 'm3', gen: 'u' },
  { lemma: 'projekt', pattern: 'm3', gen: 'u' },
  { lemma: 'proces', pattern: 'm3', gen: 'u' },
  { lemma: 'moduł', pattern: 'm3', gen: 'u' },
  { lemma: 'komponent', pattern: 'm3', gen: 'u' },
  { lemma: 'interfejs', pattern: 'm3', gen: 'u' },
  { lemma: 'algorytm', pattern: 'm3', gen: 'u' },
  { lemma: 'program', pattern: 'm3', gen: 'u' },
  { lemma: 'skrypt', pattern: 'm3', gen: 'u' },
  { lemma: 'pakiet', pattern: 'm3', gen: 'u' },
  { lemma: 'plik', pattern: 'm3', gen: 'u' },
  { lemma: 'katalog', pattern: 'm3', gen: 'u' },
  { lemma: 'kod', pattern: 'm3', gen: 'u' },
  { lemma: 'test', pattern: 'm3', gen: 'u' },
  { lemma: 'raport', pattern: 'm3', gen: 'u' },
  { lemma: 'dokument', pattern: 'm3', gen: 'u' },
  { lemma: 'budżet', pattern: 'm3', gen: 'u' },
  { lemma: 'harmonogram', pattern: 'm3', gen: 'u' },
  { lemma: 'standard', pattern: 'm3', gen: 'u' },
  { lemma: 'termin', pattern: 'm3', gen: 'u' },
  { lemma: 'koszt', pattern: 'm3', gen: 'u' },
  { lemma: 'wynik', pattern: 'm3', gen: 'u' },
  { lemma: 'produkt', pattern: 'm3', gen: 'u' },
  { lemma: 'kontrakt', pattern: 'm3', gen: 'u' },
  { lemma: 'backend', pattern: 'm3', gen: 'u' },
  { lemma: 'frontend', pattern: 'm3', gen: 'u' },
  { lemma: 'framework', pattern: 'm3', gen: 'u' },
  { lemma: 'deployment', pattern: 'm3', gen: 'u' },
  { lemma: 'pipeline', pattern: 'm3', gen: 'u' },
  { lemma: 'zespół', pattern: 'm3', gen: 'u', obliqueStem: 'zespoł', extraForms: ['zespole', 'zespoły', 'zespołów'] },
  { lemma: 'błąd', pattern: 'm3', gen: 'u', obliqueStem: 'błęd', extraForms: ['błędzie', 'błędy', 'błędów'] },
  { lemma: 'przychód', pattern: 'm3', gen: 'u', obliqueStem: 'przychod', extraForms: ['przychodzie', 'przychody'] },

  { lemma: 'programista', pattern: 'm1-a' },
  { lemma: 'specjalista', pattern: 'm1-a' },
  { lemma: 'analityk', pattern: 'm1' },
  { lemma: 'architekt', pattern: 'm1' },
  { lemma: 'administrator', pattern: 'm1' },
  { lemma: 'kierownik', pattern: 'm1' },
  { lemma: 'użytkownik', pattern: 'm1' },
  { lemma: 'pracownik', pattern: 'm1' },
  { lemma: 'klient', pattern: 'm1' },
  { lemma: 'inżynier', pattern: 'm1' },
  { lemma: 'tester', pattern: 'm1' },
  { lemma: 'deweloper', pattern: 'm1' },
  { lemma: 'konsultant', pattern: 'm1' },
  { lemma: 'serwisant', pattern: 'm1' },
  { lemma: 'monter', pattern: 'm1' },
  { lemma: 'mechanik', pattern: 'm1' },
  { lemma: 'technik', pattern: 'm1' },
  { lemma: 'operator', pattern: 'm1' },
  { lemma: 'projektant', pattern: 'm1' },
  { lemma: 'spawacz', pattern: 'm1', extraForms: ['spawacze', 'spawaczy', 'spawaczem', 'spawaczu'] },

  { lemma: 'kocioł', pattern: 'm3', gen: 'a', obliqueStem: 'kotł', extraForms: ['kotle', 'kotły', 'kotłów'] },
  { lemma: 'piec', pattern: 'm3', gen: 'a', extraForms: ['piece', 'piecu'] },
  { lemma: 'piecyk', pattern: 'm3', gen: 'a' },
  { lemma: 'grzejnik', pattern: 'm3', gen: 'a' },
  { lemma: 'zawór', pattern: 'm3', gen: 'u', obliqueStem: 'zawor', extraForms: ['zaworze', 'zawory'] },
  { lemma: 'przegląd', pattern: 'm3', gen: 'u', obliqueStem: 'przeglądz', extraForms: ['przeglądu', 'przeglądy', 'przeglądów', 'przeglądem'] },
  { lemma: 'montaż', pattern: 'm3', gen: 'u', extraForms: ['montaże'] },

  { lemma: 'rura', pattern: 'f-hard', extraForms: ['rurze'] },
  { lemma: 'pompa', pattern: 'f-hard', extraForms: ['pompie'] },
  { lemma: 'spawarka', pattern: 'f-hard', extraForms: ['spawarce'] },
  { lemma: 'usterka', pattern: 'f-hard', extraForms: ['usterce'] },
  { lemma: 'baza', pattern: 'f-hard', extraForms: ['bazie'] },
  { lemma: 'chmura', pattern: 'f-hard', extraForms: ['chmurze'] },
  { lemma: 'usługa', pattern: 'f-hard', extraForms: ['usłudze'] },
  { lemma: 'biblioteka', pattern: 'f-hard', extraForms: ['bibliotece'] },
  { lemma: 'metoda', pattern: 'f-hard', extraForms: ['metodzie'] },
  { lemma: 'awaria', pattern: 'f-soft' },
  { lemma: 'aplikacja', pattern: 'f-soft' },
  { lemma: 'funkcja', pattern: 'f-soft' },
  { lemma: 'analiza', pattern: 'f-hard', extraForms: ['analizie'] },
  { lemma: 'architektura', pattern: 'f-hard', extraForms: ['architekturze'] },
  { lemma: 'dokumentacja', pattern: 'f-soft' },
  { lemma: 'automatyzacja', pattern: 'f-soft' },
  { lemma: 'konteneryzacja', pattern: 'f-soft' },
  { lemma: 'wirtualizacja', pattern: 'f-soft' },
  { lemma: 'integracja', pattern: 'f-soft' },
  { lemma: 'migracja', pattern: 'f-soft' },
  { lemma: 'optymalizacja', pattern: 'f-soft' },
  { lemma: 'konfiguracja', pattern: 'f-soft' },
  { lemma: 'orkiestracja', pattern: 'f-soft' },
  { lemma: 'instalacja', pattern: 'f-soft' },
  { lemma: 'konserwacja', pattern: 'f-soft' },
  { lemma: 'rekrutacja', pattern: 'f-soft' },
  { lemma: 'prezentacja', pattern: 'f-soft' },
  { lemma: 'wizualizacja', pattern: 'f-soft' },
  { lemma: 'weryfikacja', pattern: 'f-soft' },
  { lemma: 'walidacja', pattern: 'f-soft' },
  { lemma: 'standaryzacja', pattern: 'f-soft' },
  { lemma: 'modernizacja', pattern: 'f-soft' },
  { lemma: 'archiwizacja', pattern: 'f-soft' },
  { lemma: 'diagnostyka', pattern: 'f-hard', extraForms: ['diagnostyce'] },
  { lemma: 'infrastruktura', pattern: 'f-hard', extraForms: ['infrastrukturze'] },
  { lemma: 'sieć', pattern: 'f-osc', extraForms: ['sieci', 'siecią', 'sieciom', 'sieciami', 'sieciach'] },
  { lemma: 'wydajność', pattern: 'f-osc' },
  { lemma: 'jakość', pattern: 'f-osc' },
  { lemma: 'dostępność', pattern: 'f-osc' },
  { lemma: 'niezawodność', pattern: 'f-osc' },
  { lemma: 'skuteczność', pattern: 'f-osc' },

  { lemma: 'środowisko', pattern: 'n-hard' },
  { lemma: 'ryzyko', pattern: 'n-hard' },
  { lemma: 'źródło', pattern: 'n-hard', extraForms: ['źródeł'] },
  { lemma: 'narzędzie', pattern: 'n-soft' },
  { lemma: 'rozwiązanie', pattern: 'n-soft' },
  { lemma: 'oprogramowanie', pattern: 'n-soft' },
  { lemma: 'doświadczenie', pattern: 'n-soft' },
  { lemma: 'zadanie', pattern: 'n-soft' },
  { lemma: 'szkolenie', pattern: 'n-soft' },
];

// ---------------------------------------------------------------------------
// Przymiotniki
// ---------------------------------------------------------------------------

/** Przymiotniki opisujące technologie i kompetencje (odmiana regularna -y/-i). */
export const DOMAIN_ADJECTIVES: string[] = [
  'techniczny',
  'systemowy',
  'produkcyjny',
  'testowy',
  'wydajny',
  'skalowalny',
  'zwinny',
  'chmurowy',
  'dockerowy',
  'kontenerowy',
  'relacyjny',
  'rozproszony',
  'bezpieczny',
  'automatyczny',
  'ciągły',
  'kluczowy',
  'złożony',
  'analityczny',
  'projektowy',
  'zespołowy',
  'wdrożeniowy',
  'serwisowy',
  'gazowy',
  'elektryczny',
  'przemysłowy',
];

function declineAdjective(lemma: string): string[] {
  const stem = lemma.slice(0, -1); // techniczny -> techniczn
  return [
    lemma,
    `${stem}ego`,
    `${stem}emu`,
    `${stem}ym`,
    `${stem}ymi`,
    `${stem}ych`,
    `${stem}e`,
    `${stem}a`,
    `${stem}ej`,
    `${stem}ą`,
    `${stem}i`,
  ];
}

// ---------------------------------------------------------------------------
// Budowa korpusu
// ---------------------------------------------------------------------------

/**
 * Usuwa duplikaty form. Przy kolizji wygrywa wpis o wyższym priorytecie części
 * mowy — dzięki temu np. przymiotnikowe „dockerowi” nigdy nie przesłoni
 * rzeczownikowego celownika „dockerowi”, a wynik nie zależy od kolejności tabel.
 */
export function dedupeByPosPriority(entries: MorphEntry[]): MorphEntry[] {
  const best = new Map<string, MorphEntry>();

  for (const entry of entries) {
    const form = entry.form.toLowerCase();
    const current = best.get(form);
    if (!current) {
      best.set(form, { ...entry, form, lemma: entry.lemma.toLowerCase() });
      continue;
    }
    const incomingRank = POS_RANK[entry.posTag as PosTag] ?? 9;
    const currentRank = POS_RANK[current.posTag as PosTag] ?? 9;
    if (incomingRank < currentRank) {
      best.set(form, { ...entry, form, lemma: entry.lemma.toLowerCase() });
    }
  }

  return [...best.values()];
}

/** Rozwija pojedynczy czasownik do pełnego zbioru form. */
export function expandVerb(spec: VerbSpec): MorphEntry[] {
  const cls = classifyVerb(spec.lemma);
  const lemma = spec.lemma;
  const out: MorphEntry[] = [{ form: lemma, lemma, posTag: 'verb' }];

  for (const form of derivePraeteritum(lemma)) {
    out.push({ form, lemma, posTag: 'praet' });
  }

  if (!spec.skipFinite) {
    for (const form of deriveFinite(lemma, cls)) {
      out.push({ form, lemma, posTag: 'fin' });
    }
  }

  const gerund = spec.gerund === null ? null : (spec.gerund ?? deriveGerund(lemma, cls));
  if (gerund) {
    for (const form of declineGerund(gerund)) {
      out.push({ form, lemma, posTag: 'ger' });
    }
  }

  for (const [form, tag] of spec.extraForms ?? []) {
    out.push({ form, lemma, posTag: tag });
  }

  return out;
}

/** Rozwija pojedynczy rzeczownik do pełnego zbioru form. */
export function expandNoun(spec: NounSpec): MorphEntry[] {
  return declineNoun(spec).map((form) => ({ form, lemma: spec.lemma, posTag: 'subst' }));
}

/**
 * Generuje odmianę męskorzeczową dla nazwy technologii („docker” → „dockerze”,
 * „dockera”, „dockerem”). Pomijamy nazwy nieodmienne w polszczyźnie: skróty,
 * nazwy z interpunkcją oraz bardzo krótkie identyfikatory (`go`, `r`, `c++`).
 */
export function expandTechnologyName(name: string): MorphEntry[] {
  const lemma = name.toLowerCase().trim();
  if (lemma.length < 4) return [];
  if (!/^[a-ząćęłńóśźż][a-ząćęłńóśźż0-9]*$/.test(lemma)) return [];

  return expandNoun({ lemma, pattern: 'm3', gen: 'a' });
}

/**
 * Buduje kompletny kuratorowany korpus morfologiczny.
 *
 * @param technologyNames dodatkowe nazwy technologii z tezaurusa umiejętności.
 */
export function buildOfflineMorphCorpus(technologyNames: string[] = []): MorphEntry[] {
  const entries: MorphEntry[] = [];

  for (const adjective of DOMAIN_ADJECTIVES) {
    for (const form of declineAdjective(adjective)) {
      entries.push({ form, lemma: adjective, posTag: 'adj' });
    }
  }

  for (const name of technologyNames) {
    entries.push(...expandTechnologyName(name));
  }

  for (const noun of DOMAIN_NOUNS) {
    entries.push(...expandNoun(noun));
  }

  for (const verb of ACTION_VERBS) {
    entries.push(...expandVerb(verb));
  }

  return dedupeByPosPriority(entries);
}
