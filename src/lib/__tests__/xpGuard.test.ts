import { describe, expect, it } from 'vitest';
import {
  DAILY_XP_CAP,
  emptyXpLedger,
  evaluateXpClaim,
  dailyXp,
  hashTarget,
  normalizeXpLedger,
  pruneLedger,
} from '../xpGuard';
import type { XpLedger } from '../xpGuard';

const DZIEN = 24 * 60 * 60 * 1000;
/** Południe, żeby żadne przesunięcie strefy nie przerzuciło wpisu na inną dobę. */
const TERAZ = new Date('2026-03-10T12:00:00').getTime();

function ledgerZ(entries: XpLedger['entries']): XpLedger {
  return { entries };
}

describe('xpGuard — deduplikacja celu', () => {
  it('przyznaje punkty za pierwsze zgłoszenie', () => {
    const verdict = evaluateXpClaim(
      emptyXpLedger(),
      { eventId: 'application_added', target: 'Elektro-Mont|Monter instalacji' },
      TERAZ
    );

    expect(verdict.granted).toBe(true);
    expect(verdict.points).toBe(200);
    expect(verdict.ledger.entries).toHaveLength(1);
  });

  it('odmawia punktów za ten sam cel po raz drugi', () => {
    const first = evaluateXpClaim(
      emptyXpLedger(),
      { eventId: 'application_added', target: 'Elektro-Mont|Monter instalacji' },
      TERAZ
    );
    const second = evaluateXpClaim(
      first.ledger,
      { eventId: 'application_added', target: '  elektro-mont|MONTER INSTALACJI ' },
      TERAZ + 1000
    );

    expect(second.granted).toBe(false);
    expect(second.reason).toBe('ALREADY_CLAIMED');
    expect(second.message).toMatch(/już naliczyliśmy/);
  });
});

describe('xpGuard — dowód pracy', () => {
  it('odrzuca ogłoszenie krótsze niż 200 znaków', () => {
    const verdict = evaluateXpClaim(
      emptyXpLedger(),
      { eventId: 'jd_ingested', target: 'https://praca.pl/oferta/1', proof: { chars: 42 } },
      TERAZ
    );

    expect(verdict.granted).toBe(false);
    expect(verdict.reason).toBe('PROOF_INSUFFICIENT');
  });

  it('odrzuca próbę STAR krótszą niż 45 sekund', () => {
    const verdict = evaluateXpClaim(
      emptyXpLedger(),
      { eventId: 'star_completed', target: 'story-1', proof: { dwellSeconds: 12, chars: 400 } },
      TERAZ
    );

    expect(verdict.reason).toBe('PROOF_INSUFFICIENT');
  });

  it('odrzuca widełki, w których dolna granica nie jest mniejsza od górnej', () => {
    const verdict = evaluateXpClaim(
      emptyXpLedger(),
      {
        eventId: 'salary_reported',
        target: 'Elektro-Mont|Monter|widelki',
        proof: { salary: { min: 9000, max: 7000, currency: 'PLN' } },
      },
      TERAZ
    );

    expect(verdict.reason).toBe('PROOF_INSUFFICIENT');
  });

  it('przyjmuje poprawne widełki spawacza', () => {
    const verdict = evaluateXpClaim(
      emptyXpLedger(),
      {
        eventId: 'salary_reported',
        target: 'Stalmex|Spawacz MAG|widelki',
        proof: { salary: { min: 6500, max: 8200, currency: 'PLN' } },
      },
      TERAZ
    );

    expect(verdict.granted).toBe(true);
    expect(verdict.points).toBe(50);
  });
});

describe('xpGuard — limity dobowe', () => {
  it('blokuje szóste ogłoszenie tego samego dnia', () => {
    let ledger = emptyXpLedger();
    for (let i = 0; i < 5; i += 1) {
      const verdict = evaluateXpClaim(
        ledger,
        { eventId: 'jd_ingested', target: `oferta-${i}`, proof: { chars: 500 } },
        TERAZ
      );
      expect(verdict.granted).toBe(true);
      ledger = verdict.ledger;
    }

    const szosta = evaluateXpClaim(
      ledger,
      { eventId: 'jd_ingested', target: 'oferta-6', proof: { chars: 500 } },
      TERAZ
    );

    expect(szosta.granted).toBe(false);
    expect(szosta.reason).toBe('DAILY_EVENT_LIMIT');
  });

  it('przycina nagrodę do sufitu dobowego zamiast ją odrzucać', () => {
    const ledger = ledgerZ([
      { eventId: 'ats_high_score', targetHash: 'aaa', points: DAILY_XP_CAP - 30, at: TERAZ },
    ]);

    const verdict = evaluateXpClaim(
      ledger,
      { eventId: 'application_added', target: 'Firma|Magazynier' },
      TERAZ
    );

    expect(verdict.granted).toBe(true);
    expect(verdict.points).toBe(30);
    expect(dailyXp(verdict.ledger, TERAZ)).toBe(DAILY_XP_CAP);
  });

  it('odmawia po osiągnięciu sufitu i mówi o północy', () => {
    const ledger = ledgerZ([
      { eventId: 'ats_high_score', targetHash: 'aaa', points: DAILY_XP_CAP, at: TERAZ },
    ]);

    const verdict = evaluateXpClaim(
      ledger,
      { eventId: 'application_added', target: 'Firma|Magazynier' },
      TERAZ
    );

    expect(verdict.reason).toBe('DAILY_CAP_REACHED');
    expect(verdict.message).toMatch(/północy/);
  });

  it('nie liczy wczorajszych punktów do dzisiejszego limitu', () => {
    const ledger = ledgerZ([
      { eventId: 'ats_high_score', targetHash: 'aaa', points: DAILY_XP_CAP, at: TERAZ - DZIEN },
    ]);

    const verdict = evaluateXpClaim(
      ledger,
      { eventId: 'application_added', target: 'Firma|Magazynier' },
      TERAZ
    );

    expect(verdict.granted).toBe(true);
    expect(verdict.points).toBe(200);
  });
});

describe('xpGuard — trwałość rejestru', () => {
  it('usuwa wpisy starsze niż dwa tygodnie', () => {
    const ledger = ledgerZ([
      { eventId: 'jd_ingested', targetHash: 'stary', points: 150, at: TERAZ - 30 * DZIEN },
      { eventId: 'jd_ingested', targetHash: 'swiezy', points: 150, at: TERAZ - DZIEN },
    ]);

    expect(pruneLedger(ledger, TERAZ).entries.map((entry) => entry.targetHash)).toEqual(['swiezy']);
  });

  it('odsiewa śmieci z dysku zamiast się wywrócić', () => {
    const ledger = normalizeXpLedger({
      entries: [
        { eventId: 'nieistniejace', targetHash: 'x', points: 10, at: TERAZ },
        { eventId: 'jd_ingested', targetHash: 'ok', points: 150, at: TERAZ },
        'nonsens',
        { eventId: 'jd_ingested', points: 150, at: TERAZ },
      ],
    });

    expect(ledger.entries).toHaveLength(1);
    expect(normalizeXpLedger(null).entries).toEqual([]);
  });

  it('skrót celu jest stabilny i niewrażliwy na wielkość liter', () => {
    expect(hashTarget(' Oferta X ')).toBe(hashTarget('oferta x'));
    expect(hashTarget('oferta x')).not.toBe(hashTarget('oferta y'));
  });
});
