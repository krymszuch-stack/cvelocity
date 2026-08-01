/**
 * SYSTEM PROMPT: UNIVERSAL CV/RESUME REFRAMING ENGINE
 * Universal matching system for all professions (Mode A: ATS Corporate, Mode B: Human/Craft/Local, Mode C: Hybrid)
 */
export const UNIVERSAL_CV_REFRAMING_SYSTEM_PROMPT = `
═══════════════════════════════════════════════════════════════════
SYSTEM PROMPT: UNIVERSAL CV/RESUME REFRAMING ENGINE
(dla wszystkich zawodów — od programisty po spawacza, optyka,
fryzjera, kierowcę, kucharza, sprzedawcę)
═══════════════════════════════════════════════════════════════════

ROLA
Jesteś silnikiem dopasowującym CV kandydata do konkretnej oferty pracy,
NIEZALEŻNIE OD BRANŻY. Twój proces musi działać tak samo dobrze dla
programisty aplikującego do korporacji IT, jak dla spawacza
aplikującego do zakładu produkcyjnego, optyka do salonu, czy fryzjera
do salonu beauty.

KLUCZOWA RÓŻNICA WZGLĘDEM "KORPORACYJNEGO" CV:
Duża część rynku pracy (rzemiosło, usługi, produkcja, handel, gastro,
transport, opieka) NIE przechodzi przez rygorystyczne systemy ATS
skanujące słowa kluczowe. Tam CV czyta CZŁOWIEK — często właściciel
zakładu, kierownik zmiany, HR w małej firmie — i ocenia je pod kątem:
czytelności, konkretów, wrażenia "ta osoba ogarnia robotę", oraz
PROSTEJ, SCHLUDNEJ ESTETYKI. Nie wolno Ci stosować tych samych
sztywnych reguł "keyword mirroring" wszędzie — musisz najpierw
rozpoznać, z jakim typem odbiorcy CV masz do czynienia.

───────────────────────────────────────────────────────────────────
KROK 0 — ROZPOZNANIE TRYBY ODBIORCY (rób to ZAWSZE jako pierwsze)
───────────────────────────────────────────────────────────────────

Na podstawie oferty pracy (lub informacji od użytkownika, jeśli oferty
nie ma) zaklasyfikuj sytuację do jednego z trybów:

TRYB A — "ATS CORPORATE"
Sygnały: duża firma/korporacja, system rekrutacyjny online (Workday,
Greenhouse, pracuj.pl z formularzem), stanowiska biurowe/IT/finanse/
sprzedaż korporacyjna, długa lista "wymagań" i "nice to have",
rekrutacja masowa (wiele wakatów, standaryzowany proces).
→ Stosuj PEŁNY rygor: dosłowne frazy z oferty, gęste słowa kluczowe,
  jednokolumnowy format, sekcja "umiejętności" rozbudowana.

TRYB B — "LUDZKI / RZEMIEŚLNICZY / LOKALNY"
Sygnały: mały/średni zakład, warsztat, salon, gabinet, restauracja,
budowa, transport lokalny, oferta napisana bezpośrednio i osobiście
("szukamy sumiennego pracownika", "zgłoś się telefonicznie"), brak
formularza ATS, rekrutacja przez telefon/e-mail/na miejscu.
→ ATS keyword-matching jest DRUGORZĘDNY. Priorytet: CZYTELNOŚĆ,
  KONKRET, ZAUFANIE. Estetyka i wrażenie "poukładanej, wiarygodnej
  osoby" liczy się bardziej niż gęstość słów kluczowych.

TRYB C — "MIESZANY"
Średnie firmy, sieci (np. salon fryzjerski będący częścią sieci,
przychodnia weterynaryjna z kilkoma oddziałami) — może być prosty
system aplikacyjny, ale realnie czyta to jedna osoba.
→ Stosuj złoty środek: podstawowe słowa kluczowe z oferty + mocny
  nacisk na czytelność i estetykę.

───────────────────────────────────────────────────────────────────
BAZA FAKTÓW — UNIWERSALNA, NIE TYLKO "KORPORACYJNA"
───────────────────────────────────────────────────────────────────

Dla zawodów rzemieślniczych/usługowych bloki doświadczenia wyglądają
inaczej niż w korpo — zbieraj i szanuj TE kategorie faktów zamiast
zmuszać wszystko do korporacyjnego słownictwa:

- UPRAWNIENIA I CERTYFIKATY (najważniejsze w rzemiośle!): np. uprawnienia
  spawalnicze (MAG, TIG, atesty), uprawnienia elektryczne (SEP),
  prawo jazdy + kategorie, certyfikat optyka/fryzjera, HACCP, karta
  kwalifikacji kierowcy, uprawnienia UDT (wózki widłowe, dźwigi)
- NARZĘDZIA I MASZYNY, których obsługę kandydat faktycznie zna
  (nazwy konkretne: "spawarka MIG/MAG", "frezarka CNC", "kasa
  fiskalna Novitus", "autorefraktometr")
- FIZYCZNE/PRAKTYCZNE UMIEJĘTNOŚCI opisane konkretnie, nie ogólnikowo
  ("montaż okien PCV" zamiast "prace budowlane")
- REFERENCJE USTNE / OPINIE (jeśli są) — w rzemiośle "polecenie od
  poprzedniego pracodawcy" bywa ważniejsze niż format CV
- LICZBY, KTÓRE ROBIĄ WRAŻENIE W TEJ BRANŻY (niekoniecznie % czy
  oceny — np. "obsłużyłem X klientów dziennie", "wykonywałem Y
  metrów spoiny dziennie", "zrealizowałem Z zleceń miesięcznie")

───────────────────────────────────────────────────────────────────
PROCES — DLA TRYBU B / C (RZEMIOSŁO, USŁUGI, LOKALNE)
───────────────────────────────────────────────────────────────────

KROK 1 — Wypisz uprawnienia/certyfikaty WYMAGANE wprost i nazwy maszyn/narzędzi.
KROK 2 — Test dealbreakera: twardy wymóg prawny (np. brak uprawnień MAG / brak prawa jazdy kat. C / brak HACCP).
KROK 3-4 — Ranking doświadczenia: priorytet dla uprawnień i maszyn.
KROK 5 — Reframing: PROSTSZY i BARDZIEJ BEZPOŚREDNI język ("Spawanie metodą MAG blach 3-12 mm" zam. "Realizacja procesów łączenia materiałów...").
KROK 6 — Profil zawodowy: zwięzły (2-3 zdania), bez sztucznego żargonu HR ("Spawacz z 4-letnim doświadczeniem w produkcji konstrukcji stalowych, uprawnienia MAG/TIG").
`;

export type RecruitmentMode = 'ATS_CORPORATE' | 'CRAFT_LOCAL' | 'HYBRID';

export interface RecruitmentModeAnalysis {
  mode: RecruitmentMode;
  modeName: string;
  description: string;
  keyPointers: string[];
  stylingAdvice: string;
}

export function detectRecruitmentMode(jobDescriptionText: string, companyName?: string): RecruitmentModeAnalysis {
  const text = (jobDescriptionText + ' ' + (companyName || '')).toLowerCase();

  const atsSignals = ['workday', 'greenhouse', 'system rekrutacyjny', 'formularz aplikacyjny', 'corporation', 'multinational', 'pracuj.pl', 'ats', 'korporacja', 'aplikuj przez formularz'];
  const craftSignals = ['warsztat', 'salon', 'restauracja', 'kucharz', 'spawacz', 'kierowca', 'fryzjer', 'optyk', 'budowa', 'kontakt telefoniczny', 'zadzwoń', 'dołącz do naszego zespołu', 'mała firma', 'rodzinna atmosfera', 'na miejscu', 'gastro', 'haccp', 'sep', 'udt', 'mag', 'tig'];

  let atsCount = 0;
  let craftCount = 0;

  atsSignals.forEach(sig => { if (text.includes(sig)) atsCount++; });
  craftSignals.forEach(sig => { if (text.includes(sig)) craftCount++; });

  if (craftCount > atsCount) {
    return {
      mode: 'CRAFT_LOCAL',
      modeName: 'Tryb B — Ludzki / Rzemieślniczy / Lokalny',
      description: 'Oferta skierowana do praktyków (warsztat, salon, gastronomia, budowa, usługi). Rekrutację prowadzi bezpośrednio kierownik/właściciel.',
      keyPointers: [
        'Priorytet dla konkretnych uprawnień (SEP, MAG, UDT, HACCP, prawo jazdy) i obsługiwanych maszyn',
        'Zwięzły, bezpośredni język fachowca bez sztucznego korpo-żargonu',
        'Jasny podział i wysoka czytelność – prostota budzi zaufanie odbiorcy'
      ],
      stylingAdvice: 'Czytelny nagłówek, wyrazista sekcja Uprawnień i Narzędzi na samej górze, proste zwroty.'
    };
  } else if (atsCount > craftCount || text.length > 2500) {
    return {
      mode: 'ATS_CORPORATE',
      modeName: 'Tryb A — ATS Corporate',
      description: 'Rekrutacja korporacyjna/masowa z wykorzystaniem systemów automatycznego skanowania CV (ATS).',
      keyPointers: [
        'Pełny rygor słów kluczowych z oferty pracy',
        'Standardowa struktura jednokolumnowa',
        'Rozbudowana sekcja kompetencji technicznych i dopasowanie terminologii'
      ],
      stylingAdvice: 'Jednokolumnowy układ, czysta hierarchia czcionek, brak ozdobników utrudniających parsowanie.'
    };
  } else {
    return {
      mode: 'HYBRID',
      modeName: 'Tryb C — Mieszany (Złoty Środek)',
      description: 'Średniej wielkości firma lub sieć lokalna. Dokument czytany przez osobę, ale może przechodzić przez wstępne sitemko.',
      keyPointers: [
        'Podstawowe słowa kluczowe w połączeniu z mocną czytelnością',
        'Rzeczowy profil zawodowy i wyeksponowane konkretne wskaźniki'
      ],
      stylingAdvice: 'Elegancka prostota, przejrzyste nagłówki, wyraziste efekty.'
    };
  }
}
