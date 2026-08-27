import { describe, it, expect, beforeEach } from 'vitest';
import { StorageKeys, readJson, writeJson, wipeAppStorage } from '../storage';
import { A11ySettings } from '../../providers/AccessibilityProvider';

describe('Accessibility & High Contrast System', () => {
  beforeEach(() => {
    wipeAppStorage();
  });

  it('rejestruje i odczytuje preferencje dostępności ze schowka', () => {
    const settings: A11ySettings = {
      highContrast: true,
      textScale: 'large',
      dyslexicSpacing: true,
      enhancedFocus: true,
      reducedMotion: true,
    };

    writeJson(StorageKeys.a11ySettings, settings);
    const loaded = readJson<A11ySettings | null>(StorageKeys.a11ySettings, null);

    expect(loaded).not.toBeNull();
    expect(loaded?.highContrast).toBe(true);
    expect(loaded?.textScale).toBe('large');
    expect(loaded?.dyslexicSpacing).toBe(true);
  });

  it('ułatwienia dostępności przeżywają wymazanie danych osobowych (wipeAppStorage) jako preferencja interfejsu', () => {
    writeJson(StorageKeys.a11ySettings, { highContrast: true, textScale: 'large' });
    wipeAppStorage();
    const loaded = readJson<A11ySettings | null>(StorageKeys.a11ySettings, null);
    expect(loaded).not.toBeNull();
    expect(loaded?.highContrast).toBe(true);
    expect(loaded?.textScale).toBe('large');
  });
});
