/**
 * Bank dynamicznych wariantów językowych (hooki, przywitania, wstępy, call-to-action).
 * Zapobiega powtarzalności i „szablonowości” w generatorach autoprezentacji,
 * listów motywacyjnych, podziękowań po rozmowie i telepromptera Live HUD.
 * Gwarantuje 0-tokenowe generowanie naturalnego, nieszablonowego języka polskiego.
 */

export interface HookContext {
  candidateName: string;
  roleTitle: string;
  companyName?: string;
  topSkills?: string;
  topMetric?: string;
  secondMetric?: string;
  companyContext?: string;
  verifiedClaimsCount?: number;
}

export type PhrasingTone = 'METRIC_FOCUSED' | 'TECHNICAL_EXPERT' | 'PRACTICAL_IMPACT' | 'BUSINESS_ROI' | 'DIRECT_CONFIDENT';

/**
 * Zwraca stabilny indeks wariantu na podstawie wejściowego ciągu znaków (hash) lub podanego indeksu.
 */
export function selectVariantIndex(seed: string | number | undefined, totalVariants: number): number {
  if (totalVariants <= 0) return 0;
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.abs(Math.floor(seed)) % totalVariants;
  }
  if (typeof seed === 'string' && seed.length > 0) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % totalVariants;
  }
  return 0;
}

/**
 * 1. Bank Hooków do Autoprezentacji / Elevator Pitch (Live HUD, ConsistencyGuard, PitchModal)
 */
export function getPitchHookVariations(ctx: HookContext): string[] {
  const { candidateName, roleTitle, topSkills, topMetric, verifiedClaimsCount = 3 } = ctx;
  const skills = topSkills || 'kluczowe kompetencje techniczne';
  const metricClause = topMetric ? `, w tym z udokumentowanym wynikiem ${topMetric}` : '';

  return [
    // Wariant 1: Klasyczny merytoryczny
    `Dzień dobry, nazywam się ${candidateName}. Jako ${roleTitle} opieram swoje doświadczenie na ${verifiedClaimsCount} zweryfikowanych filarach projektowych${metricClause}.`,
    
    // Wariant 2: Rezultatowy i zorientowany na ROI
    `Nazywam się ${candidateName}. W roli ${roleTitle} koncentruję się na wymiernych rezultatach – moje dotychczasowe wdrożenia przyniosły m.in. ${topMetric || 'znaczną optymalizację kluczowych procesów'}.`,
    
    // Wariant 3: Narzędziowy & Ekspercki
    `Cześć, jestem ${candidateName} i specjalizuję się jako ${roleTitle}. Moje codzienne środowisko pracy opiera się na ${skills}, a w projektach stawiam na jakość i stabilność rozwiązań.`,
    
    // Wariant 4: Praktyczny & Gotowy do działania
    `Dzień dobry! Nazywam się ${candidateName}. Jako ${roleTitle} łączę praktyczne doświadczenie w ${skills} ze sprawdzoną umiejętnością szybkiego rozwiązywania problemów operacyjnych.`,
    
    // Wariant 5: Architektoniczno-procesowy
    `Nazywam się ${candidateName} i od lat realizuję projekty jako ${roleTitle}. W pracy inżynierskiej kładę nacisk na standardy jakościowe oraz mierzalne efekty biznesowe${metricClause}.`,
    
    // Wariant 6: Bezpośredni & Partnerski
    `Dzień dobry, z tej strony ${candidateName}. Jako ${roleTitle} z udokumentowaną historią wdrożeń, wnoszę do zespołu natychmiastową samodzielność i ekspertyzę w ${skills}.`,
  ];
}

/**
 * 2. Bank Zakończeń / Call to Action do Autoprezentacji (Pitch)
 */
export function getPitchCtaVariations(ctx: HookContext): string[] {
  const { companyName, roleTitle } = ctx;
  const target = companyName ? `w firmie ${companyName}` : `na stanowisku ${roleTitle}`;

  return [
    `Chętnie przedstawię szczegóły tych wdrożeń podczas rozmowy technicznej.`,
    `Z przyjemnością omówię, w jaki sposób te doświadczenia przełożą się na natychmiastowe wsparcie Państwa zespołu ${target}.`,
    `Chętnie odpowiem na pytania dotyczące konkretnych studiów przypadków i metryk z moich realizacji.`,
    `Będzie mi bardzo miło rozwinąć te wątki i poznać bieżące priorytety projektowe Państwa zespołu.`,
    `Zapraszam do rozmowy – chętnie zaprezentuję, jak moja wiedza praktyczna wpisuje się w wyzwania ${target}.`,
  ];
}

/**
 * 3. Bank Nagłówków Grzecznościowych do Listu Motywacyjnego
 */
export function getCoverLetterSalutations(companyName?: string): string[] {
  const companySuffix = companyName && companyName !== 'Państwa Firmie' ? ` firmy ${companyName}` : '';
  return [
    'Szanowni Państwo,',
    `Szanowny Zespole Rekrutacji${companySuffix},`,
    `Szanowny Zespole${companySuffix},`,
    'Dzień dobry,',
  ];
}

/**
 * 4. Bank Wstępów (Hooków) do Listu Motywacyjnego (Anti-Template Cover Letter)
 * Poprawne gramatycznie formy w języku polskim, zróżnicowane stylistycznie.
 */
export function getCoverLetterHookVariations(ctx: HookContext): string[] {
  const { roleTitle, companyName = 'Państwa Firmie', topSkills, topMetric } = ctx;
  const skills = topSkills || 'kluczowe technologie i narzędzia branżowe';
  const metricClause = topMetric ? ` (w tym m.in. ${topMetric})` : '';

  return [
    // Wariant 1: Bezpośrednia propozycja współpracy i gotowości
    `Zwracam się z propozycją współpracy na stanowisku ${roleTitle} w firmie ${companyName}. Jako specjalista z wieloletnią praktyką w pracy z ${skills}, wnoszę do Państwa zespołu sprawdzoną wiedzę inżynierską oraz gotowość do natychmiastowego podejmowania kluczowych wyzwań.`,
    
    // Wariant 2: Odpowiedź na wyzwania biznesowe i dowożenie celów
    `W odpowiedzi na Państwa rekrutację na rolę ${roleTitle}, przedstawiam profil zawodowy skoncentrowany na dowożeniu mierzalnych rezultatów operacyjnych${metricClause}. Śledząc rozwój ${companyName}, jestem przekonany, że moje doświadczenie z ${skills} pozwoli skutecznie wesprzeć Państwa bieżące projekty.`,
    
    // Wariant 3: Analityczny & Dopasowany do ogłoszenia
    `Z analizy profilu poszukiwanego kandydata wynika, że ${companyName} potrzebuje ${roleTitle}, który łączy rzetelny warsztat techniczny z odpowiedzialnością za powierzony obszar. Moje dotychczasowe realizacje oparte na ${skills} stanowią bezpośrednią odpowiedź na te oczekiwania.`,
    
    // Wariant 4: Solidność inżynierska & kultura techniczna
    `Aplikuję na stanowisko ${roleTitle} w ${companyName}, opierając swoją kandydaturę na solidnym przygotowaniu wykonawczym, biegłości w ${skills} oraz rygorystycznym podejściu do standardów bezpieczeństwa i jakości.`,
    
    // Wariant 5: Sprawczość & Rozwiązywanie problemów
    `Poszukują Państwo ${roleTitle}, który potrafi sprawnie identyfikować wąskie gardła i przekładać wymagania na stabilne rozwiązania produkcyjne? Chętnie zaoferuję swoje umiejętności praktyczne oraz doświadczenie w ${skills} w zespole ${companyName}.`,
    
    // Wariant 6: Rezultatowy & Zorientowany na mierzalny wpływ
    `Zgłaszam swoją aplikację na stanowisko ${roleTitle} w ${companyName}. W pracy zawodowej stawiam na wymierne rezultaty${metricClause}, a opanowane środowisko ${skills} pozwala mi szybko i bezbłędnie realizować powierzone cele biznesowe.`,
    
    // Wariant 7: Doświadczenie & Rozwój procesów
    `Jako ${roleTitle} z udokumentowanym doświadczeniem wdrożeniowym w obszarze ${skills}, z dużym zainteresowaniem śledzę projekty realizowane przez ${companyName}. Chętnie wniosę swoje know-how i zaangażowanie w dalszy rozwój Państwa działu.`,
    
    // Wariant 8: Praktyk & Ekspert branżowy
    `Dobre przygotowanie rzemieślnicze, znajomość technologii ${skills} oraz orientacja na optymalizację pracy to fundamenty mojej codziennej praktyki jako ${roleTitle}. Z przyjemnością dołączę do zespołu ${companyName}, aby wspólnie realizować ambitne cele.`,
  ];
}

/**
 * 5. Bank Fraz Wprowadzających do Dowodów i Osiągnięć (Proof Points Bridges)
 */
export function getCoverLetterProofIntroductions(): string[] {
  return [
    'Wybrane przykłady moich dotychczasowych rezultatów zawodowych, które bezpośrednio korespondują z profilem stanowiska:',
    'Poniżej przedstawiam kluczowe wdrożenia i osiągnięcia potwierdzające moje przygotowanie praktyczne:',
    'Do najważniejszych efektów moich dotychczasowych projektów należą:',
    'Oto konkretne studia przypadków i wskaźniki z mojej dotychczasowej kariery:',
    'W dotychczasowej pracy zrealizowałem m.in. następujące zadania o wymiernym wpływie na procesy:',
    'Moje przygotowanie merytoryczne i rzetelność potwierdzają udokumentowane sukcesy projektowe:',
  ];
}

/**
 * 6. Bank Zakończeń (CTA) do Listu Motywacyjnego
 */
export function getCoverLetterCtaVariations(companyName = 'Państwa Firmie'): string[] {
  return [
    `Chętnie omówię podczas rozmowy rekrutacyjnej, w jaki sposób moje dotychczasowe osiągnięcia oraz opanowane narzędzia bezpośrednio wspomogą realizację celów firmy ${companyName}. Zapraszam do kontaktu.`,
    `Z przyjemnością przedstawię szczegółowe case studies z dotychczasowych projektów podczas bezpośredniego spotkania. Liczę na możliwość rozmowy o wyzwaniach i planach rozwojowych ${companyName}.`,
    `Będzie mi niezmiernie miło spotkać się na rozmowie kwalifikacyjnej, aby porozmawiać o tym, jak moje umiejętności mogą wesprzeć zespół w realizacji najbliższych celów operacyjnych.`,
    `Chętnie odpowiem na wszelkie pytania techniczne i zaprezentuję próbki dotychczasowych wdrożeń podczas rozmowy rekrutacyjnej. Pozostaję do Państwa dyspozycji.`,
    `Z satysfakcją zaprezentuję konkretne przykłady realizacji i porozmawiam o możliwościach współpracy w firmie ${companyName}. Zapraszam do kontaktu telefonicznego lub mailowego.`,
    `Jestem gotowy do podjęcia nowych wyzwań i chętnie przedstawię swój warsztat inżynierski podczas spotkania rekrutacyjnego. Dziękuję za poświęcony czas.`,
  ];
}

/**
 * 7. Bank Pożegnań do Listu Motywacyjnego
 */
export function getCoverLetterSignOffs(): string[] {
  return [
    'Z poważaniem,',
    'Z wyrazami szacunku,',
    'Łączę wyrazy szacunku,',
  ];
}

/**
 * 8. Bank Podziękowań / Wstępów do Maila Follow-up po Rozmowie
 */
export function getFollowUpEmailOpenings(roleTitle: string, highlightPoint: string): string[] {
  return [
    `Dzień dobry,\n\nBardzo dziękuję za poświęcony czas i inspirującą rozmowę dotyczącą stanowiska ${roleTitle}. Szczególnie doceniam ${highlightPoint}.`,
    `Dzień dobry,\n\nDziękuję za dzisiejsze spotkanie i szczegółowe przedstawienie wyzwań stojących przed zespołem w roli ${roleTitle}. Cieszę się, że mieliśmy okazję omówić ${highlightPoint}.`,
    `Dzień dobry,\n\nChciałbym serdecznie podziękować za merytoryczną wymianę myśli podczas dzisiejszej rozmowy o ${roleTitle}. Duże wrażenie zrobiło na mnie ${highlightPoint}.`,
    `Dzień dobry,\n\nDziękuję za otwartość i świetną atmosferę podczas dzisiejszego wywiadu na stanowisko ${roleTitle}. Rozmowa utwierdziła mnie w przekonaniu, że ${highlightPoint} to obszar, w którym mogę wnieść dużą wartość.`,
  ];
}

