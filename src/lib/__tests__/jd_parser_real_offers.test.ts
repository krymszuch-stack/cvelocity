import { describe, it, expect } from 'vitest';
import {
  parseJobDescriptionLocal,
  extractExperienceRequirement,
  extractResponsibilities,
  stripLegalBoilerplate,
} from '../jdParser';
import { extractDynamicJdPhrases } from '../atsSimulator';
import { buildGlossary } from '../interviewCheatSheetEngine';

/**
 * Regression fixtures taken from REAL job ads (Indeed PL, August 2026), deliberately
 * spanning trades, banking and IT plus both languages. Testing only on IT ads hid a
 * whole class of defects: the parser used to back-fill missing fields with plausible
 * IT-flavoured guesses, so a welding job "required" TypeScript, React and Node.js.
 */

// Cognor, Kraków — welder. Opens with a street address and carries the legally
// mandatory RODO clause whose "przez okres 3 lat" was read as an experience requirement.
const COGNOR_WELDER = `ul. Ujastek 1, Kraków

Do naszej krakowskiej walcowni poszukujemy Spawacza (k/m), który dołączy do działu Osprzętu!

Zakres obowiązków:
spawanie elementów metodą MIG/MAG, MMA
spawanie prostych konstrukcji stalowych wg rysunków technicznych
prace ślusarskie, m.in. szlifowanie, cięcie, wiercenie, gwintowanie
obsługa maszyn i urządzeń warsztatowych oraz elektronarzędzi

Wymagania:
doświadczenie w spawaniu metodami MIG/MAG oraz MMA
umiejętność czytania rysunków technicznych
mile widziane aktualne uprawnienia spawalnicze

Benefity:
karta lunchowa doładowywana co miesiąc kwotą 450 PLN netto
pakiet opieki medycznej za 1 zł, dostępny również dla członków rodziny
ubezpieczenie grupowe na preferencyjnych warunkach
kursy i szkolenia podnoszące kwalifikacje
pakiet sportowy
świadczenia w ramach ZFŚS

Dane Administratorów: Administratorem Pani/Pana danych osobowych objętych formularzem jest COGNOR S.A. Oddział Ferrostal w Siemianowicach Śląskich, ul. Stalmacha 8, 41-106 Siemianowice Śląskie.
Okres przechowywania: Pani/Pana dane osobowe przetwarzamy w celu prowadzenia rekrutacji przez okres 6 miesięcy od daty przesłania zgłoszenia rekrutacyjnego. Ponadto Pani/Pana dane osobowe możemy przechowywać dla celów obrony przed roszczeniami przez okres 3 lat od daty przesłania zgłoszenia rekrutacyjnego.`;

// Alior Bank — AML/sanctions specialist. The ad opens with its REQUIREMENTS section,
// so "lines 2-6" used to be mislabelled as the core responsibilities.
const ALIOR_AML = `Jeśli jesteś osobą, która posiada:

minimum 3 lata doświadczenia w bankowości lub instytucjach finansowych w obszarze AML
bardzo dobrą znajomość produktów bankowych;
doskonałe umiejętności analityczne i zdolność do pracy z dużą ilością danych;
znajomość języka angielskiego na poziomie B1-B2;
znajomość języka rosyjskiego na poziomie B1 (praca z dokumentami);

Mamy dla Ciebie pracę, która polega na:

realizowaniu obowiązków wynikających z Ustawy o przeciwdziałaniu praniu pieniędzy oraz finansowaniu terroryzmu (AML);
udziale w procesie monitorowania transakcji pod kątem sankcji międzynarodowych;
weryfikacji Klientów pod kątem statusu PEP zgodnie z regulacjami prawnymi;

Oferujemy:

umowę o pracę
pracę hybrydową
pakiet benefitów m.in. kafeteria, prywatna opieka medyczna, karta Multisport, ubezpieczenie`;

// Drukarnia PASAŻ — warehouse. Opens with application instructions including an e-mail
// address, which used to be surfaced as a "core responsibility" to prepare an example for.
const PASAZ_WAREHOUSE = `Jesteś zainteresowny(a) pracą w stabilnej firmie, która stale się rozwija ?
Skontaktuj się z nami bezpośrednio w dogodny dla Ciebie sposób:

- prześlij swoje dokumenty aplikacyjne (np. CV) na adres email: rekrutacja@pasaz.com
- po prostu przyjdz do nas (w godzinach 09:00 - 14:00) i powiedz w sekretariacie że interesuje Cię praca w drukarni
Magazynier

Zakres pracy:
- przyjmowanie dostaw towaru
- planowanie wykorzystania przestrzeni magazynowej
- czynności związane z wysyłką towaru
- sprawdzanie stanów magazynowych

Wymagania:
- doświadczenie w pracy na magazynie
- uprawnienia do obsługi wózka widłowego
- prawo jazdy kategoria B`;

// Vimanet — English-language frontend ad. Opens with the salary line, states the salary
// as "net PLN"/"gross PLN", and uses "B2B" as a contract type (not a language level).
const VIMANET_FRONTEND = `12 000 - 20 000 net PLN

We are looking for an experienced Angular Developer to help us set and maintain frontend development standards.

Employment type:
B2B or Employment Contract

Monthly salary (B2B):
12 000 - 20 000 net PLN

Tasks
developing new user interfaces of enterprise products using Angular or React or Vue
mentoring and supporting other team members in the context of the application front end layer
working in SCRUM methodology

Must have
a minimum of 3 years of working experience
strong knowledge of Angular, React or VueJS
English (Intermediate level) and above, oral and written is a must

What we offer
flexible working hours
remote work
private health insurance (Luxmed package)
multisport card
training budget +3 days off for self-development`;

describe('no fabricated data (0-Halucynacji)', () => {
  it('does not invent IT skills for a welding job', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);

    expect(parsed.requiredHardSkills).not.toContain('TypeScript');
    expect(parsed.requiredHardSkills).not.toContain('React');
    expect(parsed.requiredHardSkills).not.toContain('Node.js');
    expect(parsed.toolsAndTech).not.toContain('Docker');
    expect(parsed.toolsAndTech).not.toContain('Jira');
  });

  it('does not invent an English requirement for an ad that never mentions a language', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);
    expect(parsed.languagesRequired).toEqual([]);
  });

  it('does not invent a work model when the ad is silent about it', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);
    expect(parsed.workModel).toBeUndefined();
  });

  it('does not attribute a brand to a medical package the ad does not name', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);
    expect(parsed.benefits).toContain('Prywatna opieka medyczna');
    expect(parsed.benefits?.join(' ')).not.toMatch(/LuxMed|EnelMed/i);
  });

  it('does not upgrade "kursy i szkolenia" into a training budget', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);
    expect(parsed.benefits).toContain('Szkolenia i kursy');
    expect(parsed.benefits).not.toContain('Budżet szkoleniowy');
  });

  it('leaves the company name empty rather than asserting a placeholder', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);
    expect(parsed.companyName).toBe('');
  });
});

describe('RODO clause must not produce requirements', () => {
  it('does not read the data-retention period as an experience requirement', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);
    const asText = (parsed.mandatoryRequirements || []).join(' ');

    expect(asText).not.toMatch(/doświadczeni/i);
  });

  it('strips legal boilerplate lines before requirement scanning', () => {
    const stripped = stripLegalBoilerplate(COGNOR_WELDER);

    expect(stripped).not.toMatch(/Okres przechowywania/);
    expect(stripped).not.toMatch(/danych osobowych/);
    expect(stripped).toMatch(/spawanie elementów metodą MIG\/MAG/);
  });

  it('still reads a genuine experience requirement stated in the ad body', () => {
    expect(extractExperienceRequirement('minimum 3 lata doświadczenia w bankowości')).toBe(
      'Min. 3 lat doświadczenia'
    );
    expect(extractExperienceRequirement('a minimum of 3 years of working experience')).toBe(
      'Min. 3 lat doświadczenia'
    );
    expect(extractExperienceRequirement('przez okres 3 lat od daty przesłania zgłoszenia')).toBeNull();
  });
});

describe('job title detection', () => {
  it('never overwrites a title supplied by the user', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER, 'Spawacz MIG/MAG');
    expect(parsed.jobTitle).toBe('Spawacz MIG/MAG');
  });

  it('rejects a street address as the job title', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);
    expect(parsed.jobTitle).not.toMatch(/Ujastek/);
  });

  it('rejects a salary line as the job title', () => {
    const parsed = parseJobDescriptionLocal(VIMANET_FRONTEND);
    expect(parsed.jobTitle).not.toMatch(/PLN/);
  });

  it('rejects an introductory sentence as the job title', () => {
    expect(parseJobDescriptionLocal(ALIOR_AML).jobTitle).not.toMatch(/Jeśli jesteś/);
    expect(parseJobDescriptionLocal(PASAZ_WAREHOUSE).jobTitle).not.toMatch(/zainteresowny/);
  });
});

describe('core responsibilities', () => {
  it('takes the responsibilities section, not the requirements the ad opens with', () => {
    const parsed = parseJobDescriptionLocal(ALIOR_AML);

    expect(parsed.coreResponsibilities.join(' ')).toMatch(/przeciwdziałaniu praniu pieniędzy/);
    expect(parsed.coreResponsibilities.join(' ')).not.toMatch(/minimum 3 lata doświadczenia/);
  });

  it('never surfaces the recruiter e-mail or application instructions', () => {
    const parsed = parseJobDescriptionLocal(PASAZ_WAREHOUSE);
    const asText = parsed.coreResponsibilities.join(' ');

    expect(asText).not.toMatch(/@/);
    expect(asText).not.toMatch(/prześlij swoje dokumenty/i);
    expect(asText).toMatch(/przyjmowanie dostaw towaru/);
  });

  it('drops section headers instead of listing them as duties', () => {
    const responsibilities = extractResponsibilities([
      'Zakres obowiązków:',
      'spawanie konstrukcji stalowych',
      'Wymagania:',
      'uprawnienia spawalnicze',
    ]);

    expect(responsibilities).toEqual(['spawanie konstrukcji stalowych']);
  });
});

describe('language level accuracy', () => {
  it('reports the level the ad states rather than a fixed B2/C1', () => {
    const parsed = parseJobDescriptionLocal(ALIOR_AML);

    expect(parsed.languagesRequired).toContain('Angielski (B1-B2)');
    expect(parsed.languagesRequired.join(' ')).not.toMatch(/C1/);
  });

  it('detects Russian, which the ad genuinely requires', () => {
    const parsed = parseJobDescriptionLocal(ALIOR_AML);
    expect(parsed.languagesRequired.some((l) => l.startsWith('Rosyjski'))).toBe(true);
  });

  it('does not treat the "B2B" contract type as a language level', () => {
    const parsed = parseJobDescriptionLocal(VIMANET_FRONTEND);
    const english = parsed.languagesRequired.find((l) => l.startsWith('Angielski'));

    expect(english).toBe('Angielski');
  });
});

describe('trade-specific dealbreakers', () => {
  it('detects the forklift licence a warehouse ad requires', () => {
    const parsed = parseJobDescriptionLocal(PASAZ_WAREHOUSE);
    expect(parsed.mandatoryRequirements?.join(' ')).toMatch(/wózka widłowego/i);
  });

  it('detects the driving licence category', () => {
    const parsed = parseJobDescriptionLocal(PASAZ_WAREHOUSE);
    expect(parsed.mandatoryRequirements?.join(' ')).toMatch(/Prawo jazdy kat\. B/);
  });
});

describe('salary range', () => {
  it('reads a range written as "12 000 - 20 000 net PLN"', () => {
    const parsed = parseJobDescriptionLocal(VIMANET_FRONTEND);
    expect(parsed.salaryRange).toMatch(/12 000 - 20 000 net PLN/);
  });
});

describe('skill extraction hygiene', () => {
  it('does not treat street names, city names or legal boilerplate as skills', () => {
    const { hardSkills } = extractDynamicJdPhrases(COGNOR_WELDER);
    const phrases = hardSkills.map((h) => h.phrase);

    expect(phrases).not.toContain('ujastek');
    expect(phrases).not.toContain('stalmacha');
    expect(phrases).not.toContain('administratorem');
    expect(phrases).not.toContain('benefity');
    expect(phrases).not.toContain('pln');
  });

  it('does not truncate Polish words at diacritics ("Osprzętu" -> "osprz")', () => {
    const { hardSkills } = extractDynamicJdPhrases(COGNOR_WELDER);
    expect(hardSkills.map((h) => h.phrase)).not.toContain('osprz');
  });

  it('still keeps genuine trade acronyms', () => {
    const phrases = extractDynamicJdPhrases(COGNOR_WELDER).hardSkills.map((h) => h.phrase);

    expect(phrases).toContain('mig');
    expect(phrases).toContain('mag');
    expect(phrases).toContain('mma');
  });

  it('does not read the Polish word "jest" as the Jest test framework', () => {
    const phrases = extractDynamicJdPhrases('Praca jest ciekawa, a zespół go wspiera.').hardSkills.map(
      (h) => h.phrase
    );

    expect(phrases).not.toContain('jest');
    expect(phrases).not.toContain('go');
  });
});

describe('cheat sheet glossary quality', () => {
  it('never presents an undefined ad word as a term to be able to explain', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER, 'Spawacz MIG/MAG');
    const terms = buildGlossary(parsed).map((g) => g.term.toLowerCase());

    expect(terms).not.toContain('ujastek');
    expect(terms).not.toContain('kraków');
    expect(terms).not.toContain('pln');
    expect(terms).not.toContain('osprz');
  });

  it('does not list the Jest framework because the RODO clause contains "jest"', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER, 'Spawacz MIG/MAG');

    expect(parsed.requiredHardSkills.map((s) => s.toLowerCase())).not.toContain('jest');
    expect(buildGlossary(parsed).map((g) => g.term.toLowerCase())).not.toContain('jest');
  });
});

describe('keyword hygiene', () => {
  it('does not emit truncated Polish stubs as key terms', () => {
    const parsed = parseJobDescriptionLocal(COGNOR_WELDER);

    expect(parsed.keyKeywords).not.toContain('wym');
    expect(parsed.keyKeywords).not.toContain('wsp');
    expect(parsed.keyKeywords.every((k) => k.length >= 3)).toBe(true);
  });

  it('keeps Polish words whole instead of cutting them at diacritics', () => {
    const parsed = parseJobDescriptionLocal('Wymagany wymóg: współpraca z zespołem i spawanie konstrukcji.');

    // Asserted on whole tokens — a substring regex would match the "wsp" prefix of
    // "współpraca", since \b treats "ó" as a non-word character.
    expect(parsed.keyKeywords).toContain('współpraca');
    expect(parsed.keyKeywords).not.toContain('wsp');
    expect(parsed.keyKeywords).not.toContain('wym');
  });

  it('strips trailing sentence punctuation from key terms', () => {
    const parsed = parseJobDescriptionLocal('Zadania: spawanie konstrukcji.');
    expect(parsed.keyKeywords).not.toContain('konstrukcji.');
  });
});
