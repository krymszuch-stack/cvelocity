import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from './helpers/memoryStorage';
import { cheatSheetCacheKeyFor, readRaw } from '../storage';
import {
  hashCheatSheetInput,
  readCachedEnrichment,
  writeCachedEnrichment,
} from '../interviewCheatSheetEngine';
import { CheatSheetEnrichment } from '../interviewCheatSheetEngine';

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
});

const wpis = () => ({}) as unknown as CheatSheetEnrichment;

function kluczeCache(): string[] {
  const wyniki: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${cheatSheetCacheKeyFor('')}`)) wyniki.push(key);
  }
  return wyniki;
}

describe('cache spersonalizowanej ściągi', () => {
  it('zapisany wpis da się odczytać po tym samym skrócie', () => {
    const hash = hashCheatSheetInput({} as never, 'tytuł', 'firma', 'opis');
    writeCachedEnrichment(hash, wpis());

    expect(readCachedEnrichment(hash)).toEqual({});
  });

  it('po przekroczeniu limitu wypadają najstarsze wpisy, nie najnowsze', () => {
    for (let i = 0; i < 25; i++) {
      writeCachedEnrichment(`h${i}`, wpis());
    }

    const klucze = kluczeCache();
    expect(klucze.length).toBe(20);

    // Remis znaczników czasu rozstrzyga klucz, więc przy wpisach z tej samej
    // milisekundy wypadają te wstawione najwcześniej — ostatnio pisana oferta
    // musi przetrwać.
    expect(readRaw(cheatSheetCacheKeyFor('h24'))).not.toBeNull();
    expect(readRaw(cheatSheetCacheKeyFor('h0'))).toBeNull();
  });
});
