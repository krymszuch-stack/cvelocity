import { describe, it, expect, beforeEach } from 'vitest';
import {
  urlHash,
  getCachedExtraction,
  setCachedExtraction,
  clearExtractionCache,
  extractionCacheSize,
} from '../cache';
import type { ExtractionResult } from '../types';

const result: ExtractionResult = {
  job: { title: 'Backend Developer', company: 'Acme', description: 'x'.repeat(200) },
  tier: 'json-ld',
  structured: true,
};

beforeEach(() => {
  clearExtractionCache();
});

describe('Cache ekstrakcji po skrócie adresu', () => {
  it('zwraca zapisany wynik dla tego samego adresu', () => {
    setCachedExtraction('https://justjoin.it/job-offer/abc', result, 'https://justjoin.it/job-offer/abc');

    const hit = getCachedExtraction('https://justjoin.it/job-offer/abc');

    expect(hit?.result.job.title).toBe('Backend Developer');
    expect(hit?.finalUrl).toBe('https://justjoin.it/job-offer/abc');
  });

  it('nie miesza wyników między adresami', () => {
    setCachedExtraction('https://a.pl/1', result, 'https://a.pl/1');

    expect(getCachedExtraction('https://a.pl/2')).toBeNull();
  });

  it('nie zapisuje wyników, z których nie da się skorzystać', () => {
    setCachedExtraction(
      'https://pusta.pl',
      { job: { title: '', company: '', description: '' }, tier: 'none', structured: false },
      'https://pusta.pl'
    );

    expect(extractionCacheSize()).toBe(0);
  });

  it('skrót jest stabilny i różny dla różnych adresów', () => {
    expect(urlHash('https://a.pl')).toBe(urlHash('https://a.pl'));
    expect(urlHash('https://a.pl')).not.toBe(urlHash('https://b.pl'));
    expect(urlHash('https://a.pl')).toHaveLength(64);
  });

  it('nie przechowuje adresu w postaci jawnej — kluczem jest wyłącznie skrót', () => {
    const url = 'https://portal.pl/oferta/tajna-rekrutacja';
    setCachedExtraction(url, result, url);

    expect(getCachedExtraction(url)).not.toBeNull();
    expect(urlHash(url)).not.toContain('tajna-rekrutacja');
  });
});
