import { describe, it, expect } from 'vitest';
import { auditKnockouts, findDanglingLicenseIds, KNOCKOUT_RULES } from '../knockouts';
import { ALL_LICENSES } from '../../data/licenses';
import { createEmptyVault } from '../sampleVault';
import { MasterVault } from '../../types';

/** Profil z zaznaczonymi uprawnieniami i opcjonalnym tekstem w doświadczeniu. */
function vaultWith(licenses: string[], highlightText = ''): MasterVault {
  const vault = createEmptyVault('Jan Kowalski');
  vault.profiler.licenses = licenses;

  if (highlightText) {
    vault.history = [
      {
        id: 'exp-1',
        company: 'Zakład',
        role: 'Pracownik',
        location: 'Kraków',
        startDate: '01.2020',
        endDate: 'Obecnie',
        isCurrent: true,
        highlights: [
          {
            id: 'h-1',
            text: highlightText,
            action: '',
            target: '',
            tool: '',
            metric: '',
            keywords: [],
          },
        ],
      },
    ];
  }

  return vault;
}

describe('Spójność katalogu uprawnień', () => {
  it('każda reguła wskazuje istniejące uprawnienie', () => {
    // Rozjazd tych dwóch list byłby cichy i objawiłby się użytkownikowi jako
    // „nie masz uprawnienia, które przed chwilą zaznaczyłeś".
    expect(findDanglingLicenseIds()).toEqual([]);
  });

  it('katalog nie ma zduplikowanych identyfikatorów', () => {
    const ids = ALL_LICENSES.map((license) => license.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reguły nie mają zduplikowanych identyfikatorów', () => {
    const ids = KNOCKOUT_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Zawody techniczne — to, czego stary audyt nie widział', () => {
  it('monter kotłów: wykrywa SEP G3 i F-Gaz', () => {
    const jd = `Poszukujemy serwisanta kotłów gazowych. Wymagane uprawnienia SEP G3
      oraz certyfikat F-Gaz. Mile widziane doświadczenie z marką Junkers.`;

    const report = auditKnockouts(jd, vaultWith([]));
    const ids = report.blocking.map((f) => f.ruleId);

    expect(ids).toContain('sep_g3');
    expect(ids).toContain('fgas');
  });

  it('zaznaczone uprawnienie w profilu spełnia wymaganie', () => {
    const jd = 'Wymagane uprawnienia SEP G3 (gazowe).';

    const report = auditKnockouts(jd, vaultWith(['sep_g3']));

    expect(report.blocking).toHaveLength(0);
    expect(report.findings[0].satisfied).toBe(true);
    expect(report.findings[0].matchedVia).toBe('license');
  });

  it('magazynier: „wózki widłowe” spełnia zaznaczenie UDT', () => {
    // To jest dokładnie ten przypadek, który wcześniej nie działał: audyt
    // szukał dosłownego ciągu w JSON.stringify(vault), więc identyfikator
    // 'udt_forklift' nie miał szans dopasować się do treści ogłoszenia.
    const jd = 'Praca w magazynie. Wymagane uprawnienia na wózki widłowe (UDT).';

    const withLicense = auditKnockouts(jd, vaultWith(['udt_forklift']));
    const without = auditKnockouts(jd, vaultWith([]));

    expect(withLicense.blocking).toHaveLength(0);
    expect(without.blocking.map((f) => f.ruleId)).toContain('udt_forklift');
  });

  it('spawacz: wykrywa metody po numerach', () => {
    const jd = 'Spawacz TIG 141 / MAG 135. Wymagana książeczka spawacza.';

    const report = auditKnockouts(jd, vaultWith([]));

    expect(report.blocking.map((f) => f.ruleId)).toContain('welding');
  });

  it('kierowca: rozróżnia kat. C+E od kat. B', () => {
    const jd = 'Kierowca kat. C+E w transporcie międzynarodowym.';

    const report = auditKnockouts(jd, vaultWith(['b_license']));
    const ids = report.blocking.map((f) => f.ruleId);

    expect(ids).toContain('license_c');
  });

  it('sprzątaczka: wykrywa orzeczenie sanepidu', () => {
    const jd = `Sprzątanie obiektów spożywczych. Wymagana aktualna książeczka
      sanitarno-epidemiologiczna oraz praca w systemie zmianowym.`;

    const report = auditKnockouts(jd, vaultWith([]));
    const ids = report.blocking.map((f) => f.ruleId);

    expect(ids).toContain('sanepid');
    expect(ids).toContain('shift_work');
  });

  it('uprawnienie opisane własnymi słowami w CV też się liczy', () => {
    const jd = 'Wymagane uprawnienia na wózki widłowe.';
    const vault = vaultWith([], 'Obsługa wózka widłowego czołowego na magazynie wysokiego składu');

    const report = auditKnockouts(jd, vault);

    expect(report.blocking).toHaveLength(0);
    expect(report.findings[0].matchedVia).toBe('text');
  });
});

describe('Zdania przeczące i łagodzące', () => {
  it('„nie wymagamy prawa jazdy” nie tworzy wymagania', () => {
    // Fałszywy alarm na tym ekranie kosztuje więcej niż przeoczenie: jedna
    // bzdura podważa całą listę, a to jest cała wartość darmowej checklisty.
    const report = auditKnockouts('Nie wymagamy prawa jazdy kat. B.', vaultWith([]));

    expect(report.findings.map((f) => f.ruleId)).not.toContain('license_b');
  });

  it('„bez konieczności posiadania uprawnień SEP” nie tworzy wymagania', () => {
    const report = auditKnockouts('Praca bez konieczności posiadania uprawnień SEP G1.', vaultWith([]));

    expect(report.findings.map((f) => f.ruleId)).not.toContain('sep_g1');
  });

  it('„mile widziane” obniża twarde wymaganie do zalecanego', () => {
    const report = auditKnockouts('Mile widziane uprawnienia na wózki widłowe.', vaultWith([]));

    expect(report.blocking).toHaveLength(0);
    expect(report.optional.map((f) => f.ruleId)).toContain('udt_forklift');
  });
});

describe('Ogłoszenia korporacyjne — brak regresji', () => {
  it('ogłoszenie IT nie generuje wymagań technicznych z innych branż', () => {
    const jd = `Frontend Developer. Wymagany React 19, TypeScript oraz znajomość
      angielskiego na poziomie C1. Praca zdalna.`;

    const report = auditKnockouts(jd, vaultWith([]));
    const ids = report.findings.map((f) => f.ruleId);

    expect(ids).toContain('language_advanced');
    expect(ids).not.toContain('sep_g1');
    expect(ids).not.toContain('udt_forklift');
    expect(ids).not.toContain('welding');
  });

  it('ogłoszenie bez wymagań formalnych daje pusty raport', () => {
    const report = auditKnockouts('Szukamy osoby chętnej do pracy w miłym zespole.', vaultWith([]));

    expect(report.requirementCount).toBe(0);
    expect(report.blocking).toHaveLength(0);
  });

  it('pusta treść ogłoszenia nie wywraca audytu', () => {
    expect(() => auditKnockouts('', vaultWith([]))).not.toThrow();
    expect(auditKnockouts('', vaultWith([])).requirementCount).toBe(0);
  });
});
