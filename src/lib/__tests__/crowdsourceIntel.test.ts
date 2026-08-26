import { describe, expect, it } from 'vitest';
import { buildJobIntel, parseSalaryRange } from '../crowdsourceIntel';
import type { ParsedJobDescription } from '../jdParser';

/**
 * Te testy pilnują jednej rzeczy: co dokładnie wychodzi z przeglądarki do
 * wspólnej bazy. Wpis jest anonimowy, więc jedyny moment, w którym da się
 * zauważyć wyciek czegoś prywatnego, jest tutaj.
 */

const baseJd: ParsedJobDescription = {
  jobTitle: 'Monter instalacji sanitarnych',
  companyName: 'Instal-Bud',
  seniorityLevel: 'MID',
  requiredHardSkills: ['lutowanie miedzi', 'UDT'],
  requiredSoftSkills: ['praca w zespole'],
  toolsAndTech: ['zgrzewarka', 'UDT'],
  languagesRequired: [],
  coreResponsibilities: [],
  keyKeywords: [],
};

describe('parseSalaryRange', () => {
  it('czyta widełki ze spacją jako separatorem tysięcy', () => {
    expect(parseSalaryRange('6 500 – 9 000 zł netto')).toEqual([6500, 9000]);
  });

  it('radzi sobie ze spacją niełamliwą', () => {
    expect(parseSalaryRange('7\u00a0000 zł')).toEqual([7000, null]);
  });

  it('zwraca puste widełki, gdy nie ma liczb', () => {
    expect(parseSalaryRange('do uzgodnienia')).toEqual([null, null]);
    expect(parseSalaryRange(undefined)).toEqual([null, null]);
  });
});

describe('buildJobIntel', () => {
  it('scala umiejętności i narzędzia bez powtórzeń', () => {
    const intel = buildJobIntel(baseJd);
    expect(intel?.requiredSkills).toEqual(['lutowanie miedzi', 'UDT', 'zgrzewarka']);
  });

  it('odrzuca ogłoszenie bez firmy albo bez stanowiska', () => {
    expect(buildJobIntel({ ...baseJd, companyName: '' })).toBeNull();
    expect(buildJobIntel({ ...baseJd, jobTitle: 'x' })).toBeNull();
  });

  it('wysyła wyłącznie metadane ogłoszenia — żadnych pól spoza białej listy', () => {
    const intel = buildJobIntel({ ...baseJd, salaryRange: '6 500 - 9 000 zł' });
    expect(Object.keys(intel!).sort()).toEqual(
      [
        'companyName',
        'interviewQuestions',
        'jobTitle',
        'requiredSkills',
        'salaryRangeMax',
        'salaryRangeMin',
        'sourceUrl',
      ].sort()
    );
    expect(intel?.salaryRangeMin).toBe(6500);
  });
});
