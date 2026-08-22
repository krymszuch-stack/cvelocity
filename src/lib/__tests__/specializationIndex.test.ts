import { describe, it, expect } from 'vitest';
import {
  bestSubRoleMatch,
  findSubRoleById,
  getAllSectors,
  getSuggestionsForSubRole,
  matchSubRoles,
} from '../specializationIndex';

describe('Katalog zawodów', () => {
  it('jest w ogóle wczytany', () => {
    // Ten plik przez długi czas nie był importowany przez nic w projekcie.
    const sectors = getAllSectors();
    expect(sectors.length).toBeGreaterThan(10);
    expect(sectors.flatMap((s) => s.subRoles).length).toBeGreaterThan(15);
  });

  it('nie ma zduplikowanych identyfikatorów podról', () => {
    const ids = getAllSectors().flatMap((s) => s.subRoles.map((r) => r.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('znajduje podrolę po identyfikatorze wraz z jej sektorem', () => {
    const found = findSubRoleById('gas_heating_technician');
    expect(found?.subRole.title).toContain('Kotłów Gazowych');
    expect(found?.sector.name).toContain('HVAC');
  });
});

describe('Dopasowanie ogłoszenia do zawodu', () => {
  it('rozpoznaje montera kotłów po marce i uprawnieniu', () => {
    const jd = `Serwisant kotłów gazowych Junkers i Vaillant. Wymagane uprawnienia
      SEP G3 oraz Certyfikat F-Gaz. Praca w terenie.`;

    const best = bestSubRoleMatch(jd);

    expect(best?.subRole.id).toBe('gas_heating_technician');
    expect(best?.matchedSignals.length).toBeGreaterThan(0);
  });

  it('rozpoznaje operatora wózka widłowego', () => {
    const jd = 'Magazynier z uprawnieniami UDT na wózki widłowe, obsługa systemu WMS.';

    expect(bestSubRoleMatch(jd)?.subRole.id).toBe('warehouse_forklift_operator');
  });

  it('rozpoznaje spawacza po metodach spawania', () => {
    const jd = 'Spawacz metodą TIG 141 oraz MAG 135. Certyfikat UDT / TÜV.';

    const best = bestSubRoleMatch(jd);
    expect(best?.sector.name).toContain('Spawalnictwo');
  });

  it('nie myli branży fizycznej z korporacyjną', () => {
    const jd = 'Frontend Developer. React 19, TypeScript, Tailwind CSS. Praca zdalna.';

    const best = bestSubRoleMatch(jd);
    expect(best?.sector.id).toBe('software_it');
  });

  it('dopasowuje mimo odmiany — rdzenie, nie dosłowny ciąg znaków', () => {
    // Ogłoszenie: „montaż klimatyzatorów”. Katalog: „Montaż Klimatyzatorów Split”.
    const jd = 'Zajmiesz się montażem klimatyzatorów typu split i próżniowaniem układu.';

    expect(bestSubRoleMatch(jd)?.subRole.id).toBe('hvac_klimatyzacja');
  });

  it('zwraca pustą listę zamiast zgadywać przy tekście bez sygnałów', () => {
    // Przypadkowa branża jest gorsza niż brak sugestii: użytkownik nie ma jak
    // sprawdzić, skąd się wzięła.
    expect(matchSubRoles('Miła atmosfera i owocowe czwartki.')).toEqual([]);
    expect(bestSubRoleMatch('')).toBeNull();
  });

  it('sortuje malejąco po trafności', () => {
    const jd = 'Serwisant kotłów gazowych Junkers, uprawnienia SEP G3, Certyfikat F-Gaz.';
    const matches = matchSubRoles(jd, 3);

    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
    }
  });
});

describe('Propozycje do profilu', () => {
  it('zwraca zestaw propozycji dla istniejącej podroli', () => {
    const suggestions = getSuggestionsForSubRole('gas_heating_technician');

    expect(suggestions?.certifications.some((c) => c.includes('SEP G3'))).toBe(true);
    expect(suggestions?.tools.some((t) => t.includes('Testo'))).toBe(true);
  });

  it('zwraca null dla nieznanej podroli zamiast pustego obiektu', () => {
    expect(getSuggestionsForSubRole('nie_istnieje')).toBeNull();
  });
});
