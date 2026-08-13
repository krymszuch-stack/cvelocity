import { describe, it, expect } from 'vitest';
import {
  diversifiedSample,
  SUGGESTED_LOCATIONS,
  SUGGESTED_JOB_TITLES,
  SUGGESTED_HARD_SKILLS,
  SUGGESTED_SOFT_SKILLS,
  SUGGESTED_TOOLS_AND_TECH,
} from '../autocompleteSuggestions';

describe('autocompleteSuggestions & diversifiedSample', () => {
  it('1. diversifiedSample returns exact requested count without exceeding array bounds', () => {
    const sample = diversifiedSample(SUGGESTED_JOB_TITLES, 10);
    expect(sample.length).toBe(10);
  });

  it('2. diversifiedSample returns full array if count requested exceeds length', () => {
    const smallList = ['A', 'B', 'C'];
    const sample = diversifiedSample(smallList, 10);
    expect(sample).toEqual(['A', 'B', 'C']);
  });

  it('3. diversifiedSample picks elements across multiple industry buckets', () => {
    const sample = diversifiedSample(SUGGESTED_JOB_TITLES, 8, 4);
    expect(sample.length).toBe(8);
    // Ensure diverse job titles from different buckets are sampled
    const hasIT = sample.some((t) => t.includes('Engineer') || t.includes('Developer'));
    const hasNonIT = sample.some((t) => !t.includes('Engineer') && !t.includes('Developer'));
    expect(hasIT).toBe(true);
    expect(hasNonIT).toBe(true);
  });

  it('4. Predefined suggestion dictionaries are non-empty and well-formed', () => {
    expect(SUGGESTED_LOCATIONS.length).toBeGreaterThan(10);
    expect(SUGGESTED_LOCATIONS).toContain('Warszawa');
    expect(SUGGESTED_HARD_SKILLS).toContain('TypeScript');
    expect(SUGGESTED_SOFT_SKILLS).toContain('Praca w Zespole i Kolaboracja');
    expect(SUGGESTED_TOOLS_AND_TECH).toContain('Docker / Podman');
  });
});
