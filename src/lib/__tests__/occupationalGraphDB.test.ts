import { describe, it, expect } from 'vitest';
import {
  OccupationalGraphDB,
  getGlobalOccupationalGraphDB,
  OccupationalProfessionEntry,
} from '../occupationalGraph';
import { resolveRoleKnowledgeNode } from '../experienceEngine';

describe('Baza Grafu Zawodowego i Słowosieci (OccupationalGraphDB)', () => {
  it('inicjalizuje bazę i poprawnie buduje odwrócony indeks słów', () => {
    const db = new OccupationalGraphDB();
    expect(Object.keys(db.professions).length).toBeGreaterThanOrEqual(10);
    expect(Object.keys(db.word_index).length).toBeGreaterThan(50);
    expect(Object.keys(db.slowosiec_index).length).toBeGreaterThanOrEqual(5);

    // Weryfikacja obecności kominiarza i piekarza
    expect(db.lookupById('kominiarz')).toBeDefined();
    expect(db.lookupById('piekarz')).toBeDefined();
  });

  it('wyszukuje zawód po UUID Słowosieci (plWordNet)', () => {
    const db = new OccupationalGraphDB();
    const kominiarz = db.lookupBySenseId('d5225952-aac4-11ed-aae5-0242ac130002');
    expect(kominiarz).toBeDefined();
    expect(kominiarz?.id).toBe('kominiarz');
    expect(kominiarz?.profesja).toContain('Kominiarz');
  });

  it('wyszukuje zawód po unikalnych narzędziach i obiektach (odwrócony indeks)', () => {
    const db = new OccupationalGraphDB();

    // Szukanie po narzędziu kominiarskim
    const resKominiarz = db.search('szczotka kominiarska');
    expect(resKominiarz.length).toBeGreaterThan(0);
    expect(resKominiarz[0].profession.id).toBe('kominiarz');

    // Szukanie po obiektach piekarskich
    const resPiekarz = db.search('zakwas chleb');
    expect(resPiekarz.length).toBeGreaterThan(0);
    expect(resPiekarz[0].profession.id).toBe('piekarz');
  });

  it('obsługuje przyrostowe zasilanie paczkami danych i bezstratne scalanie (merge)', () => {
    // Pusta baza
    const db = new OccupationalGraphDB([]);
    expect(Object.keys(db.professions).length).toBe(0);

    // PACZKA 1
    const batch1: OccupationalProfessionEntry[] = [
      {
        id: 'kominiarz',
        profesja: 'Kominiarz',
        slowosiec_sense_id: 'd5225952-aac4-11ed-aae5-0242ac130002',
        osoby: ['kominiarz', 'kominiarka'],
        obiekty: ['komin', 'wentylacja'],
        czynnosci: ['czyszczenie', 'czyści'],
        narzedzia: ['szczotka kominiarska'],
        miejsce: ['dach'],
      },
    ];

    db.addOrUpdateProfessions(batch1);
    expect(Object.keys(db.professions).length).toBe(1);
    expect(db.lookupById('kominiarz')?.narzedzia).toEqual(['szczotka kominiarska']);

    // PACZKA 2 (aktualizacja kominiarza + dodanie piekarza)
    const batch2: (Partial<OccupationalProfessionEntry> & { id: string })[] = [
      {
        id: 'kominiarz',
        obiekty: ['przewód kominowy', 'piec'],
        czynnosci: ['udrożnianie', 'przegląd'],
        narzedzia: ['kula kominiarska', 'kamera inspekcyjna', 'szczotka kominiarska'], // duplikat narzędzia
      },
      {
        id: 'piekarz',
        profesja: 'Piekarz',
        osoby: ['piekarz'],
        obiekty: ['chleb', 'bułka', 'mąka'],
        czynnosci: ['pieczenie', 'mieszenie'],
        narzedzia: ['piec piekarniczy'],
        miejsce: ['piekarnia'],
      },
    ];

    db.addOrUpdateProfessions(batch2);

    // Weryfikacja liczby zawodów
    expect(Object.keys(db.professions).length).toBe(2);

    // Weryfikacja scalenia kominiarza (unikalność i sortowanie)
    const updatedKominiarz = db.lookupById('kominiarz')!;
    expect(updatedKominiarz.obiekty).toContain('komin');
    expect(updatedKominiarz.obiekty).toContain('przewód kominowy');
    expect(updatedKominiarz.obiekty).toContain('piec');
    expect(updatedKominiarz.narzedzia).toEqual([
      'kamera inspekcyjna',
      'kula kominiarska',
      'szczotka kominiarska',
    ]);
    expect(updatedKominiarz.czynnosci).toContain('czyszczenie');
    expect(updatedKominiarz.czynnosci).toContain('udrożnianie');

    // Weryfikacja dodania piekarza
    const piekarz = db.lookupById('piekarz')!;
    expect(piekarz.profesja).toBe('Piekarz');
    expect(piekarz.miejsce).toEqual(['piekarnia']);
  });

  it('eksportuje i importuje całą bazę wraz z metadanymi i indeksami (JSON payload)', () => {
    const db = new OccupationalGraphDB();
    const payload = db.exportDatabase();

    expect(payload.meta.total_professions).toBeGreaterThanOrEqual(10);
    expect(payload.meta.total_indexed_words).toBeGreaterThan(50);
    expect(payload.professions.kominiarz).toBeDefined();

    // Odtworzenie w nowej instancji
    const newDb = new OccupationalGraphDB(payload);
    expect(newDb.lookupById('kominiarz')).toBeDefined();
    expect(newDb.search('kamera inspekcyjna').length).toBeGreaterThan(0);
  });

  it('konwertuje wpis OccupationalProfessionEntry do formatu RoleKnowledgeNode', () => {
    const db = getGlobalOccupationalGraphDB();
    const kominiarz = db.lookupById('kominiarz')!;
    const node = db.toRoleKnowledgeNode(kominiarz);

    expect(node.roleId).toBe('kominiarz');
    expect(node.label).toContain('Kominiarz');
    expect(node.areas.length).toBeGreaterThanOrEqual(1);
    expect(node.actions[node.areas[0].id]).toContain('czyszczenie');
    expect(node.objects[node.areas[0].id]).toContain('komin');
  });

  it('resolveRoleKnowledgeNode natychmiast rozpoznaje zawody z OccupationalGraphDB (np. Kominiarz, Piekarz)', () => {
    const kominiarzNode = resolveRoleKnowledgeNode('Mistrz Kominiarski');
    expect(kominiarzNode.roleId).toBe('kominiarz');
    expect(kominiarzNode.label).toContain('Kominiarz');

    const piekarzNode = resolveRoleKnowledgeNode('Piekarz pieczywa rzemieślniczego');
    expect(piekarzNode.roleId).toBe('piekarz');
    expect(piekarzNode.label).toContain('Piekarz');
  });
});
